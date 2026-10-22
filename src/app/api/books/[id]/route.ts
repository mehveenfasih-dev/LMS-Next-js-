import { auth } from "@/auth";
import { getBook, removeBook, saveBook } from "@/features/library/repository";
import { revalidatePath, revalidateTag } from "next/cache";
import { readBookInput } from "@/features/library/http-validation";
import { getActiveUserById } from "@/features/users/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) {
    return Response.json({ error: "Book not found." }, { status: 404 });
  }
  return Response.json(book);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const user = session?.user
    ? await getActiveUserById(session.user.id)
    : undefined;
  if (user?.role !== "admin") {
    return Response.json({ error: "Administrator access is required." }, {
      status: 403,
    });
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

async function revalidateBookCache(id: string) {
  revalidateTag("library-books", "max");
  revalidatePath("/catalog");
  revalidatePath(`/catalog/${id}`);
  revalidatePath("/books");
}
