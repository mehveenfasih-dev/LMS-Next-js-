import type { PropsWithChildren, ReactNode } from "react";

export default function CatalogLayout({
  children,
  modal,
}: PropsWithChildren<{ modal: ReactNode }>) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
