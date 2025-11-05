"use client";

import React from "react";
import { AdminDataProvider } from "@/contexts/admin-data-context";

/**
 * Wrapper para páginas del Admin que necesitan el contexto de datos compartido
 * Usa este componente para envolver el contenido de las páginas del admin
 */
export function AdminWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AdminDataProvider>
      {children}
    </AdminDataProvider>
  );
}

