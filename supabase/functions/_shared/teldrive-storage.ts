import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from 'npm:@aws-sdk/client-s3@3.883.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.883.0';

const parseBoolean = (value: string | null | undefined, fallback: boolean) => {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return fallback;
};

const endpoint = Deno.env.get('TELDRIVE_S3_ENDPOINT') || '';
const region = Deno.env.get('TELDRIVE_S3_REGION') || 'ap-southeast-1';
const bucket = Deno.env.get('TELDRIVE_S3_BUCKET') || 'default';
const forcePathStyle = parseBoolean(Deno.env.get('TELDRIVE_S3_FORCE_PATH_STYLE'), true);
const accessKeyId = Deno.env.get('TELDRIVE_S3_ACCESS_KEY_ID') || '';
const secretAccessKey = Deno.env.get('TELDRIVE_S3_SECRET_ACCESS_KEY') || '';

export const getTeldriveBucket = () => bucket;

export const assertTeldriveConfig = () => {
  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error('TelDrive S3 environment variables are not fully configured.');
  }
};

let client: S3Client | null = null;

const getClient = () => {
  assertTeldriveConfig();
  if (client) return client;

  client = new S3Client({
    endpoint,
    region,
    forcePathStyle,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return client;
};

const toWebStream = async (body: unknown): Promise<ReadableStream<Uint8Array>> => {
  if (body instanceof ReadableStream) {
    return body;
  }

  if (body && typeof (body as { transformToWebStream?: () => ReadableStream<Uint8Array> }).transformToWebStream === 'function') {
    return (body as { transformToWebStream: () => ReadableStream<Uint8Array> }).transformToWebStream();
  }

  if (body && typeof (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === 'function') {
    const bytes = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    });
  }

  const bytes = new Uint8Array(await new Response(body as BodyInit).arrayBuffer());
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
};

export const uploadObject = async ({
  objectKey,
  body,
  contentType,
  cacheControl,
}: {
  objectKey: string;
  body: Uint8Array;
  contentType?: string | null;
  cacheControl?: string | null;
}) => {
  const s3 = getClient();
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    Body: body,
    ContentType: contentType || undefined,
    CacheControl: cacheControl || undefined,
  }));
};

export const createSignedUpload = async ({
  objectKey,
  contentType,
  cacheControl,
  expiresInSeconds = 900,
}: {
  objectKey: string;
  contentType?: string | null;
  cacheControl?: string | null;
  expiresInSeconds?: number;
}) => {
  const s3 = getClient();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: contentType || undefined,
    CacheControl: cacheControl || undefined,
  });

  const url = await getSignedUrl(s3, command, {
    expiresIn: expiresInSeconds,
  });

  const headers: Record<string, string> = {};
  if (contentType) {
    headers['content-type'] = contentType;
  }
  if (cacheControl) {
    headers['cache-control'] = cacheControl;
  }

  return {
    url,
    method: 'PUT' as const,
    headers,
    expiresAt: new Date(Date.now() + (expiresInSeconds * 1000)).toISOString(),
  };
};

export const downloadObject = async (objectKey: string) => {
  const s3 = getClient();
  const result = await s3.send(new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  }));

  if (!result.Body) {
    throw new Error(`TelDrive returned an empty body for ${objectKey}.`);
  }

  return {
    body: await toWebStream(result.Body),
    contentType: result.ContentType || 'application/octet-stream',
    contentLength: typeof result.ContentLength === 'number' ? result.ContentLength : null,
    cacheControl: result.CacheControl || null,
    etag: result.ETag || null,
  };
};

export const deleteObject = async (objectKey: string) => {
  const s3 = getClient();
  await s3.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  }));
};

export const headObject = async (objectKey: string) => {
  const s3 = getClient();
  return s3.send(new HeadObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  }));
};
