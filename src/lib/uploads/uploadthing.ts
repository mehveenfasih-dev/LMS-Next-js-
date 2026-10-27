import "server-only";
import type { PresignedUploadResult, UploadRequest } from "./types";

/**
 * UploadThing Integration Architecture:
 *
 * UploadThing provides a file-router pattern tailored for Next.js App Router:
 *
 * 1. Define FileRouter with routes:
 *    - `bookCoverUploader`: max 4MB image files, admin-only.
 *    - `userAvatarUploader`: max 2MB image files, member-only.
 * 2. Each endpoint specifies:
 *    - `.middleware(async ({ req }) => { const session = await auth(); if (!session) throw new Error("Unauthorized"); return { userId: session.user.id }; })`
 *    - `.onUploadComplete(async ({ metadata, file }) => { console.log("Uploaded by:", metadata.userId, file.url); })`
 * 3. Client components use typed hooks (`useUploadThing`) or prebuilt UI buttons (`<UploadButton />`).
 */

export async function createUploadThingTicket(
  request: UploadRequest,
  userId: string,
): Promise<PresignedUploadResult> {
  const appId = process.env.UPLOADTHING_APP_ID ?? "sample_app";

  return {
    provider: "uploadthing",
    uploadUrl: `https://uploadthing.com/api/upload/${appId}`,
    fileUrl: `https://utfs.io/f/${userId}-${request.filename}`,
    headers: {
      "x-uploadthing-version": "6.0.0",
    },
    expiresInSeconds: 300,
  };
}
