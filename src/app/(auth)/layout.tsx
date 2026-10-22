import type { PropsWithChildren } from "react";
import { AuthShell } from "@/components/layout/AuthShell";

export default function AuthenticationLayout({ children }: PropsWithChildren) {
  return <AuthShell>{children}</AuthShell>;
}
