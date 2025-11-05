import { EntradaInventarioRepositorySupabase } from "../supabase/repositories/entrada-inventario.repository.supabase";
import { InventarioService } from "./inventario.service";
import { EntradaInventario, TipoMovimientoInventario } from "@/types/domain";

export class EntradaInventarioService {
  private entradaRepository: EntradaInventarioRepositorySupabase;
  private inventarioService: InventarioService;

  constructor(
    entradaRepository: EntradaInventarioRepositorySupabase,
    inventarioService: InventarioService
  ) {
    this.entradaRepository = entradaRepository;
    this.inventarioService = inventarioService;
  }

  async registrarEntrada(
    datos: Omit<EntradaInventario, "id" | "createdAt">
  ): Promise<{ entrada: EntradaInventario; inventarioActualizado: any }> {
    if (datos.cantidad <= 0) {
      throw new Error("La cantidad debe ser mayor a cero");
    }
    if (datos.precioCompra < 0) {
      throw new Error("El precio de compra no puede ser negativo");
    }

    // Crear registro de entrada
    const entrada = await this.entradaRepository.create({
      ...datos,
    });

    // Actualizar inventario automáticamente
    const inventarioActualizado = await this.inventarioService.ajustarStock(
      datos.inventarioItemId,
      datos.cantidad,
      TipoMovimientoInventario.ENTRADA,
      `Entrada de inventario - Proveedor: ${datos.proveedorId}`
    );

    return { entrada, inventarioActualizado };
  }

  async listarEntradas(): Promise<EntradaInventario[]> {
    return this.entradaRepository.findAll();
  }

  async listarPorProveedor(proveedorId: string): Promise<EntradaInventario[]> {
    return this.entradaRepository.findByProveedor(proveedorId);
  }

  async listarPorInventarioItem(
    inventarioItemId: string
  ): Promise<EntradaInventario[]> {
    return this.entradaRepository.findByInventarioItem(inventarioItemId);
  }

  async listarPorFecha(
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<EntradaInventario[]> {
    return this.entradaRepository.findByFecha(fechaInicio, fechaFin);
  }
}
