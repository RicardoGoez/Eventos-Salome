"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Package, AlertTriangle } from "lucide-react";
import { InventarioItem, TipoMovimientoInventario } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";

export default function InventarioPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAjusteDialogOpen, setIsAjusteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventarioItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productoId: "",
    cantidad: 0,
    cantidadMinima: 0,
    unidad: "unidades",
    ubicacion: "",
  });
  const [ajusteData, setAjusteData] = useState({
    cantidad: 0,
    tipo: TipoMovimientoInventario.ENTRADA,
    motivo: "",
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const response = await fetch("/api/inventario");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Error al guardar item",
        });
        return;
      }

      toast({
        variant: "success",
        title: "Éxito",
        description: "Item de inventario creado correctamente",
      });

      setIsDialogOpen(false);
      setFormData({
        productoId: "",
        cantidad: 0,
        cantidadMinima: 0,
        unidad: "unidades",
        ubicacion: "",
      });
      loadItems();
    } catch (error) {
      console.error("Error al guardar item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al guardar item",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAjustar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/inventario/${selectedItem.id}/ajustar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ajusteData),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Error al ajustar stock",
        });
        return;
      }

      toast({
        variant: "success",
        title: "Éxito",
        description: `Stock ajustado correctamente (${ajusteData.tipo})`,
      });

      setIsAjusteDialogOpen(false);
      setSelectedItem(null);
      setAjusteData({
        cantidad: 0,
        tipo: TipoMovimientoInventario.ENTRADA,
        motivo: "",
      });
      loadItems();
    } catch (error) {
      console.error("Error al ajustar stock:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al ajustar stock",
      });
    } finally {
      setLoading(false);
    }
  };

  const bajoStock = items.filter(
    (item) => item.cantidad <= item.cantidadMinima
  );

  return (
    <div className="flex min-h-screen lg:h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-light p-4 lg:p-8 lg:ml-0">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-dark">Inventario</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Nuevo Item de Inventario</DialogTitle>
                    <DialogDescription>
                      Agrega un nuevo item al inventario
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="productoId">ID del Producto</Label>
                      <Input
                        id="productoId"
                        value={formData.productoId}
                        onChange={(e) =>
                          setFormData({ ...formData, productoId: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cantidad">Cantidad</Label>
                      <Input
                        id="cantidad"
                        type="number"
                        min="0"
                        value={formData.cantidad}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cantidad: parseInt(e.target.value) || 0,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cantidadMinima">Cantidad Mínima</Label>
                      <Input
                        id="cantidadMinima"
                        type="number"
                        min="0"
                        value={formData.cantidadMinima}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cantidadMinima: parseInt(e.target.value) || 0,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="unidad">Unidad</Label>
                      <Input
                        id="unidad"
                        value={formData.unidad}
                        onChange={(e) =>
                          setFormData({ ...formData, unidad: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ubicacion">Ubicación</Label>
                      <Input
                        id="ubicacion"
                        value={formData.ubicacion}
                        onChange={(e) =>
                          setFormData({ ...formData, ubicacion: e.target.value })
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
                    <Button type="submit">Guardar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {bajoStock.length > 0 && (
            <Card className="mb-6 border-warning">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  Stock Bajo
                </CardTitle>
                <CardDescription>
                  {bajoStock.length} item(s) con stock por debajo del mínimo
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Items de Inventario</CardTitle>
              <CardDescription>
                Gestiona el inventario de Eventos Salome
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto ID</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Cantidad Mínima</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No hay items en el inventario
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow
                        key={item.id}
                        className={
                          item.cantidad <= item.cantidadMinima
                            ? "bg-warning/10"
                            : ""
                        }
                      >
                        <TableCell className="font-medium">
                          {item.productoId}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              item.cantidad <= item.cantidadMinima
                                ? "font-bold text-warning"
                                : ""
                            }
                          >
                            {item.cantidad}
                          </span>
                        </TableCell>
                        <TableCell>{item.cantidadMinima}</TableCell>
                        <TableCell>{item.unidad}</TableCell>
                        <TableCell>{item.ubicacion || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsAjusteDialogOpen(true);
                            }}
                          >
                            Ajustar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={isAjusteDialogOpen} onOpenChange={setIsAjusteDialogOpen}>
            <DialogContent>
              <form onSubmit={handleAjustar}>
                <DialogHeader>
                  <DialogTitle>Ajustar Stock</DialogTitle>
                  <DialogDescription>
                    {selectedItem && (
                      <>Producto: {selectedItem.productoId} - Stock actual: {selectedItem.cantidad}</>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tipo">Tipo de Movimiento</Label>
                    <select
                      id="tipo"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={ajusteData.tipo}
                      onChange={(e) =>
                        setAjusteData({
                          ...ajusteData,
                          tipo: e.target.value as TipoMovimientoInventario,
                        })
                      }
                    >
                      {Object.values(TipoMovimientoInventario).map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ajuste-cantidad">Cantidad</Label>
                    <Input
                      id="ajuste-cantidad"
                      type="number"
                      min="0"
                      value={ajusteData.cantidad}
                      onChange={(e) =>
                        setAjusteData({
                          ...ajusteData,
                          cantidad: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="motivo">Motivo</Label>
                    <Input
                      id="motivo"
                      value={ajusteData.motivo}
                      onChange={(e) =>
                        setAjusteData({ ...ajusteData, motivo: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAjusteDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Ajustar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
