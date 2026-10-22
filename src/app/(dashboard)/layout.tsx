import type { PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/navigation/DashboardShell";
import { getActiveUserById } from "@/features/users/repository";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const session = await auth();
  if (!session) redirect("/login?next=%2Fdashboard");
  const user = await getActiveUserById(session.user.id);
  if (user?.role !== "admin") redirect(user ? "/catalog" : "/login");

  return <DashboardShell>{children}</DashboardShell>;
}
