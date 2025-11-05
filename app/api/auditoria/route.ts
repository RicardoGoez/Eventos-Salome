import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const usuarioId = searchParams.get("usuarioId");
    const entidad = searchParams.get("entidad");
    const entidadId = searchParams.get("entidadId");
    const fechaInicio = searchParams.get("fechaInicio");
    const fechaFin = searchParams.get("fechaFin");
    const accion = searchParams.get("accion");

    const auditoriaService = ServiceFactory.getAuditoriaService();

    let actividades;
    if (usuarioId) {
      actividades = await auditoriaService.obtenerHistorialPorUsuario(usuarioId);
    } else if (entidad && entidadId) {
      actividades = await auditoriaService.obtenerHistorialPorEntidad(
        entidad,
        entidadId
      );
    } else if (fechaInicio && fechaFin) {
      actividades = await auditoriaService.obtenerHistorialPorFecha(
        new Date(fechaInicio),
        new Date(fechaFin)
      );
    } else if (accion) {
      actividades = await auditoriaService.obtenerHistorialPorAccion(accion);
    } else {
      // Por defecto, devolver últimos 30 días
      const fechaFin = new Date();
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - 30);
      actividades = await auditoriaService.obtenerHistorialPorFecha(
        fechaInicio,
        fechaFin
      );
    }

    console.log(`[API Auditoria] Encontradas ${actividades?.length || 0} actividades`);
    return NextResponse.json(actividades || []);
  } catch (error) {
    console.error('[API Auditoria] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const auditoriaService = ServiceFactory.getAuditoriaService();
    const actividad = await auditoriaService.registrarActividad(body);

    return NextResponse.json(actividad, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al registrar actividad",
      },
      { status: 400 }
    );
  }
}
