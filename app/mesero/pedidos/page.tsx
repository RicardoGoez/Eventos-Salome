"use client";

import { useMemo, useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MeseroSidebar } from "@/components/mesero-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PedidoCard } from "@/components/mesero/pedido-card";
import { RefreshCw, Search, Filter } from "lucide-react";
import { Pedido, EstadoPedido } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMeseroData } from "@/contexts/mesero-data-context";
import { Logo } from "@/components/logo";
import { Logo } from "@/components/logo";

function PedidosMeseroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const {
    pedidos,
    loadingPedidos,
    isRefreshing,
    refreshAll,
    updatePedido,
  } = useMeseroData();
  
  const loading = loadingPedidos;
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<EstadoPedido | "TODOS">("TODOS");
  const [filtroMesa, setFiltroMesa] = useState<string>("TODAS");

  const mesaIdFromQuery = searchParams.get("mesa");

  useEffect(() => {
    if (mesaIdFromQuery) {
      setFiltroMesa(mesaIdFromQuery);
    }
  }, [mesaIdFromQuery]);

  // Optimistic update: cambiar estado del pedido
  const handleUpdateEstado = useCallback(async (pedidoId: string, nuevoEstado: EstadoPedido) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;

    // Optimistic update
    updatePedido(pedidoId, { estado: nuevoEstado });

    try {
      const response = await fetch(`/api/pedidos/${pedidoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar estado");
      }

      await refreshAll(); // Sincronizar con servidor
      toast({
        title: "Estado actualizado",
        description: `El pedido ha sido actualizado a ${nuevoEstado}`,
      });
    } catch (error) {
      // Revertir en caso de error
      updatePedido(pedidoId, { estado: pedido.estado });
      console.error("Error al actualizar estado:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido",
        variant: "destructive",
      });
    }
  }, [pedidos, updatePedido, refreshAll, toast]);

  // Optimistic update: cancelar pedido
  const handleCancelar = useCallback(async (pedidoId: string) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;

    // Optimistic update
    updatePedido(pedidoId, { estado: EstadoPedido.CANCELADO });

    try {
      const response = await fetch(`/api/pedidos/${pedidoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: EstadoPedido.CANCELADO }),
      });

      if (!response.ok) {
        throw new Error("Error al cancelar pedido");
      }

      await refreshAll(); // Sincronizar con servidor
      toast({
        title: "Pedido cancelado",
        description: "El pedido ha sido cancelado",
      });
    } catch (error) {
      // Revertir en caso de error
      updatePedido(pedidoId, { estado: pedido.estado });
      console.error("Error al cancelar pedido:", error);
      toast({
        title: "Error",
        description: "No se pudo cancelar el pedido",
        variant: "destructive",
      });
    }
  }, [pedidos, updatePedido, refreshAll, toast]);

  // Filtrar pedidos (memoizado)
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((pedido) => {
      // Filtro por estado
      if (filtroEstado !== "TODOS" && pedido.estado !== filtroEstado) {
        return false;
      }

      // Filtro por mesa
      if (filtroMesa !== "TODAS" && pedido.mesaId !== filtroMesa) {
        return false;
      }

      // Filtro por búsqueda
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          pedido.numero.toLowerCase().includes(query) ||
          pedido.clienteNombre?.toLowerCase().includes(query) ||
          pedido.mesa?.numero?.toString().includes(query)
        );
      }

      return true;
    });
  }, [pedidos, filtroEstado, filtroMesa, searchQuery]);

  // Obtener mesas únicas (memoizado)
  const mesasUnicas = useMemo(() => {
    return Array.from(
      new Set(pedidos.map((p) => p.mesaId).filter(Boolean))
    );
  }, [pedidos]);

  // Estadísticas memoizadas
  const estadisticas = useMemo(() => ({
    total: pedidosFiltrados.length,
    pendientes: pedidosFiltrados.filter((p) => p.estado === EstadoPedido.PENDIENTE).length,
    enPreparacion: pedidosFiltrados.filter((p) => p.estado === EstadoPedido.EN_PREPARACION).length,
    listos: pedidosFiltrados.filter((p) => p.estado === EstadoPedido.LISTO).length,
  }), [pedidosFiltrados]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <MeseroSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted">Cargando pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MeseroSidebar />
      
      <main className="flex-1 md:ml-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <Logo size="lg" shadow />
                <div>
                  <h1 className="text-2xl font-bold text-dark">Todos los Pedidos</h1>
                  <p className="text-sm text-gray-600">Gestiona todos los pedidos del sistema</p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAll}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar por número, cliente o mesa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v as EstadoPedido | "TODOS")}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los estados</SelectItem>
                  <SelectItem value={EstadoPedido.PENDIENTE}>Pendientes</SelectItem>
                  <SelectItem value={EstadoPedido.EN_PREPARACION}>En Preparación</SelectItem>
                  <SelectItem value={EstadoPedido.LISTO}>Listos</SelectItem>
                  <SelectItem value={EstadoPedido.ENTREGADO}>Entregados</SelectItem>
                  <SelectItem value={EstadoPedido.CANCELADO}>Cancelados</SelectItem>
                </SelectContent>
              </Select>

              {mesasUnicas.length > 0 && (
                <Select value={filtroMesa} onValueChange={setFiltroMesa}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Mesa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAS">Todas las mesas</SelectItem>
                    {mesasUnicas.map((mesaId) => {
                      if (!mesaId) return null;
                      const pedidoConMesa = pedidos.find((p) => p.mesaId === mesaId);
                      return (
                        <SelectItem key={mesaId} value={mesaId}>
                          Mesa {pedidoConMesa?.mesa?.numero || mesaId}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-800 mb-1">Total Pedidos</p>
                <p className="text-2xl font-bold">{estadisticas.total}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-800 mb-1">Pendientes</p>
                <p className="text-2xl font-bold text-warning">
                  {estadisticas.pendientes}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-800 mb-1">En Preparación</p>
                <p className="text-2xl font-bold text-info">
                  {estadisticas.enPreparacion}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-800 mb-1">Listos</p>
                <p className="text-2xl font-bold text-success">
                  {estadisticas.listos}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Grid de Pedidos */}
          {pedidosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pedidosFiltrados.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onVerDetalles={(id) => router.push(`/mesero/pedido/${id}`)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-lg font-medium text-gray-800 mb-2">
                  No se encontraron pedidos con los filtros aplicados
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Intenta ajustar los filtros de búsqueda
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setFiltroEstado("TODOS");
                    setFiltroMesa("TODAS");
                  }}
                >
                  Limpiar Filtros
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PedidosMeseroPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen">
        <MeseroSidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Cargando...</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </main>
      </div>
    }>
      <PedidosMeseroContent />
    </Suspense>
  );
}

