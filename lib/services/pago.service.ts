import { MetodoPago, Pedido } from "@/types/domain";

export interface ResultadoPago {
  exito: boolean;
  transaccionId?: string;
  mensaje: string;
  detalles?: any;
}

export interface DatosPagoTarjeta {
  numero: string;
  nombre: string;
  expiracion: string; // MM/YY
  cvv: string;
  monto: number;
  descripcion?: string;
}

/**
 * Servicio de pagos - Integración con pasarelas de pago
 * Por ahora soporta Stripe (puede extenderse a PayPal, etc.)
 */
export class PagoService {
  private stripePublicKey?: string;
  private stripeSecretKey?: string;

  constructor() {
    // En producción, estas claves deben venir de variables de entorno
    this.stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
    this.stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  }

  /**
   * Procesa pago con tarjeta usando Stripe
   */
  async procesarPagoTarjeta(
    datos: DatosPagoTarjeta
  ): Promise<ResultadoPago> {
    try {
      // Validar datos de tarjeta
      if (!this.validarTarjeta(datos.numero)) {
        return {
          exito: false,
          mensaje: "Número de tarjeta inválido",
        };
      }

      if (!this.validarCVV(datos.cvv)) {
        return {
          exito: false,
          mensaje: "CVV inválido",
        };
      }

      if (!this.validarExpiracion(datos.expiracion)) {
        return {
          exito: false,
          mensaje: "Fecha de expiración inválida",
        };
      }

      // Si Stripe está configurado, procesar pago real
      if (this.stripeSecretKey) {
        return await this.procesarConStripe(datos);
      }

      // Modo simulado (para desarrollo)
      return this.procesarPagoSimulado(datos);
    } catch (error) {
      return {
        exito: false,
        mensaje: error instanceof Error ? error.message : "Error al procesar pago",
      };
    }
  }

  /**
   * Procesa pago con Stripe (producción)
   */
  private async procesarConStripe(
    datos: DatosPagoTarjeta
  ): Promise<ResultadoPago> {
    try {
      // Crear PaymentIntent en Stripe
      const response = await fetch("/api/pagos/stripe/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monto: datos.monto,
          descripcion: datos.descripcion || "Pago Eventos Salome",
        }),
      });

      if (!response.ok) {
        throw new Error("Error al crear intención de pago");
      }

      const { clientSecret } = await response.json();

      // Confirmar pago
      const confirmResponse = await fetch("/api/pagos/stripe/confirm-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientSecret,
          numero: datos.numero,
          nombre: datos.nombre,
          expiracion: datos.expiracion,
          cvv: datos.cvv,
        }),
      });

      if (!confirmResponse.ok) {
        const error = await confirmResponse.json();
        throw new Error(error.mensaje || "Error al confirmar pago");
      }

      const resultado = await confirmResponse.json();

      return {
        exito: true,
        transaccionId: resultado.paymentIntentId,
        mensaje: "Pago procesado exitosamente",
        detalles: resultado,
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: error instanceof Error ? error.message : "Error al procesar pago con Stripe",
      };
    }
  }

  /**
   * Procesa pago simulado (para desarrollo/testing)
   */
  private procesarPagoSimulado(datos: DatosPagoTarjeta): ResultadoPago {
    // Simular procesamiento
    const transaccionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Simular validación de tarjeta
    if (datos.numero.startsWith("4")) {
      // Visa
      return {
        exito: true,
        transaccionId,
        mensaje: "Pago procesado exitosamente (modo simulado)",
        detalles: {
          metodo: "TARJETA",
          marca: "Visa",
          ultimos4: datos.numero.slice(-4),
        },
      };
    } else if (datos.numero.startsWith("5")) {
      // Mastercard
      return {
        exito: true,
        transaccionId,
        mensaje: "Pago procesado exitosamente (modo simulado)",
        detalles: {
          metodo: "TARJETA",
          marca: "Mastercard",
          ultimos4: datos.numero.slice(-4),
        },
      };
    } else {
      return {
        exito: false,
        mensaje: "Tipo de tarjeta no soportado en modo simulado",
      };
    }
  }

  /**
   * Valida número de tarjeta usando algoritmo de Luhn
   */
  private validarTarjeta(numero: string): boolean {
    // Remover espacios y guiones
    const numeroLimpio = numero.replace(/[\s-]/g, "");

    // Verificar que solo contenga dígitos
    if (!/^\d+$/.test(numeroLimpio)) {
      return false;
    }

    // Verificar longitud (13-19 dígitos)
    if (numeroLimpio.length < 13 || numeroLimpio.length > 19) {
      return false;
    }

    // Algoritmo de Luhn
    let suma = 0;
    let esPar = false;

    for (let i = numeroLimpio.length - 1; i >= 0; i--) {
      let digito = parseInt(numeroLimpio[i]);

      if (esPar) {
        digito *= 2;
        if (digito > 9) {
          digito -= 9;
        }
      }

      suma += digito;
      esPar = !esPar;
    }

    return suma % 10 === 0;
  }

  /**
   * Valida CVV
   */
  private validarCVV(cvv: string): boolean {
    return /^\d{3,4}$/.test(cvv);
  }

  /**
   * Valida fecha de expiración
   */
  private validarExpiracion(expiracion: string): boolean {
    const regex = /^(\d{2})\/(\d{2})$/;
    const match = expiracion.match(regex);

    if (!match) {
      return false;
    }

    const mes = parseInt(match[1]);
    const año = parseInt("20" + match[2]);
    const ahora = new Date();
    const fechaExpiracion = new Date(año, mes - 1);

    return (
      mes >= 1 &&
      mes <= 12 &&
      fechaExpiracion >= ahora
    );
  }

  /**
   * Procesa reembolso
   */
  async procesarReembolso(
    transaccionId: string,
    monto?: number
  ): Promise<ResultadoPago> {
    try {
      if (this.stripeSecretKey) {
        // Reembolso real con Stripe
        const response = await fetch("/api/pagos/stripe/refund", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transaccionId,
            monto,
          }),
        });

        if (!response.ok) {
          throw new Error("Error al procesar reembolso");
        }

        const resultado = await response.json();

        return {
          exito: true,
          transaccionId: resultado.refundId,
          mensaje: "Reembolso procesado exitosamente",
          detalles: resultado,
        };
      }

      // Modo simulado
      return {
        exito: true,
        transaccionId: `refund_${Date.now()}`,
        mensaje: "Reembolso procesado exitosamente (modo simulado)",
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: error instanceof Error ? error.message : "Error al procesar reembolso",
      };
    }
  }
}

