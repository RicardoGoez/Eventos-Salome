"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { PublicHeader } from "@/components/public-header";
import { ProductCard } from "@/components/product-card";
import { CartSidebar } from "@/components/cart-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Producto, CategoriaProducto } from "@/types/domain";
import { Coffee, Search, Filter, ArrowRight, MapPin, Phone, Mail, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { PublicDataProvider, usePublicData } from "@/contexts/public-data-context";

interface CartItem {
  producto: Producto;
  cantidad: number;
}

const categoriaLabels: Record<CategoriaProducto, string> = {
  [CategoriaProducto.BEBIDA]: "Bebidas",
  [CategoriaProducto.COMIDA]: "Comidas",
  [CategoriaProducto.POSTRE]: "Postres",
  [CategoriaProducto.SNACK]: "Snacks",
  [CategoriaProducto.INGREDIENTE]: "Ingredientes",
};

function HomePageContent() {
  const { productos, loading, getProductosPorCategoria } = usePublicData();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaProducto | "TODOS">("TODOS");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  // Media para hero desde fuentes públicas sin credenciales
  const [heroImageUrl, setHeroImageUrl] = useState<string>(
    "https://source.unsplash.com/1600x900/?coffee,restaurant"
  );
  const [heroVideoUrl, setHeroVideoUrl] = useState<string>("");

  useEffect(() => {
    // Verificar autenticación
    const checkAuth = () => {
      const usuario = localStorage.getItem("usuario");
      setIsAuthenticated(!!usuario);
    };
    
    checkAuth();
    
    // Escuchar cambios en localStorage para actualizar estado de autenticación
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener("storage", handleStorageChange);
    // También escuchar eventos personalizados
    window.addEventListener("authChange", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleStorageChange);
    };
  }, []);

  // Animaciones de aparición al hacer scroll (reveal)
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll("[data-reveal]"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(
              "animate-in",
              "fade-in",
              "slide-in-from-bottom-2",
              "duration-700"
            );
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    elements.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Elegir video público (Coverr) o solo imagen (Unsplash Source)
  useEffect(() => {
    // Lista de videos MP4 públicos y libres (Coverr)
    const publicVideos = [
      "https://cdn.coverr.co/videos/coverr-brewing-coffee-7420/1080p.mp4",
      "https://cdn.coverr.co/videos/coverr-pouring-coffee-1067/1080p.mp4",
      "https://cdn.coverr.co/videos/coverr-coffee-break-6366/1080p.mp4",
    ];
    // elegir uno aleatorio
    const pick = publicVideos[Math.floor(Math.random() * publicVideos.length)];
    setHeroVideoUrl(pick);
    // imagen aleatoria sin credenciales
    setHeroImageUrl("https://source.unsplash.com/1600x900/?coffee,restaurant");
  }, []);

  useEffect(() => {
    // Cargar carrito desde localStorage
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error loading cart:", e);
      }
    }
  }, []);

  useEffect(() => {
    // Guardar carrito en localStorage
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Filtrar productos (memoizado)
  const productosFiltrados = useMemo(() => {
    let filtered = getProductosPorCategoria(categoriaFiltro);

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((producto) =>
        producto.nombre.toLowerCase().includes(query) ||
        producto.descripcion?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [productos, categoriaFiltro, searchQuery, getProductosPorCategoria]);

  const handleAddToCart = (producto: Producto, cantidad: number) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.producto.id === producto.id);
      if (existing) {
        return prev.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      }
      return [...prev, { producto, cantidad }];
    });

    toast({
      title: "Producto agregado",
      description: `${cantidad} x ${producto.nombre} agregado al carrito`,
    });
  };

  const handleUpdateQuantity = (productoId: string, cantidad: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.producto.id === productoId ? { ...item, cantidad } : item
      )
    );
  };

  const handleRemoveItem = (productoId: string) => {
    setCartItems((prev) => prev.filter((item) => item.producto.id !== productoId));
    toast({
      title: "Producto eliminado",
      description: "El producto fue removido del carrito",
    });
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PublicHeader
        cartItemCount={cartItemCount}
        onCartClick={() => setIsCartOpen(true)}
      />
      <main id="main-content" role="main">

      {/* Hero Section con imagen de cafetería - Optimizado móvil */}
      <section className="relative min-h-[60vh] sm:min-h-[65vh] md:min-h-[70vh] flex flex-col px-4 sm:px-6 overflow-hidden bg-gray-900">
        {/* Imagen de cafetería como fondo */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1470&auto=format&fit=crop"
            alt="Interior acogedor de cafetería Eventos Salome"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Overlay - más oscuro para mejor contraste */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>
        
        {/* Contenido */}
        <div className="relative z-10 container mx-auto max-w-6xl py-6 sm:py-10 md:py-12 px-4 flex-1 flex flex-col justify-center">
          <div className="flex flex-col items-center gap-5 sm:gap-6 md:gap-8">
            <div className="text-center w-full" data-reveal>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-3 sm:mb-4 text-white leading-[1.2] sm:leading-tight drop-shadow-lg">
                Bienvenido a Eventos <span className="italic">Salome</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-3 sm:mb-4 md:mb-6 text-white drop-shadow-md font-medium">
                Sabores auténticos, momentos especiales
              </p>
              <p className="text-sm sm:text-base md:text-lg mb-5 sm:mb-6 md:mb-8 text-white/95 max-w-2xl mx-auto drop-shadow-sm leading-relaxed">
                Descubre bebidas, comidas y postres elaborados con ingredientes frescos y de calidad.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2 w-full sm:w-auto h-12 sm:h-11 text-base sm:text-sm font-semibold"
                  onClick={() => {
                    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Ver Menú
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="inverted" 
                  onClick={() => setIsCartOpen(true)}
                  className="w-full sm:w-auto h-12 sm:h-11 text-base sm:text-sm font-semibold"
                >
                  Ver Carrito
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promociones / CTA Superior - Optimizado móvil */}
      <section className="px-4 sm:px-6 py-6 sm:py-8 md:py-10 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-accent text-white p-5 sm:p-6 md:p-8 lg:p-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-5 md:gap-6">
            <div className="flex-1 text-center sm:text-left w-full">
              <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight mb-2 sm:mb-0">Descubre nuestras creaciones de temporada</h3>
              <p className="text-white/95 mt-2 text-sm sm:text-base leading-relaxed">Bebidas frías, postres caseros y sabores que te sorprenderán.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full sm:w-auto h-11 sm:h-10 text-sm font-semibold"
              >
                Explorar menú
              </Button>
              <Button 
                size="lg" 
                variant="inverted" 
                onClick={() => setIsCartOpen(true)}
                className="w-full sm:w-auto h-11 sm:h-10 text-sm font-semibold"
              >
                Ver carrito
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Menú Section - Optimizado para ocupar toda la pantalla */}
      <section id="menu" className="py-6 sm:py-8 md:py-12 lg:py-16 w-full bg-white">
        {/* Header y Filtros - Con padding lateral */}
        <div className="container mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
          <div className="text-center mb-5 sm:mb-6 md:mb-8 lg:mb-12" data-reveal>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-1.5 sm:mb-2 md:mb-3 lg:mb-4">
              Nuestro Menú
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 max-w-2xl mx-auto leading-relaxed px-2">
              Explora nuestra deliciosa selección de productos frescos y artesanales
            </p>
          </div>

          {/* Filtros y búsqueda - Organizados y compactos */}
          <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8 space-y-2.5 sm:space-y-3 md:space-y-4">
            <p className="text-center text-xs sm:text-sm md:text-base text-gray-600 font-medium">Encuentra rápido lo que se te antoja</p>
            
            {/* Barra de búsqueda - Compacta */}
            <div className="relative w-full max-w-md mx-auto px-1" data-reveal>
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-600" aria-hidden="true" />
              <Input
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-9 md:pl-10 placeholder:text-gray-500 text-xs sm:text-sm md:text-base h-10 sm:h-11 md:h-10"
              />
            </div>

            {/* Filtros de categoría - Scroll horizontal optimizado */}
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide px-2" data-reveal>
              <Button
                variant={categoriaFiltro === "TODOS" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoriaFiltro("TODOS")}
                className={cn(
                  "flex-shrink-0 text-[10px] sm:text-xs md:text-sm h-8 sm:h-9 md:h-8 px-2.5 sm:px-3 md:px-4 font-medium",
                  categoriaFiltro !== "TODOS" && "text-gray-800 border-gray-400 hover:text-gray-900 hover:border-gray-500"
                )}
              >
                Todos
              </Button>
              {Object.entries(categoriaLabels).map(([key, label]) => (
                <Button
                  key={key}
                  variant={categoriaFiltro === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoriaFiltro(key as CategoriaProducto)}
                  className={cn(
                    "flex-shrink-0 text-[10px] sm:text-xs md:text-sm h-8 sm:h-9 md:h-8 px-2.5 sm:px-3 md:px-4 font-medium",
                    categoriaFiltro !== key && "text-gray-800 border-gray-400 hover:text-gray-900 hover:border-gray-500"
                  )}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid de productos - Ocupa toda la pantalla */}
        <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6">
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4" role="status" aria-label="Cargando productos">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="border rounded-lg overflow-hidden bg-white animate-pulse">
                  <div className="w-full aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300" />
                  <div className="p-2 sm:p-2.5 md:p-3 lg:p-4 space-y-2">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-full" />
                    <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-2/3" />
                    <div className="flex flex-col gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                      <div className="h-7 sm:h-8 bg-gray-200 rounded w-full" />
                      <div className="h-7 sm:h-8 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="text-center py-10 sm:py-12 container mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
              <p className="text-sm sm:text-base md:text-lg text-gray-800">No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4" data-reveal>
              {productosFiltrados.map((producto) => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                  onAddToCartAction={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Experiencias / Testimonios - Optimizado móvil */}
      <section className="px-3 sm:px-4 md:px-6 py-8 sm:py-10 md:py-12 lg:py-16 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2">Lo que dicen nuestros clientes</h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 max-w-2xl mx-auto mt-1.5 sm:mt-2 leading-relaxed px-2">Momentos memorables con sabores auténticos</p>
          </div>
          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
            {[1,2,3].map((i) => (
              <div key={i} className="rounded-lg sm:rounded-xl border p-3.5 sm:p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-gray-900 font-semibold mb-1.5 sm:mb-2 text-xs sm:text-sm md:text-base">Excelente sabor y atención</p>
                <p className="text-gray-700 text-[11px] sm:text-xs md:text-sm leading-relaxed mb-2 sm:mb-0">&quot;El café y los postres están increíbles. El lugar ideal para una tarde con amigos.&quot;</p>
                <p className="mt-2.5 sm:mt-3 md:mt-4 text-[10px] sm:text-xs md:text-sm font-medium text-gray-800">Cliente satisfecho</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final - Optimizado móvil */}
      <section className="px-4 sm:px-6 pb-10 sm:pb-12 md:pb-16">
        <div className="container mx-auto max-w-7xl">
          <div className="rounded-xl sm:rounded-2xl border p-5 sm:p-6 md:p-8 text-center bg-light">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 text-gray-900">¿Listo para ordenar?</h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 mb-4 sm:mb-5 md:mb-6 leading-relaxed">Agrega tus favoritos y finaliza tu pedido cuando quieras.</p>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center">
              <Button 
                onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full sm:w-auto h-11 sm:h-10 text-sm font-semibold"
              >
                Ver menú
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsCartOpen(true)}
                className="w-full sm:w-auto h-11 sm:h-10 text-sm font-semibold"
              >
                Ver carrito
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contacto Section */}
      <section id="contacto" className="bg-gray-50 py-12 sm:py-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Contáctanos
            </h2>
            <p className="text-sm sm:text-base text-gray-700">
              Estamos aquí para atenderte
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                <MapPin className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm md:text-base text-gray-900">Ubicación</h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-700 leading-tight">Eventos Salome</p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                <Phone className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm md:text-base text-gray-900">Teléfono</h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-700 leading-tight">Contacta con nosotros</p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                <Clock className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm md:text-base text-gray-900">Horarios</h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-700 leading-tight">Lun - Dom: 8:00 AM - 10:00 PM</p>
            </div>
          </div>
        </div>
      </section>

      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 sm:py-8 px-4 sm:px-6" role="contentinfo">
        <div className="container mx-auto max-w-6xl text-center">
            <p className="text-sm sm:text-base text-gray-300">
              © 2024 Eventos Salome. Todos los derechos reservados.
            </p>
        </div>
      </footer>

      {/* Cart Sidebar */}
      <CartSidebar
        cartItems={cartItems}
        onUpdateQuantityAction={handleUpdateQuantity}
        onRemoveItemAction={handleRemoveItem}
        isOpen={isCartOpen}
        onOpenChangeAction={setIsCartOpen}
        isAuthenticated={isAuthenticated}
      />

    </div>
  );
}

export default function HomePage() {
  return (
    <PublicDataProvider>
      <HomePageContent />
    </PublicDataProvider>
  );
}

