import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function getS3Config() {
  const region =
    process.env.AWS_REGION ||
    process.env.REMOTION_AWS_REGION ||
    "ap-southeast-2";
  const accessKeyId =
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.REMOTION_AWS_ACCESS_KEY_ID ||
    "";
  const secretAccessKey =
    process.env.AWS_SECRET_ACCESS_KEY ||
    process.env.REMOTION_AWS_SECRET_ACCESS_KEY ||
    "";
  const bucket =
    process.env.AWS_BUCKET_NAME || "vidshorts-uploads-ashwini";
  const isConfigured = Boolean(
    accessKeyId &&
      secretAccessKey &&
      !accessKeyId.includes("your-") &&
      !secretAccessKey.includes("your-")
  );

  return { region, accessKeyId, secretAccessKey, bucket, isConfigured };
}

export const s3BucketName =
  process.env.AWS_BUCKET_NAME || "vidshorts-uploads-ashwini";

export const isAwsConfigured = Boolean(
  (process.env.AWS_ACCESS_KEY_ID || process.env.REMOTION_AWS_ACCESS_KEY_ID) &&
  (process.env.AWS_SECRET_ACCESS_KEY || process.env.REMOTION_AWS_SECRET_ACCESS_KEY)
);

// Lazy or singleton client initialization
let s3ClientInstance: S3Client | null = null;

export function getS3Client(): S3Client {
  const { region, accessKeyId, secretAccessKey, isConfigured } = getS3Config();

  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region,
      credentials: isConfigured
        ? {
            accessKeyId,
            secretAccessKey,
          }
        : undefined,
    });
  }
  return s3ClientInstance;
}

export interface UploadVideoParams {
  key: string;
  body: Buffer | Uint8Array | Blob | string;
  contentType: string;
  bucket?: string;
}

export interface UploadResult {
  s3Key: string;
  s3Bucket: string;
  s3Url: string;
  signedUrl: string;
  signedUrlExpiresAt: Date;
  isSimulated?: boolean;
}

/**
 * Uploads a video buffer/stream to AWS S3 bucket and returns the key and public S3 URL.
 * If AWS credentials are not yet configured in .env.local, provides a safe fallback
 * so the upload flow and Inngest pipeline run smoothly during local development/demo.
 */
export async function uploadVideoToS3({
  key,
  body,
  contentType,
  bucket = s3BucketName,
}: UploadVideoParams): Promise<UploadResult> {
  const config = getS3Config();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  if (!config.isConfigured) {
    console.warn(
      `⚠️ AWS S3 credentials are not configured in .env.local. Simulating S3 upload for key "${key}". To use real AWS S3, set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_BUCKET_NAME.`
    );

    const mockS3Url = `https://${bucket}.s3.${config.region}.amazonaws.com/${encodeURIComponent(key)}`;
    const mockSignedUrl = mockS3Url;

    return {
      s3Key: key,
      s3Bucket: bucket,
      s3Url: mockS3Url,
      signedUrl: mockSignedUrl,
      signedUrlExpiresAt: expiresAt,
      isSimulated: true,
    };
  }

  const client = getS3Client();

  // Convert string or blob to Buffer if needed
  let uploadPayload: Buffer | Uint8Array;
  if (typeof body === "string") {
    uploadPayload = Buffer.from(body);
  } else if (body instanceof Blob) {
    const arrayBuf = await body.arrayBuffer();
    uploadPayload = Buffer.from(arrayBuf);
  } else {
    uploadPayload = body as Buffer | Uint8Array;
  }

  const putCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: uploadPayload,
    ContentType: contentType,
  });

  await client.send(putCommand);

  const s3Url = `https://${bucket}.s3.${config.region}.amazonaws.com/${key}`;

  // Generate signed URL for viewing video
  const signedUrl = await generateSignedVideoUrl({
    key,
    bucket,
    expiresInSeconds: 86400, // 24 hours
  });

  return {
    s3Key: key,
    s3Bucket: bucket,
    s3Url,
    signedUrl,
    signedUrlExpiresAt: expiresAt,
    isSimulated: false,
  };
}

/**
 * Generates an AWS S3 presigned GET URL for viewing the uploaded video.
 */
export async function generateSignedVideoUrl({
  key,
  bucket,
  expiresInSeconds = 86400,
}: {
  key: string;
  bucket?: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const config = getS3Config();
  const targetBucket = bucket || config.bucket;

  if (!config.isConfigured) {
    console.warn(`[S3] Warning: AWS S3 credentials not configured when signing URL for key: ${key}`);
    return `https://${targetBucket}.s3.${config.region}.amazonaws.com/${encodeURIComponent(key)}`;
  }

  const client = getS3Client();
  const getCommand = new GetObjectCommand({
    Bucket: targetBucket,
    Key: key,
  });

  return await getSignedUrl(client, getCommand, {
    expiresIn: expiresInSeconds,
  });
}

/**
 * Generates an AWS S3 presigned PUT URL for direct browser-to-S3 uploads.
 * This completely bypasses Vercel's 4.5MB Serverless Function payload limit.
 */
export async function generatePresignedUploadUrl({
  key,
  contentType,
  bucket,
  expiresInSeconds = 3600,
}: {
  key: string;
  contentType: string;
  bucket?: string;
  expiresInSeconds?: number;
}): Promise<{ uploadUrl: string; key: string; bucket: string; isConfigured: boolean }> {
  const config = getS3Config();
  const targetBucket = bucket || config.bucket;

  if (!config.isConfigured) {
    console.warn(`[S3] Warning: AWS S3 credentials not configured for presigned upload: ${key}`);
    return {
      uploadUrl: `https://${targetBucket}.s3.${config.region}.amazonaws.com/${encodeURIComponent(key)}`,
      key,
      bucket: targetBucket,
      isConfigured: false,
    };
  }

  const client = getS3Client();
  const putCommand = new PutObjectCommand({
    Bucket: targetBucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, putCommand, {
    expiresIn: expiresInSeconds,
  });

  return {
    uploadUrl,
    key,
    bucket: targetBucket,
    isConfigured: true,
  };
}
