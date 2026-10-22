import { getServerBooks } from "@/features/library/server-data";
import { auth } from "@/auth";
import { saveBook } from "@/features/library/repository";
import { revalidatePath, revalidateTag } from "next/cache";
import { readBookInput } from "@/features/library/http-validation";
import { getActiveUserById } from "@/features/users/repository";

export async function GET() {
  const books = await getServerBooks();
  return Response.json(
    { items: books },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user
    ? await getActiveUserById(session.user.id)
    : undefined;
  if (user?.role !== "admin") {
    return Response.json({ error: "Administrator access is required." }, {
      status: 403,
    });
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

function revalidateBookCache() {
  revalidateTag("library-books", "max");
  revalidatePath("/catalog");
  revalidatePath("/books");
}
