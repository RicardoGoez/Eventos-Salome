"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Notificacion } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";

interface NotificacionesContextType {
  notificaciones: Notificacion[];
  notificacionesNoLeidas: Notificacion[];
  marcarComoLeida: (id: string) => Promise<void>;
  marcarTodasComoLeidas: () => Promise<void>;
  enviarNotificacion: (titulo: string, mensaje: string) => Promise<void>;
}

const NotificacionesContext = createContext<NotificacionesContextType | undefined>(
  undefined
);

export function NotificacionesProvider({
  children,
  usuarioId,
}: {
  children: React.ReactNode;
  usuarioId: string;
}) {
  const { toast } = useToast();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [permisoNotificaciones, setPermisoNotificaciones] = useState<NotificationPermission>(
    typeof window !== "undefined" ? Notification.permission : "default"
  );

  // Solicitar permiso para notificaciones push
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          setPermisoNotificaciones(permission);
        });
      }
    }
  }, []);

  // Cargar notificaciones iniciales
  const cargarNotificaciones = useCallback(async () => {
    if (!usuarioId) return;
    try {
      const response = await fetch(`/api/notificaciones?usuarioId=${usuarioId}`);
      if (response.ok) {
        const data = await response.json();
        setNotificaciones(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    }
  }, [usuarioId]);

  useEffect(() => {
    cargarNotificaciones();
  }, [cargarNotificaciones]);

  // Configurar Supabase Realtime para notificaciones
  useEffect(() => {
    if (!usuarioId) return;

    if (!supabase) return;

    // Suscribirse a cambios en notificaciones (si se almacenan en BD)
    // Por ahora, usamos polling cada 30 segundos y notificaciones push del navegador
    const interval = setInterval(() => {
      cargarNotificaciones();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [usuarioId, cargarNotificaciones]);

  // Mostrar notificación push del navegador
  const mostrarNotificacionPush = useCallback(
    (titulo: string, mensaje: string) => {
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        permisoNotificaciones === "granted"
      ) {
        const notificacion = new Notification(titulo, {
          body: mensaje,
          icon: "/branding/logo.png",
          badge: "/branding/logo.png",
          tag: `notif-${Date.now()}`,
        });

        notificacion.onclick = () => {
          window.focus();
          notificacion.close();
        };

        // Cerrar automáticamente después de 5 segundos
        setTimeout(() => {
          notificacion.close();
        }, 5000);
      }
    },
    [permisoNotificaciones]
  );

  // Escuchar eventos personalizados de notificaciones
  useEffect(() => {
    const handleNotificacionEvent = (event: CustomEvent) => {
      const { titulo, mensaje } = event.detail;
      mostrarNotificacionPush(titulo, mensaje);
      cargarNotificaciones();
    };

    window.addEventListener("nueva-notificacion", handleNotificacionEvent as EventListener);

    return () => {
      window.removeEventListener("nueva-notificacion", handleNotificacionEvent as EventListener);
    };
  }, [mostrarNotificacionPush, cargarNotificaciones]);

  const marcarComoLeida = useCallback(
    async (id: string) => {
      try {
        const response = await fetch("/api/notificaciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificacionId: id, accion: "marcar-leida" }),
        });

        if (response.ok) {
          setNotificaciones((prev) =>
            prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
          );
        }
      } catch (error) {
        console.error("Error al marcar notificación:", error);
      }
    },
    []
  );

  const marcarTodasComoLeidas = useCallback(async () => {
    try {
      const response = await fetch("/api/notificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId, accion: "marcar-todas-leidas" }),
      });

      if (response.ok) {
        setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      }
    } catch (error) {
      console.error("Error al marcar notificaciones:", error);
    }
  }, [usuarioId]);

  const enviarNotificacion = useCallback(
    async (titulo: string, mensaje: string) => {
      try {
        const response = await fetch("/api/notificaciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuarioId,
            titulo,
            mensaje,
            tipo: "PUSH",
          }),
        });

        if (response.ok) {
          mostrarNotificacionPush(titulo, mensaje);
          cargarNotificaciones();
        }
      } catch (error) {
        console.error("Error al enviar notificación:", error);
      }
    },
    [usuarioId, mostrarNotificacionPush, cargarNotificaciones]
  );

  const notificacionesNoLeidas = notificaciones.filter((n) => !n.leida);

  return (
    <NotificacionesContext.Provider
      value={{
        notificaciones,
        notificacionesNoLeidas,
        marcarComoLeida,
        marcarTodasComoLeidas,
        enviarNotificacion,
      }}
    >
      {children}
    </NotificacionesContext.Provider>
  );
}

export function useNotificaciones() {
  const context = useContext(NotificacionesContext);
  if (context === undefined) {
    throw new Error("useNotificaciones debe usarse dentro de NotificacionesProvider");
  }
  return context;
}

