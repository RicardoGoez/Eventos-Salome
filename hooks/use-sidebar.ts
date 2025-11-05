import { useMemo } from "react";
import { usePathname } from "next/navigation";

export function useSidebar() {
  const pathname = usePathname();

  const isActiveRoute = useMemo(() => {
    return (href: string) => {
      if (href === "/") {
        return pathname === "/";
      }
      return pathname.startsWith(href);
    };
  }, [pathname]);

  const getCurrentModule = useMemo(() => {
    const modules: Record<string, string> = {
      "/": "Dashboard",
      "/productos": "Productos",
      "/inventario": "Inventario",
      "/pedidos": "Pedidos",
      "/proveedores": "Proveedores",
      "/mesas": "Mesas",
      "/descuentos": "Descuentos",
      "/cierre-caja": "Cierre de Caja",
      "/reportes": "Reportes",
      "/mi-cuenta": "Mi Cuenta",
    };

    for (const [path, name] of Object.entries(modules)) {
      if (pathname.startsWith(path)) {
        return name;
      }
    }
    return "Eventos Salome";
  }, [pathname]);

  return {
    isActiveRoute,
    getCurrentModule,
    pathname,
  };
}
