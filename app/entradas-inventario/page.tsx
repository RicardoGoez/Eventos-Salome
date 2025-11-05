"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package } from "lucide-react";
import { EntradaInventario } from "@/types/domain";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function EntradasInventarioPage() {
  const { toast } = useToast();
  const [entradas, setEntradas] = useState<EntradaInventario[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inventarioItems, setInventarioItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    inventarioItemId: "",
    proveedorId: "",
    cantidad: 0,
    precioCompra: 0,
    fecha: new Date().toISOString().split("T")[0],
    numeroFactura: "",
    notas: "",
  });

  useEffect(() => {
    loadEntradas();
    loadInventarioItems();
    loadProveedores();
  }, []);

  const loadEntradas = async () => {
    try {
      const response = await fetch("/api/entradas-inventario");
      const data = await response.json();
      setEntradas(data);
    } catch (error) {
      console.error("Error al cargar entradas:", error);
    }
  };

  const loadInventarioItems = async () => {
    try {
      const [inventarioRes, productosRes] = await Promise.all([
        fetch("/api/inventario"),
        fetch("/api/productos"),
      ]);
      const inventario = await inventarioRes.json();
      const productos = await productosRes.json();
      setInventarioItems(inventario);
      setProductos(productos);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
    }
  };

  const loadProveedores = async () => {
    try {
      const response = await fetch("/api/proveedores");
      const data = await response.json();
      setProveedores(data.filter((p: any) => p.activo));
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const usuarioStorage = localStorage.getItem("usuario");
      if (!usuarioStorage) {
        toast({
          variant: "warning",
          title: "Sesión requerida",
          description: "Debes iniciar sesión para continuar",
        });
        return;
      }
      const usuario = JSON.parse(usuarioStorage);

      const response = await fetch("/api/entradas-inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          fecha: new Date(formData.fecha).toISOString(),
          usuarioId: usuario.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Error al crear entrada",
        });
        return;
      }

      toast({
        variant: "success",
        title: "Éxito",
        description: "Entrada de inventario registrada correctamente",
      });

      setIsDialogOpen(false);
      setFormData({
        inventarioItemId: "",
        proveedorId: "",
        cantidad: 0,
        precioCompra: 0,
        fecha: new Date().toISOString().split("T")[0],
        numeroFactura: "",
        notas: "",
      });
      loadEntradas();
    } catch (error) {
      console.error("Error al guardar entrada:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al guardar entrada",
      });
    } finally {
      setLoading(false);
    }
  };

  const inventarioItem = inventarioItems.find((i) => i.id === formData.inventarioItemId);
  const proveedor = proveedores.find((p) => p.id === formData.proveedorId);
  const totalCosto = formData.cantidad * formData.precioCompra;

  return (
    <div className="flex min-h-screen lg:h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-light p-4 lg:p-8 lg:ml-0">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-dark">Entradas de Inventario</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Entrada
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Nueva Entrada de Inventario</DialogTitle>
                    <DialogDescription>
                      Registra una nueva entrada de inventario con proveedor
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="inventarioItemId">Item de Inventario *</Label>
                      <Select
                        value={formData.inventarioItemId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, inventarioItemId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar item de inventario" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventarioItems.map((item) => {
                            const producto = productos.find((p) => p.id === item.productoId);
                            return (
                              <SelectItem key={item.id} value={item.id}>
                                {producto?.nombre || item.productoId} - Stock: {item.cantidad} {item.unidad}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="proveedorId">Proveedor *</Label>
                      <Select
                        value={formData.proveedorId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, proveedorId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {proveedores.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nombre} - {p.telefono}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="cantidad">Cantidad *</Label>
                        <Input
                          id="cantidad"
                          type="number"
                          min="1"
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
                        <Label htmlFor="precioCompra">Precio de Compra *</Label>
                        <Input
                          id="precioCompra"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.precioCompra}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              precioCompra: parseFloat(e.target.value) || 0,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="numeroFactura">Número de Factura (Opcional)</Label>
                      <Input
                        id="numeroFactura"
                        value={formData.numeroFactura}
                        onChange={(e) =>
                          setFormData({ ...formData, numeroFactura: e.target.value })
                        }
                      />
                    </div>

                    {formData.cantidad > 0 && formData.precioCompra > 0 && (
                      <div className="rounded-lg bg-primary/10 p-3">
                        <p className="text-sm font-medium text-primary">
                          Total: ${totalCosto.toFixed(2)}
                        </p>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="fecha">Fecha *</Label>
                      <Input
                        id="fecha"
                        type="date"
                        value={formData.fecha}
                        onChange={(e) =>
                          setFormData({ ...formData, fecha: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="notas">Notas (Opcional)</Label>
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
                    <Button
                      type="submit"
                      disabled={
                        !formData.inventarioItemId ||
                        !formData.proveedorId ||
                        formData.cantidad <= 0 ||
                        formData.precioCompra <= 0
                      }
                    >
                      Registrar Entrada
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Entradas</CardTitle>
              <CardDescription>
                Registro de todas las entradas de inventario con proveedores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Item Inventario</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Compra</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Factura</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No hay entradas registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    entradas
                      .sort(
                        (a, b) =>
                          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
                      )
                      .map((entrada) => {
                        const inventarioItem = inventarioItems.find((i) => i.id === entrada.inventarioItemId);
                        const producto = inventarioItem ? productos.find((p) => p.id === inventarioItem.productoId) : null;
                        const proveedor = proveedores.find((p) => p.id === entrada.proveedorId);
                        const total = entrada.cantidad * entrada.precioCompra;

                        return (
                          <TableRow key={entrada.id}>
                            <TableCell>
                              {format(new Date(entrada.fecha), "dd/MM/yyyy", { locale: es })}
                            </TableCell>
                            <TableCell className="font-medium">
                              {producto?.nombre || inventarioItem?.productoId || entrada.inventarioItemId}
                            </TableCell>
                            <TableCell>{proveedor?.nombre || entrada.proveedorId}</TableCell>
                            <TableCell>{entrada.cantidad}</TableCell>
                            <TableCell>${entrada.precioCompra.toFixed(2)}</TableCell>
                            <TableCell className="font-semibold">
                              ${total.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {entrada.numeroFactura || "-"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {entrada.notas || "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

