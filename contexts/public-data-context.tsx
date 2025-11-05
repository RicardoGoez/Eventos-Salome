"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { Producto } from "@/types/domain";

interface PublicDataContextType {
  // Datos
  productos: Producto[];
  
  // Estados de carga
  loading: boolean;
  isRefreshing: boolean;
  
  // Funciones
  loadProductos: (silent?: boolean) => Promise<void>;
  refreshProductos: () => Promise<void>;
  
  // Cache y optimización
  lastUpdate: Date | null;
  
  // Helpers
  getProductoById: (productoId: string) => Producto | undefined;
  getProductosPorCategoria: (categoria: string) => Producto[];
}

const PublicDataContext = createContext<PublicDataContextType | undefined>(undefined);

const CACHE_DURATION = 30000; // 30 segundos de caché para productos públicos
const REFRESH_INTERVAL = 60000; // 60 segundos de auto-refresh

export function PublicDataProvider({ children }: { children: React.ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Cargar productos con caché
  const loadProductos = useCallback(async (silent = false) => {
    // Evitar cargas múltiples simultáneas
    if (loading && !silent) return;
    
    // Verificar caché
    if (lastUpdate && (Date.now() - lastUpdate.getTime()) < CACHE_DURATION) {
      return; // Usar datos en caché
    }
    
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      const response = await fetch("/api/productos", {
        next: { revalidate: 30 } // Next.js cache revalidation
      });
      
      if (!response.ok) {
        throw new Error("Error al cargar productos");
      }

      const data = await response.json();
      const productosArray = Array.isArray(data) ? data.filter((p: Producto) => p.disponible) : [];
      setProductos(productosArray);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [loading, lastUpdate]);

  // Refrescar productos
  const refreshProductos = useCallback(async () => {
    setIsRefreshing(true);
    setLastUpdate(null); // Invalidar caché
    await loadProductos(true);
    setIsRefreshing(false);
  }, [loadProductos]);

  // Helpers memoizados
  const getProductoById = useCallback((productoId: string) => {
    return productos.find(p => p.id === productoId);
  }, [productos]);

  const getProductosPorCategoria = useCallback((categoria: string) => {
    if (categoria === "TODOS") return productos;
    return productos.filter(p => p.categoria === categoria);
  }, [productos]);

  // Carga inicial
  useEffect(() => {
    loadProductos();
  }, []); // Solo en mount inicial

  // Auto-refresh cada 60 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refreshProductos();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [refreshProductos]);

  // Prefetch cuando el usuario está inactivo
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Solo refrescar si han pasado más de 30 segundos desde la última actualización
        if (!lastUpdate || (Date.now() - lastUpdate.getTime()) > CACHE_DURATION) {
          refreshProductos();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [lastUpdate, refreshProductos]);

  const value = useMemo(() => ({
    productos,
    loading,
    isRefreshing,
    loadProductos,
    refreshProductos,
    lastUpdate,
    getProductoById,
    getProductosPorCategoria,
  }), [
    productos,
    loading,
    isRefreshing,
    loadProductos,
    refreshProductos,
    lastUpdate,
    getProductoById,
    getProductosPorCategoria,
  ]);

  return (
    <PublicDataContext.Provider value={value}>
      {children}
    </PublicDataContext.Provider>
  );
}

export function usePublicData() {
  const context = useContext(PublicDataContext);
  if (context === undefined) {
    throw new Error("usePublicData debe usarse dentro de PublicDataProvider");
  }
  return context;
}

