import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getBook, listBooks } from "./repository";
import type { Book } from "./types";

export async function getServerBooks() {
  return getCachedBooks();
}

export async function getServerBook(id: string) {
  return getBook(id);
}

async function getCachedBooks(): Promise<Book[]> {
  "use cache";

  cacheLife("hours");
  cacheTag("library-books");
  return listBooks();
}
