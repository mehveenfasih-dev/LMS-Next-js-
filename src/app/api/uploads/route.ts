import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getActiveUserById } from "@/features/users/repository";
import { guardMutatingRequest } from "@/lib/security/mutate-guard";
import { UploadRequestSchema } from "@/lib/uploads/types";
import { createS3PresignedUpload } from "@/lib/uploads/s3";
import { createCloudinaryUploadSignature } from "@/lib/uploads/cloudinary";
import { createUploadThingTicket } from "@/lib/uploads/uploadthing";

export async function POST(request: NextRequest) {
  // CSRF verification and rate limiting
  const guard = await guardMutatingRequest(request, "upload-presign", {
    limit: 10,
    windowMs: 60_000,
  });
  if (guard) return guard;

  // Authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeUser = await getActiveUserById(session.user.id);
  if (!activeUser || !activeUser.active) {
    return NextResponse.json({ error: "Account inactive" }, { status: 403 });
  }

  // Parse and validate payload
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parseResult = UploadRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parseResult.error.flatten() },
      { status: 422 },
    );
  }

  const uploadReq = parseResult.data;

  // If uploading a book cover, enforce admin role
  if (uploadReq.purpose === "book_cover" && activeUser.role !== "admin") {
    return NextResponse.json(
      { error: "Only librarians and admins can upload book covers" },
      { status: 403 },
    );
  }

  const provider = request.nextUrl.searchParams.get("provider") ?? "s3";

  try {
    let result;
    switch (provider) {
      case "cloudinary":
        result = await createCloudinaryUploadSignature(
          uploadReq,
          activeUser.id,
        );
        break;
      case "uploadthing":
        result = await createUploadThingTicket(uploadReq, activeUser.id);
        break;
      case "s3":
      default:
        result = await createS3PresignedUpload(uploadReq, activeUser.id);
        break;
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Failed to generate upload ticket:", err);
    return NextResponse.json(
      { error: "Failed to generate upload ticket" },
      { status: 500 },
    );
  }
}
