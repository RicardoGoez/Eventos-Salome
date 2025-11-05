"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { Pedido } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";

interface ClientDataContextType {
  // Datos
  pedidos: Pedido[];
  
  // Estados de carga
  loading: boolean;
  isRefreshing: boolean;
  
  // Funciones
  loadPedidos: (clienteId: string, silent?: boolean) => Promise<void>;
  refreshPedidos: (clienteId: string) => Promise<void>;
  
  // Cache y optimización
  lastUpdate: Date | null;
  updatePedido: (pedidoId: string, updates: Partial<Pedido>) => void;
  
  // Helpers
  getPedidoById: (pedidoId: string) => Pedido | undefined;
  getPedidosActivos: () => Pedido[];
  getPedidosCompletados: () => Pedido[];
}

const ClientDataContext = createContext<ClientDataContextType | undefined>(undefined);

const CACHE_DURATION = 10000; // 10 segundos de caché para pedidos del cliente
const REFRESH_INTERVAL = 30000; // 30 segundos de auto-refresh

export function ClientDataProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Cargar pedidos del cliente con caché
  const loadPedidos = useCallback(async (clienteId: string, silent = false) => {
    // Evitar cargas múltiples simultáneas
    if (loading && !silent) return;
    
    // Verificar caché
    if (lastUpdate && (Date.now() - lastUpdate.getTime()) < CACHE_DURATION) {
      return; // Usar datos en caché
    }
    
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      const response = await fetch(`/api/pedidos?clienteId=${clienteId}`, {
        next: { revalidate: 10 } // Next.js cache revalidation
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
          description: "No se pudieron cargar tus pedidos. Por favor intenta más tarde.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [loading, lastUpdate, toast]);

  // Refrescar pedidos
  const refreshPedidos = useCallback(async (clienteId: string) => {
    setIsRefreshing(true);
    setLastUpdate(null); // Invalidar caché
    await loadPedidos(clienteId, true);
    setIsRefreshing(false);
  }, [loadPedidos]);

  // Optimistic update de pedido
  const updatePedido = useCallback((pedidoId: string, updates: Partial<Pedido>) => {
    setPedidos(prev => prev.map(p => 
      p.id === pedidoId ? { ...p, ...updates } : p
    ));
  }, []);

  // Helpers memoizados
  const getPedidoById = useCallback((pedidoId: string) => {
    return pedidos.find(p => p.id === pedidoId);
  }, [pedidos]);

  const getPedidosActivos = useCallback(() => {
    return pedidos.filter(p => 
      p.estado !== "ENTREGADO" && 
      p.estado !== "CANCELADO"
    );
  }, [pedidos]);

  const getPedidosCompletados = useCallback(() => {
    return pedidos.filter(p => p.estado === "ENTREGADO");
  }, [pedidos]);

  const value = useMemo(() => ({
    pedidos,
    loading,
    isRefreshing,
    loadPedidos,
    refreshPedidos,
    lastUpdate,
    updatePedido,
    getPedidoById,
    getPedidosActivos,
    getPedidosCompletados,
  }), [
    pedidos,
    loading,
    isRefreshing,
    loadPedidos,
    refreshPedidos,
    lastUpdate,
    updatePedido,
    getPedidoById,
    getPedidosActivos,
    getPedidosCompletados,
  ]);

  return (
    <ClientDataContext.Provider value={value}>
      {children}
    </ClientDataContext.Provider>
  );
}

export function useClientData() {
  const context = useContext(ClientDataContext);
  if (context === undefined) {
    throw new Error("useClientData debe usarse dentro de ClientDataProvider");
  }
  return context;
}

