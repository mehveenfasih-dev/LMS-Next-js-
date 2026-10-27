import { auth } from "@/auth";
import { getBook, removeBook, saveBook } from "@/features/library/repository";
import { revalidatePath, revalidateTag } from "next/cache";
import { readBookInput } from "@/features/library/http-validation";
import { getActiveUserById } from "@/features/users/repository";
import { guardMutatingRequest } from "@/lib/security/mutate-guard";
import { rateLimit, rateLimitExceededResponse } from "@/lib/security";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) {
    return Response.json({ error: "Book not found." }, { status: 404 });
  }
  return Response.json(book, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const blocked = await guardMutatingRequest(request, "api:books:write");
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

  const userLimited = await rateLimit(`api:books:write:user:${user.id}`, 30, 60_000);
  if (!userLimited.ok) {
    return rateLimitExceededResponse(userLimited.retryAfterSec);
  }

  const input = await readBookInput(request);
  if (input instanceof Response) return input;
  const { id } = await params;
  try {
    const book = await saveBook(input, id);
    await revalidateBookCache(id);
    return Response.json(book);
  } catch (error) {
    console.error("Could not update the book record.", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not save this book." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const blocked = await guardMutatingRequest(request, "api:books:write");
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

  const userLimited = await rateLimit(`api:books:write:user:${user.id}`, 30, 60_000);
  if (!userLimited.ok) {
    return rateLimitExceededResponse(userLimited.retryAfterSec);
  }

  const { id } = await params;
  try {
    await removeBook(id);
    revalidateTag("library-books", "max");
    revalidatePath("/catalog");
    revalidatePath("/books");
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Could not delete the book record.", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not remove this book." },
      { status: 400 },
    );
  }
}

/** See docs/production-ecosystem.md — data cache + paths only. */
async function revalidateBookCache(id: string) {
  revalidateTag("library-books", "max");
  revalidatePath("/catalog");
  revalidatePath(`/catalog/${id}`);
  revalidatePath("/books");
}
