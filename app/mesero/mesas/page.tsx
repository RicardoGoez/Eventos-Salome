"use client";

import { useMemo, useState, useCallback } from "react";
import { MeseroSidebar } from "@/components/mesero-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { Mesa } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreatePedidoDialog } from "@/components/mesero/create-pedido-dialog";
import { cn } from "@/lib/utils";
import { useMeseroData } from "@/contexts/mesero-data-context";

export default function MesasMeseroPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    mesas,
    pedidos,
    loadingMesas,
    loadingPedidos,
    isRefreshing,
    refreshAll,
    getPedidosPorMesa,
    updatePedido,
    updateMesa,
  } = useMeseroData();
  
  const loading = loadingMesas || loadingPedidos;
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [dragOverMesaId, setDragOverMesaId] = useState<string | "SIN_MESA" | null>(null);

  // Optimistic update: mover pedido a mesa
  const handleDropPedidoEnMesa = useCallback(async (pedidoId: string, mesaId: string) => {
    // Optimistic update
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (pedido) {
      updatePedido(pedidoId, { mesaId: mesaId || undefined });
    }

    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesaId: mesaId || null })
      });
      if (!res.ok) throw new Error();
      await refreshAll(); // Sincronizar con servidor
      toast({ title: "Pedido movido", description: mesaId ? `Pedido asignado a mesa` : "Pedido sin mesa asignada" });
    } catch {
      // Revertir en caso de error
      if (pedido) {
        updatePedido(pedidoId, { mesaId: pedido.mesaId });
      }
      toast({ title: "Error", description: "No se pudo mover el pedido", variant: "destructive" });
    }
  }, [pedidos, updatePedido, refreshAll, toast]);

  // Optimistic update: cambiar estado de mesa
  const handleCambiarEstadoMesa = useCallback(async (mesa: Mesa, accion: "ocupar" | "liberar") => {
    const nuevoEstado = accion === "ocupar" ? false : true;
    
    // Optimistic update
    updateMesa(mesa.id, { disponible: nuevoEstado });

    try {
      const res = await fetch(`/api/mesas/${mesa.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion })
      });
      if (!res.ok) throw new Error();
      await refreshAll(); // Sincronizar con servidor
      toast({ title: "OK", description: accion === "ocupar" ? "Mesa ocupada" : "Mesa liberada" });
    } catch {
      // Revertir en caso de error
      updateMesa(mesa.id, { disponible: mesa.disponible });
      toast({ title: "Error", description: "No se pudo actualizar el estado de la mesa", variant: "destructive" });
    }
  }, [updateMesa, refreshAll, toast]);

  const handleCrearPedidoParaMesa = useCallback((mesa: Mesa) => {
    setSelectedMesa(mesa);
    setIsCreateDialogOpen(true);
  }, []);

  const handlePedidoCreated = useCallback(() => {
    setIsCreateDialogOpen(false);
    setSelectedMesa(null);
    refreshAll(); // Refrescar datos
    toast({
      title: "Pedido creado",
      description: "El pedido ha sido creado exitosamente",
    });
  }, [refreshAll, toast]);

  // Memoizar estadísticas
  const estadisticas = useMemo(() => ({
    total: mesas.length,
    disponibles: mesas.filter((m) => m.disponible).length,
    ocupadas: mesas.filter((m) => !m.disponible).length,
  }), [mesas]);

  // Memoizar pedidos activos
  const pedidosActivos = useMemo(() => 
    pedidos.filter(p => p.estado !== "ENTREGADO" && p.estado !== "CANCELADO"),
    [pedidos]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <MeseroSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted">Cargando mesas...</p>
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-dark">Gestión de Mesas</h1>
                <p className="text-sm text-gray-700">Monitorea y gestiona las mesas del restaurante</p>
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
          </div>
        </header>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700 mb-1">Total Mesas</p>
                    <p className="text-2xl font-bold">{estadisticas.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700 mb-1">Mesas Disponibles</p>
                    <p className="text-2xl font-bold text-success">
                      {estadisticas.disponibles}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700 mb-1">Mesas Ocupadas</p>
                    <p className="text-2xl font-bold text-danger">
                      {estadisticas.ocupadas}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leyenda */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-success border-2 border-success-300" />
                  <span className="text-sm text-gray-700">Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-danger border-2 border-danger-300" />
                  <span className="text-sm text-gray-700">Ocupada</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista rápida de pedidos activos (arrastrables) */}
          {pedidosActivos.length > 0 && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">Pedidos activos - arrastra a una mesa</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {pedidosActivos.map(p => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/x-pedido-id", p.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    className="px-3 py-1.5 border rounded-full text-sm bg-white hover:bg-gray-50 cursor-grab"
                    title={`Pedido #${p.numero}`}
                  >
                    #{p.numero} {p.mesaId ? `(Mesa)` : `(Sin mesa)`}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Zona droppable para dejar pedidos sin mesa */}
          <Card
            className={cn(
              "mb-4 border-2",
              dragOverMesaId === "SIN_MESA" ? "border-primary ring-2 ring-primary/50" : "border-dashed border-gray-300"
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOverMesaId("SIN_MESA"); }}
            onDragLeave={() => setDragOverMesaId(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverMesaId(null);
              const pedidoId = e.dataTransfer.getData("application/x-pedido-id");
              if (pedidoId) handleDropPedidoEnMesa(pedidoId, "");
            }}
          >
            <CardHeader>
              <CardTitle className="text-sm">Soltar aquí para dejar pedido sin mesa</CardTitle>
              <p className="text-xs text-gray-700">Útil cuando el cliente aún no tiene mesa asignada</p>
            </CardHeader>
          </Card>

          {/* Grid de Mesas */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
            {mesas.map((mesa) => {
              const pedidosMesa = getPedidosPorMesa(mesa.id);
              const tienePedidosActivos = pedidosMesa.length > 0;

              return (
                <Card
                  key={mesa.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-lg",
                    !mesa.disponible || tienePedidosActivos
                      ? "border-2 border-danger-300 bg-danger/5"
                      : "border-2 border-success-300 bg-success/5"
                    , dragOverMesaId === mesa.id && "ring-2 ring-primary border-primary"
                  )}
                  onClick={() => {
                    if (tienePedidosActivos) {
                      router.push(`/mesero/pedidos?mesa=${mesa.id}`);
                    } else {
                      handleCrearPedidoParaMesa(mesa);
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setDragOverMesaId(mesa.id);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverMesaId(null);
                    const pedidoId = e.dataTransfer.getData("application/x-pedido-id");
                    if (pedidoId) handleDropPedidoEnMesa(pedidoId, mesa.id);
                  }}
                  onDragLeave={() => setDragOverMesaId(null)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="space-y-2">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold text-lg",
                          !mesa.disponible || tienePedidosActivos
                            ? "bg-danger-100 text-danger-800"
                            : "bg-success-100 text-success-800"
                        )}
                      >
                        {mesa.numero}
                      </div>
                      <p className="text-sm font-medium">Mesa {mesa.numero}</p>
                      {tienePedidosActivos && (
                        <Badge variant="outline" className="text-xs">
                          {pedidosMesa.length} pedido{pedidosMesa.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {!mesa.disponible && (
                        <Badge variant="outline" className="text-xs bg-danger-100 text-danger-800">
                          Ocupada
                        </Badge>
                      )}
                      <div className="mt-2 flex items-center justify-center gap-2">
                        {mesa.disponible ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCambiarEstadoMesa(mesa, "ocupar");
                            }}
                          >
                            Ocupar
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={tienePedidosActivos}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCambiarEstadoMesa(mesa, "liberar");
                            }}
                          >
                            {tienePedidosActivos ? "Con pedidos" : "Marcar libre"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {mesas.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-lg font-medium text-muted mb-2">
                  No hay mesas registradas
                </p>
                <p className="text-sm text-gray-500">
                  Contacta al administrador para agregar mesas
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Dialog para crear pedido */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Crear Pedido {selectedMesa && `- Mesa ${selectedMesa.numero}`}
            </DialogTitle>
          </DialogHeader>
          <CreatePedidoDialog
            onPedidoCreatedAction={handlePedidoCreated}
            mesaIdPredefinida={selectedMesa?.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

