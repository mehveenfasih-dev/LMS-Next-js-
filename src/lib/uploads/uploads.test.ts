import { describe, expect, it } from "vitest";
import { UploadRequestSchema } from "./types";
import { createS3PresignedUpload } from "./s3";
import { createCloudinaryUploadSignature } from "./cloudinary";
import { createUploadThingTicket } from "./uploadthing";

describe("Uploads Validation and Ticket Generation", () => {
  it("accepts valid image upload requests", () => {
    const validData = {
      filename: "cover.png",
      contentType: "image/png",
      size: 1024 * 500, // 500 KB
      purpose: "book_cover",
    };

    const parsed = UploadRequestSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it("rejects files exceeding size limit (5MB)", () => {
    const oversizedData = {
      filename: "large.jpg",
      contentType: "image/jpeg",
      size: 6 * 1024 * 1024, // 6 MB
      purpose: "book_cover",
    };

    const parsed = UploadRequestSchema.safeParse(oversizedData);
    expect(parsed.success).toBe(false);
  });

  it("rejects unsupported MIME types", () => {
    const invalidType = {
      filename: "script.exe",
      contentType: "application/x-msdownload",
      size: 1024,
      purpose: "catalog_attachment",
    };

    const parsed = UploadRequestSchema.safeParse(invalidType);
    expect(parsed.success).toBe(false);
  });

  it("generates S3 upload tickets with public headers and expiry", async () => {
    const ticket = await createS3PresignedUpload(
      {
        filename: "my-book.jpg",
        contentType: "image/jpeg",
        size: 2048,
        purpose: "book_cover",
      },
      "user-123",
    );

    expect(ticket.provider).toBe("s3");
    expect(ticket.uploadUrl).toContain("amazonaws.com");
    expect(ticket.headers?.["Content-Type"]).toBe("image/jpeg");
    expect(ticket.expiresInSeconds).toBe(300);
  });

  it("generates Cloudinary signatures with SHA-1 hash", async () => {
    const ticket = await createCloudinaryUploadSignature(
      {
        filename: "avatar.png",
        contentType: "image/png",
        size: 1024,
        purpose: "profile_avatar",
      },
      "user-456",
    );

    expect(ticket.provider).toBe("cloudinary");
    expect(ticket.uploadUrl).toContain("cloudinary.com");
    expect(ticket.fields?.signature).toBeDefined();
    expect(ticket.fields?.timestamp).toBeDefined();
  });

  it("generates UploadThing tickets with version headers", async () => {
    const ticket = await createUploadThingTicket(
      {
        filename: "doc.webp",
        contentType: "image/webp",
        size: 4096,
        purpose: "catalog_attachment",
      },
      "user-789",
    );

    expect(ticket.provider).toBe("uploadthing");
    expect(ticket.headers?.["x-uploadthing-version"]).toBe("6.0.0");
  });
});
