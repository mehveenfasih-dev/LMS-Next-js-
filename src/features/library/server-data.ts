import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getBook, listBooks } from "./repository";
import type { Book } from "./types";

/**
 * Catalog list uses the Next.js data cache (`"use cache"` + `library-books`).
 * Detail lookups stay uncached. Invalidation, Router Cache, React Query, and
 * CDN layers are separate — see docs/production-ecosystem.md.
 */
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
