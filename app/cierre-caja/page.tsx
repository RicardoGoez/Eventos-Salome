"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Download, Plus } from "lucide-react";
import { CierreCaja } from "@/types/domain";
import { ReporteGenerator } from "@/lib/utils/reporte-generator";

export default function CierreCajaPage() {
  const [cierres, setCierres] = useState<CierreCaja[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: new Date().toISOString().split("T")[0],
    diferenciaEfectivo: 0,
    notas: "",
  });

  useEffect(() => {
    loadCierres();
  }, []);

  const loadCierres = async () => {
    try {
      const response = await fetch("/api/cierre-caja");
      const data = await response.json();
      setCierres(data);
    } catch (error) {
      console.error("Error al cargar cierres:", error);
    }
  };

  const handleCrearCierre = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const usuarioStorage = localStorage.getItem("usuario");
      if (!usuarioStorage) {
        alert("Debes iniciar sesión");
        return;
      }
      const usuario = JSON.parse(usuarioStorage);

      const response = await fetch("/api/cierre-caja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fechaInicio: formData.fechaInicio,
          fechaFin: formData.fechaFin,
          usuarioId: usuario.id,
          diferenciaEfectivo: formData.diferenciaEfectivo,
          notas: formData.notas,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Error al crear cierre");
        return;
      }

      setIsDialogOpen(false);
      setFormData({
        fechaInicio: new Date().toISOString().split("T")[0],
        fechaFin: new Date().toISOString().split("T")[0],
        diferenciaEfectivo: 0,
        notas: "",
      });
      loadCierres();
    } catch (error) {
      console.error("Error al crear cierre:", error);
    }
  };

  const handleCerrarCaja = async (cierreId: string) => {
    try {
      const diferenciaEfectivo = prompt("Ingresa la diferencia de efectivo (si hay):");
      const notas = prompt("Notas adicionales (opcional):");

      await fetch(`/api/cierre-caja/${cierreId}/cerrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diferenciaEfectivo: diferenciaEfectivo ? parseFloat(diferenciaEfectivo) : undefined,
          notas: notas || undefined,
        }),
      });

      loadCierres();
    } catch (error) {
      console.error("Error al cerrar caja:", error);
    }
  };

  const handleDescargarPDF = async (cierre: CierreCaja) => {
    try {
      const pdfUrl = ReporteGenerator.generarReporteCierreCajaPDF(cierre);
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `cierre-caja-${new Date(cierre.fecha).toISOString().split("T")[0]}.pdf`;
      link.click();
    } catch (error) {
      console.error("Error al generar PDF:", error);
    }
  };

  return (
    <div className="flex min-h-screen lg:h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-light p-4 lg:p-8 lg:ml-0">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-dark">Cierre de Caja</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setFormData({
                    fechaInicio: new Date().toISOString().split("T")[0],
                    fechaFin: new Date().toISOString().split("T")[0],
                    diferenciaEfectivo: 0,
                    notas: "",
                  });
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Cierre
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCrearCierre}>
                  <DialogHeader>
                    <DialogTitle>Nuevo Cierre de Caja</DialogTitle>
                    <DialogDescription>
                      Calcula el cierre de caja para un período
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                      <Input
                        id="fechaInicio"
                        type="date"
                        value={formData.fechaInicio}
                        onChange={(e) =>
                          setFormData({ ...formData, fechaInicio: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="fechaFin">Fecha de Fin</Label>
                      <Input
                        id="fechaFin"
                        type="date"
                        value={formData.fechaFin}
                        onChange={(e) =>
                          setFormData({ ...formData, fechaFin: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="diferenciaEfectivo">Diferencia de Efectivo (Opcional)</Label>
                      <Input
                        id="diferenciaEfectivo"
                        type="number"
                        step="0.01"
                        value={formData.diferenciaEfectivo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            diferenciaEfectivo: parseFloat(e.target.value) || 0,
                          })
                        }
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
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">Crear Cierre</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Cierres de Caja</CardTitle>
              <CardDescription>
                Registro de cierres de caja de Eventos Salome
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Total Ventas</TableHead>
                    <TableHead>Efectivo</TableHead>
                    <TableHead>Tarjeta</TableHead>
                    <TableHead>Transferencia</TableHead>
                    <TableHead>Pedidos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cierres.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        No hay cierres de caja registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    cierres.map((cierre) => (
                      <TableRow key={cierre.id}>
                        <TableCell className="font-medium">
                          {new Date(cierre.fecha).toLocaleDateString()}
                        </TableCell>
                        <TableCell>${cierre.totalVentas.toFixed(2)}</TableCell>
                        <TableCell>${cierre.totalEfectivo.toFixed(2)}</TableCell>
                        <TableCell>${cierre.totalTarjeta.toFixed(2)}</TableCell>
                        <TableCell>${cierre.totalTransferencia.toFixed(2)}</TableCell>
                        <TableCell>{cierre.numeroPedidos}</TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              cierre.cerrado
                                ? "bg-success/20 text-success"
                                : "bg-warning/20 text-warning"
                            }`}
                          >
                            {cierre.cerrado ? "Cerrado" : "Abierto"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!cierre.cerrado && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCerrarCaja(cierre.id)}
                              >
                                Cerrar
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDescargarPDF(cierre)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              PDF
                            </Button>
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
