"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PedidoCard } from "@/components/mesero/pedido-card";
import { RefreshCw, Search, Package, CheckCircle2, Clock, LogOut } from "lucide-react";
import { Pedido, EstadoPedido } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function CocinaDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detallePedido, setDetallePedido] = useState<Pedido | null>(null);
  const [chipEstado, setChipEstado] = useState<"TODOS" | "PENDIENTE" | "EN_PREPARACION" | "LISTO">("TODOS");
  const [secondsLeft, setSecondsLeft] = useState(15);
  const handleLogout = () => {
    try {
      localStorage.removeItem("usuario");
    } finally {
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    // Solo ADMIN (o rol con permisos de cocina) debe acceder
    const usuarioStorage = localStorage.getItem("usuario");
    if (!usuarioStorage) {
      router.push("/login");
      return;
    }
    const usuario = JSON.parse(usuarioStorage);
    if (usuario.rol !== "ADMIN" && usuario.rol !== "COCINA") {
      // Bloquear acceso a no administradores por ahora
      router.push("/");
      return;
    }

    // Restaurar preferencias básicas (filtros)
    try {
      const prefs = localStorage.getItem("cocina:prefs");
      if (prefs) {
        const { chip, query } = JSON.parse(prefs);
        if (chip) setChipEstado(chip);
        if (typeof query === "string") setSearchQuery(query);
      }
    } catch {}

    loadPedidos();
    // Suscripción Realtime a cambios de pedidos
    let channel: any;
    try {
      if (supabase) {
        channel = (supabase as any)
          .channel("realtime-pedidos")
          .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, () => {
            loadPedidos(true);
          })
          .subscribe();
      }
    } catch {}
    const refreshInterval = setInterval(() => {
      loadPedidos(true);
      setSecondsLeft(15);
    }, 15000);

    const tick = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => {
      clearInterval(refreshInterval);
      clearInterval(tick);
      try { channel && (supabase as any)?.removeChannel?.(channel); } catch {}
    };
  }, [router]);

  // Guardar preferencias (sin modo compacto)
  useEffect(() => {
    try {
      localStorage.setItem(
        "cocina:prefs",
        JSON.stringify({ chip: chipEstado, query: searchQuery })
      );
    } catch {}
  }, [chipEstado, searchQuery]);

  const loadPedidos = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      const response = await fetch("/api/pedidos");
      const data = await response.json();
      const pedidosArray = Array.isArray(data) ? data : [];
      pedidosArray.sort((a: Pedido, b: Pedido) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      setPedidos(pedidosArray.filter(p => p.estado !== EstadoPedido.ENTREGADO && p.estado !== EstadoPedido.CANCELADO));
    } catch (e) {
      toast({ title: "Error", description: "No se pudieron cargar pedidos", variant: "destructive" });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const openDetalle = async (pedidoId: string) => {
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDetallePedido(data);
      setIsDetailOpen(true);
    } catch {
      toast({ title: "Error", description: "No se pudo cargar el detalle", variant: "destructive" });
    }
  };

  const handleUpdateEstado = async (pedidoId: string, nuevoEstado: EstadoPedido) => {
    try {
      const response = await fetch(`/api/pedidos/${pedidoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!response.ok) throw new Error();
      loadPedidos(true);
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar el estado", variant: "destructive" });
    }
  };

  const pedidosPendientes = pedidos.filter(p => p.estado === EstadoPedido.PENDIENTE);
  const pedidosEnPreparacion = pedidos.filter(p => p.estado === EstadoPedido.EN_PREPARACION);
  const pedidosListos = pedidos.filter(p => p.estado === EstadoPedido.LISTO);

  const filtrar = (lista: Pedido[]) => {
    if (!searchQuery.trim()) return lista;
    const q = searchQuery.toLowerCase();
    return lista.filter(p => p.numero.toLowerCase().includes(q) || p.clienteNombre?.toLowerCase().includes(q) || p.mesa?.numero?.toString().includes(q));
  };

  const filtrarChip = (lista: Pedido[]) => {
    if (chipEstado === "TODOS") return lista;
    return lista.filter(p => p.estado === chipEstado);
  };

  const minutosDesde = (fechaIso: string | Date) => {
    const ms = Date.now() - new Date(fechaIso).getTime();
    return Math.floor(ms / 60000);
  };

  const esUrgente = (p: Pedido) => {
    const m = minutosDesde(p.fecha);
    if (p.estado === EstadoPedido.LISTO) return m >= 15;
    if (p.estado === EstadoPedido.EN_PREPARACION) return m >= 12;
    return m >= 8; // pendiente
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-dark">Cocina - Gestión de Pedidos</h1>
              <p className="text-sm text-gray-600">Actualizar estados: En preparación, Listo</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar por número, cliente o mesa"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => loadPedidos(true)} disabled={isRefreshing} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Badge variant="outline" className="ml-1">Auto en {secondsLeft}s</Badge>
              <Button size="sm" onClick={handleLogout} className="gap-2 ml-2">
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Chips de filtro por estado */}
        <div className="flex flex-wrap gap-2">
          {([
            { key: "TODOS", label: "Todos" },
            { key: "PENDIENTE", label: "Pendientes" },
            { key: "EN_PREPARACION", label: "En preparación" },
            { key: "LISTO", label: "Listos" },
          ] as const).map((c) => (
            <button
              key={c.key}
              onClick={() => setChipEstado(c.key)}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                chipEstado === c.key ? "bg-primary text-white border-primary" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {/* Listos */}
        {filtrarChip(filtrar(pedidosListos)).length > 0 && (
          <Card className="border-success-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" /> Listos para Entregar ({filtrar(pedidosListos).length})
              </CardTitle>
              <CardDescription>Entregar al mesero/cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtrarChip(filtrar(pedidosListos)).map((pedido) => (
                  <div key={pedido.id} className="relative">
                    {esUrgente(pedido) && (
                      <span className="absolute -top-2 -right-2">
                        <Badge className="bg-danger text-white">Urgente</Badge>
                      </span>
                    )}
                    <PedidoCard
                      pedido={pedido}
                      onUpdateEstado={handleUpdateEstado}
                      onVerDetalles={(id) => openDetalle(id)}
                      allowedNextStates={[]}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* En preparación */}
        {filtrarChip(filtrar(pedidosEnPreparacion)).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-info" /> En Preparación ({filtrar(pedidosEnPreparacion).length})
              </CardTitle>
              <CardDescription>Pedidos siendo preparados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtrarChip(filtrar(pedidosEnPreparacion)).map((pedido) => (
                  <div key={pedido.id} className="relative">
                    {esUrgente(pedido) && (
                      <span className="absolute -top-2 -right-2">
                        <Badge className="bg-warning text-white">Urgente</Badge>
                      </span>
                    )}
                    <PedidoCard
                      pedido={pedido}
                      onUpdateEstado={handleUpdateEstado}
                      onVerDetalles={(id) => openDetalle(id)}
                      allowedNextStates={[EstadoPedido.LISTO]}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pendientes */}
        {filtrarChip(filtrar(pedidosPendientes)).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" /> Pendientes ({filtrar(pedidosPendientes).length})
              </CardTitle>
              <CardDescription>Nuevos pedidos a enviar a cocina</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtrarChip(filtrar(pedidosPendientes)).map((pedido) => (
                  <div key={pedido.id} className="relative">
                    {esUrgente(pedido) && (
                      <span className="absolute -top-2 -right-2">
                        <Badge className="bg-info text-white">Urgente</Badge>
                      </span>
                    )}
                    <PedidoCard
                      pedido={pedido}
                      onUpdateEstado={handleUpdateEstado}
                      onVerDetalles={(id) => openDetalle(id)}
                      allowedNextStates={[EstadoPedido.EN_PREPARACION]}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {/* Detalle Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Pedido</DialogTitle>
          </DialogHeader>
          {!detallePedido ? (
            <div className="py-8 text-center">
              <RefreshCw className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
              <p className="text-muted">Cargando...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Pedido #{detallePedido.numero}</h3>
                  <p className="text-sm text-muted">
                    {new Date(detallePedido.fecha).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                    {detallePedido.mesa && (
                      <p className="text-sm mt-1"><span className="font-medium">Mesa:</span> {detallePedido.mesa.numero || detallePedido.mesaId}</p>
                    )}
                </div>
                <Badge>{detallePedido.estado}</Badge>
              </div>

              <Separator />

              <div className="space-y-3">
                {detallePedido.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.producto?.nombre || "Producto"}</p>
                      <p className="text-sm text-muted">Cantidad: {item.cantidad} x ${item.precioUnitario.toFixed(2)}</p>
                      {item.notas && <p className="text-xs text-muted mt-1">Nota: {item.notas}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${item.subtotal.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal:</span>
                  <span className="font-medium">${detallePedido.subtotal.toFixed(2)}</span>
                </div>
                {detallePedido.descuento && detallePedido.descuento > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Descuento:</span>
                    <span>-${detallePedido.descuento.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted">IVA (16%):</span>
                  <span className="font-medium">${detallePedido.iva.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">${detallePedido.total.toFixed(2)}</span>
                </div>
                <div className="pt-2 flex gap-2">
                  {detallePedido.estado === EstadoPedido.PENDIENTE && (
                    <Button onClick={() => handleUpdateEstado(detallePedido.id, EstadoPedido.EN_PREPARACION)}>Enviar a preparación</Button>
                  )}
                  {detallePedido.estado === EstadoPedido.EN_PREPARACION && (
                    <Button onClick={() => handleUpdateEstado(detallePedido.id, EstadoPedido.LISTO)}>Marcar como listo</Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


