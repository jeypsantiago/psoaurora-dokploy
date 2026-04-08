// @ts-nocheck
import {
  assertAllowedOrigin,
  createAdminClient,
  getHttpStatus,
  handleCorsPreflight,
  HttpError,
  json,
  requireAuthenticatedUser,
  requireSuperAdmin,
} from "../_shared/auth.ts";
import {
  cleanupStalePendingAppFiles,
  completePendingAppFile,
  createPendingAppFile,
  deleteAppFileById,
  getAppFileById,
} from "../_shared/app-files.ts";
import {
  assertTeldriveConfig,
  uploadObject,
} from "../_shared/teldrive-storage.ts";

const FALLBACK_UPLOAD_ACTION = "uploadPendingBytes";
const GENERIC_START_ACTION = "startUpload";

type UploadTarget =
  | "staff-avatar"
  | "staff-signature"
  | "landing-hero"
  | "landing-team-member";

const readJson = async (request: Request) => {
  try {
    return await request.json();
  } catch {
    return {};
  }
};

const requireAction = (payload: Record<string, unknown>) => {
  const action = String(payload?.action || "").trim();
  if (!action) {
    throw new Error("Action is required.");
  }
  return action;
};

const requireUuid = (value: unknown, fieldName: string) => {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }
  return normalized;
};

const requireFileName = (value: unknown, fallback: string) => {
  const normalized = String(value || "").trim();
  return normalized || fallback;
};

const normalizeContentType = (value: unknown) => {
  const normalized = String(value || "").trim();
  return normalized || null;
};

const normalizeSizeBytes = (value: unknown) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
};

const sanitizeLabel = (value: unknown, fallback: string) =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "") || fallback;

const normalizeUploadTarget = (
  payload: Record<string, unknown>,
): UploadTarget => {
  const explicitTarget = String(payload?.uploadTarget || "").trim();
  if (
    explicitTarget === "staff-avatar" ||
    explicitTarget === "staff-signature" ||
    explicitTarget === "landing-hero" ||
    explicitTarget === "landing-team-member"
  ) {
    return explicitTarget;
  }

  const legacyAction = String(payload?.action || "").trim();
  if (legacyAction === "startUploadLandingAsset") {
    return String(payload?.kind || "").trim() === "team"
      ? "landing-team-member"
      : "landing-hero";
  }
  if (legacyAction === "startUploadStaffMedia") {
    return String(payload?.kind || "").trim() === "signature"
      ? "staff-signature"
      : "staff-avatar";
  }

  throw new Error("Unsupported upload target.");
};

const assertFileAccess = async (
  request: Request,
  adminClient: ReturnType<typeof createAdminClient>,
  row: Awaited<ReturnType<typeof getAppFileById>>,
) => {
  if (!row) {
    throw new HttpError(404, "File metadata not found.");
  }

  const caller = await requireAuthenticatedUser(request);
  if (row.storage_kind === "landing-asset") {
    await requireSuperAdmin(request, adminClient);
    return caller;
  }

  if (row.owner_user_id !== caller.id) {
    await requireSuperAdmin(request, adminClient);
  }

  return caller;
};

const uploadPendingBytes = async (
  request: Request,
  adminClient: ReturnType<typeof createAdminClient>,
) => {
  const fileId = requireUuid(
    new URL(request.url).searchParams.get("fileId"),
    "fileId",
  );
  const row = await getAppFileById(adminClient, fileId);
  await assertFileAccess(request, adminClient, row);

  if (
    !row ||
    (row.upload_state !== "pending" && row.upload_state !== "ready")
  ) {
    throw new HttpError(409, "File upload metadata is no longer writable.");
  }

  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength === 0) {
    throw new HttpError(400, "Upload body is empty.");
  }

  await uploadObject({
    objectKey: row.object_key,
    body,
    contentType:
      request.headers.get("Content-Type") || row.content_type || undefined,
    cacheControl:
      row.visibility === "public"
        ? "public, max-age=3600, stale-while-revalidate=86400"
        : "private, max-age=0, no-store",
  });

  return json(request, 200, { ok: true });
};

const resolveStartUpload = async (
  request: Request,
  adminClient: ReturnType<typeof createAdminClient>,
  payload: Record<string, unknown>,
) => {
  const uploadTarget = normalizeUploadTarget(payload);
  const originalName = requireFileName(payload?.originalName, "upload.bin");
  const contentType = normalizeContentType(payload?.contentType);
  const sizeBytes = normalizeSizeBytes(payload?.sizeBytes);

  if (uploadTarget === "staff-avatar" || uploadTarget === "staff-signature") {
    const caller = await requireAuthenticatedUser(request);
    const targetUserId = requireUuid(
      payload?.ownerUserId ?? payload?.targetUserId,
      uploadTarget === "staff-avatar" ? "ownerUserId" : "ownerUserId",
    );
    if (targetUserId !== caller.id) {
      await requireSuperAdmin(request, adminClient);
    }

    const label =
      uploadTarget === "staff-avatar"
        ? `staff-avatar-${targetUserId}`
        : `staff-signature-${targetUserId}`;
    const storageKind =
      uploadTarget === "staff-avatar" ? "staff-avatar" : "staff-signature";

    await cleanupStalePendingAppFiles(adminClient, {
      ownerUserId: targetUserId,
      storageKind,
      label,
    });

    return {
      uploadTarget,
      ownerUserId: targetUserId,
      storageKind,
      visibility: "public" as const,
      label,
      originalName,
      contentType,
      sizeBytes,
    };
  }

  const caller = await requireSuperAdmin(request, adminClient);
  const slotId = sanitizeLabel(payload?.slotId, "");
  const providedLabel = sanitizeLabel(
    payload?.label,
    uploadTarget === "landing-hero" ? "hero-background" : "team-member",
  );
  const label =
    uploadTarget === "landing-hero"
      ? `landing-hero-${providedLabel}`
      : `landing-team-member-${slotId || providedLabel}`;

  await cleanupStalePendingAppFiles(adminClient, {
    ownerUserId: caller.id,
    storageKind: "landing-asset",
    label,
  });

  return {
    uploadTarget,
    ownerUserId: caller.id,
    storageKind: "landing-asset" as const,
    visibility: "public" as const,
    label,
    originalName,
    contentType,
    sizeBytes,
  };
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return handleCorsPreflight(request);
  }

  try {
    assertAllowedOrigin(request);
    assertTeldriveConfig();
    const adminClient = createAdminClient();
    const url = new URL(request.url);
    if (url.searchParams.get("action") === FALLBACK_UPLOAD_ACTION) {
      return await uploadPendingBytes(request, adminClient);
    }

    const payload = await readJson(request);
    const action = requireAction(payload);

    if (action === "warmup") {
      await requireAuthenticatedUser(request);
      return json(request, 200, { ok: true });
    }

    if (
      action === GENERIC_START_ACTION ||
      action === "startUploadLandingAsset" ||
      action === "startUploadStaffMedia"
    ) {
      const resolved = await resolveStartUpload(request, adminClient, payload);
      const started = await createPendingAppFile(adminClient, {
        ownerUserId: resolved.ownerUserId,
        storageKind: resolved.storageKind,
        visibility: resolved.visibility,
        originalName: resolved.originalName,
        contentType: resolved.contentType,
        sizeBytes: resolved.sizeBytes,
        label: resolved.label,
        uploadState: "pending",
      });

      return json(request, 200, {
        fileId: started.row.id,
        objectKey: started.row.object_key,
        url: started.url,
        uploadUrl: started.upload.url,
        method: started.upload.method,
        headers: started.upload.headers,
        expiresAt: started.upload.expiresAt,
        uploadTarget: resolved.uploadTarget,
      });
    }

    if (action === "completeUpload") {
      const fileId = requireUuid(payload?.fileId, "fileId");
      const row = await getAppFileById(adminClient, fileId);
      await assertFileAccess(request, adminClient, row);
      const completed = await completePendingAppFile(adminClient, fileId, {
        originalName: requireFileName(
          payload?.originalName,
          row?.original_name || "upload.bin",
        ),
        contentType:
          normalizeContentType(payload?.contentType) ||
          row?.content_type ||
          "application/octet-stream",
        sizeBytes:
          normalizeSizeBytes(payload?.sizeBytes) || row?.size_bytes || 0,
      });

      return json(request, 200, {
        fileId: completed.row.id,
        objectKey: completed.row.object_key,
        url: completed.url,
        contentType: completed.row.content_type,
        sizeBytes: completed.row.size_bytes,
      });
    }

    if (action === "deleteFile") {
      const fileId = requireUuid(payload?.fileId, "fileId");
      const row = await getAppFileById(adminClient, fileId);
      await assertFileAccess(request, adminClient, row);
      await deleteAppFileById(adminClient, fileId);
      return json(request, 200, { ok: true });
    }

    return json(request, 400, { error: "Unsupported action." });
  } catch (error) {
    console.error("media-assets.error", error);
    return json(request, getHttpStatus(error), {
      error:
        error instanceof Error
          ? error.message
          : "Unexpected media asset error.",
    });
  }
});
