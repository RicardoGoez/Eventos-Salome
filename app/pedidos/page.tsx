"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumb } from "@/components/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Eye, Activity, Timer, BarChart3, Signal, RefreshCw } from "lucide-react";
import { Pedido, EstadoPedido, ItemPedido, MetodoPago } from "@/types/domain";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AdminWrapper } from "@/components/admin-wrapper";
import { useAdminData } from "@/contexts/admin-data-context";
import { cn } from "@/lib/utils";
import { differenceInSeconds, formatDistanceToNow, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Logo } from "@/components/logo";

function PedidosPageContent() {
  const { toast } = useToast();
  const {
    pedidos,
    productos,
    mesas,
    descuentos,
    refreshAll,
    realtimeStatus,
    lastRealtimeEvent,
    isRefreshing,
  } = useAdminData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    items: [] as Array<{ productoId: string; cantidad: number; notas?: string }>,
    cliente: "",
    notas: "",
    mesaId: "",
    descuentoId: "",
    metodoPago: MetodoPago.EFECTIVO,
  });
  const [newItem, setNewItem] = useState({
    productoId: "",
    cantidad: 1,
    notas: "",
  });
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(interval);
  }, []);

  const toDate = useCallback((value?: Date | string | null) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }, []);

  const secondsToHuman = useCallback((seconds: number | null | undefined) => {
    if (!seconds || seconds <= 0) return "--";
    if (seconds < 60) {
      return `${Math.max(1, Math.round(seconds))} s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    if (minutes < 60) {
      return `${minutes} min${minutes !== 1 ? "s" : ""}${remainingSeconds >= 10 ? ` ${remainingSeconds}s` : ""}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} h${remainingMinutes > 0 ? ` ${remainingMinutes} min` : ""}`;
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

  const getSecondsInCurrentEstado = useCallback(
    (pedido: Pedido) => {
      if (pedido.estado === EstadoPedido.PENDIENTE) {
        return getSecondsSince(pedido.fecha);
      }
      return getSecondsSince(pedido.updatedAt || pedido.fecha);
    },
    [getSecondsSince]
  );

  const isNewPedido = useCallback(
    (pedido: Pedido) => {
      const seconds = getSecondsSince(pedido.fecha);
      return seconds !== null && seconds < 180;
    },
    [getSecondsSince]
  );

  const isPedidoUrgente = useCallback(
    (pedido: Pedido) => {
      const seconds = getSecondsInCurrentEstado(pedido) || 0;
      const minutes = seconds / 60;
      if (pedido.estado === EstadoPedido.LISTO) return minutes >= 15;
      if (pedido.estado === EstadoPedido.EN_PREPARACION) return minutes >= 12;
      if (pedido.estado === EstadoPedido.PENDIENTE) return minutes >= 8;
      return false;
    },
    [getSecondsInCurrentEstado]
  );

  const pedidosHoy = useMemo(() => {
    return pedidos.filter((pedido) => {
      const fechaPedido = toDate(pedido.fecha);
      return fechaPedido ? isSameDay(fechaPedido, now) : false;
    });
  }, [now, pedidos, toDate]);

  const entregadosHoy = useMemo(
    () => pedidosHoy.filter((pedido) => pedido.estado === EstadoPedido.ENTREGADO),
    [pedidosHoy]
  );

  const pedidosPendientes = useMemo(
    () => pedidos.filter((pedido) => pedido.estado === EstadoPedido.PENDIENTE),
    [pedidos]
  );

  const pedidosEnPreparacion = useMemo(
    () => pedidos.filter((pedido) => pedido.estado === EstadoPedido.EN_PREPARACION),
    [pedidos]
  );

  const pedidosListos = useMemo(
    () => pedidos.filter((pedido) => pedido.estado === EstadoPedido.LISTO),
    [pedidos]
  );

  const tiempoPromedioEntregaSegundos = useMemo(() => {
    const totales = entregadosHoy.reduce(
      (acc, pedido) => {
        const inicio = toDate(pedido.fecha);
        const fin = toDate(pedido.updatedAt);
        if (inicio && fin) {
          acc.segundos += (fin.getTime() - inicio.getTime()) / 1000;
          acc.cantidad += 1;
        }
        return acc;
      },
      { segundos: 0, cantidad: 0 }
    );
    return totales.cantidad > 0 ? totales.segundos / totales.cantidad : null;
  }, [entregadosHoy, toDate]);

  const tiempoPromedioEnColaSegundos = useMemo(() => {
    const cola = [...pedidosPendientes, ...pedidosEnPreparacion];
    if (cola.length === 0) return null;
    const total = cola.reduce((acc, pedido) => {
      const seconds = getSecondsInCurrentEstado(pedido);
      return acc + (seconds ?? 0);
    }, 0);
    return total / cola.length;
  }, [getSecondsInCurrentEstado, pedidosEnPreparacion, pedidosPendientes]);

  const ticketPromedio = useMemo(() => {
    if (pedidosHoy.length === 0) return null;
    const total = pedidosHoy.reduce((acc, pedido) => acc + pedido.total, 0);
    return total / pedidosHoy.length;
  }, [pedidosHoy]);

  const ultimoEventoRealtime = useMemo(() => {
    if (!lastRealtimeEvent) return "Sin eventos aún";
    try {
      return formatDistanceToNow(new Date(lastRealtimeEvent), {
        addSuffix: true,
        locale: es,
      });
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
        label: "Conectando con Supabase…",
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

  const formatCurrency = useCallback((value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "--";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  const pedidosEnCola = pedidosPendientes.length + pedidosEnPreparacion.length;

  const stats = useMemo(
    () => [
      {
        label: "Pedidos hoy",
        value: pedidosHoy.length.toString(),
        hint: `${entregadosHoy.length} entregados`,
        icon: Activity,
      },
      {
        label: "Tiempo promedio entrega",
        value: secondsToHuman(tiempoPromedioEntregaSegundos),
        hint:
          entregadosHoy.length > 0
            ? "Basado en pedidos entregados hoy"
            : "Sin entregas completadas",
        icon: Timer,
      },
      {
        label: "Pedidos en cola",
        value: pedidosEnCola.toString(),
        hint:
          pedidosEnCola > 0
            ? `Promedio en cola: ${secondsToHuman(tiempoPromedioEnColaSegundos)}`
            : "Sin pedidos en cola",
        icon: BarChart3,
      },
      {
        label: "Ticket promedio",
        value: formatCurrency(ticketPromedio),
        hint: pedidosHoy.length > 0 ? "Ticket promedio del día" : "Sin pedidos hoy",
        icon: BarChart3,
      },
    ],
    [
      entregadosHoy.length,
      formatCurrency,
      pedidosEnCola,
      pedidosHoy.length,
      secondsToHuman,
      ticketPromedio,
      tiempoPromedioEnColaSegundos,
      tiempoPromedioEntregaSegundos,
    ]
  );

  const boardColumns = useMemo(
    () => [
      {
        key: "pendientes",
        label: "Pendientes",
        pedidos: pedidosPendientes,
        emptyHelp: "Los pedidos creados aparecerán aquí",
        nextState: EstadoPedido.EN_PREPARACION,
        actionLabel: "Enviar a cocina",
      },
      {
        key: "enPreparacion",
        label: "En preparación",
        pedidos: pedidosEnPreparacion,
        emptyHelp: "Cocina sin pedidos activos",
        nextState: EstadoPedido.LISTO,
        actionLabel: "Marcar listo",
      },
      {
        key: "listos",
        label: "Listos",
        pedidos: pedidosListos,
        emptyHelp: "Sin pedidos listos para entregar",
        nextState: EstadoPedido.ENTREGADO,
        actionLabel: "Entregar",
      },
      {
        key: "entregados",
        label: "Entregados (hoy)",
        pedidos: entregadosHoy,
        emptyHelp: "Aún no se entregan pedidos hoy",
        nextState: null,
        actionLabel: null,
      },
    ],
    [entregadosHoy, pedidosEnPreparacion, pedidosListos, pedidosPendientes]
  );

  const getTiempoPedido = useCallback(
    (pedido: Pedido) => {
      const seconds = getSecondsInCurrentEstado(pedido);
      return secondsToHuman(seconds);
    },
    [getSecondsInCurrentEstado, secondsToHuman]
  );

  const getCreatedRelativeTime = useCallback(
    (pedido: Pedido) => {
      const fecha = toDate(pedido.fecha);
      if (!fecha) return "--";
      try {
        return formatDistanceToNow(fecha, {
          addSuffix: true,
          locale: es,
        });
      } catch {
        return "--";
      }
    },
    [toDate]
  );

  // Los datos se cargan desde el contexto

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast({
        variant: "warning",
        title: "Validación",
        description: "Debes agregar al menos un item al pedido",
      });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Error al crear pedido",
        });
        return;
      }

      toast({
        variant: "success",
        title: "Éxito",
        description: "Pedido creado correctamente",
      });

      setIsDialogOpen(false);
      setFormData({
        items: [],
        cliente: "",
        notas: "",
        mesaId: "",
        descuentoId: "",
        metodoPago: MetodoPago.EFECTIVO,
      });
      refreshAll();
    } catch (error) {
      console.error("Error al crear pedido:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al crear pedido",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.productoId) return;
    setFormData({
      ...formData,
      items: [...formData.items, { ...newItem }],
    });
    setNewItem({ productoId: "", cantidad: 1, notas: "" });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleUpdateEstado = async (id: string, nuevoEstado: EstadoPedido) => {
    try {
      const response = await fetch(`/api/pedidos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Error al actualizar estado",
        });
        return;
      }

      toast({
        variant: "success",
        title: "Éxito",
        description: `Estado actualizado a ${nuevoEstado}`,
      });

      refreshAll();
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al actualizar estado",
      });
    }
  };

  const getEstadoColor = (estado: EstadoPedido) => {
    switch (estado) {
      case EstadoPedido.PENDIENTE:
        return "bg-warning/20 text-warning";
      case EstadoPedido.EN_PREPARACION:
        return "bg-info/20 text-info";
      case EstadoPedido.LISTO:
        return "bg-success/20 text-success";
      case EstadoPedido.ENTREGADO:
        return "bg-primary/20 text-primary";
      case EstadoPedido.CANCELADO:
        return "bg-danger/20 text-danger";
      default:
        return "bg-gray-medium/20 text-gray-medium";
    }
  };

  return (
    <div className="flex min-h-screen lg:h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-light p-4 lg:p-8 lg:ml-0" role="main" id="main-content">
        <div className="mx-auto max-w-7xl">
          <Breadcrumb items={[{ label: "Pedidos" }]} />
          <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <Logo size="lg" shadow />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pedidos</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Monitorea y gestiona el flujo de pedidos con actualizaciones en vivo.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshAll()}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing ? "animate-spin" : "")} />
                Sincronizar
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Pedido
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>Nuevo Pedido</DialogTitle>
                      <DialogDescription>
                        Crea un nuevo pedido para Eventos Salome
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="cliente">Cliente (Opcional)</Label>
                        <Input
                          id="cliente"
                          value={formData.cliente}
                          onChange={(e) =>
                            setFormData({ ...formData, cliente: e.target.value })
                          }
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="mesaId">Mesa (Opcional)</Label>
                        <Select
                          value={formData.mesaId || "none"}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              mesaId: value === "none" ? "" : value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar mesa" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin mesa</SelectItem>
                            {mesas
                              .filter((m) => m.disponible)
                              .map((mesa) => (
                                <SelectItem key={mesa.id} value={mesa.id}>
                                  Mesa {mesa.numero} - Capacidad: {mesa.capacidad}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="metodoPago">Método de Pago *</Label>
                        <Select
                          value={formData.metodoPago}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              metodoPago: value as MetodoPago,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={MetodoPago.EFECTIVO}>
                              Efectivo
                            </SelectItem>
                            <SelectItem value={MetodoPago.TARJETA}>
                              Tarjeta
                            </SelectItem>
                            <SelectItem value={MetodoPago.TRANSFERENCIA}>
                              Transferencia
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="descuentoId">Descuento (Opcional)</Label>
                        <Select
                          value={formData.descuentoId || "none"}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              descuentoId: value === "none" ? "" : value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar descuento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin descuento</SelectItem>
                            {descuentos.map((descuento) => (
                              <SelectItem key={descuento.id} value={descuento.id}>
                                {descuento.nombre} -{" "}
                                {descuento.tipo === "PORCENTAJE"
                                  ? `${descuento.valor}%`
                                  : `$${descuento.valor}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <Label className="mb-2 block">Agregar Item</Label>
                      <div className="grid gap-2">
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={newItem.productoId}
                          onChange={(e) =>
                            setNewItem({ ...newItem, productoId: e.target.value })
                          }
                        >
                          <option value="">Seleccionar producto</option>
                          {productos.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre} - ${p.precio}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Cantidad"
                            value={newItem.cantidad}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                cantidad: parseInt(e.target.value) || 1,
                              })
                            }
                          />
                          <Button
                            type="button"
                            onClick={handleAddItem}
                            disabled={!newItem.productoId}
                          >
                            Agregar
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {formData.items.map((item, index) => {
                          const producto = productos.find(
                            (p) => p.id === item.productoId
                          );
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between rounded border p-2"
                            >
                              <span>
                                {producto?.nombre || item.productoId} x
                                {item.cantidad}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                              >
                                Eliminar
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="notas">Notas</Label>
                      <Input
                        id="notas"
                        value={formData.notas}
                        onChange={(e) =>
                          setFormData({ ...formData, notas: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={formData.items.length === 0 || loading}>
                      {loading ? "Creando..." : "Crear Pedido"}
                    </Button>
                  </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
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
                <span className="font-medium text-gray-900">{ultimoEventoRealtime}</span>
              </p>
            </div>
            <div className="text-sm text-gray-600 space-y-1 sm:text-right">
              <p>
                Pedidos activos:{" "}
                <span className="font-semibold text-gray-900">{pedidos.length}</span>
              </p>
              <p>
                Promedio en cola:{" "}
                <span className="font-semibold text-gray-900">
                  {pedidosEnCola > 0 ? secondsToHuman(tiempoPromedioEnColaSegundos) : "Sin cola"}
                </span>
              </p>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">{stat.label}</CardTitle>
                    <Icon className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <p className="text-xs text-gray-600 mt-1">{stat.hint}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mb-6 border-primary/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Tablero en tiempo real</CardTitle>
              <CardDescription className="text-gray-600">
                Visualiza pedidos por estado, identifica cuellos de botella y avanza etapas con un clic.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {boardColumns.map((column) => (
                  <div key={column.key} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                        {column.label}
                      </h3>
                      <span className="text-xs font-medium text-gray-500">
                        {column.pedidos.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {column.pedidos.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
                          {column.emptyHelp}
                        </div>
                      ) : (
                        column.pedidos.map((pedido) => (
                          <div
                            key={pedido.id}
                            className={cn(
                              "relative rounded-lg border bg-white p-4 shadow-sm transition-all",
                              isPedidoUrgente(pedido)
                                ? "border-danger/60 shadow-danger/10"
                                : "border-gray-200 hover:border-primary/40",
                              isNewPedido(pedido) ? "ring-2 ring-primary/30" : ""
                            )}
                          >
                            {isPedidoUrgente(pedido) && (
                              <span className="absolute -top-2 right-2 rounded-full bg-danger px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                                Urgente
                              </span>
                            )}

                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{pedido.numero}</p>
                                <p className="text-xs text-gray-500">
                                  Creado {getCreatedRelativeTime(pedido)}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "rounded-full px-2 py-1 text-[11px] font-semibold",
                                  getEstadoColor(pedido.estado)
                                )}
                              >
                                {pedido.estado}
                              </span>
                            </div>

                            <div className="mt-3 space-y-1 text-sm text-gray-700">
                              {pedido.clienteNombre || pedido.cliente?.nombre ? (
                                <p className="font-medium line-clamp-1">
                                  {pedido.clienteNombre || pedido.cliente?.nombre}
                                </p>
                              ) : (
                                <p className="font-medium text-gray-500">Cliente sin registrar</p>
                              )}
                              {(pedido.mesaId || pedido.mesa) && (
                                <p className="text-xs text-gray-500">
                                  Mesa {pedido.mesa?.numero ?? pedido.mesaId}
                                  {pedido.mesa?.capacidad ? ` · Capacidad ${pedido.mesa?.capacidad}` : ""}
                                </p>
                              )}
                              <p className="text-xs text-gray-500">
                                {pedido.items.length} item(s) · Total {formatCurrency(pedido.total)}
                              </p>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                              <span>En estado: {getTiempoPedido(pedido)}</span>
                              {column.nextState ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateEstado(pedido.id, column.nextState!)}
                                >
                                  {column.actionLabel}
                                </Button>
                              ) : (
                                <span className="text-success font-semibold">Completado</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Lista de Pedidos</CardTitle>
              <CardDescription className="text-gray-600">
                Gestiona los pedidos de Eventos Salome
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-800">
                        No hay pedidos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    pedidos.map((pedido) => (
                      <TableRow key={pedido.id}>
                        <TableCell className="font-medium text-gray-900">
                          {pedido.numero}
                        </TableCell>
                        <TableCell className="text-gray-800">
                          {pedido.clienteNombre || pedido.cliente?.nombre || "-"}
                        </TableCell>
                        <TableCell className="text-gray-800">{pedido.items.length} item(s)</TableCell>
                        <TableCell className="text-gray-900 font-semibold">{formatCurrency(pedido.total)}</TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${getEstadoColor(
                              pedido.estado
                            )}`}
                          >
                            {pedido.estado}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-800">
                          {new Date(pedido.fecha).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPedido(pedido);
                                setIsDetailDialogOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver
                            </Button>
                            {pedido.estado === EstadoPedido.PENDIENTE && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateEstado(
                                      pedido.id,
                                      EstadoPedido.EN_PREPARACION
                                    )
                                  }
                                >
                                  Preparar
                                </Button>
                              </>
                            )}
                            {pedido.estado === EstadoPedido.EN_PREPARACION && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUpdateEstado(pedido.id, EstadoPedido.LISTO)
                                }
                              >
                                Listo
                              </Button>
                            )}
                            {pedido.estado === EstadoPedido.LISTO && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUpdateEstado(
                                    pedido.id,
                                    EstadoPedido.ENTREGADO
                                  )
                                }
                              >
                                Entregar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog
            open={isDetailDialogOpen}
            onOpenChange={setIsDetailDialogOpen}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Pedido {selectedPedido?.numero}
                </DialogTitle>
                <DialogDescription>
                  Detalles del pedido
                </DialogDescription>
              </DialogHeader>
              {selectedPedido && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-900 font-semibold">Cliente:</Label>
                    <p className="text-gray-900 font-medium mt-1">{selectedPedido.clienteNombre || selectedPedido.cliente?.nombre || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-900 font-semibold">Estado:</Label>
                    <p className="text-gray-900 font-medium mt-1">{selectedPedido.estado}</p>
                  </div>
                  <div>
                    <Label className="text-gray-900 font-semibold">Items:</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio Unit.</TableHead>
                          <TableHead>Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPedido.items.map((item: ItemPedido) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-gray-800">
                              {item.producto?.nombre || item.productoId}
                            </TableCell>
                            <TableCell className="text-gray-800">{item.cantidad}</TableCell>
                            <TableCell className="text-gray-800">{formatCurrency(item.precioUnitario)}</TableCell>
                            <TableCell className="text-gray-800 font-semibold">{formatCurrency(item.subtotal)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-bold">
                            Total:
                          </TableCell>
                          <TableCell className="font-bold">
                            {formatCurrency(selectedPedido.total)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                  {selectedPedido.notas && (
                    <div>
                      <Label className="text-gray-900 font-semibold">Notas:</Label>
                      <p className="text-gray-800">{selectedPedido.notas}</p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}

export default function PedidosPage() {
  return (
    <AdminWrapper>
      <PedidosPageContent />
    </AdminWrapper>
  );
}
