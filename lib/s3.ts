import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
function getS3Client(): S3Client {
  const region = process.env.AWS_REGION || 'us-east-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'moonsys-projects';

export interface UploadResult {
  url: string;
  key: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

/**
 * Generate a presigned URL for direct upload from client
 */
export async function getPresignedUploadUrl(
  projectId: number,
  fileName: string,
  fileType: string,
  fileCategory: 'screenshot' | 'document' | 'video' | 'other' = 'other'
): Promise<PresignedUrlResult> {
  const s3Client = getS3Client();
  
  // Sanitize filename and create unique key
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const key = `moonsys-projects/${projectId}/${fileCategory}/${timestamp}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  // URL expires in 5 minutes
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  
  // Construct the public URL (assuming bucket has public read access or CloudFront)
  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

  return {
    uploadUrl,
    fileUrl,
    key,
  };
}

/**
 * Upload a file directly from the server (for small files or server-side operations)
 */
export async function uploadFile(
  projectId: number,
  file: Buffer,
  fileName: string,
  fileType: string,
  fileCategory: 'screenshot' | 'document' | 'video' | 'other' = 'other'
): Promise<UploadResult> {
  const s3Client = getS3Client();
  
  // Sanitize filename and create unique key
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const key = `moonsys-projects/${projectId}/${fileCategory}/${timestamp}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: fileType,
  });

  await s3Client.send(command);
  
  const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

  return { url, key };
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  const s3Client = getS3Client();
  
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
  console.log(`✅ Deleted file from S3: ${key}`);
}

/**
 * Get a presigned URL for downloading/viewing a file
 */
export async function getPresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const s3Client = getS3Client();
  
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Check if S3 is configured
 */
export function isS3Configured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  );
}
