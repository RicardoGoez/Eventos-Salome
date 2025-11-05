"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { Producto, Pedido, Mesa, Descuento, InventarioItem, Usuario } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";

interface AdminDataContextType {
  // Datos
  productos: Producto[];
  pedidos: Pedido[];
  mesas: Mesa[];
  descuentos: Descuento[];
  inventario: InventarioItem[];
  usuarios: Usuario[];
  
  // Estados de carga
  loadingProductos: boolean;
  loadingPedidos: boolean;
  loadingMesas: boolean;
  loadingDescuentos: boolean;
  loadingInventario: boolean;
  loadingUsuarios: boolean;
  isRefreshing: boolean;
  
  // Funciones
  loadProductos: (silent?: boolean) => Promise<void>;
  loadPedidos: (silent?: boolean) => Promise<void>;
  loadMesas: (silent?: boolean) => Promise<void>;
  loadDescuentos: (silent?: boolean) => Promise<void>;
  loadInventario: (silent?: boolean) => Promise<void>;
  loadUsuarios: (silent?: boolean) => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Cache y optimización
  lastUpdate: Date | null;
  updateProducto: (productoId: string, updates: Partial<Producto>) => void;
  updatePedido: (pedidoId: string, updates: Partial<Pedido>) => void;
  updateMesa: (mesaId: string, updates: Partial<Mesa>) => void;
  
  // Helpers
  getProductoById: (productoId: string) => Producto | undefined;
  getPedidoById: (pedidoId: string) => Pedido | undefined;
  getMesaById: (mesaId: string) => Mesa | undefined;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

const CACHE_DURATION = 10000; // 10 segundos de caché
const REFRESH_INTERVAL = 60000; // 60 segundos de auto-refresh

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [descuentos, setDescuentos] = useState<Descuento[]>([]);
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [loadingMesas, setLoadingMesas] = useState(false);
  const [loadingDescuentos, setLoadingDescuentos] = useState(false);
  const [loadingInventario, setLoadingInventario] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Cargar productos
  const loadProductos = useCallback(async (silent = false) => {
    if (loadingProductos && !silent) return;
    
    try {
      if (!silent) setLoadingProductos(true);
      else setIsRefreshing(true);

      const response = await fetch("/api/productos", {
        next: { revalidate: 10 }
      });
      
      if (!response.ok) throw new Error("Error al cargar productos");

      const data = await response.json();
      setProductos(Array.isArray(data) ? data : []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error al cargar productos:", error);
      if (!silent) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingProductos(false);
      setIsRefreshing(false);
    }
  }, [loadingProductos, toast]);

  // Cargar pedidos
  const loadPedidos = useCallback(async (silent = false) => {
    if (loadingPedidos && !silent) return;
    
    try {
      if (!silent) setLoadingPedidos(true);
      else setIsRefreshing(true);

      const response = await fetch("/api/pedidos", {
        next: { revalidate: 10 }
      });
      
      if (!response.ok) throw new Error("Error al cargar pedidos");

      const data = await response.json();
      const pedidosArray = Array.isArray(data) ? data : [];
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

  // Cargar mesas
  const loadMesas = useCallback(async (silent = false) => {
    if (loadingMesas && !silent) return;
    
    try {
      if (!silent) setLoadingMesas(true);
      else setIsRefreshing(true);

      const response = await fetch("/api/mesas", {
        next: { revalidate: 10 }
      });
      
      if (!response.ok) throw new Error("Error al cargar mesas");

      const data = await response.json();
      setMesas(Array.isArray(data) ? data : []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error al cargar mesas:", error);
    } finally {
      setLoadingMesas(false);
      setIsRefreshing(false);
    }
  }, [loadingMesas]);

  // Cargar descuentos
  const loadDescuentos = useCallback(async (silent = false) => {
    if (loadingDescuentos && !silent) return;
    
    try {
      if (!silent) setLoadingDescuentos(true);
      else setIsRefreshing(true);

      const response = await fetch("/api/descuentos", {
        next: { revalidate: 10 }
      });
      
      if (!response.ok) throw new Error("Error al cargar descuentos");

      const data = await response.json();
      setDescuentos(Array.isArray(data) ? data : []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error al cargar descuentos:", error);
    } finally {
      setLoadingDescuentos(false);
      setIsRefreshing(false);
    }
  }, [loadingDescuentos]);

  // Cargar inventario
  const loadInventario = useCallback(async (silent = false) => {
    if (loadingInventario && !silent) return;
    
    try {
      if (!silent) setLoadingInventario(true);
      else setIsRefreshing(true);

      const response = await fetch("/api/inventario", {
        next: { revalidate: 10 }
      });
      
      if (!response.ok) throw new Error("Error al cargar inventario");

      const data = await response.json();
      setInventario(Array.isArray(data) ? data : []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error al cargar inventario:", error);
    } finally {
      setLoadingInventario(false);
      setIsRefreshing(false);
    }
  }, [loadingInventario]);

  // Cargar usuarios
  const loadUsuarios = useCallback(async (silent = false) => {
    if (loadingUsuarios && !silent) return;
    
    try {
      if (!silent) setLoadingUsuarios(true);
      else setIsRefreshing(true);

      const response = await fetch("/api/usuarios", {
        next: { revalidate: 10 }
      });
      
      if (!response.ok) throw new Error("Error al cargar usuarios");

      const data = await response.json();
      setUsuarios(Array.isArray(data) ? data : []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setLoadingUsuarios(false);
      setIsRefreshing(false);
    }
  }, [loadingUsuarios]);

  // Refrescar todo
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadProductos(true),
      loadPedidos(true),
      loadMesas(true),
      loadDescuentos(true),
    ]);
    setIsRefreshing(false);
  }, [loadProductos, loadPedidos, loadMesas, loadDescuentos]);

  // Optimistic updates
  const updateProducto = useCallback((productoId: string, updates: Partial<Producto>) => {
    setProductos(prev => prev.map(p => 
      p.id === productoId ? { ...p, ...updates } : p
    ));
  }, []);

  const updatePedido = useCallback((pedidoId: string, updates: Partial<Pedido>) => {
    setPedidos(prev => prev.map(p => 
      p.id === pedidoId ? { ...p, ...updates } : p
    ));
  }, []);

  const updateMesa = useCallback((mesaId: string, updates: Partial<Mesa>) => {
    setMesas(prev => prev.map(m => 
      m.id === mesaId ? { ...m, ...updates } : m
    ));
  }, []);

  // Helpers memoizados
  const getProductoById = useCallback((productoId: string) => {
    return productos.find(p => p.id === productoId);
  }, [productos]);

  const getPedidoById = useCallback((pedidoId: string) => {
    return pedidos.find(p => p.id === pedidoId);
  }, [pedidos]);

  const getMesaById = useCallback((mesaId: string) => {
    return mesas.find(m => m.id === mesaId);
  }, [mesas]);

  // Carga inicial (solo datos esenciales)
  useEffect(() => {
    loadProductos();
    loadPedidos();
    loadMesas();
    loadDescuentos();
  }, []); // Solo en mount inicial

  // Auto-refresh cada 60 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAll();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [refreshAll]);

  const value = useMemo(() => ({
    productos,
    pedidos,
    mesas,
    descuentos,
    inventario,
    usuarios,
    loadingProductos,
    loadingPedidos,
    loadingMesas,
    loadingDescuentos,
    loadingInventario,
    loadingUsuarios,
    isRefreshing,
    loadProductos,
    loadPedidos,
    loadMesas,
    loadDescuentos,
    loadInventario,
    loadUsuarios,
    refreshAll,
    lastUpdate,
    updateProducto,
    updatePedido,
    updateMesa,
    getProductoById,
    getPedidoById,
    getMesaById,
  }), [
    productos,
    pedidos,
    mesas,
    descuentos,
    inventario,
    usuarios,
    loadingProductos,
    loadingPedidos,
    loadingMesas,
    loadingDescuentos,
    loadingInventario,
    loadingUsuarios,
    isRefreshing,
    loadProductos,
    loadPedidos,
    loadMesas,
    loadDescuentos,
    loadInventario,
    loadUsuarios,
    refreshAll,
    lastUpdate,
    updateProducto,
    updatePedido,
    updateMesa,
    getProductoById,
    getPedidoById,
    getMesaById,
  ]);

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (context === undefined) {
    throw new Error("useAdminData debe usarse dentro de AdminDataProvider");
  }
  return context;
}

