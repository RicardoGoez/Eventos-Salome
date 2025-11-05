"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PublicHeader } from "@/components/public-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Clock, Package, Truck, XCircle, Download, QrCode, ArrowLeft, RefreshCw } from "lucide-react";
import { Pedido, EstadoPedido } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const estados = [
  { estado: EstadoPedido.PENDIENTE, label: "Pendiente", icon: Clock, color: "text-warning", bgColor: "bg-warning/20" },
  { estado: EstadoPedido.EN_PREPARACION, label: "En Preparación", icon: Package, color: "text-info", bgColor: "bg-info/20" },
  { estado: EstadoPedido.LISTO, label: "Listo", icon: CheckCircle2, color: "text-success", bgColor: "bg-success/20" },
  { estado: EstadoPedido.ENTREGADO, label: "Entregado", icon: Truck, color: "text-primary", bgColor: "bg-primary/20" },
  { estado: EstadoPedido.CANCELADO, label: "Cancelado", icon: XCircle, color: "text-danger", bgColor: "bg-danger/20" },
];

export default function SeguimientoPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pedidoId = params?.id as string;

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) {
      router.push("/login");
      return;
    }
    loadPedido();
    
    // Auto-refresh cada 10 segundos
    const interval = setInterval(() => {
      loadPedido(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [pedidoId, router]);

  const loadPedido = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      const response = await fetch(`/api/pedidos/${pedidoId}`);
      
      if (!response.ok) {
        throw new Error("Pedido no encontrado");
      }

      const data = await response.json();
      setPedido(data);
    } catch (error: any) {
      console.error("Error al cargar pedido:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar el pedido",
        variant: "destructive",
      });
      router.push("/mi-cuenta");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const getEstadoIndex = (estado: EstadoPedido): number => {
    return estados.findIndex(e => e.estado === estado);
  };

  const handleDescargarTicket = async () => {
    if (!pedido) return;
    
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <PublicHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <PublicHeader />
        <div className="container mx-auto max-w-4xl py-12 px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted">Pedido no encontrado</p>
              <Button className="mt-4" onClick={() => router.push("/mi-cuenta")}>
                Volver a Mi Cuenta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const estadoActual = estados.find(e => e.estado === pedido.estado);
  const estadoIndex = getEstadoIndex(pedido.estado);
  const EstadoIcon = estadoActual?.icon || Clock;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PublicHeader />
      
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="mb-6">
          <Link href="/mi-cuenta">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Mi Cuenta
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-dark">Seguimiento de Pedido</h1>
              <p className="text-muted mt-1">Pedido #{pedido.numero}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPedido(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Timeline de Estados */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Estado del Pedido</CardTitle>
            <CardDescription>Progreso de tu pedido</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {estados.map((estadoItem, index) => {
                const Icon = estadoItem.icon;
                const isActive = index <= estadoIndex;
                const isCurrent = index === estadoIndex;
                
                return (
                  <div key={estadoItem.estado} className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      isActive ? estadoItem.bgColor : "bg-gray-200"
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        isActive ? estadoItem.color : "text-gray-500"
                      }`} />
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-semibold ${
                          isActive ? "text-dark" : "text-gray-500"
                        }`}>
                          {estadoItem.label}
                        </h3>
                        {isCurrent && (
                          <Badge className={estadoItem.bgColor + " " + estadoItem.color}>
                            Actual
                          </Badge>
                        )}
                      </div>
                      {index < estados.length - 1 && (
                        <div className={`mt-2 h-8 w-0.5 ml-6 ${
                          index < estadoIndex ? estadoItem.bgColor : "bg-gray-200"
                        }`} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Información del Pedido */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">Fecha:</span>
                  <span className="font-medium">
                    {new Date(pedido.fecha).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Método de Pago:</span>
                  <span className="font-medium">{pedido.metodoPago || "No especificado"}</span>
                </div>
                {pedido.mesa && (
                  <div className="flex justify-between">
                    <span className="text-muted">Mesa:</span>
                    <span className="font-medium">{pedido.mesa.numero}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal:</span>
                <span className="font-medium">${pedido.subtotal.toFixed(2)}</span>
              </div>
              {pedido.descuento && pedido.descuento > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento:</span>
                  <span>-${pedido.descuento.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted">IVA (16%):</span>
                <span className="font-medium">${pedido.iva.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">${pedido.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items del Pedido */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pedido.items?.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {item.producto?.imagen && (
                      <img
                        src={item.producto.imagen}
                        alt={item.producto.nombre}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h4 className="font-semibold">{item.producto?.nombre || "Producto"}</h4>
                      <p className="text-sm text-muted">
                        Cantidad: {item.cantidad} x ${item.precioUnitario.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold">
                    ${(item.precioUnitario * item.cantidad).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="mt-6 flex flex-wrap gap-4">
          <Button onClick={handleDescargarTicket} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Descargar Ticket
          </Button>
          {pedido.ticketQR && (
            <Button
              variant="outline"
              onClick={() => router.push(`/pedido/${pedido.id}`)}
            >
              <QrCode className="mr-2 h-4 w-4" />
              Ver Código QR
            </Button>
          )}
          <Button
            onClick={() => router.push(`/pedido/${pedido.id}`)}
          >
            Ver Detalles Completos
          </Button>
        </div>
      </div>
    </div>
  );
}

