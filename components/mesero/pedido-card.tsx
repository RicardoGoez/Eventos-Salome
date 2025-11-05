"use client";

import { Pedido, EstadoPedido } from "@/types/domain";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Package, 
  CheckCircle2, 
  Truck, 
  XCircle,
  Eye,
  ArrowRight,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface PedidoCardProps {
  pedido: Pedido;
  onUpdateEstado?: (pedidoId: string, nuevoEstado: EstadoPedido) => void;
  onVerDetalles?: (pedidoId: string) => void;
  onCancelar?: (pedidoId: string) => void;
  allowedNextStates?: EstadoPedido[]; // Opcional: restringe los posibles siguientes estados
  draggable?: boolean;
}

const estadoConfig = {
  [EstadoPedido.PENDIENTE]: {
    icon: Clock,
    label: "Pendiente",
    color: "text-warning",
    bgColor: "bg-warning/20",
    borderColor: "border-warning-300",
    badgeColor: "bg-warning text-warning-900",
    acciones: ["EN_PREPARACION", "CANCELADO"],
  },
  [EstadoPedido.EN_PREPARACION]: {
    icon: Package,
    label: "En Preparación",
    color: "text-info",
    bgColor: "bg-info/20",
    borderColor: "border-info-300",
    badgeColor: "bg-info text-info-900",
    acciones: ["LISTO", "CANCELADO"],
  },
  [EstadoPedido.LISTO]: {
    icon: CheckCircle2,
    label: "Listo",
    color: "text-success",
    bgColor: "bg-success/20",
    borderColor: "border-success-400",
    badgeColor: "bg-success text-success-900",
    acciones: ["ENTREGADO"],
    destacado: true,
  },
  [EstadoPedido.ENTREGADO]: {
    icon: Truck,
    label: "Entregado",
    color: "text-primary",
    bgColor: "bg-primary/20",
    borderColor: "border-primary-300",
    badgeColor: "bg-primary text-primary-900",
    acciones: [],
  },
  [EstadoPedido.CANCELADO]: {
    icon: XCircle,
    label: "Cancelado",
    color: "text-danger",
    bgColor: "bg-danger/20",
    borderColor: "border-danger-300",
    badgeColor: "bg-danger text-danger-900",
    acciones: [],
  },
};

export function PedidoCard({ 
  pedido, 
  onUpdateEstado, 
  onVerDetalles,
  onCancelar,
  allowedNextStates,
  draggable = false,
}: PedidoCardProps) {
  const config = estadoConfig[pedido.estado];
  const EstadoIcon = config.icon;
  const tiempoTranscurrido = formatDistanceToNow(new Date(pedido.fecha), { 
    addSuffix: true,
    locale: es 
  });

  const getSiguienteEstado = (): EstadoPedido | null => {
    const acciones = (allowedNextStates && allowedNextStates.length > 0)
      ? allowedNextStates
      : (config.acciones || []);
    if (acciones.length === 0) return null;
    // Excluir CANCELADO, solo avanzar estados
    const siguiente = acciones.find(a => a !== EstadoPedido.CANCELADO);
    return siguiente as EstadoPedido || null;
  };

  const siguienteEstado = getSiguienteEstado();

  const handleSiguienteEstado = () => {
    if (siguienteEstado && onUpdateEstado) {
      onUpdateEstado(pedido.id, siguienteEstado);
    }
  };

  const handleCancelar = () => {
    if (onCancelar && confirm(`¿Estás seguro de cancelar el pedido #${pedido.numero}?`)) {
      onCancelar(pedido.id);
    }
  };

  return (
    <Card 
      className={cn(
        "border-2 transition-all duration-200 hover:shadow-lg",
        config.borderColor,
        pedido.estado === EstadoPedido.LISTO && "ring-2 ring-success-300",
        pedido.estado === EstadoPedido.PENDIENTE && "bg-warning/5"
      )}
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.setData("application/x-pedido-id", pedido.id);
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <EstadoIcon className={cn("h-5 w-5", config.color)} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">Pedido #{pedido.numero}</h3>
              <p className="text-sm text-gray-600">{tiempoTranscurrido}</p>
            </div>
          </div>
          <Badge className={config.badgeColor}>
            {config.label}
          </Badge>
        </div>

        {/* Información del Pedido */}
        <div className="space-y-2 mb-4">
          {pedido.mesa && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-800">Mesa:</span>
              <span className="text-gray-700">{pedido.mesa.numero || pedido.mesaId}</span>
            </div>
          )}
          
          {pedido.clienteNombre && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-800">Cliente:</span>
              <span className="text-gray-700">{pedido.clienteNombre}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-800">Items:</span>
            <span className="text-gray-700">{pedido.items.length}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-medium">Total:</span>
            <span className="text-lg font-bold text-primary">
              ${pedido.total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Items del Pedido (Primeros 3) */}
        {pedido.items.length > 0 && (
          <div className="mb-4 space-y-1">
            <p className="text-xs font-medium text-gray-800 mb-2">Productos:</p>
            {pedido.items.slice(0, 3).map((item, index) => (
              <div key={index} className="text-sm text-gray-800">
                • {item.producto?.nombre || "Producto"} x {item.cantidad}
              </div>
            ))}
            {pedido.items.length > 3 && (
              <p className="text-xs text-gray-600">
                + {pedido.items.length - 3} producto(s) más
              </p>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-wrap gap-2">
          {siguienteEstado && onUpdateEstado && (
            <Button
              onClick={handleSiguienteEstado}
              className={cn(
                "flex-1 gap-2",
                pedido.estado === EstadoPedido.LISTO && "bg-success hover:bg-success-600"
              )}
              size="sm"
            >
              <ArrowRight className="h-4 w-4" />
              {pedido.estado === EstadoPedido.PENDIENTE && "Enviar a Cocina"}
              {pedido.estado === EstadoPedido.EN_PREPARACION && "Marcar como Listo"}
              {pedido.estado === EstadoPedido.LISTO && "Entregar Pedido"}
            </Button>
          )}

          {onVerDetalles && (
            <Button
              variant="outline"
              onClick={() => onVerDetalles(pedido.id)}
              size="sm"
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Detalles
            </Button>
          )}

          {pedido.estado !== EstadoPedido.ENTREGADO && 
           pedido.estado !== EstadoPedido.CANCELADO &&
           onCancelar && (
            <Button
              variant="outline"
              onClick={handleCancelar}
              size="sm"
              className="gap-2 text-danger hover:text-danger hover:bg-danger/10"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

