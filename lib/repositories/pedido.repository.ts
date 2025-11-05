import { BaseRepository } from "../patterns/base-repository";
import { Pedido, EstadoPedido } from "@/types/domain";

export class PedidoRepository extends BaseRepository<Pedido> {
  async findByEstado(estado: EstadoPedido): Promise<Pedido[]> {
    const all = await this.findAll();
    return all.filter((p) => p.estado === estado);
  }

  async findByFecha(fechaInicio: Date, fechaFin: Date): Promise<Pedido[]> {
    const all = await this.findAll();
    return all.filter(
      (p) => p.fecha >= fechaInicio && p.fecha <= fechaFin
    );
  }

  async findByCliente(cliente: string): Promise<Pedido[]> {
    const all = await this.findAll();
    const lowerCliente = cliente.toLowerCase();
    return all.filter((p) => 
      p.clienteNombre?.toLowerCase() === lowerCliente ||
      p.cliente?.email?.toLowerCase() === lowerCliente ||
      p.cliente?.nombre?.toLowerCase() === lowerCliente
    );
  }

  async generateNumero(): Promise<string> {
    const all = await this.findAll();
    const numero = `PED-${String(all.length + 1).padStart(6, "0")}`;
    return numero;
  }
}
