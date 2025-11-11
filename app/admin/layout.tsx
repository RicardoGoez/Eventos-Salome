"use client";

import React, { useEffect, useState } from "react";
import { AdminDataProvider } from "@/contexts/admin-data-context";
import { NotificacionesProvider } from "@/components/notificaciones/notificaciones-provider";
import { NotificacionesBadge } from "@/components/notificaciones/notificaciones-badge";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usuarioId, setUsuarioId] = useState<string>("");

  useEffect(() => {
    // Obtener usuario del localStorage
    const usuario = localStorage.getItem("usuario");
    if (usuario) {
      try {
        const usuarioData = JSON.parse(usuario);
        setUsuarioId(usuarioData.id || "");
      } catch (error) {
        console.error("Error al parsear usuario:", error);
      }
    }
  }, []);

  return (
    <AdminDataProvider>
      <NotificacionesProvider usuarioId={usuarioId}>
        <div className="relative">
          {/* Badge de notificaciones flotante - solo si hay usuarioId */}
          {usuarioId && (
            <div className="fixed top-4 right-4 z-50">
              <NotificacionesBadge />
            </div>
          )}
          {children}
        </div>
      </NotificacionesProvider>
    </AdminDataProvider>
  );
}

