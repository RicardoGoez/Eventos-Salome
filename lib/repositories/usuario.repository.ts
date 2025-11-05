import { BaseRepository } from "../patterns/base-repository";
import { Usuario, RolUsuario } from "@/types/domain";

export class UsuarioRepository extends BaseRepository<Usuario> {
  async findByEmail(email: string): Promise<Usuario | null> {
    const all = await this.findAll();
    return all.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async findByRol(rol: RolUsuario): Promise<Usuario[]> {
    const all = await this.findAll();
    return all.filter((u) => u.rol === rol && u.activo);
  }

  async findActivos(): Promise<Usuario[]> {
    const all = await this.findAll();
    return all.filter((u) => u.activo);
  }
}
