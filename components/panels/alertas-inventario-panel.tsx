"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw, CheckCircle2, Package, Clock } from "lucide-react";
import { AlertaInventario } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function AlertasInventarioPanel() {
  const { toast } = useToast();
  const [alertas, setAlertas] = useState<AlertaInventario[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarAlertas = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/alertas-inventario?accion=verificar");
      if (response.ok) {
        const data = await response.json();
        setAlertas(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error al cargar alertas:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las alertas",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAlertas();
    // Actualizar cada 60 segundos
    const interval = setInterval(cargarAlertas, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const marcarComoLeida = async (alertaId: string) => {
    try {
      const response = await fetch("/api/alertas-inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertaId, accion: "marcar-leida" }),
      });

      if (response.ok) {
        setAlertas((prev) =>
          prev.map((a) => (a.id === alertaId ? { ...a, leida: true } : a))
        );
        toast({
          title: "Alerta marcada como leída",
        });
      }
    } catch (error) {
      console.error("Error al marcar alerta:", error);
    }
  };

  const alertasNoLeidas = alertas.filter((a) => !a.leida);
  const alertasPorSeveridad = {
    CRITICA: alertasNoLeidas.filter((a) => a.severidad === "CRITICA"),
    ALTA: alertasNoLeidas.filter((a) => a.severidad === "ALTA"),
    MEDIA: alertasNoLeidas.filter((a) => a.severidad === "MEDIA"),
    BAJA: alertasNoLeidas.filter((a) => a.severidad === "BAJA"),
  };

  const getSeveridadColor = (severidad: string) => {
    switch (severidad) {
      case "CRITICA":
        return "bg-red-600 text-white";
      case "ALTA":
        return "bg-orange-500 text-white";
      case "MEDIA":
        return "bg-yellow-500 text-white";
      case "BAJA":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "SIN_STOCK":
        return <Package className="h-4 w-4" />;
      case "PROXIMO_VENCIMIENTO":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alertas de Inventario
            </CardTitle>
            <CardDescription>
              {alertasNoLeidas.length} alerta{alertasNoLeidas.length !== 1 ? "s" : ""} activa{alertasNoLeidas.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={cargarAlertas}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {alertasNoLeidas.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No hay alertas activas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Alertas Críticas */}
            {alertasPorSeveridad.CRITICA.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-600 mb-2">
                  Críticas ({alertasPorSeveridad.CRITICA.length})
                </h4>
                <div className="space-y-2">
                  {alertasPorSeveridad.CRITICA.map((alerta) => (
                    <div
                      key={alerta.id}
                      className="p-3 rounded-lg border-2 border-red-200 bg-red-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getTipoIcon(alerta.tipo)}
                            <Badge className={getSeveridadColor(alerta.severidad)}>
                              {alerta.severidad}
                            </Badge>
                            <Badge variant="outline">{alerta.tipo}</Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {alerta.inventarioItem?.producto?.nombre || "Producto desconocido"}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{alerta.mensaje}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(alerta.fecha), "dd/MM/yyyy HH:mm", {
                              locale: es,
                            })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => marcarComoLeida(alerta.id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alertas Altas */}
            {alertasPorSeveridad.ALTA.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-orange-600 mb-2">
                  Altas ({alertasPorSeveridad.ALTA.length})
                </h4>
                <div className="space-y-2">
                  {alertasPorSeveridad.ALTA.map((alerta) => (
                    <div
                      key={alerta.id}
                      className="p-3 rounded-lg border border-orange-200 bg-orange-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getTipoIcon(alerta.tipo)}
                            <Badge className={getSeveridadColor(alerta.severidad)}>
                              {alerta.severidad}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {alerta.inventarioItem?.producto?.nombre || "Producto desconocido"}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{alerta.mensaje}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => marcarComoLeida(alerta.id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alertas Medias y Bajas */}
            {(alertasPorSeveridad.MEDIA.length > 0 ||
              alertasPorSeveridad.BAJA.length > 0) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">
                  Otras ({alertasPorSeveridad.MEDIA.length + alertasPorSeveridad.BAJA.length})
                </h4>
                <div className="space-y-2">
                  {[...alertasPorSeveridad.MEDIA, ...alertasPorSeveridad.BAJA].map(
                    (alerta) => (
                      <div
                        key={alerta.id}
                        className="p-3 rounded-lg border border-gray-200 bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getTipoIcon(alerta.tipo)}
                              <Badge className={getSeveridadColor(alerta.severidad)}>
                                {alerta.severidad}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {alerta.inventarioItem?.producto?.nombre || "Producto desconocido"}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">{alerta.mensaje}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => marcarComoLeida(alerta.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

