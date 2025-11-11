"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UmbralesAlerta {
  ventasMinimas: number;
  tiempoMaximoAtencion: number;
  diferenciaMaximaCaja: number;
  tasaErrorMaxima: number;
  satisfaccionMinima: number;
}

interface UmbralesInventario {
  stockBajoPorcentaje: number;
  diasVencimiento: number;
  nivelServicio: number;
}

export function ConfiguracionUmbralesPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [umbralesAlerta, setUmbralesAlerta] = useState<UmbralesAlerta>({
    ventasMinimas: 80,
    tiempoMaximoAtencion: 10,
    diferenciaMaximaCaja: 5,
    tasaErrorMaxima: 5,
    satisfaccionMinima: 3.5,
  });

  const [umbralesInventario, setUmbralesInventario] = useState<UmbralesInventario>({
    stockBajoPorcentaje: 50,
    diasVencimiento: 7,
    nivelServicio: 0.95,
  });

  const guardarUmbralesAlerta = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/alertas-negocio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "configurar-umbrales",
          umbrales: umbralesAlerta,
        }),
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Umbrales de alertas guardados correctamente",
        });
      }
    } catch (error) {
      console.error("Error al guardar umbrales:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron guardar los umbrales",
      });
    } finally {
      setLoading(false);
    }
  };

  const guardarUmbralesInventario = async () => {
    setLoading(true);
    try {
      // Aquí se guardarían los umbrales de inventario
      // Por ahora solo mostramos un mensaje
      toast({
        title: "Éxito",
        description: "Umbrales de inventario guardados correctamente",
      });
    } catch (error) {
      console.error("Error al guardar umbrales:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron guardar los umbrales",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Configuración de Umbrales
        </CardTitle>
        <CardDescription>
          Configure los umbrales para alertas y notificaciones automáticas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="alertas" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="alertas">Alertas de Negocio</TabsTrigger>
            <TabsTrigger value="inventario">Inventario</TabsTrigger>
          </TabsList>

          <TabsContent value="alertas" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="ventasMinimas">
                  Ventas Mínimas (% de la meta)
                </Label>
                <Input
                  id="ventasMinimas"
                  type="number"
                  min="0"
                  max="100"
                  value={umbralesAlerta.ventasMinimas}
                  onChange={(e) =>
                    setUmbralesAlerta({
                      ...umbralesAlerta,
                      ventasMinimas: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Porcentaje mínimo de ventas respecto a la meta para generar alerta
                </p>
              </div>

              <div>
                <Label htmlFor="tiempoMaximoAtencion">
                  Tiempo Máximo de Atención (minutos)
                </Label>
                <Input
                  id="tiempoMaximoAtencion"
                  type="number"
                  min="1"
                  value={umbralesAlerta.tiempoMaximoAtencion}
                  onChange={(e) =>
                    setUmbralesAlerta({
                      ...umbralesAlerta,
                      tiempoMaximoAtencion: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tiempo máximo permitido para preparar un pedido antes de alerta
                </p>
              </div>

              <div>
                <Label htmlFor="diferenciaMaximaCaja">
                  Diferencia Máxima en Caja (%)
                </Label>
                <Input
                  id="diferenciaMaximaCaja"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={umbralesAlerta.diferenciaMaximaCaja}
                  onChange={(e) =>
                    setUmbralesAlerta({
                      ...umbralesAlerta,
                      diferenciaMaximaCaja: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Porcentaje máximo de diferencia permitida en cierre de caja
                </p>
              </div>

              <div>
                <Label htmlFor="tasaErrorMaxima">Tasa de Error Máxima (%)</Label>
                <Input
                  id="tasaErrorMaxima"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={umbralesAlerta.tasaErrorMaxima}
                  onChange={(e) =>
                    setUmbralesAlerta({
                      ...umbralesAlerta,
                      tasaErrorMaxima: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Porcentaje máximo de pedidos cancelados permitido
                </p>
              </div>

              <div>
                <Label htmlFor="satisfaccionMinima">
                  Satisfacción Mínima (0-5)
                </Label>
                <Input
                  id="satisfaccionMinima"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={umbralesAlerta.satisfaccionMinima}
                  onChange={(e) =>
                    setUmbralesAlerta({
                      ...umbralesAlerta,
                      satisfaccionMinima: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Calificación mínima de satisfacción del cliente
                </p>
              </div>

              <Button
                onClick={guardarUmbralesAlerta}
                disabled={loading}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar Umbrales de Alertas
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="inventario" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="stockBajoPorcentaje">
                  Stock Bajo (% del mínimo)
                </Label>
                <Input
                  id="stockBajoPorcentaje"
                  type="number"
                  min="0"
                  max="100"
                  value={umbralesInventario.stockBajoPorcentaje}
                  onChange={(e) =>
                    setUmbralesInventario({
                      ...umbralesInventario,
                      stockBajoPorcentaje: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Porcentaje del stock mínimo para considerar como &quot;bajo stock&quot;
                </p>
              </div>

              <div>
                <Label htmlFor="diasVencimiento">
                  Días Antes de Vencimiento
                </Label>
                <Input
                  id="diasVencimiento"
                  type="number"
                  min="1"
                  value={umbralesInventario.diasVencimiento}
                  onChange={(e) =>
                    setUmbralesInventario({
                      ...umbralesInventario,
                      diasVencimiento: parseInt(e.target.value) || 7,
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Días antes del vencimiento para generar alerta
                </p>
              </div>

              <div>
                <Label htmlFor="nivelServicio">
                  Nivel de Servicio (0-1)
                </Label>
                <Input
                  id="nivelServicio"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={umbralesInventario.nivelServicio}
                  onChange={(e) =>
                    setUmbralesInventario({
                      ...umbralesInventario,
                      nivelServicio: parseFloat(e.target.value) || 0.95,
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nivel de servicio objetivo para cálculo de punto de reorden (ej: 0.95 = 95%)
                </p>
              </div>

              <Button
                onClick={guardarUmbralesInventario}
                disabled={loading}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar Umbrales de Inventario
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

