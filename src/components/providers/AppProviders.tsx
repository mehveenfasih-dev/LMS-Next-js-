"use client";

import { Suspense } from "react";
import { StateProviders } from "./StateProviders";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={<div className="app-startup" aria-label="Starting Book Hub" />}
    >
      <StateProviders>{children}</StateProviders>
    </Suspense>
  );
}
