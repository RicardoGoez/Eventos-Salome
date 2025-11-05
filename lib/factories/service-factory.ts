// Importar repositorios de Supabase
import { createServerClient } from "../supabase/client";
import { ProductoRepositorySupabase } from "../supabase/repositories/producto.repository.supabase";
import { InventarioRepositorySupabase } from "../supabase/repositories/inventario.repository.supabase";
import { PedidoRepositorySupabase } from "../supabase/repositories/pedido.repository.supabase";
import { MovimientoInventarioRepositorySupabase } from "../supabase/repositories/movimiento-inventario.repository.supabase";
import { UsuarioRepositorySupabase } from "../supabase/repositories/usuario.repository.supabase";
import { ProveedorRepositorySupabase } from "../supabase/repositories/proveedor.repository.supabase";
import { EntradaInventarioRepositorySupabase } from "../supabase/repositories/entrada-inventario.repository.supabase";
import { MesaRepositorySupabase } from "../supabase/repositories/mesa.repository.supabase";
import { DescuentoRepositorySupabase } from "../supabase/repositories/descuento.repository.supabase";
import { CierreCajaRepositorySupabase } from "../supabase/repositories/cierre-caja.repository.supabase";
import { ActividadAuditoriaRepositorySupabase } from "../supabase/repositories/actividad-auditoria.repository.supabase";

// Tipos para mantener compatibilidad
type ProductoRepository = ProductoRepositorySupabase;
type InventarioRepository = InventarioRepositorySupabase;
type PedidoRepository = PedidoRepositorySupabase;
type MovimientoInventarioRepository = MovimientoInventarioRepositorySupabase;
type UsuarioRepository = UsuarioRepositorySupabase;
type ProveedorRepository = ProveedorRepositorySupabase;
type EntradaInventarioRepository = EntradaInventarioRepositorySupabase;
type MesaRepository = MesaRepositorySupabase;
type DescuentoRepository = DescuentoRepositorySupabase;
type CierreCajaRepository = CierreCajaRepositorySupabase;
type ActividadAuditoriaRepository = ActividadAuditoriaRepositorySupabase;
import { ProductoService } from "../services/producto.service";
import { InventarioService } from "../services/inventario.service";
import { PedidoService } from "../services/pedido.service";
import { AuthService } from "../services/auth.service";
import { ProveedorService } from "../services/proveedor.service";
import { EntradaInventarioService } from "../services/entrada-inventario.service";
import { MesaService } from "../services/mesa.service";
import { DescuentoService } from "../services/descuento.service";
import { CierreCajaService } from "../services/cierre-caja.service";
import { AuditoriaService } from "../services/auditoria.service";

// Factory Pattern - Centraliza la creación de servicios y repositorios
export class ServiceFactory {
  // Repositorios
  private static productoRepository?: ProductoRepository;
  private static inventarioRepository?: InventarioRepository;
  private static pedidoRepository?: PedidoRepository;
  private static movimientoRepository?: MovimientoInventarioRepository;
  private static usuarioRepository?: UsuarioRepository;
  private static proveedorRepository?: ProveedorRepository;
  private static entradaInventarioRepository?: EntradaInventarioRepository;
  private static mesaRepository?: MesaRepository;
  private static descuentoRepository?: DescuentoRepository;
  private static cierreCajaRepository?: CierreCajaRepository;
  private static actividadAuditoriaRepository?: ActividadAuditoriaRepository;

  // Servicios
  private static productoService?: ProductoService;
  private static inventarioService?: InventarioService;
  private static pedidoService?: PedidoService;
  private static authService?: AuthService;
  private static proveedorService?: ProveedorService;
  private static entradaInventarioService?: EntradaInventarioService;
  private static mesaService?: MesaService;
  private static descuentoService?: DescuentoService;
  private static cierreCajaService?: CierreCajaService;
  private static auditoriaService?: AuditoriaService;

  static getProductoRepository(): ProductoRepository {
    if (!this.productoRepository) {
      const supabase = createServerClient();
      this.productoRepository = new ProductoRepositorySupabase(supabase);
    }
    return this.productoRepository;
  }

  static getInventarioRepository(): InventarioRepository {
    if (!this.inventarioRepository) {
      const supabase = createServerClient();
      this.inventarioRepository = new InventarioRepositorySupabase(supabase);
    }
    return this.inventarioRepository;
  }

  static getPedidoRepository(): PedidoRepository {
    if (!this.pedidoRepository) {
      const supabase = createServerClient();
      this.pedidoRepository = new PedidoRepositorySupabase(supabase);
    }
    return this.pedidoRepository;
  }

  static getMovimientoRepository(): MovimientoInventarioRepository {
    if (!this.movimientoRepository) {
      const supabase = createServerClient();
      this.movimientoRepository = new MovimientoInventarioRepositorySupabase(supabase);
    }
    return this.movimientoRepository;
  }

  static getProductoService(): ProductoService {
    if (!this.productoService) {
      this.productoService = new ProductoService(
        this.getProductoRepository()
      );
    }
    return this.productoService;
  }

  static getInventarioService(): InventarioService {
    if (!this.inventarioService) {
      this.inventarioService = new InventarioService(
        this.getInventarioRepository(),
        this.getMovimientoRepository()
      );
    }
    return this.inventarioService;
  }

  static getPedidoService(): PedidoService {
    if (!this.pedidoService) {
      this.pedidoService = new PedidoService(
        this.getPedidoRepository(),
        this.getInventarioService(),
        this.getProductoService(),
        this.getDescuentoService()
      );
    }
    return this.pedidoService;
  }

  // Nuevos repositorios
  static getUsuarioRepository(): UsuarioRepository {
    if (!this.usuarioRepository) {
      const supabase = createServerClient();
      this.usuarioRepository = new UsuarioRepositorySupabase(supabase);
    }
    return this.usuarioRepository;
  }

  static getProveedorRepository(): ProveedorRepository {
    if (!this.proveedorRepository) {
      const supabase = createServerClient();
      this.proveedorRepository = new ProveedorRepositorySupabase(supabase);
    }
    return this.proveedorRepository;
  }

  static getEntradaInventarioRepository(): EntradaInventarioRepository {
    if (!this.entradaInventarioRepository) {
      const supabase = createServerClient();
      this.entradaInventarioRepository = new EntradaInventarioRepositorySupabase(supabase);
    }
    return this.entradaInventarioRepository;
  }

  static getMesaRepository(): MesaRepository {
    if (!this.mesaRepository) {
      const supabase = createServerClient();
      this.mesaRepository = new MesaRepositorySupabase(supabase);
    }
    return this.mesaRepository;
  }

  static getDescuentoRepository(): DescuentoRepository {
    if (!this.descuentoRepository) {
      const supabase = createServerClient();
      this.descuentoRepository = new DescuentoRepositorySupabase(supabase);
    }
    return this.descuentoRepository;
  }

  static getCierreCajaRepository(): CierreCajaRepository {
    if (!this.cierreCajaRepository) {
      const supabase = createServerClient();
      this.cierreCajaRepository = new CierreCajaRepositorySupabase(supabase);
    }
    return this.cierreCajaRepository;
  }

  static getActividadAuditoriaRepository(): ActividadAuditoriaRepository {
    if (!this.actividadAuditoriaRepository) {
      const supabase = createServerClient();
      this.actividadAuditoriaRepository = new ActividadAuditoriaRepositorySupabase(supabase);
    }
    return this.actividadAuditoriaRepository;
  }

  // Nuevos servicios
  static getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = new AuthService(this.getUsuarioRepository());
    }
    return this.authService;
  }

  static getProveedorService(): ProveedorService {
    if (!this.proveedorService) {
      this.proveedorService = new ProveedorService(this.getProveedorRepository());
    }
    return this.proveedorService;
  }

  static getEntradaInventarioService(): EntradaInventarioService {
    if (!this.entradaInventarioService) {
      this.entradaInventarioService = new EntradaInventarioService(
        this.getEntradaInventarioRepository(),
        this.getInventarioService()
      );
    }
    return this.entradaInventarioService;
  }

  static getMesaService(): MesaService {
    if (!this.mesaService) {
      this.mesaService = new MesaService(this.getMesaRepository());
    }
    return this.mesaService;
  }

  static getDescuentoService(): DescuentoService {
    if (!this.descuentoService) {
      this.descuentoService = new DescuentoService(this.getDescuentoRepository());
    }
    return this.descuentoService;
  }

  static getCierreCajaService(): CierreCajaService {
    if (!this.cierreCajaService) {
      this.cierreCajaService = new CierreCajaService(
        this.getCierreCajaRepository(),
        this.getPedidoRepository()
      );
    }
    return this.cierreCajaService;
  }

  static getAuditoriaService(): AuditoriaService {
    if (!this.auditoriaService) {
      this.auditoriaService = new AuditoriaService(
        this.getActividadAuditoriaRepository()
      );
    }
    return this.auditoriaService;
  }

  // Método para reiniciar (útil para testing)
  static reset() {
    this.productoRepository = undefined;
    this.inventarioRepository = undefined;
    this.pedidoRepository = undefined;
    this.movimientoRepository = undefined;
    this.usuarioRepository = undefined;
    this.proveedorRepository = undefined;
    this.entradaInventarioRepository = undefined;
    this.mesaRepository = undefined;
    this.descuentoRepository = undefined;
    this.cierreCajaRepository = undefined;
    this.actividadAuditoriaRepository = undefined;
    this.productoService = undefined;
    this.inventarioService = undefined;
    this.pedidoService = undefined;
    this.authService = undefined;
    this.proveedorService = undefined;
    this.entradaInventarioService = undefined;
    this.mesaService = undefined;
    this.descuentoService = undefined;
    this.cierreCajaService = undefined;
    this.auditoriaService = undefined;
  }
}
