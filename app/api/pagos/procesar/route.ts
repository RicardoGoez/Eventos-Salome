import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metodo, datos } = body;

    const pagoService = ServiceFactory.getPagoService();

    if (metodo === "TARJETA") {
      const resultado = await pagoService.procesarPagoTarjeta(datos);
      return NextResponse.json(resultado);
    }

    return NextResponse.json(
      { error: "Método de pago no soportado" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al procesar pago",
      },
      { status: 500 }
    );
  }
}

