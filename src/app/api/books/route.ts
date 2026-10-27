import { getServerBooks } from "@/features/library/server-data";
import { auth } from "@/auth";
import { saveBook } from "@/features/library/repository";
import { revalidatePath, revalidateTag } from "next/cache";
import { readBookInput } from "@/features/library/http-validation";
import { getActiveUserById } from "@/features/users/repository";
import { guardMutatingRequest } from "@/lib/security/mutate-guard";
import { rateLimit, rateLimitExceededResponse } from "@/lib/security";

export async function GET() {
  const books = await getServerBooks();
  return Response.json(
    { items: books },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const blocked = await guardMutatingRequest(request, "api:books:write");
  if (blocked) return blocked;

  const session = await auth();
  // Never trust a client-supplied role; re-read the active SQL Server user.
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
  try {
    const book = await saveBook(input);
    revalidateBookCache();
    return Response.json(book, { status: 201 });
  } catch (error) {
    console.error("Could not create the book record.", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not save this book." },
      { status: 400 },
    );
  }
}

/** See docs/production-ecosystem.md — invalidates data cache + route paths, not React Query. */
function revalidateBookCache() {
  revalidateTag("library-books", "max");
  revalidatePath("/catalog");
  revalidatePath("/books");
}
