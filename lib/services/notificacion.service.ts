import { Notificacion } from "@/types/domain";

export class NotificacionService {
  private notificaciones: Map<string, Notificacion> = new Map();

  /**
   * Envía notificación push del navegador
   */
  async enviarNotificacionPush(
    usuarioId: string,
    titulo: string,
    mensaje: string
  ): Promise<Notificacion> {
    // Verificar si el navegador soporta notificaciones
    if (typeof window !== "undefined" && "Notification" in window) {
      // Solicitar permiso si no está concedido
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }

      // Enviar notificación si el permiso está concedido
      if (Notification.permission === "granted") {
        new Notification(titulo, {
          body: mensaje,
          icon: "/branding/logo.png",
          badge: "/branding/logo.png",
        });
      }
    }

    // Guardar notificación en el sistema
    const notificacion: Notificacion = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      usuarioId,
      tipo: "PUSH",
      titulo,
      mensaje,
      leida: false,
      fecha: new Date(),
      createdAt: new Date(),
    };

    this.notificaciones.set(notificacion.id, notificacion);
    return notificacion;
  }

  /**
   * Envía notificación por email (simulado - en producción usar servicio de email)
   */
  async enviarEmail(
    usuarioId: string,
    asunto: string,
    cuerpo: string
  ): Promise<Notificacion> {
    // En producción, esto debería integrarse con un servicio de email
    // como SendGrid, AWS SES, etc.
    console.log(`[EMAIL] Para: ${usuarioId}`);
    console.log(`[EMAIL] Asunto: ${asunto}`);
    console.log(`[EMAIL] Cuerpo: ${cuerpo}`);

    const notificacion: Notificacion = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      usuarioId,
      tipo: "EMAIL",
      titulo: asunto,
      mensaje: cuerpo,
      leida: false,
      fecha: new Date(),
      createdAt: new Date(),
    };

    this.notificaciones.set(notificacion.id, notificacion);
    return notificacion;
  }

  /**
   * Crea notificación in-app
   */
  async crearNotificacionInApp(
    usuarioId: string,
    titulo: string,
    mensaje: string
  ): Promise<Notificacion> {
    const notificacion: Notificacion = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      usuarioId,
      tipo: "IN_APP",
      titulo,
      mensaje,
      leida: false,
      fecha: new Date(),
      createdAt: new Date(),
    };

    this.notificaciones.set(notificacion.id, notificacion);
    return notificacion;
  }

  /**
   * Obtiene notificaciones no leídas para un usuario
   */
  async obtenerNotificacionesNoLeidas(
    usuarioId: string
  ): Promise<Notificacion[]> {
    return Array.from(this.notificaciones.values())
      .filter((n) => n.usuarioId === usuarioId && !n.leida)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  /**
   * Marca una notificación como leída
   */
  async marcarComoLeida(notificacionId: string): Promise<void> {
    const notificacion = this.notificaciones.get(notificacionId);
    if (notificacion) {
      notificacion.leida = true;
      this.notificaciones.set(notificacionId, notificacion);
    }
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  async marcarTodasComoLeidas(usuarioId: string): Promise<void> {
    const notificaciones = Array.from(this.notificaciones.values()).filter(
      (n) => n.usuarioId === usuarioId && !n.leida
    );

    notificaciones.forEach((notificacion) => {
      notificacion.leida = true;
      this.notificaciones.set(notificacion.id, notificacion);
    });
  }
}

