import type { Metadata } from "next";
import { connection } from "next/server";
import { auth } from "@/auth";
import { MemberRequests } from "@/features/library/components/MemberRequests";
import { listBorrowRequests } from "@/features/library/repository";

export const metadata: Metadata = { title: "My requests" };

export default async function MyRequestsPage() {
  await connection();
  const session = await auth();
  const requests = await listBorrowRequests(session?.user.id);
  return <MemberRequests initialRequests={requests} />;
}
