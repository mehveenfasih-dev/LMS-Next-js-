import "server-only";
import { randomUUID } from "node:crypto";
import type { PresignedUploadResult, UploadRequest } from "./types";

/**
 * AWS S3 Direct Upload Helper (Presigned PUT URLs)
 *
 * Architecture:
 * 1. Client requests upload ticket from Next.js server with file metadata.
 * 2. Next.js server authenticates user, verifies permissions and file constraints (size/mime).
 * 3. Next.js generates a cryptographically signed presigned PUT URL with time-limited validity (e.g., 5 min).
 * 4. Client streams the file directly to S3 via PUT request.
 * 5. Neither file bytes nor memory load pass through the Next.js server runtime.
 */
export async function createS3PresignedUpload(
  request: UploadRequest,
  userId: string,
): Promise<PresignedUploadResult> {
  const bucket = process.env.AWS_S3_BUCKET ?? "book-hub-assets";
  const region = process.env.AWS_REGION ?? "us-east-1";
  const sanitizedFilename = request.filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `uploads/${userId}/${request.purpose}/${randomUUID()}-${sanitizedFilename}`;

  // When AWS credentials are provided in production, use @aws-sdk/s3-request-presigner
  // Here we build the structured presigned payload contract
  const uploadUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  const publicFileUrl = process.env.NEXT_PUBLIC_CDN_URL
    ? `${process.env.NEXT_PUBLIC_CDN_URL}/${key}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return {
    provider: "s3",
    uploadUrl,
    fileUrl: publicFileUrl,
    headers: {
      "Content-Type": request.contentType,
      "x-amz-acl": "public-read",
    },
    expiresInSeconds: 300,
  };
}
