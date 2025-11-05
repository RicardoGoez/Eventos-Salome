import { UsuarioRepositorySupabase } from "../supabase/repositories/usuario.repository.supabase";
import { Usuario, RolUsuario } from "@/types/domain";
import bcrypt from "bcryptjs";

export class AuthService {
  private usuarioRepository: UsuarioRepositorySupabase;

  constructor(usuarioRepository: UsuarioRepositorySupabase) {
    this.usuarioRepository = usuarioRepository;
  }

  async login(email: string, password: string): Promise<Usuario | null> {
    const usuario = await this.usuarioRepository.findByEmail(email);
    if (!usuario || !usuario.activo) {
      return null;
    }

    // En producción, comparar hash
    const isValid = await bcrypt.compare(password, usuario.password);
    if (!isValid) {
      return null;
    }

    // Retornar usuario sin password
    const { password: _, ...usuarioSinPassword } = usuario;
    return usuarioSinPassword as Usuario;
  }

  async registrarUsuario(
    datos: Omit<Usuario, "id" | "createdAt" | "updatedAt" | "password"> & {
      password: string;
    }
  ): Promise<Usuario> {
    const existe = await this.usuarioRepository.findByEmail(datos.email);
    if (existe) {
      throw new Error("El email ya está registrado");
    }

    // Hash de password
    const passwordHash = await bcrypt.hash(datos.password, 10);

    const usuario = await this.usuarioRepository.create({
      ...datos,
      password: passwordHash,
    });

    const { password: _, ...usuarioSinPassword } = usuario;
    return usuarioSinPassword as Usuario;
  }

  async cambiarPassword(
    usuarioId: string,
    nuevaPassword: string
  ): Promise<boolean> {
    const passwordHash = await bcrypt.hash(nuevaPassword, 10);
    await this.usuarioRepository.update(usuarioId, { password: passwordHash });
    return true;
  }

  async actualizarUsuario(
    usuarioId: string,
    datos: Partial<Omit<Usuario, "id" | "createdAt" | "updatedAt">> & {
      password?: string;
    }
  ): Promise<Usuario> {
    const usuarioExistente = await this.usuarioRepository.findById(usuarioId);
    if (!usuarioExistente) {
      throw new Error("Usuario no encontrado");
    }

    // Si se actualiza el email, verificar que no esté en uso
    if (datos.email && datos.email !== usuarioExistente.email) {
      const existe = await this.usuarioRepository.findByEmail(datos.email);
      if (existe) {
        throw new Error("El email ya está registrado");
      }
    }

    // Hash de password si se proporciona
    const datosActualizacion: any = { ...datos };
    if (datos.password) {
      datosActualizacion.password = await bcrypt.hash(datos.password, 10);
    }

    const usuarioActualizado = await this.usuarioRepository.update(
      usuarioId,
      datosActualizacion
    );

    const { password: _, ...usuarioSinPassword } = usuarioActualizado;
    return usuarioSinPassword as Usuario;
  }

  async verificarRol(usuarioId: string, rol: RolUsuario): Promise<boolean> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    return usuario?.rol === rol && usuario.activo;
  }

  async tienePermiso(
    usuarioId: string,
    accion: "ADMIN" | "MESERO" | "CLIENTE"
  ): Promise<boolean> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario || !usuario.activo) return false;

    if (accion === "ADMIN") {
      return usuario.rol === RolUsuario.ADMIN;
    }
    if (accion === "MESERO") {
      return (
        usuario.rol === RolUsuario.ADMIN || usuario.rol === RolUsuario.MESERO
      );
    }
    return true; // Cliente puede acceder a funciones básicas
  }

  async eliminarUsuario(usuarioId: string): Promise<boolean> {
    // Intentar eliminación física primero
    try {
      const eliminado = await this.usuarioRepository.delete(usuarioId);
      return eliminado;
    } catch (error: any) {
      // Si falla por restricción de clave foránea (usuario tiene registros asociados)
      // Usuarios pueden estar referenciados en:
      // - entradas_inventario.usuario_id (ON DELETE RESTRICT)
      // - cierres_caja.usuario_id (ON DELETE RESTRICT)
      // - actividades_auditoria.usuario_id (ON DELETE RESTRICT)
      if (error?.message?.includes('foreign key constraint') || 
          error?.message?.includes('violates foreign key') ||
          error?.code === '23503') {
        // Soft delete: marcar como inactivo en lugar de eliminar
        // Esto preserva la integridad histórica de:
        // - Entradas de inventario creadas por el usuario
        // - Cierres de caja realizados por el usuario
        // - Actividades de auditoría del usuario
        await this.usuarioRepository.update(usuarioId, { activo: false });
        return true; // Retornamos true porque el usuario fue "eliminado" (soft delete)
      }
      // Si es otro tipo de error, relanzarlo
      throw error;
    }
  }
}
