"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Book, BookInput, BorrowRequestStatus } from "./types";
import {
  deleteBook,
  getBookById,
  getBooks,
  getRequests,
  getUsers,
  requestBook,
  saveBook,
  setUserActive,
  updateRequestStatus,
} from "./services";
import type { LibraryUser } from "./types";
import { useAuth } from "@/components/providers/AuthProvider";

export const libraryKeys = {
  books: ["library", "books"] as const,
  book: (id: string) => ["library", "books", id] as const,
  requests: ["library", "requests"] as const,
  members: ["library", "members"] as const,
};

export function useBooksQuery(initialData?: Book[]) {
  return useQuery({
    queryKey: libraryKeys.books,
    queryFn: getBooks,
    initialData,
    initialDataUpdatedAt: 0,
  });
}

export function useBookQuery(id: string, initialData?: Book) {
  return useQuery({
    queryKey: libraryKeys.book(id),
    queryFn: async () => {
      const book = await getBookById(id);
      if (!book) throw new Error("This book could not be found in the catalog.");
      return book;
    },
    initialData: initialData?.id === id ? initialData : undefined,
    initialDataUpdatedAt: 0,
  });
}

export function useRequestsQuery(initialData?: Awaited<ReturnType<typeof getRequests>>) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...libraryKeys.requests, user?.id ?? "anonymous"],
    queryFn: getRequests,
    initialData,
    initialDataUpdatedAt: 0,
    enabled: Boolean(user),
  });
}

export function useMembersQuery(initialData?: LibraryUser[]) {
  return useQuery({
    queryKey: libraryKeys.members,
    queryFn: getUsers,
    initialData,
    initialDataUpdatedAt: 0,
  });
}

export function useSaveBookMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, id }: { input: BookInput; id?: string }) =>
      saveBook(input, id),
    onSuccess: async (book) => {
      queryClient.setQueryData(libraryKeys.book(book.id), book);
      await queryClient.invalidateQueries({ queryKey: libraryKeys.books });
    },
  });
}

export function useDeleteBookMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBook,
    onSuccess: async (_, id) => {
      queryClient.removeQueries({ queryKey: libraryKeys.book(id) });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: libraryKeys.books }),
        queryClient.invalidateQueries({ queryKey: libraryKeys.requests }),
      ]);
    },
  });
}

export function useRequestBookMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ book }: { book: Book }) => requestBook(book.id),
    onSuccess: async (_request, { book }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: libraryKeys.books }),
        queryClient.invalidateQueries({ queryKey: libraryKeys.book(book.id) }),
        queryClient.invalidateQueries({ queryKey: libraryKeys.requests }),
      ]);
    },
  });
}

export function useUpdateRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BorrowRequestStatus }) =>
      updateRequestStatus(id, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: libraryKeys.books }),
        queryClient.invalidateQueries({ queryKey: libraryKeys.requests }),
      ]);
    },
  });
}

export function useSetMemberActiveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setUserActive(id, active),
    onSuccess: async (user) => {
      queryClient.setQueryData<LibraryUser[]>(
        libraryKeys.members,
        (members) =>
          members?.map((member) => (member.id === user.id ? user : member)),
      );
      await queryClient.invalidateQueries({ queryKey: libraryKeys.members });
    },
  });
}
