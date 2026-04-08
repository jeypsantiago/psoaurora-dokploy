// @ts-nocheck
import {
  assertAllowedOrigin,
  createAdminClient,
  getCorsHeaders,
  handleCorsPreflight,
  json,
} from "../_shared/auth.ts";
import { getAppFileById } from "../_shared/app-files.ts";
import {
  assertTeldriveConfig,
  downloadObject,
} from "../_shared/teldrive-storage.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return handleCorsPreflight(request);
  }

  assertAllowedOrigin(request);

  if (request.method !== "GET") {
    return json(request, 405, { error: "Method not allowed." });
  }

  try {
    assertTeldriveConfig();
    const fileId = new URL(request.url).searchParams.get("id")?.trim() || "";
    if (!fileId) {
      return json(request, 400, { error: "File id is required." });
    }

    const adminClient = createAdminClient();
    const row = await getAppFileById(adminClient, fileId);
    if (!row || row.visibility !== "public" || row.upload_state !== "ready") {
      return json(request, 404, { error: "Media file not found." });
    }

    console.log("media-public.download.requested", {
      fileId: row.id,
      ownerUserId: row.owner_user_id,
      bucket: row.bucket,
      objectKey: row.object_key,
    });

    let object;
    try {
      object = await downloadObject(row.object_key);
    } catch (error) {
      console.error("media-public.download.failed", {
        fileId: row.id,
        bucket: row.bucket,
        objectKey: row.object_key,
        error: error instanceof Error ? error.message : String(error),
      });
      return json(request, 502, {
        error: "Unable to retrieve media from storage.",
      });
    }

    const headers = new Headers(getCorsHeaders(request));
    headers.set(
      "Content-Type",
      row.content_type || object.contentType || "application/octet-stream",
    );
    headers.set(
      "Cache-Control",
      object.cacheControl ||
        "public, max-age=3600, stale-while-revalidate=86400",
    );
    headers.set(
      "Content-Disposition",
      `inline; filename="${row.original_name.replace(/"/g, "")}"`,
    );
    if (typeof object.contentLength === "number") {
      headers.set("Content-Length", String(object.contentLength));
    }
    if (object.etag) {
      headers.set("ETag", object.etag);
    }

    return new Response(object.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("media-public.error", error);
    return json(request, 500, {
      error:
        error instanceof Error
          ? error.message
          : "Unexpected media proxy error.",
    });
  }
});
