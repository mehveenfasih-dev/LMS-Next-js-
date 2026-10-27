import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getServerBook } from "@/features/library/server-data";
import { BookModal } from "@/components/modals/BookModal";

type InterceptedBookProps = {
  params: Promise<{ id: string }>;
};

export default async function InterceptedBookModalPage({
  params,
}: InterceptedBookProps) {
  await connection();
  const { id } = await params;
  const book = await getServerBook(id);
  if (!book) notFound();

  return <BookModal book={book} />;
}
