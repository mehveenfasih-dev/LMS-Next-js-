import type { PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MemberShell } from "@/components/layout/MemberShell";
import { getActiveUserById } from "@/features/users/repository";
import { cookies } from "next/headers";
export default async function MemberLayout({ children }: PropsWithChildren) {
  const session = await auth();
  if (!session) redirect("/login?next=%2Fmy-requests");
  const user = await getActiveUserById(session.user.id);
  if (user?.role !== "member") redirect(user ? "/dashboard" : "/login");
const cookieStore = await cookies();
  const variant = cookieStore.get("experiment")?.value === "B" ? "B" : "A";

  return <MemberShell variant={variant}>{children}</MemberShell>;
}
