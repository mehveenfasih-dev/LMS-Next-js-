import { auth } from "@/auth";
import { changeBorrowRequestStatus } from "@/features/library/repository";
import type { BorrowRequestStatus } from "@/features/library/types";
import { revalidatePath, revalidateTag } from "next/cache";
import { getActiveUserById } from "@/features/users/repository";
import { guardMutatingRequest } from "@/lib/security/mutate-guard";
import { rateLimit, rateLimitExceededResponse } from "@/lib/security";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const blocked = await guardMutatingRequest(request, "api:requests:status");
  if (blocked) return blocked;

  const session = await auth();
  const user = session?.user
    ? await getActiveUserById(session.user.id)
    : undefined;
  if (user?.role !== "admin") {
    return Response.json({ error: "Administrator access is required." }, {
      status: 403,
    });
  }

  const userLimited = await rateLimit(
    `api:requests:status:user:${user.id}`,
    60,
    60_000,
  );
  if (!userLimited.ok) {
    return rateLimitExceededResponse(userLimited.retryAfterSec);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "A valid JSON body is required." }, {
      status: 400,
    });
  }
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("status" in payload) ||
    !isAdminRequestStatus(payload.status)
  ) {
    return Response.json({ error: "A valid request status is required." }, {
      status: 400,
    });
  }

  const { id } = await params;
  try {
    const updated = await changeBorrowRequestStatus(id, payload.status);
    revalidateTag("library-books", "max");
    revalidatePath("/catalog");
    revalidatePath("/requests");
    revalidatePath("/my-requests");
    revalidatePath("/dashboard");
    return Response.json(updated);
  } catch (error) {
    console.error("Could not update the borrowing request.", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update the borrowing request.",
      },
      { status: 400 },
    );
  }
}

function isAdminRequestStatus(
  status: unknown,
): status is Extract<BorrowRequestStatus, "approved" | "rejected" | "returned"> {
  return status === "approved" || status === "rejected" || status === "returned";
}
