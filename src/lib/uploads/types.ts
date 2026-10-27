import { z } from "zod";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const UploadRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(ALLOWED_IMAGE_TYPES, {
    message: "Unsupported file type. Only JPEG, PNG, WEBP, and GIF are allowed.",
  }),
  size: z.number().int().positive().max(MAX_FILE_SIZE, {
    message: "File exceeds maximum size of 5 MB.",
  }),
  purpose: z.enum(["book_cover", "profile_avatar", "catalog_attachment"]),
});

export type UploadRequest = z.infer<typeof UploadRequestSchema>;

export type PresignedUploadResult = {
  provider: "s3" | "cloudinary" | "uploadthing";
  uploadUrl: string;
  fileUrl: string;
  fields?: Record<string, string>;
  headers?: Record<string, string>;
  expiresInSeconds: number;
};
