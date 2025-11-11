"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useNotificaciones } from "./notificaciones-provider";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";

export function NotificacionesBadge() {
  const {
    notificacionesNoLeidas,
    notificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas,
  } = useNotificaciones();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notificacionesNoLeidas.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {notificacionesNoLeidas.length > 9 ? "9+" : notificacionesNoLeidas.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Notificaciones</SheetTitle>
              <SheetDescription>
                {notificacionesNoLeidas.length > 0
                  ? `${notificacionesNoLeidas.length} no leída${notificacionesNoLeidas.length !== 1 ? "s" : ""}`
                  : "No hay notificaciones nuevas"}
              </SheetDescription>
            </div>
            {notificacionesNoLeidas.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={marcarTodasComoLeidas}
              >
                Marcar todas como leídas
              </Button>
            )}
          </div>
        </SheetHeader>
        <div className="mt-6 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {notificaciones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No hay notificaciones</p>
            </div>
          ) : (
            notificaciones
              .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
              .map((notificacion) => (
                <div
                  key={notificacion.id}
                  className={`p-4 rounded-lg border ${
                    notificacion.leida
                      ? "bg-gray-50 border-gray-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className={`font-medium ${
                            notificacion.leida ? "text-gray-700" : "text-gray-900"
                          }`}
                        >
                          {notificacion.titulo}
                        </h4>
                        {!notificacion.leida && (
                          <Badge variant="default" className="bg-blue-600">
                            Nueva
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{notificacion.mensaje}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(notificacion.fecha), "dd/MM/yyyy HH:mm", {
                          locale: es,
                        })}
                      </p>
                    </div>
                    {!notificacion.leida && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => marcarComoLeida(notificacion.id)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

