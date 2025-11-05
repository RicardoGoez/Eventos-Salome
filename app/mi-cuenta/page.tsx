"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PublicHeader } from "@/components/public-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, Mail, Package, Download, QrCode, ArrowRight, Clock, CheckCircle2, Truck, XCircle, RefreshCw, Search, Filter } from "lucide-react";
import { Pedido, EstadoPedido } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import { formatCOP } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useClientData } from "@/contexts/client-data-context";

const estados = [
  { estado: EstadoPedido.PENDIENTE, label: "Pendiente", icon: Clock, color: "text-warning", bgColor: "bg-warning/20" },
  { estado: EstadoPedido.EN_PREPARACION, label: "En Preparación", icon: Package, color: "text-info", bgColor: "bg-info/20" },
  { estado: EstadoPedido.LISTO, label: "Listo", icon: CheckCircle2, color: "text-success", bgColor: "bg-success/20" },
  { estado: EstadoPedido.ENTREGADO, label: "Entregado", icon: Truck, color: "text-primary", bgColor: "bg-primary/20" },
  { estado: EstadoPedido.CANCELADO, label: "Cancelado", icon: XCircle, color: "text-danger", bgColor: "bg-danger/20" },
];

function MiCuentaPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    pedidos,
    loading: loadingPedidos,
    isRefreshing,
    loadPedidos,
    refreshPedidos,
    getPedidosActivos,
    getPedidosCompletados,
  } = useClientData();
  
  const [usuario, setUsuario] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<EstadoPedido | "TODOS">("TODOS");
  const [filtroFecha, setFiltroFecha] = useState<string>("TODOS");
  const loading = loadingPedidos;

  useEffect(() => {
    const usuarioStorage = localStorage.getItem("usuario");
    if (!usuarioStorage) {
      router.push("/login");
      return;
    }
    const usuarioData = JSON.parse(usuarioStorage);
    // Guard: solo CLIENTE debe ver /mi-cuenta
    if (usuarioData.rol === "ADMIN") {
      router.push("/admin");
      return;
    }
    if (usuarioData.rol === "MESERO") {
      router.push("/mesero/mesas");
      return;
    }
    if (usuarioData.rol === "COCINA") {
      router.push("/cocina");
      return;
    }
    setUsuario(usuarioData);
    loadPedidos(usuarioData.id);
    
    // Auto-refresh cada 30 segundos para pedidos activos
    const interval = setInterval(() => {
      refreshPedidos(usuarioData.id);
    }, 30000);

    return () => clearInterval(interval);
  }, [router, loadPedidos, refreshPedidos]);

  // Los pedidos se cargan desde el contexto

  const handleDescargarTicket = async (pedido: Pedido) => {
    try {
      const response = await fetch(`/api/pedidos/${pedido.id}/ticket`);
      const data = await response.json();
      
      const link = document.createElement("a");
      link.href = data.pdfUrl;
      link.download = `ticket-${pedido.numero}.pdf`;
      link.click();
    } catch (error) {
      console.error("Error al descargar ticket:", error);
      toast({
        title: "Error",
        description: "No se pudo descargar el ticket",
        variant: "destructive",
      });
    }
  };

  // Filtrar pedidos (memoizado)
  const pedidosFiltrados = useMemo(() => {
    let filtrados = [...pedidos];

    // Filtro por estado
    if (filtroEstado !== "TODOS") {
      filtrados = filtrados.filter(p => p.estado === filtroEstado);
    }

    // Filtro por búsqueda (número de pedido)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtrados = filtrados.filter(p => 
        p.numero.toLowerCase().includes(query)
      );
    }

    // Filtro por fecha
    if (filtroFecha !== "TODOS") {
      const ahora = new Date();
      const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      
      filtrados = filtrados.filter(p => {
        const fechaPedido = new Date(p.fecha);
        
        switch (filtroFecha) {
          case "HOY":
            return fechaPedido >= hoy;
          case "ESTA_SEMANA":
            const inicioSemana = new Date(hoy);
            inicioSemana.setDate(hoy.getDate() - hoy.getDay());
            return fechaPedido >= inicioSemana;
          case "ESTE_MES":
            const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
            return fechaPedido >= inicioMes;
          case "MES_PASADO":
            const inicioMesPasado = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
            const finMesPasado = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
            return fechaPedido >= inicioMesPasado && fechaPedido <= finMesPasado;
          default:
            return true;
        }
      });
    }

    return filtrados;
  }, [pedidos, filtroEstado, filtroFecha, searchQuery]);

  const getEstadoInfo = (estado: EstadoPedido) => {
    return estados.find(e => e.estado === estado) || estados[0];
  };

  // Usar helpers del contexto (memoizados)
  const pedidosActivosFiltered = useMemo(() => 
    pedidosFiltrados.filter(p => p.estado !== EstadoPedido.ENTREGADO && p.estado !== EstadoPedido.CANCELADO),
    [pedidosFiltrados]
  );
  const pedidosCompletadosFiltered = useMemo(() =>
    pedidosFiltrados.filter(p => p.estado === EstadoPedido.ENTREGADO || p.estado === EstadoPedido.CANCELADO),
    [pedidosFiltrados]
  );

  const pedidoMasReciente = useMemo(() => 
    pedidosActivosFiltered.length > 0
      ? pedidosActivosFiltered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
      : null,
    [pedidosActivosFiltered]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <PublicHeader />
        <div className="container mx-auto max-w-6xl py-8 px-4">
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-64" />
          </div>
          
          {/* Skeleton de información personal */}
          <div className="border rounded-lg p-6 mb-6">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-40 mb-4" />
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                <div className="h-6 bg-gray-200 rounded animate-pulse w-48" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                <div className="h-6 bg-gray-200 rounded animate-pulse w-48" />
              </div>
            </div>
          </div>

          {/* Skeleton de resumen */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-6">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2" />
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16" />
              </div>
            ))}
          </div>

          {/* Skeleton de pedidos */}
          <div className="border rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-40 mb-4" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-32" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-48" />
                  </div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PublicHeader />
      
      <div className="container mx-auto max-w-6xl py-6 sm:py-8 px-4 sm:px-6">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Mi Cuenta</h1>
            <p className="text-sm sm:text-base text-gray-700">Gestiona tus pedidos y información personal</p>
          </div>
          {pedidoMasReciente && (
            <Button
              onClick={() => router.push(`/seguimiento/${pedidoMasReciente.id}`)}
              className="gap-2 w-full sm:w-auto"
              size="sm"
            >
              <ArrowRight className="h-4 w-4" />
              Ver Seguimiento
            </Button>
          )}
        </div>

        {/* Información Personal */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-gray-900">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-gray-700 font-medium">Nombre</p>
                <p className="font-semibold text-base sm:text-lg text-gray-900">{usuario?.nombre}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-gray-700 font-medium">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-600 flex-shrink-0" aria-hidden="true" />
                  <p className="font-semibold text-sm sm:text-base text-gray-900 break-all">{usuario?.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de Pedidos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-800 mb-1 font-medium">Total de Pedidos</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{pedidos.length}</p>
                </div>
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary opacity-50 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
          <Card
            className={pedidoMasReciente ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
            onClick={() => {
              if (pedidoMasReciente) {
                router.push(`/seguimiento/${pedidoMasReciente.id}`);
              }
            }}
          >
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-800 mb-1 font-medium">Pedidos Activos</p>
                  <p className="text-xl sm:text-2xl font-bold text-info">{pedidosActivosFiltered.length}</p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-info opacity-50 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-800 mb-1 font-medium">Completados</p>
                  <p className="text-xl sm:text-2xl font-bold text-success">{pedidosCompletadosFiltered.length}</p>
                </div>
                <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-success opacity-50 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y Búsqueda - Optimizado móvil */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="pt-4 sm:pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Búsqueda */}
              <div className="relative sm:col-span-2 md:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" aria-hidden="true" />
                <Input
                  placeholder="Buscar por número de pedido..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm sm:text-base h-11 sm:h-10"
                />
              </div>

              {/* Filtro por Estado */}
              <Select value={filtroEstado} onValueChange={(value) => setFiltroEstado(value as EstadoPedido | "TODOS")}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los estados</SelectItem>
                  {estados.map((estado) => (
                    <SelectItem key={estado.estado} value={estado.estado}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro por Fecha */}
              <Select value={filtroFecha} onValueChange={setFiltroFecha}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas las fechas</SelectItem>
                  <SelectItem value="HOY">Hoy</SelectItem>
                  <SelectItem value="ESTA_SEMANA">Esta semana</SelectItem>
                  <SelectItem value="ESTE_MES">Este mes</SelectItem>
                  <SelectItem value="MES_PASADO">Mes pasado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botón de Actualizar */}
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => usuario?.id && refreshPedidos(usuario.id)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pedidos Activos - Optimizado móvil */}
        {pedidosActivosFiltered.length > 0 && (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg sm:text-xl text-gray-900 mb-1">Pedidos en Proceso</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600">Pedidos que están siendo preparados o listos para recoger</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
                    if (usuario.id) {
                      refreshPedidos(usuario.id);
                    }
                  }}
                  disabled={isRefreshing}
                  className="gap-2 w-full sm:w-auto h-10 sm:h-9"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pedidosActivosFiltered.map((pedido: Pedido) => {
                  const estadoInfo = getEstadoInfo(pedido.estado);
                  const EstadoIcon = estadoInfo.icon;
                  
                  return (
                    <div key={pedido.id} className="p-3 sm:p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
                      <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-2">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${estadoInfo.bgColor}`}>
                              <EstadoIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${estadoInfo.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base sm:text-lg text-gray-900">Pedido #{pedido.numero}</h3>
                              <p className="text-xs sm:text-sm text-gray-700 mt-1">
                                {new Date(pedido.fecha).toLocaleDateString("es-ES", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                            <Badge className={`${estadoInfo.bgColor} ${estadoInfo.color} w-fit`}>
                              {estadoInfo.label}
                            </Badge>
                            <span className="text-base sm:text-lg font-bold text-primary">
                              {formatCOP(pedido.total)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => router.push(`/seguimiento/${pedido.id}`)}
                            className="gap-2 w-full sm:w-auto"
                          >
                            <ArrowRight className="h-4 w-4" />
                            Ver Seguimiento
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/pedido/${pedido.id}`)}
                            className="w-full sm:w-auto"
                          >
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historial de Pedidos */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Historial de Pedidos</CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              {pedidosCompletadosFiltered.length > 0 
                ? "Todos tus pedidos anteriores"
                : pedidosActivosFiltered.length === 0
                ? "No tienes pedidos registrados"
                : "Tus pedidos completados aparecerán aquí"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pedidosFiltrados.length === 0 && pedidos.length > 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-2">No se encontraron pedidos</p>
                <p className="text-sm text-gray-600 mb-4">
                  Intenta ajustar los filtros de búsqueda
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setFiltroEstado("TODOS");
                    setFiltroFecha("TODOS");
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            ) : pedidos.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-2">No tienes pedidos registrados</p>
                <p className="text-sm text-gray-600 mb-4">
                  Comienza a hacer tu primer pedido desde el menú
                </p>
                <Button onClick={() => router.push("/")}>
                  Ver Menú
                </Button>
              </div>
            ) : pedidosCompletadosFiltered.length === 0 && pedidosActivosFiltered.length > 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-700">No hay pedidos completados aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pedidosFiltrados.map((pedido) => {
                  const estadoInfo = getEstadoInfo(pedido.estado);
                  const EstadoIcon = estadoInfo.icon;
                  const isActive = pedido.estado !== EstadoPedido.ENTREGADO && pedido.estado !== EstadoPedido.CANCELADO;
                  
                  if (isActive) return null; // Ya se mostró en Pedidos Activos
                  
                  return (
                    <div
                      key={pedido.id}
                      className="p-3 sm:p-4 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                          <div className={`p-2 rounded-lg flex-shrink-0 ${estadoInfo.bgColor}`}>
                            <EstadoIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${estadoInfo.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                              <h4 className="font-semibold text-sm sm:text-base text-gray-900">Pedido #{pedido.numero}</h4>
                              <Badge className={`${estadoInfo.bgColor} ${estadoInfo.color} w-fit`}>
                                {estadoInfo.label}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-700">
                              {new Date(pedido.fecha).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div className="text-left sm:text-right flex-shrink-0">
                            <p className="font-bold text-base sm:text-lg text-gray-900">{formatCOP(pedido.total)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => router.push(`/seguimiento/${pedido.id}`)}
                            className="gap-2 w-full sm:w-auto"
                          >
                            <ArrowRight className="h-4 w-4" />
                            Ver Seguimiento
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/pedido/${pedido.id}`)}
                            className="w-full sm:w-auto"
                          >
                            Detalles
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDescargarTicket(pedido)}
                            className="w-full sm:w-auto"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Ticket
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botón para volver al menú */}
        <div className="mt-6 text-center">
          <Button onClick={() => router.push("/")} variant="outline">
            Volver al Menú
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MiCuentaPage() {
  return <MiCuentaPageContent />;
}
