import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";
import { RolUsuario } from "@/types/domain";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, email, password, rol } = body;

    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const authService = ServiceFactory.getAuthService();
    const usuario = await authService.registrarUsuario({
      nombre,
      email,
      password,
      rol: rol || RolUsuario.CLIENTE,
      activo: true,
    });

    return NextResponse.json(
      {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al registrar" },
      { status: 400 }
    );
  }
}
