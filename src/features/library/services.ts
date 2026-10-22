"use client";

import axios from "axios";
import { apiClient } from "@/lib/api-client";
import type {
  Book,
  BookInput,
  BorrowRequest,
  BorrowRequestStatus,
  LibraryUser,
} from "./types";

export async function getBooks(): Promise<Book[]> {
  const { data } = await apiClient.get<{ items: Book[] }>("/books");
  return data.items;
}

export async function getBookById(id: string): Promise<Book | undefined> {
  try {
    const { data } = await apiClient.get<Book>(
      `/books/${encodeURIComponent(id)}`,
    );
    return data;
  } catch (error) {
    if (
      error instanceof Error &&
      axios.isAxiosError(error.cause) &&
      error.cause.response?.status === 404
    ) {
      return undefined;
    }
    throw error;
  }
}

export async function saveBook(input: BookInput, id?: string): Promise<Book> {
  const path = id ? `/books/${encodeURIComponent(id)}` : "/books";
  const { data } = id
    ? await apiClient.put<Book>(path, input)
    : await apiClient.post<Book>(path, input);
  return data;
}

export async function deleteBook(id: string): Promise<void> {
  await apiClient.delete(`/books/${encodeURIComponent(id)}`);
}

export async function getUsers(): Promise<LibraryUser[]> {
  const { data } = await apiClient.get<{ items: LibraryUser[] }>("/users");
  return data.items;
}

export async function setUserActive(id: string, active: boolean) {
  const { data } = await apiClient.patch<LibraryUser>(
    `/users/${encodeURIComponent(id)}`,
    { active },
  );
  return data;
}

export async function getRequests(): Promise<BorrowRequest[]> {
  const { data } = await apiClient.get<{ items: BorrowRequest[] }>("/requests");
  return data.items;
}

export async function requestBook(bookId: string): Promise<BorrowRequest> {
  const { data } = await apiClient.post<BorrowRequest>("/requests", { bookId });
  return data;
}

export async function updateRequestStatus(
  id: string,
  status: BorrowRequestStatus,
) {
  const { data } = await apiClient.patch<BorrowRequest>(
    `/requests/${encodeURIComponent(id)}`,
    { status },
  );
  return data;
}

export function notify(
  message: string,
  severity: "success" | "error" | "info" = "success",
) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("library:notification", {
        detail: { message, severity },
      }),
    );
  }
}
