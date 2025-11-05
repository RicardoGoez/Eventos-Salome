import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";
import { RolUsuario } from "@/types/domain";

export async function GET(request: NextRequest) {
  try {
    const usuarioRepository = ServiceFactory.getUsuarioRepository();
    const usuarios = await usuarioRepository.findAll();
    
    // No devolver las contraseñas
    const usuariosSinPassword = usuarios.map(({ password, ...usuario }) => usuario);
    
    console.log(`[API Usuarios] Encontrados ${usuariosSinPassword?.length || 0} usuarios`);
    return NextResponse.json(usuariosSinPassword || []);
  } catch (error) {
    console.error('[API Usuarios] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, email, password, rol, activo } = body;

    if (!nombre || !email || !password || !rol) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Validar rol
    if (!Object.values(RolUsuario).includes(rol)) {
      return NextResponse.json(
        { error: "Rol inválido" },
        { status: 400 }
      );
    }

    const authService = ServiceFactory.getAuthService();
    const usuario = await authService.registrarUsuario({
      nombre,
      email,
      password,
      rol: rol as RolUsuario,
      activo: activo !== undefined ? activo : true,
    });

    // No devolver la contraseña
    const { password: _, ...usuarioSinPassword } = usuario;
    
    return NextResponse.json(usuarioSinPassword, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear usuario" },
      { status: 400 }
    );
  }
}

