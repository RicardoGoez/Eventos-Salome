"use client";

import { useMemo, memo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  Coffee,
  Package,
  ShoppingCart,
  BarChart3,
  Home,
  Building2,
  Square,
  Tag,
  DollarSign,
  LogOut,
  User,
  Menu,
  X,
  Users,
  FileText,
  ShoppingBag,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navigation: NavItem[] = [
  { name: "Inicio", href: "/admin", icon: Home },
  { name: "Productos", href: "/productos", icon: Coffee },
  { name: "Inventario", href: "/inventario", icon: Package },
  { name: "Entradas Inventario", href: "/entradas-inventario", icon: ShoppingBag },
  { name: "Pedidos", href: "/pedidos", icon: ShoppingCart },
  { name: "Proveedores", href: "/proveedores", icon: Building2 },
  { name: "Mesas", href: "/mesas", icon: Square },
  { name: "Descuentos", href: "/descuentos", icon: Tag },
  { name: "Cierre de Caja", href: "/cierre-caja", icon: DollarSign },
  { name: "Usuarios", href: "/usuarios", icon: Users },
  { name: "Auditoría", href: "/auditoria", icon: FileText },
  { name: "Reportes", href: "/reportes", icon: BarChart3 },
];

// Componente memoizado para items de navegación
const NavItem = memo(({ item, isActive }: { item: NavItem; isActive: boolean }) => {
  const Icon = item.icon;
  
  return (
    <Link
      href={item.href}
      prefetch={true}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
        "hover:translate-x-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-primary-dark",
        isActive
          ? "bg-primary text-white shadow-lg"
          : "text-primary-light hover:bg-primary/80 hover:text-white"
      )}
    >
      <Icon 
        className={cn(
          "h-5 w-5 flex-shrink-0 transition-transform duration-200",
          isActive && "scale-110",
          !isActive && "group-hover:scale-110"
        )} 
      />
      <span className="flex-1 truncate">{item.name}</span>
      {isActive && (
        <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-white transition-all" />
      )}
      {item.badge && item.badge > 0 && (
        <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1.5 text-xs font-bold text-white">
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      )}
    </Link>
  );
});

NavItem.displayName = "NavItem";

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Memoizar la detección de ruta activa
  const isActiveRoute = useMemo(() => {
    return (href: string) => {
      if (href === "/") {
        return pathname === "/";
      }
      return pathname.startsWith(href);
    };
  }, [pathname]);

  // Cerrar sidebar móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("usuario");
      window.location.href = "/login";
    }
  };

  const usuario = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const usuarioStr = localStorage.getItem("usuario");
      return usuarioStr ? JSON.parse(usuarioStr) : null;
    } catch {
      return null;
    }
  }, []);

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-primary/30 px-4">
        <Link 
          href="/" 
          className="flex items-center gap-2 transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-primary-dark rounded"
          onClick={() => setIsMobileOpen(false)}
        >
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <Image
                src="/branding/logo.png"
                alt="Logo de Eventos Salome"
                fill
                sizes="40px"
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl font-bold">
              Eventos <span className="italic">Salome</span>
            </h1>
          </div>
        </Link>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden text-primary-light hover:text-white transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-primary scrollbar-track-transparent">
        {navigation.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={isActiveRoute(item.href)}
          />
        ))}
      </nav>

      {/* Footer con usuario */}
      <div className="border-t border-primary/30 p-4 space-y-2">
        {mounted && usuario && (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="truncate font-medium text-white" suppressHydrationWarning>
                {usuario?.nombre}
              </p>
              <p className="truncate text-xs text-primary-light capitalize" suppressHydrationWarning>
                {usuario?.rol?.toLowerCase()}
              </p>
            </div>
          </div>
        )}
        {/* En admin no se expone enlace a Mi Cuenta para evitar salir del contexto */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-primary-light transition-colors hover:bg-danger/20 hover:text-danger focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-primary-dark"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Botón móvil */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-4 z-50 lg:hidden rounded-lg bg-primary-dark p-2 text-white shadow-lg transition-all hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay móvil */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-primary-dark text-white shadow-xl transition-transform duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
});
