"use client";

import React from "react";
import { AdminDataProvider } from "@/contexts/admin-data-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminDataProvider>
      {children}
    </AdminDataProvider>
  );
}

