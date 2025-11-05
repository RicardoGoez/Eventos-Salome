"use client";

import { useMemo, memo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  ShoppingCart,
  Square,
  Plus,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navigation: NavItem[] = [
  { name: "Mesas", href: "/mesero/mesas", icon: Square },
  { name: "Pedidos", href: "/mesero/pedidos", icon: ShoppingCart },
];

const NavItem = memo(({ item, isActive }: { item: NavItem; isActive: boolean }) => {
  const Icon = item.icon;
  
  return (
    <Link
      href={item.href}
      prefetch={true} // Prefetch automático de Next.js - prepara la navegación
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

export const MeseroSidebar = memo(function MeseroSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isActiveRoute = useMemo(() => {
    return (href: string) => {
      if (href === "/mesero") {
        return pathname === "/mesero";
      }
      return pathname.startsWith(href);
    };
  }, [pathname]);

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
          href="/mesero" 
          className="flex items-center gap-2 transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-primary-dark rounded"
          onClick={() => setIsMobileOpen(false)}
        >
          <h1 className="text-xl font-bold">
            Eventos <span className="italic">Salome</span>
          </h1>
        </Link>
      </div>

      {/* User Info */}
      <div className="border-b border-primary/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate" suppressHydrationWarning>
              {mounted ? (usuario?.nombre || "Mesero") : ""}
            </p>
            <p className="text-xs text-primary-light truncate" suppressHydrationWarning>
              {mounted ? (usuario?.email || "") : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavItem key={item.href} item={item} isActive={isActiveRoute(item.href)} />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-primary/30 p-4">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-primary-light hover:bg-primary/80 hover:text-white"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden bg-primary text-white hover:bg-primary-dark"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-primary-dark transform transition-transform duration-300 ease-in-out",
          "md:translate-x-0 md:static md:z-auto",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {sidebarContent}
        </div>
      </aside>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
});

