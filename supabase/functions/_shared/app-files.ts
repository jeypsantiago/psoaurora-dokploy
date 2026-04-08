import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { getSupabaseUrl } from './auth.ts';
import { createSignedUpload, deleteObject, getTeldriveBucket } from './teldrive-storage.ts';

export type StorageKind = 'landing-asset' | 'staff-avatar' | 'staff-signature';
export type Visibility = 'public' | 'private';
export type UploadState = 'pending' | 'ready';

export interface AppFileRow {
  id: string;
  owner_user_id: string | null;
  storage_kind: StorageKind;
  visibility: Visibility;
  bucket: string;
  object_key: string;
  original_name: string;
  content_type: string | null;
  size_bytes: number;
  upload_state: UploadState;
  created_at: string;
  updated_at: string;
}

const sanitizeFileToken = (value: string) => value
  .replace(/[^a-zA-Z0-9._-]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^[-.]+|[-.]+$/g, '')
  || 'file';

const extensionFromMimeType = (mimeType: string | null | undefined) => {
  const token = String(mimeType || '').split('/').pop() || 'bin';
  return sanitizeFileToken(token.toLowerCase());
};

const extensionFromOriginalName = (originalName: string) => {
  const match = originalName.trim().match(/\.([a-zA-Z0-9]{1,16})$/);
  return match ? sanitizeFileToken(match[1].toLowerCase()) : '';
};

const normalizeOriginalName = ({
  originalName,
  label,
  extension,
}: {
  originalName?: string | null;
  label: string;
  extension: string;
}) => {
  const cleaned = sanitizeFileToken(String(originalName || '').trim());
  if (cleaned) {
    return cleaned.includes('.') ? cleaned : `${cleaned}.${extension}`;
  }

  const baseName = sanitizeFileToken(label);
  return `${baseName}.${extension}`;
};

const storageKindSegment = (storageKind: StorageKind) => {
  if (storageKind === 'landing-asset') return 'landing-assets';
  if (storageKind === 'staff-avatar') return 'staff-avatar';
  return 'staff-signature';
};

const buildObjectKey = ({
  ownerUserId,
  storageKind,
  label,
  extension,
}: {
  ownerUserId?: string | null;
  storageKind: StorageKind;
  label: string;
  extension: string;
}) => {
  const ownerSegment = sanitizeFileToken(ownerUserId || 'public');
  const kindSegment = storageKindSegment(storageKind);
  const safeLabel = sanitizeFileToken(label);
  return `uploads/${ownerSegment}/${kindSegment}/${Date.now()}-${crypto.randomUUID()}-${safeLabel}.${extension}`;
};

const visibilityCacheControl = (visibility: Visibility) => (
  visibility === 'public'
    ? 'public, max-age=3600, stale-while-revalidate=86400'
    : 'private, max-age=0, no-store'
);

export const buildPublicMediaUrl = (fileId: string) => (
  `${getSupabaseUrl()}/functions/v1/media-public?id=${encodeURIComponent(fileId)}`
);

export const getAppFileById = async (adminClient: SupabaseClient, fileId: string): Promise<AppFileRow | null> => {
  const { data, error } = await adminClient
    .from('app_files')
    .select('*')
    .eq('id', fileId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Unable to load file metadata.');
  }

  return (data as AppFileRow | null) || null;
};

export const createPendingAppFile = async (
  adminClient: SupabaseClient,
  {
    ownerUserId,
    storageKind,
    visibility,
    label,
    originalName,
    contentType,
    sizeBytes,
    uploadState = 'pending',
  }: {
    ownerUserId?: string | null;
    storageKind: StorageKind;
    visibility: Visibility;
    label: string;
    originalName?: string | null;
    contentType?: string | null;
    sizeBytes?: number | null;
    uploadState?: UploadState;
  },
) => {
  const extension = extensionFromOriginalName(String(originalName || '')) || extensionFromMimeType(contentType);
  const normalizedOriginalName = normalizeOriginalName({
    originalName,
    label,
    extension,
  });
  const objectKey = buildObjectKey({
    ownerUserId,
    storageKind,
    label,
    extension,
  });
  const cacheControl = visibilityCacheControl(visibility);

  console.log('app_files.upload.pending', {
    ownerUserId: ownerUserId || null,
    storageKind,
    bucket: getTeldriveBucket(),
    objectKey,
    sizeBytes: Number(sizeBytes || 0),
    contentType: contentType || null,
  });

  const { data, error } = await adminClient
    .from('app_files')
    .insert({
      owner_user_id: ownerUserId || null,
      storage_kind: storageKind,
      visibility,
      bucket: getTeldriveBucket(),
      object_key: objectKey,
      original_name: normalizedOriginalName,
      content_type: contentType || null,
      size_bytes: Math.max(0, Number(sizeBytes || 0)),
      upload_state: uploadState,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Unable to create pending file metadata.');
  }

  try {
    const upload = await createSignedUpload({
      objectKey,
      contentType: contentType || null,
      cacheControl,
    });

    return {
      row: data as AppFileRow,
      url: buildPublicMediaUrl(String(data.id)),
      upload,
    };
  } catch (presignError) {
    await adminClient.from('app_files').delete().eq('id', data.id);
    throw new Error(presignError instanceof Error ? presignError.message : 'Unable to create upload target.');
  }
};

export const completePendingAppFile = async (
  adminClient: SupabaseClient,
  fileId: string,
  metadata?: {
    originalName?: string | null;
    contentType?: string | null;
    sizeBytes?: number | null;
  },
) => {
  const existingRow = await getAppFileById(adminClient, fileId);
  if (!existingRow) {
    throw new Error('File metadata not found.');
  }

  const nextContentType = String(metadata?.contentType || existingRow.content_type || '').trim() || 'application/octet-stream';
  const nextSizeBytes = Math.max(0, Number(metadata?.sizeBytes ?? existingRow.size_bytes ?? 0));
  const nextOriginalName = normalizeOriginalName({
    originalName: metadata?.originalName || existingRow.original_name,
    label: existingRow.original_name || existingRow.storage_kind,
    extension: extensionFromOriginalName(String(metadata?.originalName || existingRow.original_name || ''))
      || extensionFromMimeType(nextContentType),
  });

  if (
    existingRow.upload_state === 'ready'
    && existingRow.original_name === nextOriginalName
    && existingRow.content_type === nextContentType
    && Number(existingRow.size_bytes || 0) === nextSizeBytes
  ) {
    return {
      row: existingRow,
      url: buildPublicMediaUrl(existingRow.id),
    };
  }

  const { data, error } = await adminClient
    .from('app_files')
    .update({
      original_name: nextOriginalName,
      content_type: nextContentType,
      size_bytes: nextSizeBytes,
      upload_state: 'ready',
    })
    .eq('id', existingRow.id)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Unable to finalize file metadata.');
  }

  console.log('app_files.upload.completed', {
    fileId: data.id,
    ownerUserId: data.owner_user_id,
    storageKind: data.storage_kind,
    bucket: data.bucket,
    objectKey: data.object_key,
    sizeBytes: data.size_bytes,
  });

  return {
    row: data as AppFileRow,
    url: buildPublicMediaUrl(String(data.id)),
  };
};

export const deleteAppFileById = async (adminClient: SupabaseClient, fileId: string) => {
  const row = await getAppFileById(adminClient, fileId);
  if (!row) {
    throw new Error('File metadata not found.');
  }

  console.log('app_files.delete.started', {
    fileId: row.id,
    ownerUserId: row.owner_user_id,
    storageKind: row.storage_kind,
    bucket: row.bucket,
    objectKey: row.object_key,
    uploadState: row.upload_state,
  });

  try {
    await deleteObject(row.object_key);
  } catch (error) {
    console.error('app_files.delete.object_failed', {
      fileId: row.id,
      bucket: row.bucket,
      objectKey: row.object_key,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const { error } = await adminClient
    .from('app_files')
    .delete()
    .eq('id', row.id);

  if (error) {
    console.error('app_files.delete.metadata_failed', {
      fileId: row.id,
      bucket: row.bucket,
      objectKey: row.object_key,
      error: error.message,
    });
    throw new Error(error.message || 'Unable to delete file metadata.');
  }

  return row;
};

export const cleanupStalePendingAppFiles = async (
  adminClient: SupabaseClient,
  {
    ownerUserId,
    storageKind,
    label,
    olderThanMs = 30 * 60 * 1000,
  }: {
    ownerUserId?: string | null;
    storageKind: StorageKind;
    label: string;
    olderThanMs?: number;
  },
) => {
  const cutoffIso = new Date(Date.now() - olderThanMs).toISOString();
  const safeLabel = sanitizeFileToken(label);
  let query = adminClient
    .from('app_files')
    .select('id')
    .eq('storage_kind', storageKind)
    .eq('upload_state', 'pending')
    .lt('created_at', cutoffIso)
    .ilike('object_key', `%${safeLabel}.%`);

  if (ownerUserId) {
    query = query.eq('owner_user_id', ownerUserId);
  } else {
    query = query.is('owner_user_id', null);
  }

  const { data, error } = await query.limit(20);
  if (error) {
    console.error('app_files.cleanup_stale_pending.failed', {
      ownerUserId: ownerUserId || null,
      storageKind,
      label: safeLabel,
      error: error.message,
    });
    return;
  }

  const staleIds = (data || []).map((entry) => String(entry.id || '')).filter(Boolean);
  if (staleIds.length === 0) return;

  await Promise.allSettled(staleIds.map((staleFileId) => deleteAppFileById(adminClient, staleFileId)));
};

