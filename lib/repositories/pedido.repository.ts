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
    return all.filter((p) => p.cliente?.toLowerCase() === cliente.toLowerCase());
  }

  async generateNumero(): Promise<string> {
    const all = await this.findAll();
    const numero = `PED-${String(all.length + 1).padStart(6, "0")}`;
    return numero;
  }
}
