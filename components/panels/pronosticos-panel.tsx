"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, RefreshCw, BarChart3 } from "lucide-react";
import { PronosticoDemanda } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PronosticosPanel() {
  const { toast } = useToast();
  const [pronosticos, setPronosticos] = useState<PronosticoDemanda[]>([]);
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState("30");
  const [diasFuturo, setDiasFuturo] = useState("7");

  const cargarPronosticos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/pronostico-demanda?periodo=${periodo}&dias=${diasFuturo}`
      );
      if (response.ok) {
        const data = await response.json();
        setPronosticos(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error al cargar pronósticos:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los pronósticos",
      });
    } finally {
      setLoading(false);
    }
  }, [periodo, diasFuturo, toast]);

  useEffect(() => {
    cargarPronosticos();
  }, [cargarPronosticos]);

  const getConfianzaColor = (confianza: number) => {
    if (confianza >= 0.8) return "bg-green-500";
    if (confianza >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfianzaLabel = (confianza: number) => {
    if (confianza >= 0.8) return "Alta";
    if (confianza >= 0.6) return "Media";
    return "Baja";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Pronósticos de Demanda
            </CardTitle>
            <CardDescription>
              Predicción de demanda usando suavizado exponencial triple
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={cargarPronosticos}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Período Histórico (días)
            </label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 días</SelectItem>
                <SelectItem value="15">15 días</SelectItem>
                <SelectItem value="30">30 días</SelectItem>
                <SelectItem value="60">60 días</SelectItem>
                <SelectItem value="90">90 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Pronóstico (días futuros)
            </label>
            <Select value={diasFuturo} onValueChange={setDiasFuturo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 día</SelectItem>
                <SelectItem value="7">7 días</SelectItem>
                <SelectItem value="14">14 días</SelectItem>
                <SelectItem value="30">30 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {pronosticos.length > 0 ? (
          <div className="space-y-4">
            {pronosticos
              .sort((a, b) => b.demandaPronosticada - a.demandaPronosticada)
              .slice(0, 20)
              .map((pronostico) => (
                <div
                  key={pronostico.productoId}
                  className="p-4 rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <h4 className="font-medium text-gray-900">
                          {pronostico.producto?.nombre || "Producto desconocido"}
                        </h4>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-600">Demanda Pronosticada</p>
                          <p className="text-lg font-bold text-gray-900">
                            {pronostico.demandaPronosticada.toFixed(0)} unidades
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Nivel de Confianza</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getConfianzaColor(
                                  pronostico.nivelConfianza
                                )}`}
                                style={{
                                  width: `${pronostico.nivelConfianza * 100}%`,
                                }}
                              />
                            </div>
                            <Badge
                              className={`${getConfianzaColor(
                                pronostico.nivelConfianza
                              )} text-white`}
                            >
                              {getConfianzaLabel(pronostico.nivelConfianza)}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Método</p>
                          <p className="text-sm font-medium text-gray-700">
                            {pronostico.metodo.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {loading ? "Cargando pronósticos..." : "No hay pronósticos disponibles"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

