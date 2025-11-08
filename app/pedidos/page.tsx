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
import { Plus, Eye } from "lucide-react";
import { Pedido, EstadoPedido, ItemPedido, MetodoPago } from "@/types/domain";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AdminWrapper } from "@/components/admin-wrapper";
import { useAdminData } from "@/contexts/admin-data-context";

function PedidosPageContent() {
  const { toast } = useToast();
  const {
    pedidos,
    productos,
    mesas,
    descuentos,
    loadPedidos,
    loadProductos,
    loadMesas,
    loadDescuentos,
    refreshAll,
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pedidos</h1>
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
                        <TableCell className="text-gray-900 font-semibold">${pedido.total.toFixed(2)}</TableCell>
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
                            <TableCell className="text-gray-800">${item.precioUnitario.toFixed(2)}</TableCell>
                            <TableCell className="text-gray-800 font-semibold">${item.subtotal.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-bold">
                            Total:
                          </TableCell>
                          <TableCell className="font-bold">
                            ${selectedPedido.total.toFixed(2)}
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
