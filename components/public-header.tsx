"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Menu, X, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";

interface PublicHeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
}

export function PublicHeader({ cartItemCount = 0, onCartClick }: PublicHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Verificar si hay usuario autenticado
    const checkAuth = () => {
      const usuario = localStorage.getItem("usuario");
      if (usuario) {
        try {
          const userData = JSON.parse(usuario);
          setIsAuthenticated(true);
          setUserName(userData.nombre || userData.email);
        } catch (e) {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
        setUserName("");
      }
    };
    
    checkAuth();
    
    // Escuchar cambios en localStorage
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authChange", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    setIsAuthenticated(false);
    setUserName("");
    // Disparar evento personalizado para actualizar otros componentes
    window.dispatchEvent(new Event("authChange"));
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
    router.push("/");
  };

  return (
    <>
      {/* Skip Links para accesibilidad */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Saltar al contenido principal
      </a>
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm" role="banner">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            {/* Logo - Optimizado para móvil */}
            <Link 
              href="/" 
              className="flex items-center gap-1.5 sm:gap-2 group flex-shrink-0 min-w-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label="Eventos Salome - Inicio"
            >
              <div className="relative flex items-center gap-2">
                <Logo
                  size="lg"
                  className="transition-transform group-hover:scale-105"
                  priority
                  shadow
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-base sm:text-xl font-bold text-gray-900 leading-tight">Eventos</span>
                  <span className="text-sm sm:text-lg italic text-primary -mt-0.5 sm:-mt-1 leading-tight">Salome</span>
                </div>
              </div>
            </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" role="navigation" aria-label="Navegación principal">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
              aria-label="Ir a página de inicio"
            >
              Inicio
            </Link>
            <Link
              href="/#menu"
              className="text-sm font-medium text-gray-700 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
              aria-label="Ir a sección de menú"
            >
              Menú
            </Link>
            <Link
              href="/#contacto"
              className="text-sm font-medium text-gray-700 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
              aria-label="Ir a sección de contacto"
            >
              Contacto
            </Link>
          </nav>

          {/* Actions - Optimizado para móvil */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
            {/* Cart Button - Siempre visible */}
            <Button
              variant="outline"
              size="icon"
              className="relative h-10 w-10 sm:h-11 sm:w-11 focus:ring-2 focus:ring-primary"
              onClick={onCartClick}
              disabled={cartItemCount === 0}
              aria-label={cartItemCount === 0 ? "Tu carrito está vacío" : `Ver carrito, ${cartItemCount} ${cartItemCount === 1 ? "producto" : "productos"}`}
              aria-live="polite"
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              {cartItemCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary text-white text-[10px] sm:text-xs flex items-center justify-center font-bold"
                  aria-label={`${cartItemCount} ${cartItemCount === 1 ? "producto" : "productos"} en el carrito`}
                >
                  {cartItemCount > 9 ? "9+" : cartItemCount}
                </span>
              )}
            </Button>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/mi-cuenta" aria-label="Ir a mi cuenta">
                  <Button variant="ghost" className="gap-2 h-10 sm:h-11 focus:ring-2 focus:ring-primary">
                    <User className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden lg:inline text-sm">{userName}</span>
                    <span className="sr-only">Mi cuenta, usuario {userName}</span>
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10 sm:h-11 sm:w-11 focus:ring-2 focus:ring-primary" 
                  onClick={handleLogout}
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
                <Link href="/login" aria-label="Ir a página de inicio de sesión">
                  <Button variant="ghost" size="sm" className="h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-3 focus:ring-2 focus:ring-primary">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/register" aria-label="Ir a página de registro">
                  <Button size="sm" className="h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-3 focus:ring-2 focus:ring-primary">Registrarse</Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10 sm:h-11 sm:w-11 focus:ring-2 focus:ring-primary"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu - Mejorado */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t bg-white" id="mobile-menu" role="navigation" aria-label="Menú de navegación móvil">
            <nav className="flex flex-col gap-1 px-2">
              <Link
                href="/"
                className="px-4 py-3 text-base font-medium text-gray-700 hover:text-primary hover:bg-primary/5 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link
                href="/#menu"
                className="px-4 py-3 text-base font-medium text-gray-700 hover:text-primary hover:bg-primary/5 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Menú
              </Link>
              <Link
                href="/#contacto"
                className="px-4 py-3 text-base font-medium text-gray-700 hover:text-primary hover:bg-primary/5 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Contacto
              </Link>
              {isAuthenticated ? (
                <>
                  <Link href="/mi-cuenta" className="px-4 py-3 text-base font-medium text-gray-700 hover:text-primary hover:bg-primary/5 transition-colors rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      <span>Mi Cuenta</span>
                    </div>
                  </Link>
                  <Button variant="outline" className="w-full mt-2 h-11" onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <>
                  <div className="pt-2 mt-2 border-t">
                    <Link href="/login">
                      <Button variant="outline" className="w-full h-11 mb-2" onClick={() => setIsMenuOpen(false)}>
                        Iniciar Sesión
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full h-11" onClick={() => setIsMenuOpen(false)}>
                        Registrarse
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
    </>
  );
}

