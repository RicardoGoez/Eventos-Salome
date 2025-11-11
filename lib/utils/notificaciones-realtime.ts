import { supabase } from "@/lib/supabase/client";

/**
 * Utilidad para enviar notificaciones en tiempo real usando eventos personalizados
 * y Supabase Realtime cuando sea necesario
 */
export class NotificacionesRealtime {
  private static supabase = supabase;

  /**
   * Envía una notificación push inmediata
   */
  static enviarNotificacion(titulo: string, mensaje: string) {
    if (typeof window !== "undefined") {
      // Disparar evento personalizado
      const event = new CustomEvent("nueva-notificacion", {
        detail: { titulo, mensaje },
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Suscribe a cambios en alertas de inventario
   */
  static suscribirAlertasInventario(callback: (alerta: any) => void) {
    if (!this.supabase) {
      console.warn("Supabase no está disponible");
      return () => {};
    }

    const channel = this.supabase
      .channel("alertas-inventario")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alertas_inventario", // Asumiendo que existe esta tabla
        },
        (payload) => {
          callback(payload.new);
          this.enviarNotificacion(
            "Nueva Alerta de Inventario",
            `Alerta: ${(payload.new as any).mensaje || "Stock bajo detectado"}`
          );
        }
      )
      .subscribe();

    return () => {
      if (this.supabase) {
        this.supabase.removeChannel(channel);
      }
    };
  }

  /**
   * Suscribe a cambios en pedidos críticos
   */
  static suscribirPedidosCriticos(callback: (pedido: any) => void) {
    if (!this.supabase) {
      console.warn("Supabase no está disponible");
      return () => {};
    }

    const channel = this.supabase
      .channel("pedidos-criticos")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
          filter: "estado=eq.EN_PREPARACION",
        },
        (payload) => {
          // Verificar si el pedido es crítico (tiempo excesivo)
          const pedido = payload.new as any;
          const fechaPedido = new Date(pedido.fecha);
          const ahora = new Date();
          const minutosTranscurridos =
            (ahora.getTime() - fechaPedido.getTime()) / (1000 * 60);

          if (minutosTranscurridos > 10) {
            callback(pedido);
            this.enviarNotificacion(
              "Pedido Crítico",
              `El pedido #${pedido.numero} lleva más de ${Math.round(minutosTranscurridos)} minutos en preparación`
            );
          }
        }
      )
      .subscribe();

    return () => {
      if (this.supabase) {
        this.supabase.removeChannel(channel);
      }
    };
  }

  /**
   * Suscribe a alertas de negocio
   */
  static suscribirAlertasNegocio(callback: (alerta: any) => void) {
    if (!this.supabase) {
      console.warn("Supabase no está disponible");
      return () => {};
    }

    const channel = this.supabase
      .channel("alertas-negocio")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alertas_negocio", // Asumiendo que existe esta tabla
        },
        (payload) => {
          const alerta = payload.new as any;
          callback(alerta);
          this.enviarNotificacion(
            `Alerta: ${alerta.tipo}`,
            alerta.mensaje || "Nueva alerta de negocio detectada"
          );
        }
      )
      .subscribe();

    return () => {
      if (this.supabase) {
        this.supabase.removeChannel(channel);
      }
    };
  }
}

