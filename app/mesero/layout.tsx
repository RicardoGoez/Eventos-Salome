"use client";

import { MeseroDataProvider } from "@/contexts/mesero-data-context";

export default function MeseroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MeseroDataProvider>
      {children}
    </MeseroDataProvider>
  );
}

