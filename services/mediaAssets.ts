import { pb, POCKETBASE_URL } from './pocketbase';

export type UploadTarget = 'staff-avatar' | 'staff-signature' | 'landing-hero' | 'landing-team-member';

export type UploadPreparationContext = {
  ownerUserId?: string;
  slotId?: string;
  label?: string;
};

export type CompleteUploadResponse = {
  fileId: string;
  objectKey: string;
  url: string;
  contentType?: string;
  sizeBytes?: number;
};

export type MediaUploadPhase = 'preparing' | 'uploading' | 'committing' | 'done' | 'error';

export type MediaUploadProgress = {
  phase: MediaUploadPhase;
  loadedBytes?: number;
  totalBytes?: number;
  progressPercent?: number;
  message?: string;
};

type MediaUploadOptions = {
  onProgress?: (progress: MediaUploadProgress) => void;
};

const LANDING_ASSET_RECORD_ID = /^[a-z0-9]{15}$/i;

const emitProgress = (
  callback: MediaUploadOptions['onProgress'] | undefined,
  progress: MediaUploadProgress,
) => {
  if (!callback) return;
  callback(progress);
};

const asFileName = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return '';
};

const extractLandingAssetRecordId = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (LANDING_ASSET_RECORD_ID.test(trimmed)) return trimmed;

  try {
    const parsed = new URL(trimmed, `${POCKETBASE_URL}/`);
    const match = parsed.pathname.match(/\/api\/files\/[^/]+\/([^/]+)\//i);
    return match?.[1] && LANDING_ASSET_RECORD_ID.test(match[1]) ? match[1] : null;
  } catch {
    return null;
  }
};

const uploadLandingAssetRecord = async (
  target: UploadTarget,
  file: File,
  context: UploadPreparationContext,
  options?: MediaUploadOptions,
): Promise<CompleteUploadResponse> => {
  emitProgress(options?.onProgress, {
    phase: 'preparing',
    loadedBytes: 0,
    totalBytes: file.size,
    progressPercent: 0,
    message: 'Preparing upload...',
  });

  const formData = new FormData();
  formData.append('label', context.label || file.name || `asset-${Date.now()}`);
  formData.append('kind', target);
  formData.append('ownerId', context.ownerUserId || '');
  formData.append('slotId', context.slotId || '');
  formData.append('file', file);

  emitProgress(options?.onProgress, {
    phase: 'uploading',
    loadedBytes: file.size,
    totalBytes: file.size,
    progressPercent: 65,
    message: 'Uploading file...',
  });

  const record = await pb.collection('landing_assets').create(formData);
  const fileName = asFileName(record.file);
  const url = fileName ? pb.files.getURL(record, fileName) : '';

  emitProgress(options?.onProgress, {
    phase: 'committing',
    loadedBytes: file.size,
    totalBytes: file.size,
    progressPercent: 100,
    message: 'Finishing upload...',
  });

  emitProgress(options?.onProgress, {
    phase: 'done',
    loadedBytes: file.size,
    totalBytes: file.size,
    progressPercent: 100,
    message: 'Upload complete.',
  });

  return {
    fileId: String(record.id),
    objectKey: String(record.id),
    url,
    contentType: file.type || '',
    sizeBytes: file.size,
  };
};

export const invalidatePreparedUpload = (_target: UploadTarget, _context: UploadPreparationContext) => {
  return;
};

export const warmMediaUploadPipeline = async () => {
  return;
};

export const prepareUpload = async (_target: UploadTarget, _context: UploadPreparationContext) => {
  return { ok: true };
};

export const uploadFile = async (
  target: UploadTarget,
  file: File,
  context: UploadPreparationContext,
  options?: MediaUploadOptions,
): Promise<CompleteUploadResponse> => {
  if (target === 'staff-avatar' || target === 'staff-signature') {
    return {
      fileId: '',
      objectKey: '',
      url: '',
      contentType: file.type || '',
      sizeBytes: file.size,
    };
  }

  try {
    return await uploadLandingAssetRecord(target, file, context, options);
  } catch (error) {
    emitProgress(options?.onProgress, {
      phase: 'error',
      loadedBytes: 0,
      totalBytes: file.size,
      progressPercent: 0,
      message: error instanceof Error ? error.message : 'Upload failed.',
    });
    throw error;
  }
};

export const isDataImageUrl = (value: string): boolean => /^data:image\/[^;]+;base64,/i.test(value);

export const isBackendFilePath = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/api/files/')) return true;
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.includes('/api/files/');
  }
  return LANDING_ASSET_RECORD_ID.test(trimmed);
};

export const resolveMediaSource = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/api/files/')) {
    return `${POCKETBASE_URL}${trimmed}`;
  }
  return trimmed;
};

export const dataImageUrlToFile = (dataUrl: string, baseName: string): File | null => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return null;

  const mimeType = match[1] || 'image/png';
  const base64 = match[2] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const extension = mimeType.split('/')[1] || 'png';
  return new File([bytes], `${baseName}.${extension}`, { type: mimeType });
};

export const uploadLandingAssetFile = async (
  file: File,
  options?: {
    kind?: 'hero' | 'team' | 'misc';
    label?: string;
    slotId?: string;
    onProgress?: (progress: MediaUploadProgress) => void;
  },
): Promise<string> => {
  const kind = options?.kind || 'misc';
  const target: UploadTarget = kind === 'team' ? 'landing-team-member' : 'landing-hero';
  const response = await uploadFile(target, file, {
    label: options?.label,
    slotId: options?.slotId,
  }, {
    onProgress: options?.onProgress,
  });
  return response.url;
};

export const deleteLandingAssetBySource = async (source: string): Promise<void> => {
  const recordId = extractLandingAssetRecordId(resolveMediaSource(source));
  if (!recordId) return;
  await pb.collection('landing_assets').delete(recordId);
};

export const extractMediaFileId = (value: string): string | null => extractLandingAssetRecordId(value);
