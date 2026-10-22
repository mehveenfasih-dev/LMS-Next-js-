import type { PropsWithChildren } from "react";
import { PublicShell } from "@/components/layout/PublicShell";

export default function PublicLayout({ children }: PropsWithChildren) {
  return <PublicShell>{children}</PublicShell>;
}
