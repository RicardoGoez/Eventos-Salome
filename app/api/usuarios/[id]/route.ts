import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";
import { RolUsuario } from "@/types/domain";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const usuarioRepository = ServiceFactory.getUsuarioRepository();
    const usuario = await usuarioRepository.findById(params.id);

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // No devolver la contraseña
    const { password, ...usuarioSinPassword } = usuario;
    
    return NextResponse.json(usuarioSinPassword);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { nombre, email, password, rol, activo } = body;

    const usuarioRepository = ServiceFactory.getUsuarioRepository();
    const usuarioExistente = await usuarioRepository.findById(params.id);

    if (!usuarioExistente) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Validar rol si se proporciona
    if (rol && !Object.values(RolUsuario).includes(rol)) {
      return NextResponse.json(
        { error: "Rol inválido" },
        { status: 400 }
      );
    }

    const authService = ServiceFactory.getAuthService();
    
    // Actualizar usuario
    const datosActualizacion: any = {
      nombre: nombre || usuarioExistente.nombre,
      email: email || usuarioExistente.email,
      rol: rol || usuarioExistente.rol,
      activo: activo !== undefined ? activo : usuarioExistente.activo,
    };

    if (password) {
      datosActualizacion.password = password;
    }

    const usuarioActualizado = await authService.actualizarUsuario(
      params.id,
      datosActualizacion
    );

    // No devolver la contraseña
    const { password: _, ...usuarioSinPassword } = usuarioActualizado;
    
    return NextResponse.json(usuarioSinPassword);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al actualizar usuario" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authService = ServiceFactory.getAuthService();
    const usuarioRepository = ServiceFactory.getUsuarioRepository();
    
    // Verificar si el usuario existe
    const usuario = await usuarioRepository.findById(params.id);
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Intentar eliminar (puede hacer soft delete si tiene registros asociados)
    const eliminado = await authService.eliminarUsuario(params.id);

    if (!eliminado) {
      return NextResponse.json({ error: "No se pudo eliminar el usuario" }, { status: 500 });
    }

    // Verificar si se hizo soft delete (marcado como inactivo)
    const usuarioActualizado = await usuarioRepository.findById(params.id);
    const fueSoftDelete = usuarioActualizado && !usuarioActualizado.activo;

    return NextResponse.json({ 
      message: fueSoftDelete 
        ? "Usuario marcado como inactivo (tiene registros asociados: entradas de inventario, cierres de caja o actividades de auditoría)" 
        : "Usuario eliminado correctamente" 
    });
  } catch (error) {
    // Mejorar mensaje de error para el usuario
    const errorMessage = error instanceof Error ? error.message : "Error al eliminar usuario";
    
    // Mensaje más amigable para errores de clave foránea
    if (errorMessage.includes('foreign key') || errorMessage.includes('violates foreign key')) {
      return NextResponse.json(
        { 
          error: "No se puede eliminar este usuario porque tiene registros asociados (entradas de inventario, cierres de caja o actividades de auditoría). El usuario ha sido marcado como inactivo.",
          softDeleted: true
        },
        { status: 200 } // Cambiamos a 200 porque se hizo soft delete exitosamente
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

