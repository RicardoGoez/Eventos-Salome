"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, TrendingUp } from "lucide-react";
import { ClasificacionABC } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AnalisisABCPanel() {
  const { toast } = useToast();
  const [clasificaciones, setClasificaciones] = useState<ClasificacionABC[]>([]);
  const [reporte, setReporte] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(
    format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd")
  );
  const [fechaFin, setFechaFin] = useState(format(new Date(), "yyyy-MM-dd"));

  const cargarAnalisis = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analisis-abc?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.clasificaciones) {
          setClasificaciones(data.clasificaciones);
          setReporte(data);
        } else {
          setClasificaciones(Array.isArray(data) ? data : []);
        }
      }
    } catch (error) {
      console.error("Error al cargar análisis:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el análisis ABC",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAnalisis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoriaA = clasificaciones.filter((c) => c.categoria === "A");
  const categoriaB = clasificaciones.filter((c) => c.categoria === "B");
  const categoriaC = clasificaciones.filter((c) => c.categoria === "C");

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case "A":
        return "bg-green-600 text-white";
      case "B":
        return "bg-yellow-500 text-white";
      case "C":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const exportarReporte = () => {
    const datos = clasificaciones.map((c) => ({
      Producto: c.producto?.nombre || "Desconocido",
      Categoría: c.categoria,
      "Valor Rotación": c.valorRotacion,
      "Cantidad Vendida": c.cantidadVendida,
      Ingresos: c.ingresos,
      "% Acumulado": c.porcentajeAcumulado.toFixed(2),
    }));

    const csv = [
      Object.keys(datos[0] || {}).join(","),
      ...datos.map((d) => Object.values(d).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analisis-abc-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Análisis ABC de Inventario
            </CardTitle>
            <CardDescription>
              Clasificación Pareto 80/20 de productos por valor de rotación
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportarReporte}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fechaInicio">Fecha Inicio</Label>
            <Input
              id="fechaInicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fechaFin">Fecha Fin</Label>
            <Input
              id="fechaFin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={cargarAnalisis} disabled={loading} className="mb-4">
          {loading ? "Cargando..." : "Actualizar Análisis"}
        </Button>

        {reporte && (
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Categoría A</span>
                <Badge className={getCategoriaColor("A")}>A</Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900">{reporte.categoriaA}</div>
              <div className="text-xs text-gray-600">
                ${reporte.valorTotalA?.toFixed(2) || "0.00"}
              </div>
              <div className="text-xs text-gray-500 mt-1">80% del valor</div>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Categoría B</span>
                <Badge className={getCategoriaColor("B")}>B</Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900">{reporte.categoriaB}</div>
              <div className="text-xs text-gray-600">
                ${reporte.valorTotalB?.toFixed(2) || "0.00"}
              </div>
              <div className="text-xs text-gray-500 mt-1">15% del valor</div>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Categoría C</span>
                <Badge className={getCategoriaColor("C")}>C</Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900">{reporte.categoriaC}</div>
              <div className="text-xs text-gray-600">
                ${reporte.valorTotalC?.toFixed(2) || "0.00"}
              </div>
              <div className="text-xs text-gray-500 mt-1">5% del valor</div>
            </div>
          </div>
        )}

        {clasificaciones.length > 0 ? (
          <div className="space-y-4">
            {/* Categoría A */}
            {categoriaA.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Categoría A - Alta Rotación ({categoriaA.length} productos)
                </h4>
                <div className="space-y-2">
                  {categoriaA.slice(0, 10).map((item) => (
                    <div
                      key={item.productoId}
                      className="p-3 rounded-lg border border-green-200 bg-green-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.producto?.nombre || "Producto desconocido"}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                            <span>Valor: ${item.valorRotacion.toFixed(2)}</span>
                            <span>Cantidad: {item.cantidadVendida}</span>
                            <span>% Acum: {item.porcentajeAcumulado.toFixed(1)}%</span>
                          </div>
                        </div>
                        <Badge className={getCategoriaColor(item.categoria)}>
                          {item.categoria}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categoría B */}
            {categoriaB.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-yellow-700 mb-2">
                  Categoría B - Rotación Media ({categoriaB.length} productos)
                </h4>
                <div className="space-y-2">
                  {categoriaB.slice(0, 5).map((item) => (
                    <div
                      key={item.productoId}
                      className="p-3 rounded-lg border border-yellow-200 bg-yellow-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.producto?.nombre || "Producto desconocido"}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                            <span>Valor: ${item.valorRotacion.toFixed(2)}</span>
                            <span>% Acum: {item.porcentajeAcumulado.toFixed(1)}%</span>
                          </div>
                        </div>
                        <Badge className={getCategoriaColor(item.categoria)}>
                          {item.categoria}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categoría C */}
            {categoriaC.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-blue-700 mb-2">
                  Categoría C - Baja Rotación ({categoriaC.length} productos)
                </h4>
                <div className="space-y-2">
                  {categoriaC.slice(0, 5).map((item) => (
                    <div
                      key={item.productoId}
                      className="p-3 rounded-lg border border-blue-200 bg-blue-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.producto?.nombre || "Producto desconocido"}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                            <span>Valor: ${item.valorRotacion.toFixed(2)}</span>
                            <span>% Acum: {item.porcentajeAcumulado.toFixed(1)}%</span>
                          </div>
                        </div>
                        <Badge className={getCategoriaColor(item.categoria)}>
                          {item.categoria}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {loading ? "Cargando análisis..." : "No hay datos para el período seleccionado"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

