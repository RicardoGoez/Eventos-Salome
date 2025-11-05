"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PublicHeader } from "@/components/public-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Download, QrCode, ArrowLeft, Printer, Share2, MapPin, CreditCard, User, Mail } from "lucide-react";
import { Pedido, EstadoPedido } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function PedidoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);

  const pedidoId = params?.id as string;

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) {
      router.push("/login");
      return;
    }
    loadPedido();
  }, [pedidoId, router]);

  const loadPedido = async () => {
    try {
      setLoading(true);
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
        return "bg-gray-200 text-gray-700";
    }
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

  const handleImprimir = () => {
    window.print();
  };

  const handleCompartir = async () => {
    if (navigator.share && pedido) {
      try {
        await navigator.share({
          title: `Pedido #${pedido.numero} - Eventos Salome`,
          text: `Revisa el estado de mi pedido #${pedido.numero}`,
          url: window.location.href,
        });
      } catch (error) {
        // Usuario canceló o no se pudo compartir
      }
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Enlace copiado",
        description: "El enlace del pedido ha sido copiado al portapapeles",
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PublicHeader />
      
      <div className="container mx-auto max-w-5xl py-8 px-4">
        <div className="mb-6">
          <Link href="/mi-cuenta">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Mi Cuenta
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-dark">Detalle del Pedido</h1>
              <p className="text-muted mt-1">Pedido #{pedido.numero}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCompartir}>
                <Share2 className="mr-2 h-4 w-4" />
                Compartir
              </Button>
              <Button variant="outline" size="sm" onClick={handleImprimir}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>

        {/* Header del Pedido */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={getEstadoColor(pedido.estado)}>
                    {pedido.estado}
                  </Badge>
                </div>
                <p className="text-sm text-muted">
                  Fecha: {new Date(pedido.fecha).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  ${pedido.total.toFixed(2)}
                </p>
                <p className="text-sm text-muted">Total del pedido</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">
                {pedido.clienteNombre || pedido.cliente?.nombre || "Cliente"}
              </p>
              {pedido.cliente?.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  {pedido.cliente.email}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información de Pago */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{pedido.metodoPago || "No especificado"}</p>
            </CardContent>
          </Card>

          {/* Información de Entrega */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pedido.mesa ? (
                <div>
                  <p className="font-medium">Mesa #{pedido.mesa.numero}</p>
                  <p className="text-sm text-muted">Consumo en el local</p>
                </div>
              ) : (
                <p className="text-gray-600">A definir</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Items del Pedido */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Productos del Pedido</CardTitle>
            <CardDescription>{pedido.items?.length || 0} productos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pedido.items?.map((item, index) => (
                <div key={index}>
                  <div className="flex items-start gap-4 p-4">
                    {item.producto?.imagen && (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={item.producto.imagen}
                          alt={item.producto.nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-lg mb-1">
                        {item.producto?.nombre || "Producto"}
                      </h4>
                      {item.producto?.descripcion && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {item.producto.descripcion}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <span>Cantidad: {item.cantidad}</span>
                          <span className="mx-2">•</span>
                          <span>Precio unitario: ${item.precioUnitario.toFixed(2)}</span>
                        </div>
                        <p className="font-bold text-lg">
                          ${(item.precioUnitario * item.cantidad).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {index < (pedido.items?.length || 0) - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resumen Financiero */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Resumen Financiero</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal:</span>
                <span className="font-medium">${pedido.subtotal.toFixed(2)}</span>
              </div>
              {pedido.descuento && pedido.descuento > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
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
                <span className="text-muted">IVA (16%):</span>
                <span className="font-medium">${pedido.iva.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold pt-2">
                <span>Total:</span>
                <span className="text-primary">${pedido.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        {pedido.notas && (
          <Card className="mt-6">
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
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Código QR del Ticket
              </CardTitle>
              <CardDescription>
                Escanea este código para verificar tu pedido
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-lg border-2 border-primary/20">
                <img
                  src={pedido.ticketQR}
                  alt="Código QR del ticket"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm text-muted mt-4 text-center">
                Pedido #{pedido.numero}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Acciones */}
        <div className="mt-6 flex flex-wrap gap-4">
          <Button onClick={handleDescargarTicket} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Descargar Ticket PDF
          </Button>
          <Button onClick={() => router.push(`/seguimiento/${pedido.id}`)}>
            Ver Seguimiento
          </Button>
        </div>
      </div>
    </div>
  );
}

