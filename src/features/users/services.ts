import { getUsers as getLibraryUsers } from "@/features/library/services";
import type { User } from "./types";

export async function getUsers(): Promise<User[]> {
  return getLibraryUsers();
}
