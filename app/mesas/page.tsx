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
import { Plus, Edit, Trash2, Square, CheckCircle2, XCircle } from "lucide-react";
import { Mesa } from "@/types/domain";

export default function MesasPage() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);
  const [formData, setFormData] = useState({
    numero: 0,
    capacidad: 0,
    disponible: true,
    notas: "",
  });

  useEffect(() => {
    loadMesas();
  }, []);

  const loadMesas = async () => {
    try {
      const response = await fetch("/api/mesas");
      const data = await response.json();
      setMesas(data);
    } catch (error) {
      console.error("Error al cargar mesas:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMesa) {
        await fetch(`/api/mesas/${editingMesa.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch("/api/mesas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setIsDialogOpen(false);
      setEditingMesa(null);
      setFormData({
        numero: 0,
        capacidad: 0,
        disponible: true,
        notas: "",
      });
      loadMesas();
    } catch (error) {
      console.error("Error al guardar mesa:", error);
    }
  };

  const handleEdit = (mesa: Mesa) => {
    setEditingMesa(mesa);
    setFormData({
      numero: mesa.numero,
      capacidad: mesa.capacidad,
      disponible: mesa.disponible,
      notas: mesa.notas || "",
    });
    setIsDialogOpen(true);
  };

  const handleToggleDisponible = async (mesa: Mesa) => {
    try {
      await fetch(`/api/mesas/${mesa.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: mesa.disponible ? "ocupar" : "liberar",
        }),
      });
      loadMesas();
    } catch (error) {
      console.error("Error al cambiar estado de mesa:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/mesas/${id}`, { method: "DELETE" });
      loadMesas();
    } catch (error) {
      console.error("Error al eliminar mesa:", error);
    }
  };

  return (
    <div className="flex min-h-screen lg:h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-light p-4 lg:p-8 lg:ml-0">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-dark">Mesas</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingMesa(null);
                  setFormData({
                    numero: 0,
                    capacidad: 0,
                    disponible: true,
                    notas: "",
                  });
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Mesa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingMesa ? "Editar Mesa" : "Nueva Mesa"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingMesa
                        ? "Modifica la información de la mesa"
                        : "Completa la información de la nueva mesa"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="numero">Número de Mesa</Label>
                      <Input
                        id="numero"
                        type="number"
                        min="1"
                        value={formData.numero}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            numero: parseInt(e.target.value) || 0,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="capacidad">Capacidad</Label>
                      <Input
                        id="capacidad"
                        type="number"
                        min="1"
                        value={formData.capacidad}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            capacidad: parseInt(e.target.value) || 0,
                          })
                        }
                        required
                      />
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
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="disponible"
                        checked={formData.disponible}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            disponible: e.target.checked,
                          })
                        }
                        className="h-4 w-4"
                      />
                      <Label htmlFor="disponible">Disponible</Label>
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
              <CardTitle>Lista de Mesas</CardTitle>
              <CardDescription>
                Gestiona las mesas de Eventos Salome
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Capacidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mesas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No hay mesas registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    mesas.map((mesa) => (
                      <TableRow key={mesa.id}>
                        <TableCell className="font-medium">
                          Mesa {mesa.numero}
                        </TableCell>
                        <TableCell>{mesa.capacidad} personas</TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              mesa.disponible
                                ? "bg-success/20 text-success"
                                : "bg-danger/20 text-danger"
                            }`}
                          >
                            {mesa.disponible ? "Disponible" : "Ocupada"}
                          </span>
                        </TableCell>
                        <TableCell>{mesa.notas || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleDisponible(mesa)}
                            >
                              {mesa.disponible ? (
                                <>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Ocupar
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Liberar
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(mesa)}
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
                                    Esta acción no se puede deshacer. Se eliminará permanentemente la Mesa {mesa.numero}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(mesa.id)}
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
