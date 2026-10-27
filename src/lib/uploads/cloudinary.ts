import "server-only";
import { createHash } from "node:crypto";
import type { PresignedUploadResult, UploadRequest } from "./types";

/**
 * Cloudinary Direct Upload Helper (Signed Presets)
 *
 * Architecture:
 * 1. Server generates timestamp and signature using CLOUDINARY_API_SECRET.
 * 2. Client uploads directly to Cloudinary REST API with signature.
 * 3. Cloudinary performs real-time media transformations (f_auto, q_auto, thumbnails).
 */
export async function createCloudinaryUploadSignature(
  request: UploadRequest,
  userId: string,
): Promise<PresignedUploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "book-hub";
  const apiKey = process.env.CLOUDINARY_API_KEY ?? "sample_key";
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "sample_secret";

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `book_hub/${request.purpose}/${userId}`;

  // Cloudinary signature algorithm: SHA-1 of alphabetically sorted parameters + API Secret
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(paramsToSign).digest("hex");

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const fileUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${folder}/${request.filename}`;

  return {
    provider: "cloudinary",
    uploadUrl,
    fileUrl,
    fields: {
      api_key: apiKey,
      timestamp: String(timestamp),
      signature,
      folder,
    },
    expiresInSeconds: 300,
  };
}

/**
 * Helper to generate optimized Cloudinary responsive URLs
 */
export function getOptimizedImageUrl(
  publicId: string,
  options?: { width?: number; height?: number; crop?: "fill" | "limit" | "thumb" },
) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "book-hub";
  const transforms = [
    "f_auto",
    "q_auto",
    options?.width ? `w_${options.width}` : null,
    options?.height ? `h_${options.height}` : null,
    options?.crop ? `c_${options.crop}` : null,
  ]
    .filter(Boolean)
    .join(",");

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${publicId}`;
}
