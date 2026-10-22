import { auth } from "@/auth";
import {
  createBorrowRequest,
  listBorrowRequests,
} from "@/features/library/repository";
import { revalidatePath } from "next/cache";
import { getActiveUserById } from "@/features/users/repository";

export async function GET() {
  const session = await auth();
  const user = session?.user
    ? await getActiveUserById(session.user.id)
    : undefined;
  if (!user) {
    return Response.json({ error: "Sign in to view borrowing requests." }, {
      status: 401,
    });
  }

  try {
    const items = await listBorrowRequests(
      user.role === "admin" ? undefined : user.id,
    );
    return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load borrowing requests.", error);
    return Response.json({ error: "Could not load borrowing requests." }, {
      status: 500,
    });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user
    ? await getActiveUserById(session.user.id)
    : undefined;
  if (user?.role !== "member") {
    return Response.json({ error: "Member access is required." }, {
      status: 403,
    });
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
    !("bookId" in payload) ||
    typeof payload.bookId !== "string"
  ) {
    return Response.json({ error: "A valid book ID is required." }, {
      status: 400,
    });
  }

  try {
    const borrowingRequest = await createBorrowRequest(
      payload.bookId,
      user.id,
    );
    revalidatePath("/requests");
    revalidatePath("/my-requests");
    revalidatePath("/dashboard");
    return Response.json(borrowingRequest, { status: 201 });
  } catch (error) {
    console.error("Could not create borrowing request.", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create the borrowing request.",
      },
      { status: 400 },
    );
  }
}
