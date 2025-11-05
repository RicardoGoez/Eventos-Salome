"use client";

import React from "react";
import { ClientDataProvider } from "@/contexts/client-data-context";

export default function MiCuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientDataProvider>
      {children}
    </ClientDataProvider>
  );
}

