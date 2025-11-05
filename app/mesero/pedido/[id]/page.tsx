"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { MeseroSidebar } from "@/components/mesero-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { Pedido, EstadoPedido } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import { useMeseroData } from "@/contexts/mesero-data-context";

export default function PedidoDetalleMeseroPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { getPedidoById, loadingPedidos } = useMeseroData();
  const pedidoId = params?.id as string;

  // Obtener pedido desde el contexto (cache)
  const pedido = useMemo(() => getPedidoById(pedidoId), [getPedidoById, pedidoId]);
  const loading = loadingPedidos && !pedido;

  useEffect(() => {
    // Si no está en cache, redirigir (debería cargarse desde el contexto)
    if (!pedido && !loadingPedidos) {
      toast({
        title: "Error",
        description: "Pedido no encontrado",
        variant: "destructive",
      });
      router.push("/mesero/pedidos");
    }
  }, [pedido, loadingPedidos, toast, router]);

  const getEstadoColor = (estado: EstadoPedido) => {
    switch (estado) {
      case EstadoPedido.PENDIENTE:
        return "bg-warning text-warning-900";
      case EstadoPedido.EN_PREPARACION:
        return "bg-info text-info-900";
      case EstadoPedido.LISTO:
        return "bg-success text-success-900";
      case EstadoPedido.ENTREGADO:
        return "bg-primary text-primary-900";
      case EstadoPedido.CANCELADO:
        return "bg-danger text-danger-900";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <MeseroSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted">Cargando pedido...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex min-h-screen">
        <MeseroSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted">Pedido no encontrado</p>
              <Button onClick={() => router.push("/mesero")} className="mt-4">
                Volver al Dashboard
              </Button>
            </CardContent>
          </Card>
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
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/mesero")}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Pedido #{pedido.numero}</h1>
                  <p className="text-sm text-gray-600">
                    {new Date(pedido.fecha).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className={getEstadoColor(pedido.estado)}>
                  {pedido.estado}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Información del Pedido */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {pedido.mesa && (
                    <div>
                      <p className="text-sm text-gray-700">Mesa</p>
                      <p className="font-semibold">Mesa {pedido.mesa.numero || pedido.mesaId}</p>
                    </div>
                  )}
                  
                  {pedido.clienteNombre && (
                    <div>
                      <p className="text-sm text-gray-700">Cliente</p>
                      <p className="font-semibold">{pedido.clienteNombre}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-700">Método de Pago</p>
                    <p className="font-semibold">{pedido.metodoPago || "No especificado"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-700">Estado</p>
                    <Badge className={getEstadoColor(pedido.estado)}>
                      {pedido.estado}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items del Pedido */}
            <Card>
              <CardHeader>
                <CardTitle>Productos del Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pedido.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4 flex-1">
                        {item.producto?.imagen && (
                          <img
                            src={item.producto.imagen}
                            alt={item.producto.nombre}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold">
                            {item.producto?.nombre || "Producto"}
                          </p>
                          <p className="text-sm text-gray-700">
                            Cantidad: {item.cantidad} x ${item.precioUnitario.toFixed(2)}
                          </p>
                          {item.notas && (
                            <p className="text-xs text-gray-600 mt-1">Nota: {item.notas}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resumen Financiero */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen Financiero</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-medium">${pedido.subtotal.toFixed(2)}</span>
                </div>
                {pedido.descuento && pedido.descuento > 0 && (
                  <>
                    <div className="flex justify-between text-success">
                      <span>Descuento:</span>
                      <span>-${pedido.descuento.toFixed(2)}</span>
                    </div>
                    {pedido.descuentoAplicado && (
                      <p className="text-xs text-muted">
                        Descuento: {pedido.descuentoAplicado.nombre}
                      </p>
                    )}
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-700">IVA (16%):</span>
                  <span className="font-medium">${pedido.iva.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold pt-2">
                  <span>Total:</span>
                  <span className="text-primary">${pedido.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Notas */}
            {pedido.notas && (
              <Card>
                <CardHeader>
                  <CardTitle>Notas del Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-800 whitespace-pre-wrap">{pedido.notas}</p>
                </CardContent>
              </Card>
            )}

            {/* Código QR */}
            {pedido.ticketQR && (
              <Card>
                <CardHeader>
                  <CardTitle>Código QR del Ticket</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <img
                    src={pedido.ticketQR}
                    alt="Código QR del ticket"
                    className="w-48 h-48 mx-auto"
                  />
                  <p className="text-sm text-gray-600 mt-4">Pedido #{pedido.numero}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

