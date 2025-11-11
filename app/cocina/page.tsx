"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PedidoCard } from "@/components/mesero/pedido-card";
import { RefreshCw, Search, Package, CheckCircle2, Clock, LogOut, Signal, Timer } from "lucide-react";
import { Pedido, EstadoPedido } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { differenceInSeconds, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn, formatCOP } from "@/lib/utils";
import { Logo } from "@/components/logo";

type RealtimeStatus = "disabled" | "connecting" | "connected" | "disconnected" | "error";

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
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [now, setNow] = useState(() => new Date());
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>(() =>
    supabase ? "connecting" : "disabled"
  );
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState<Date | null>(null);
  const REFRESH_INTERVAL_SECONDS = 60;
  const REFRESH_INTERVAL_MS = REFRESH_INTERVAL_SECONDS * 1000;
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

    const supabaseClient = supabase;
    let channel: any = null;

    if (!supabaseClient) {
      setRealtimeStatus("disabled");
    } else {
      setRealtimeStatus("connecting");
      channel = supabaseClient
        .channel("cocina-pedidos")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "pedidos" },
          () => {
            setLastRealtimeEvent(new Date());
            setSecondsLeft(REFRESH_INTERVAL_SECONDS);
            loadPedidos(true);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setRealtimeStatus("connected");
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setRealtimeStatus("error");
          } else if (status === "CLOSED") {
            setRealtimeStatus("disconnected");
          }
        });
    }

    const refreshInterval = setInterval(() => {
      loadPedidos(true);
      setSecondsLeft(REFRESH_INTERVAL_SECONDS);
    }, REFRESH_INTERVAL_MS);

    const tick = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(tick);
      if (channel && supabaseClient) {
        try {
          supabaseClient.removeChannel(channel);
        } catch (error) {
          console.warn("Error removing Supabase channel (cocina):", error);
        }
      }
    };
  }, [REFRESH_INTERVAL_MS, REFRESH_INTERVAL_SECONDS, router]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(interval);
  }, []);

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
      setSecondsLeft(REFRESH_INTERVAL_SECONDS);
      if (!silent) {
        setLastRealtimeEvent(new Date());
      }
    } catch (e) {
      toast({ title: "Error", description: "No se pudieron cargar pedidos", variant: "destructive" });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const toDate = useCallback((value?: Date | string | null) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }, []);

  const getSecondsSince = useCallback(
    (value?: Date | string | null) => {
      const date = toDate(value);
      if (!date) return null;
      const diff = differenceInSeconds(now, date);
      return diff >= 0 ? diff : 0;
    },
    [now, toDate]
  );

  const getSecondsInEstado = useCallback(
    (pedido: Pedido) => {
      if (pedido.estado === EstadoPedido.PENDIENTE) {
        return getSecondsSince(pedido.fecha);
      }
      return getSecondsSince(pedido.updatedAt || pedido.fecha);
    },
    [getSecondsSince]
  );

  const secondsToHuman = useCallback((seconds: number | null | undefined) => {
    if (!seconds || seconds <= 0) return "--";
    if (seconds < 60) {
      return `${Math.max(1, Math.round(seconds))} s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    if (minutes < 60) {
      return `${minutes} min${minutes !== 1 ? "s" : ""}${remainingSeconds >= 15 ? ` ${remainingSeconds}s` : ""}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} h${remainingMinutes > 0 ? ` ${remainingMinutes} min` : ""}`;
  }, []);

  const pedidosPendientes = useMemo(
    () => pedidos.filter((p) => p.estado === EstadoPedido.PENDIENTE),
    [pedidos]
  );

  const pedidosEnPreparacion = useMemo(
    () => pedidos.filter((p) => p.estado === EstadoPedido.EN_PREPARACION),
    [pedidos]
  );

  const pedidosListos = useMemo(
    () => pedidos.filter((p) => p.estado === EstadoPedido.LISTO),
    [pedidos]
  );

  const tiempoPromedioPendientes = useMemo(() => {
    if (pedidosPendientes.length === 0) return null;
    const total = pedidosPendientes.reduce((acc, pedido) => {
      const seconds = getSecondsInEstado(pedido) ?? 0;
      return acc + seconds;
    }, 0);
    return total / pedidosPendientes.length;
  }, [getSecondsInEstado, pedidosPendientes]);

  const tiempoPromedioPreparacion = useMemo(() => {
    if (pedidosEnPreparacion.length === 0) return null;
    const total = pedidosEnPreparacion.reduce((acc, pedido) => {
      const seconds = getSecondsInEstado(pedido) ?? 0;
      return acc + seconds;
    }, 0);
    return total / pedidosEnPreparacion.length;
  }, [getSecondsInEstado, pedidosEnPreparacion]);

  const tiempoPromedioListos = useMemo(() => {
    if (pedidosListos.length === 0) return null;
    const total = pedidosListos.reduce((acc, pedido) => {
      const seconds = getSecondsInEstado(pedido) ?? 0;
      return acc + seconds;
    }, 0);
    return total / pedidosListos.length;
  }, [getSecondsInEstado, pedidosListos]);

  const filtrar = useCallback(
    (lista: Pedido[]) => {
      if (!searchQuery.trim()) return lista;
      const q = searchQuery.toLowerCase();
      return lista.filter(
        (p) =>
          p.numero.toLowerCase().includes(q) ||
          p.clienteNombre?.toLowerCase().includes(q) ||
          p.mesa?.numero?.toString().includes(q)
      );
    },
    [searchQuery]
  );

  const filtrarChip = useCallback(
    (lista: Pedido[]) => {
      if (chipEstado === "TODOS") return lista;
      return lista.filter((p) => p.estado === chipEstado);
    },
    [chipEstado]
  );

  const esUrgente = useCallback(
    (pedido: Pedido) => {
      const seconds = getSecondsInEstado(pedido) ?? 0;
      const minutes = seconds / 60;
      if (pedido.estado === EstadoPedido.LISTO) return minutes >= 15;
      if (pedido.estado === EstadoPedido.EN_PREPARACION) return minutes >= 12;
      return minutes >= 8;
    },
    [getSecondsInEstado]
  );

  const ultimoEventoRealtime = useMemo(() => {
    if (!lastRealtimeEvent) return "Sin eventos recientes";
    try {
      return formatDistanceToNow(lastRealtimeEvent, { addSuffix: true, locale: es });
    } catch {
      return "Sincronización reciente";
    }
  }, [lastRealtimeEvent]);

  const realtimeConfig = useMemo(
    () => ({
      disabled: {
        label: "Tiempo real deshabilitado",
        className: "border-gray-300 bg-gray-100 text-gray-600",
        iconClass: "text-gray-500",
      },
      connecting: {
        label: "Conectando al canal en vivo…",
        className: "border-warning/30 bg-warning/10 text-warning",
        iconClass: "text-warning",
      },
      connected: {
        label: "Actualización en vivo",
        className: "border-success/40 bg-success/10 text-success",
        iconClass: "text-success",
      },
      disconnected: {
        label: "Conexión interrumpida",
        className: "border-warning/30 bg-warning/10 text-warning",
        iconClass: "text-warning",
      },
      error: {
        label: "Error con canal en vivo",
        className: "border-danger/30 bg-danger/10 text-danger",
        iconClass: "text-danger",
      },
    }),
    []
  );

  const realtimeBadge = realtimeConfig[realtimeStatus] ?? realtimeConfig.disabled;

  const statCards = useMemo(
    () => [
      {
        label: "Pendientes",
        value: pedidosPendientes.length,
        hint: `Espera media: ${secondsToHuman(tiempoPromedioPendientes)}`,
      },
      {
        label: "En preparación",
        value: pedidosEnPreparacion.length,
        hint: `Tiempo en cocina: ${secondsToHuman(tiempoPromedioPreparacion)}`,
      },
      {
        label: "Listos",
        value: pedidosListos.length,
        hint: `Listos hace: ${secondsToHuman(tiempoPromedioListos)}`,
      },
      {
        label: "Próxima recarga",
        value: `${secondsLeft}s`,
        hint: "Refresco de respaldo automático",
      },
    ],
    [
      pedidosEnPreparacion.length,
      pedidosListos.length,
      pedidosPendientes.length,
      secondsLeft,
      secondsToHuman,
      tiempoPromedioListos,
      tiempoPromedioPendientes,
      tiempoPromedioPreparacion,
    ]
  );

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
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Logo size="lg" shadow />
              <div>
                <h1 className="text-2xl font-bold text-dark">Cocina - Gestión de Pedidos</h1>
                <p className="text-sm text-gray-600">Actualizar estados: En preparación, Listo</p>
              </div>
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium shadow-sm",
                realtimeBadge.className
              )}
            >
              <Signal className={cn("h-4 w-4", realtimeBadge.iconClass)} />
              <span>{realtimeBadge.label}</span>
            </div>
            <p className="text-xs text-gray-600">
              Último evento:{" "}
              <span className="font-semibold text-gray-900">{ultimoEventoRealtime}</span>
            </p>
          </div>
          <div className="flex flex-col gap-1 text-sm text-gray-600 sm:items-end">
            <span>
              Pedidos activos:{" "}
              <span className="font-semibold text-gray-900">{pedidos.length}</span>
            </span>
            <span className="flex items-center gap-1">
              <Timer className="h-4 w-4 text-gray-400" />
              {pedidosEnPreparacion.length > 0
                ? `Tiempo en cocina: ${secondsToHuman(tiempoPromedioPreparacion)}`
                : "Sin pedidos en preparación"}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-600 mt-1">{stat.hint}</p>
            </div>
          ))}
        </div>

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
                      <p className="text-sm text-muted">Cantidad: {item.cantidad} x {formatCOP(item.precioUnitario)}</p>
                      {item.notas && <p className="text-xs text-muted mt-1">Nota: {item.notas}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCOP(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal:</span>
                  <span className="font-medium">{formatCOP(detallePedido.subtotal)}</span>
                </div>
                {detallePedido.descuento && detallePedido.descuento > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Descuento:</span>
                    <span>-{formatCOP(detallePedido.descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted">IVA (16%):</span>
                  <span className="font-medium">{formatCOP(detallePedido.iva)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">{formatCOP(detallePedido.total)}</span>
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


