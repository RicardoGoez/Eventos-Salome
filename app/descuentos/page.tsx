"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { Descuento, TipoDescuento } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";

export default function DescuentosPage() {
  const { toast } = useToast();
  const [descuentos, setDescuentos] = useState<Descuento[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDescuento, setEditingDescuento] = useState<Descuento | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    tipo: TipoDescuento.PORCENTAJE,
    valor: 0,
    activo: true,
    fechaInicio: "",
    fechaFin: "",
    cantidadMinima: 0,
  });

  useEffect(() => {
    loadDescuentos();
  }, []);

  const loadDescuentos = async () => {
    try {
      const response = await fetch("/api/descuentos");
      const data = await response.json();
      setDescuentos(data);
    } catch (error) {
      console.error("Error al cargar descuentos:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const datos = {
        ...formData,
        fechaInicio: formData.fechaInicio ? new Date(formData.fechaInicio).toISOString() : undefined,
        fechaFin: formData.fechaFin ? new Date(formData.fechaFin).toISOString() : undefined,
        cantidadMinima: formData.cantidadMinima > 0 ? formData.cantidadMinima : undefined,
      };

      if (editingDescuento) {
        await fetch(`/api/descuentos/${editingDescuento.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos),
        });
      } else {
        await fetch("/api/descuentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos),
        });
      }
      setIsDialogOpen(false);
      setEditingDescuento(null);
      setFormData({
        nombre: "",
        descripcion: "",
        tipo: TipoDescuento.PORCENTAJE,
        valor: 0,
        activo: true,
        fechaInicio: "",
        fechaFin: "",
        cantidadMinima: 0,
      });
      loadDescuentos();
    } catch (error) {
      console.error("Error al guardar descuento:", error);
    }
  };

  const handleEdit = (descuento: Descuento) => {
    setEditingDescuento(descuento);
    setFormData({
      nombre: descuento.nombre,
      descripcion: descuento.descripcion || "",
      tipo: descuento.tipo,
      valor: descuento.valor,
      activo: descuento.activo,
      fechaInicio: descuento.fechaInicio
        ? new Date(descuento.fechaInicio).toISOString().split("T")[0]
        : "",
      fechaFin: descuento.fechaFin
        ? new Date(descuento.fechaFin).toISOString().split("T")[0]
        : "",
      cantidadMinima: descuento.cantidadMinima || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/descuentos/${id}`, { method: "DELETE" });
      const data = await response.json();
      
      if (!response.ok && response.status !== 200) {
        // Error real (no soft delete)
        return;
      }

      // Éxito (puede ser eliminación física o soft delete)
      if (data.softDeleted || data.message?.includes("marcado como inactivo")) {
        toast({
          variant: "default",
          title: "Descuento deshabilitado",
          description: "El descuento fue marcado como inactivo porque está asociado a pedidos existentes. Puedes reactivarlo editando el descuento.",
        });
      } else {
        toast({
          variant: "success",
          title: "Éxito",
          description: data.message || "Descuento eliminado correctamente",
        });
      }
      loadDescuentos();
    } catch (error) {
      console.error("Error al eliminar descuento:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al eliminar descuento",
      });
    }
  };

  return (
    <div className="flex min-h-screen lg:h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-light p-4 lg:p-8 lg:ml-0">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-dark">Descuentos y Promociones</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingDescuento(null);
                  setFormData({
                    nombre: "",
                    descripcion: "",
                    tipo: TipoDescuento.PORCENTAJE,
                    valor: 0,
                    activo: true,
                    fechaInicio: "",
                    fechaFin: "",
                    cantidadMinima: 0,
                  });
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Descuento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingDescuento ? "Editar Descuento" : "Nuevo Descuento"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingDescuento
                        ? "Modifica la información del descuento"
                        : "Crea un nuevo descuento o promoción"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Input
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) =>
                          setFormData({ ...formData, descripcion: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tipo">Tipo de Descuento</Label>
                      <select
                        id="tipo"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={formData.tipo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tipo: e.target.value as TipoDescuento,
                          })
                        }
                      >
                        <option value={TipoDescuento.PORCENTAJE}>Porcentaje (%)</option>
                        <option value={TipoDescuento.VALOR_FIJO}>Valor Fijo ($)</option>
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="valor">
                        Valor{" "}
                        {formData.tipo === TipoDescuento.PORCENTAJE
                          ? "(%)"
                          : "($)"}
                      </Label>
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        min="0"
                        max={formData.tipo === TipoDescuento.PORCENTAJE ? 100 : undefined}
                        value={formData.valor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            valor: parseFloat(e.target.value) || 0,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cantidadMinima">Cantidad Mínima de Items (Opcional)</Label>
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
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="fechaInicio">Fecha de Inicio (Opcional)</Label>
                        <Input
                          id="fechaInicio"
                          type="date"
                          value={formData.fechaInicio}
                          onChange={(e) =>
                            setFormData({ ...formData, fechaInicio: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="fechaFin">Fecha de Fin (Opcional)</Label>
                        <Input
                          id="fechaFin"
                          type="date"
                          value={formData.fechaFin}
                          onChange={(e) =>
                            setFormData({ ...formData, fechaFin: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="activo"
                        checked={formData.activo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            activo: e.target.checked,
                          })
                        }
                        className="h-4 w-4"
                      />
                      <Label htmlFor="activo">Activo</Label>
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

          <Card>
            <CardHeader>
              <CardTitle>Lista de Descuentos</CardTitle>
              <CardDescription>
                Gestiona los descuentos y promociones de Eventos Salome
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Cant. Mín.</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Aplicado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {descuentos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        No hay descuentos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    descuentos.map((descuento) => (
                      <TableRow key={descuento.id}>
                        <TableCell className="font-medium">
                          {descuento.nombre}
                        </TableCell>
                        <TableCell>{descuento.tipo}</TableCell>
                        <TableCell>
                          {descuento.tipo === TipoDescuento.PORCENTAJE
                            ? `${descuento.valor}%`
                            : `$${descuento.valor.toFixed(2)}`}
                        </TableCell>
                        <TableCell>
                          {descuento.cantidadMinima || "-"}
                        </TableCell>
                        <TableCell>
                          {descuento.fechaInicio && descuento.fechaFin
                            ? `${new Date(descuento.fechaInicio).toLocaleDateString()} - ${new Date(descuento.fechaFin).toLocaleDateString()}`
                            : "Sin límite"}
                        </TableCell>
                        <TableCell>{descuento.aplicadoAPedidos || 0} veces</TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              descuento.activo
                                ? "bg-success/20 text-success"
                                : "bg-gray-medium/20 text-gray-medium"
                            }`}
                          >
                            {descuento.activo ? "Activo" : "Inactivo"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(descuento)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Se eliminará permanentemente el descuento "{descuento.nombre}".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(descuento.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
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
