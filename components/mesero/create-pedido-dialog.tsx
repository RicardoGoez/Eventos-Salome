"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, X, Search } from "lucide-react";
import { Producto, MetodoPago, Mesa } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";

interface CreatePedidoDialogProps {
  onPedidoCreatedAction: () => void;
  mesaIdPredefinida?: string;
}

interface ItemPedido {
  productoId: string;
  cantidad: number;
  producto?: Producto;
  precio?: number;
}

export function CreatePedidoDialog({ onPedidoCreatedAction, mesaIdPredefinida }: CreatePedidoDialogProps) {
  const { toast } = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<ItemPedido[]>([]);
  const [mesaId, setMesaId] = useState<string>(mesaIdPredefinida || "");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(MetodoPago.EFECTIVO);
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mesaIdPredefinida) {
      setMesaId(mesaIdPredefinida);
    }
  }, [mesaIdPredefinida]);

  useEffect(() => {
    loadProductos();
    loadMesas();
  }, []);

  const loadProductos = async () => {
    try {
      const response = await fetch("/api/productos");
      const data = await response.json();
      setProductos(Array.isArray(data) ? data.filter((p: Producto) => p.disponible) : []);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  const loadMesas = async () => {
    try {
      const response = await fetch("/api/mesas");
      const data = await response.json();
      setMesas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar mesas:", error);
    }
  };

  const productosFiltrados = productos.filter((producto) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      producto.nombre.toLowerCase().includes(query) ||
      producto.descripcion?.toLowerCase().includes(query)
    );
  });

  const handleAddItem = (producto: Producto) => {
    const existingItem = items.find((item) => item.productoId === producto.id);
    
    if (existingItem) {
      setItems(
        items.map((item) =>
          item.productoId === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setItems([
        ...items,
        {
          productoId: producto.id,
          cantidad: 1,
          producto,
          precio: producto.precio,
        },
      ]);
    }
  };

  const handleUpdateQuantity = (productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      setItems(items.filter((item) => item.productoId !== productoId));
    } else {
      setItems(
        items.map((item) =>
          item.productoId === productoId ? { ...item, cantidad } : item
        )
      );
    }
  };

  const handleRemoveItem = (productoId: string) => {
    setItems(items.filter((item) => item.productoId !== productoId));
  };

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.precio || 0) * item.cantidad;
  }, 0);

  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos un producto al pedido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

      const pedidoData = {
        items: items.map((item) => ({
          productoId: item.productoId,
          cantidad: item.cantidad,
        })),
        clienteId: undefined, // Pedido del mesero (sin cliente específico)
        mesaId: mesaId || undefined,
        metodoPago,
        notas: notas.trim() || undefined,
      };

      const response = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedidoData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear pedido");
      }

      toast({
        title: "Pedido creado",
        description: "El pedido ha sido creado exitosamente",
      });

      // Reset form
      setItems([]);
      setMesaId("");
      setMetodoPago(MetodoPago.EFECTIVO);
      setNotas("");
      setSearchQuery("");

      onPedidoCreatedAction();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el pedido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selección de Productos */}
        <div className="space-y-4">
          <div>
            <Label>Buscar Productos</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              {productosFiltrados.map((producto) => (
                <button
                  key={producto.id}
                  onClick={() => handleAddItem(producto)}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  {producto.imagen ? (
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      className="w-16 h-16 object-cover rounded mb-2"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded mb-2 flex items-center justify-center">
                      <span className="text-xs text-gray-400">Sin imagen</span>
                    </div>
                  )}
                  <span className="text-sm font-medium truncate w-full">
                    {producto.nombre}
                  </span>
                  <span className="text-xs text-primary font-semibold">
                    ${producto.precio.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen y Configuración */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Mesa (Opcional)</Label>
              <Select value={mesaId || "SIN_MESA"} onValueChange={(v) => setMesaId(v === "SIN_MESA" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mesa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIN_MESA">Sin mesa</SelectItem>
                  {mesas.map((mesa) => (
                    <SelectItem key={mesa.id} value={mesa.id}>
                      Mesa {mesa.numero} {mesa.disponible ? "(Disponible)" : "(Ocupada)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Método de Pago</Label>
              <Select value={metodoPago} onValueChange={(v) => setMetodoPago(v as MetodoPago)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MetodoPago.EFECTIVO}>Efectivo</SelectItem>
                  <SelectItem value={MetodoPago.TARJETA}>Tarjeta</SelectItem>
                  <SelectItem value={MetodoPago.TRANSFERENCIA}>Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items del Pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Items del Pedido ({items.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  Agrega productos al pedido
                </p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.productoId}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {item.producto?.nombre || "Producto"}
                      </p>
                      <p className="text-xs text-muted">
                        ${(item.precio || 0).toFixed(2)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          handleUpdateQuantity(item.productoId, item.cantidad - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {item.cantidad}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          handleUpdateQuantity(item.productoId, item.cantidad + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-danger"
                        onClick={() => handleRemoveItem(item.productoId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Resumen Financiero */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">IVA (16%):</span>
                <span className="font-medium">${iva.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          <div>
            <Label>Notas (Opcional)</Label>
            <Input
              placeholder="Notas especiales del pedido..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Botón Crear */}
          <Button
            onClick={handleSubmit}
            disabled={loading || items.length === 0}
            className="w-full"
            size="lg"
          >
            {loading ? "Creando pedido..." : `Crear Pedido - $${total.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

