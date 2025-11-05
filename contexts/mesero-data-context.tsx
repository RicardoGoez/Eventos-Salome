"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { Mesa, Pedido } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";

interface MeseroDataContextType {
  // Datos
  mesas: Mesa[];
  pedidos: Pedido[];
  
  // Estados de carga
  loadingMesas: boolean;
  loadingPedidos: boolean;
  isRefreshing: boolean;
  
  // Funciones
  loadMesas: (silent?: boolean) => Promise<void>;
  loadPedidos: (silent?: boolean) => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Cache y optimización
  lastUpdate: Date | null;
  updatePedido: (pedidoId: string, updates: Partial<Pedido>) => void;
  updateMesa: (mesaId: string, updates: Partial<Mesa>) => void;
  
  // Helpers
  getPedidosPorMesa: (mesaId: string) => Pedido[];
  getPedidoById: (pedidoId: string) => Pedido | undefined;
  getMesaById: (mesaId: string) => Mesa | undefined;
}

const MeseroDataContext = createContext<MeseroDataContextType | undefined>(undefined);

const CACHE_DURATION = 5000; // 5 segundos de caché
const REFRESH_INTERVAL = 30000; // 30 segundos de auto-refresh

export function MeseroDataProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingMesas, setLoadingMesas] = useState(false);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Cargar mesas con caché
  const loadMesas = useCallback(async (silent = false) => {
    // Evitar cargas múltiples simultáneas
    if (loadingMesas && !silent) return;
    
    try {
      if (!silent) setLoadingMesas(true);
      else setIsRefreshing(true);

      const response = await fetch("/api/mesas", {
        next: { revalidate: 5 } // Next.js cache revalidation
      });
      
      if (!response.ok) {
        throw new Error("Error al cargar mesas");
      }

      const data = await response.json();
      setMesas(Array.isArray(data) ? data : []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error al cargar mesas:", error);
      if (!silent) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las mesas",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingMesas(false);
      setIsRefreshing(false);
    }
  }, [loadingMesas, toast]);

  // Cargar pedidos con caché
  const loadPedidos = useCallback(async (silent = false) => {
    // Evitar cargas múltiples simultáneas
    if (loadingPedidos && !silent) return;
    
    try {
      if (!silent) setLoadingPedidos(true);
      else setIsRefreshing(true);

      const response = await fetch("/api/pedidos", {
        next: { revalidate: 5 } // Next.js cache revalidation
      });
      
      if (!response.ok) {
        throw new Error("Error al cargar pedidos");
      }

      const data = await response.json();
      const pedidosArray = Array.isArray(data) ? data : [];
      
      // Ordenar por fecha más reciente primero
      pedidosArray.sort((a: Pedido, b: Pedido) => {
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      });
      
      setPedidos(pedidosArray);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      if (!silent) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los pedidos",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingPedidos(false);
      setIsRefreshing(false);
    }
  }, [loadingPedidos, toast]);

  // Refrescar todo
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadMesas(true), loadPedidos(true)]);
    setIsRefreshing(false);
  }, [loadMesas, loadPedidos]);

  // Optimistic update de pedido
  const updatePedido = useCallback((pedidoId: string, updates: Partial<Pedido>) => {
    setPedidos(prev => prev.map(p => 
      p.id === pedidoId ? { ...p, ...updates } : p
    ));
  }, []);

  // Optimistic update de mesa
  const updateMesa = useCallback((mesaId: string, updates: Partial<Mesa>) => {
    setMesas(prev => prev.map(m => 
      m.id === mesaId ? { ...m, ...updates } : m
    ));
  }, []);

  // Helpers memoizados
  const getPedidosPorMesa = useCallback((mesaId: string) => {
    return pedidos.filter(
      (p) => p.mesaId === mesaId && 
      p.estado !== "ENTREGADO" && 
      p.estado !== "CANCELADO"
    );
  }, [pedidos]);

  const getPedidoById = useCallback((pedidoId: string) => {
    return pedidos.find(p => p.id === pedidoId);
  }, [pedidos]);

  const getMesaById = useCallback((mesaId: string) => {
    return mesas.find(m => m.id === mesaId);
  }, [mesas]);

  // Carga inicial
  useEffect(() => {
    loadMesas();
    loadPedidos();
  }, []); // Solo en mount inicial

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAll();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [refreshAll]);

  // Prefetch cuando el usuario está inactivo (para preparar navegación)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Solo refrescar si han pasado más de 5 segundos desde la última actualización
        if (!lastUpdate || (Date.now() - lastUpdate.getTime()) > CACHE_DURATION) {
          refreshAll();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [lastUpdate, refreshAll]);

  const value = useMemo(() => ({
    mesas,
    pedidos,
    loadingMesas,
    loadingPedidos,
    isRefreshing,
    loadMesas,
    loadPedidos,
    refreshAll,
    lastUpdate,
    updatePedido,
    updateMesa,
    getPedidosPorMesa,
    getPedidoById,
    getMesaById,
  }), [
    mesas,
    pedidos,
    loadingMesas,
    loadingPedidos,
    isRefreshing,
    loadMesas,
    loadPedidos,
    refreshAll,
    lastUpdate,
    updatePedido,
    updateMesa,
    getPedidosPorMesa,
    getPedidoById,
    getMesaById,
  ]);

  return (
    <MeseroDataContext.Provider value={value}>
      {children}
    </MeseroDataContext.Provider>
  );
}

export function useMeseroData() {
  const context = useContext(MeseroDataContext);
  if (context === undefined) {
    throw new Error("useMeseroData debe usarse dentro de MeseroDataProvider");
  }
  return context;
}

