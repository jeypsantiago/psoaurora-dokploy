// @ts-nocheck
import {
  assertAllowedOrigin,
  createAdminClient,
  getHttpStatus,
  handleCorsPreflight,
  json,
  requireSuperAdmin,
} from "../_shared/auth.ts";
import {
  buildPublicMediaUrl,
  deleteAppFileById,
  getAppFileById,
} from "../_shared/app-files.ts";

const adminClient = createAdminClient();

const randomPassword = () => crypto.randomUUID().replace(/-/g, "").slice(0, 16);

const deleteLegacyStaffMedia = async (path: string | null | undefined) => {
  const normalized = typeof path === "string" ? path.trim() : "";
  if (!normalized) return;
  const { error } = await adminClient.storage
    .from("staff-media")
    .remove([normalized]);
  if (error)
    throw new Error(error.message || "Unable to delete previous media file.");
};

const deleteStaffMedia = async ({
  fileId,
  path,
}: {
  fileId?: string | null;
  path?: string | null;
}) => {
  if (fileId) {
    await deleteAppFileById(adminClient, fileId);
    return;
  }

  await deleteLegacyStaffMedia(path);
};

const findUserByEmail = async (email: string) => {
  let page = 1;
  while (page < 20) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(error.message || "Unable to list auth users.");
    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
  }
  return null;
};

const fetchProfile = async (userId: string) => {
  const { data, error } = await adminClient
    .from("staff_users")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw new Error(error.message || "Unable to load staff profile.");
  return data;
};

const resolveMediaAttachment = async ({
  userId,
  kind,
  fileId,
}: {
  userId: string;
  kind: "avatar" | "signature";
  fileId: string;
}) => {
  const row = await getAppFileById(adminClient, fileId);
  if (!row) {
    throw new Error(`Selected ${kind} file was not found.`);
  }

  const expectedStorageKind =
    kind === "avatar" ? "staff-avatar" : "staff-signature";
  if (row.storage_kind !== expectedStorageKind) {
    throw new Error(`Selected ${kind} file has the wrong storage kind.`);
  }

  if (row.owner_user_id !== userId) {
    throw new Error(
      `Selected ${kind} file does not belong to the target user.`,
    );
  }

  if (row.upload_state !== "ready") {
    throw new Error(`Selected ${kind} file upload is not complete yet.`);
  }

  return {
    fileId: row.id,
    path: row.object_key,
    url: buildPublicMediaUrl(row.id),
  };
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return handleCorsPreflight(request);
  }

  try {
    assertAllowedOrigin(request);
    await requireSuperAdmin(request, adminClient);
    const payload = await request.json();
    const action = String(payload?.action || "");
    const user = payload?.user || {};

    if (action === "create") {
      const email = String(user.email || "")
        .trim()
        .toLowerCase();
      const password = String(user.password || "").trim() || randomPassword();
      const roles =
        Array.isArray(user.roles) && user.roles.length > 0
          ? user.roles
          : ["Viewer"];
      if (!email) return json(request, 400, { error: "Email is required." });

      let authUser = await findUserByEmail(email);
      if (!authUser) {
        const { data, error } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name: String(user.name || email),
          },
        });
        if (error || !data.user) {
          return json(request, 400, {
            error: error?.message || "Unable to create auth user.",
          });
        }
        authUser = data.user;
      }

      const profilePatch: Record<string, unknown> = {
        id: authUser.id,
        email,
        name: String(user.name || email),
        roles,
        gender: String(user.gender || "Prefer not to say"),
        position: String(user.position || ""),
        prefs_bundle: {},
        last_access: user.lastAccess || null,
        must_reset_password: !String(user.password || "").trim(),
        is_migrated: false,
      };

      const { error } = await adminClient
        .from("staff_users")
        .upsert(profilePatch);
      if (error) {
        return json(request, 400, {
          error: error.message || "Unable to upsert staff profile.",
        });
      }

      return json(request, 200, { user: await fetchProfile(authUser.id) });
    }

    if (action === "update") {
      const userId = String(user.id || "").trim();
      if (!userId) return json(request, 400, { error: "User id is required." });
      const existingProfile = await fetchProfile(userId);
      const profilePatch: Record<string, unknown> = {};
      const authPatch: Record<string, unknown> = {};
      const cleanupAfterSuccess: Array<{
        fileId?: string | null;
        path?: string | null;
      }> = [];
      const uploadedFiles: string[] = [];

      if (typeof user.email === "string" && user.email.trim()) {
        authPatch.email = user.email.trim().toLowerCase();
        profilePatch.email = authPatch.email;
      }

      if (typeof user.password === "string" && user.password.trim()) {
        authPatch.password = user.password.trim();
        profilePatch.must_reset_password = false;
      }

      if (typeof user.name === "string") profilePatch.name = user.name;
      if (Array.isArray(user.roles)) profilePatch.roles = user.roles;
      if (typeof user.gender === "string") profilePatch.gender = user.gender;
      if (typeof user.position === "string")
        profilePatch.position = user.position;
      if (typeof user.lastAccess === "string")
        profilePatch.last_access = user.lastAccess;

      if (Object.keys(authPatch).length > 0) {
        const { error } = await adminClient.auth.admin.updateUserById(
          userId,
          authPatch,
        );
        if (error)
          return json(request, 400, {
            error: error.message || "Unable to update auth user.",
          });
      }

      try {
        if (user.clearAvatar) {
          profilePatch.avatar_file_id = null;
          profilePatch.avatar_path = null;
          profilePatch.avatar_url = null;
          cleanupAfterSuccess.push({
            fileId: existingProfile.avatar_file_id,
            path: existingProfile.avatar_path,
          });
        } else if (
          typeof user.avatarFileId === "string" &&
          user.avatarFileId.trim()
        ) {
          const attachedAvatar = await resolveMediaAttachment({
            userId,
            kind: "avatar",
            fileId: user.avatarFileId.trim(),
          });
          profilePatch.avatar_file_id = attachedAvatar.fileId;
          profilePatch.avatar_path = attachedAvatar.path;
          profilePatch.avatar_url = attachedAvatar.url;
          if (existingProfile.avatar_file_id !== attachedAvatar.fileId) {
            uploadedFiles.push(attachedAvatar.fileId);
          }
          if (
            existingProfile.avatar_file_id &&
            existingProfile.avatar_file_id !== attachedAvatar.fileId
          ) {
            cleanupAfterSuccess.push({
              fileId: existingProfile.avatar_file_id,
              path: existingProfile.avatar_path,
            });
          }
        }

        if (user.clearSignature) {
          profilePatch.signature_file_id = null;
          profilePatch.signature_path = null;
          profilePatch.signature_url = null;
          cleanupAfterSuccess.push({
            fileId: existingProfile.signature_file_id,
            path: existingProfile.signature_path,
          });
        } else if (
          typeof user.signatureFileId === "string" &&
          user.signatureFileId.trim()
        ) {
          const attachedSignature = await resolveMediaAttachment({
            userId,
            kind: "signature",
            fileId: user.signatureFileId.trim(),
          });
          profilePatch.signature_file_id = attachedSignature.fileId;
          profilePatch.signature_path = attachedSignature.path;
          profilePatch.signature_url = attachedSignature.url;
          if (existingProfile.signature_file_id !== attachedSignature.fileId) {
            uploadedFiles.push(attachedSignature.fileId);
          }
          if (
            existingProfile.signature_file_id &&
            existingProfile.signature_file_id !== attachedSignature.fileId
          ) {
            cleanupAfterSuccess.push({
              fileId: existingProfile.signature_file_id,
              path: existingProfile.signature_path,
            });
          }
        }

        if (Object.keys(profilePatch).length > 0) {
          const { error } = await adminClient
            .from("staff_users")
            .update(profilePatch)
            .eq("id", userId);
          if (error) {
            throw new Error(error.message || "Unable to update staff profile.");
          }
        }
      } catch (error) {
        await Promise.allSettled(
          uploadedFiles.map((fileId) => deleteAppFileById(adminClient, fileId)),
        );
        return json(request, 400, {
          error:
            error instanceof Error
              ? error.message
              : "Unable to update staff profile.",
        });
      }

      const cleanupResults = await Promise.allSettled(
        cleanupAfterSuccess.map((entry) => deleteStaffMedia(entry)),
      );
      cleanupResults.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error("staff-user-admin.cleanup_failed", {
            userId,
            entry: cleanupAfterSuccess[index],
            error:
              result.reason instanceof Error
                ? result.reason.message
                : String(result.reason),
          });
        }
      });

      return json(request, 200, { user: await fetchProfile(userId) });
    }

    if (action === "delete") {
      const userId = String(user.id || "").trim();
      if (!userId) return json(request, 400, { error: "User id is required." });
      const existingProfile = await fetchProfile(userId);

      await deleteStaffMedia({
        fileId: existingProfile.avatar_file_id,
        path: existingProfile.avatar_path,
      });
      await deleteStaffMedia({
        fileId: existingProfile.signature_file_id,
        path: existingProfile.signature_path,
      });

      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error)
        return json(request, 400, {
          error: error.message || "Unable to delete auth user.",
        });
      return json(request, 200, { ok: true });
    }

    return json(request, 400, { error: "Unsupported action." });
  } catch (error) {
    return json(request, getHttpStatus(error), {
      error:
        error instanceof Error ? error.message : "Unexpected function error.",
    });
  }
});
