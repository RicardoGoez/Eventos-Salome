"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter, Search } from "lucide-react";
import { ActividadAuditoria } from "@/types/domain";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AuditoriaPage() {
  const [actividades, setActividades] = useState<ActividadAuditoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    accion: "",
    entidad: "",
    fechaInicio: "",
    fechaFin: "",
  });

  useEffect(() => {
    loadActividades();
  }, []);

  const loadActividades = async () => {
    setLoading(true);
    try {
      // Obtener todas las actividades usando filtro de fecha (últimos 30 días)
      const fechaFin = new Date();
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - 30);

      const params = new URLSearchParams({
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
      });

      const response = await fetch(`/api/auditoria?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setActividades(data);
      }
    } catch (error) {
      console.error("Error al cargar actividades:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (filtros.accion) {
        params.append("accion", filtros.accion);
      } else if (filtros.fechaInicio && filtros.fechaFin) {
        params.append("fechaInicio", filtros.fechaInicio);
        params.append("fechaFin", filtros.fechaFin);
      } else {
        // Por defecto, últimos 30 días
        const fechaFin = new Date();
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - 30);
        params.append("fechaInicio", fechaInicio.toISOString());
        params.append("fechaFin", fechaFin.toISOString());
      }

      const response = await fetch(`/api/auditoria?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setActividades(data);
      }
    } catch (error) {
      console.error("Error al filtrar actividades:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["Fecha", "Usuario", "Acción", "Entidad", "Entidad ID", "Detalles"],
      ...actividades.map((act) => [
        format(new Date(act.fecha), "dd/MM/yyyy HH:mm:ss", { locale: es }),
        act.usuarioId,
        act.accion,
        act.entidad || "",
        act.entidadId || "",
        JSON.stringify(act.detalles || {}),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `auditoria_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAccionColor = (accion: string) => {
    if (accion.includes("CREAR") || accion.includes("CREATE")) {
      return "bg-success/20 text-success";
    }
    if (accion.includes("ACTUALIZAR") || accion.includes("UPDATE")) {
      return "bg-info/20 text-info";
    }
    if (accion.includes("ELIMINAR") || accion.includes("DELETE")) {
      return "bg-danger/20 text-danger";
    }
    return "bg-gray-medium/20 text-gray-medium";
  };

  return (
    <div className="flex min-h-screen lg:h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-light p-4 lg:p-8 lg:ml-0">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-dark">Historial de Auditoría</h1>
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Filtra las actividades de auditoría</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="grid gap-2">
                  <Label htmlFor="accion">Acción</Label>
                  <Select
                    value={filtros.accion || "all"}
                    onValueChange={(value) =>
                      setFiltros({ ...filtros, accion: value === "all" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las acciones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las acciones</SelectItem>
                      <SelectItem value="CREAR">Crear</SelectItem>
                      <SelectItem value="ACTUALIZAR">Actualizar</SelectItem>
                      <SelectItem value="ELIMINAR">Eliminar</SelectItem>
                      <SelectItem value="LOGIN">Login</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={filtros.fechaInicio}
                    onChange={(e) =>
                      setFiltros({ ...filtros, fechaInicio: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fechaFin">Fecha Fin</Label>
                  <Input
                    id="fechaFin"
                    type="date"
                    value={filtros.fechaFin}
                    onChange={(e) =>
                      setFiltros({ ...filtros, fechaFin: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleFilter} className="w-full">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtrar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividades Registradas</CardTitle>
              <CardDescription>
                Historial completo de actividades del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Cargando actividades...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Entidad</TableHead>
                      <TableHead>Detalles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actividades.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No hay actividades registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      actividades
                        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                        .map((actividad) => (
                          <TableRow key={actividad.id}>
                            <TableCell>
                              {format(new Date(actividad.fecha), "dd/MM/yyyy HH:mm:ss", {
                                locale: es,
                              })}
                            </TableCell>
                            <TableCell className="font-medium">
                              {actividad.usuarioId}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getAccionColor(
                                  actividad.accion
                                )}`}
                              >
                                {actividad.accion}
                              </span>
                            </TableCell>
                            <TableCell>
                              {actividad.entidad || "-"}
                              {actividad.entidadId && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({actividad.entidadId.slice(0, 8)}...)
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <pre className="text-xs text-muted-foreground max-w-xs truncate">
                                {JSON.stringify(actividad.detalles || {}, null, 2)}
                              </pre>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

