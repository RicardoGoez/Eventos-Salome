"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { useParams, useRouter } from "next/navigation";
import { PublicHeader } from "@/components/public-header";
import { CartSidebar } from "@/components/cart-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Producto, VarianteProducto } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { formatCOP } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function ProductoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState<number>(1);
  const [varianteSeleccionada, setVarianteSeleccionada] = useState<VarianteProducto | null>(null);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [cartItems, setCartItems] = useState<Array<{ 
    producto: Producto; 
    variante?: VarianteProducto;
    cantidad: number;
    nombreCompleto: string;
  }>>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const productoId = params?.id as string;

  useEffect(() => {
    // Cargar carrito desde localStorage
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Asegurar que todos los items tengan nombreCompleto
        const cartWithNombreCompleto = parsedCart.map((item: any) => {
          if (!item.nombreCompleto) {
            const nombreCompleto = item.variante 
              ? `${item.producto.nombre} - ${item.variante.nombre}`
              : item.producto.nombre;
            return { ...item, nombreCompleto };
          }
          return item;
        });
        setCartItems(cartWithNombreCompleto);
      } catch (e) {
        console.error("Error loading cart:", e);
      }
    }

    // Verificar autenticación
    const usuario = localStorage.getItem("usuario");
    setIsAuthenticated(!!usuario);
  }, []);

  useEffect(() => {
    // Guardar carrito en localStorage cuando cambie
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/productos/${productoId}`);
        if (!res.ok) throw new Error("Producto no encontrado");
        const data = await res.json();
        setProducto(data);
        // Si tiene variantes, seleccionar la primera disponible por defecto
        if (data.tieneVariantes && data.variantes && data.variantes.length > 0) {
          const primeraDisponible = data.variantes.find((v: VarianteProducto) => v.disponible) || data.variantes[0];
          setVarianteSeleccionada(primeraDisponible);
        }
      } catch (e) {
        toast({ title: "Error", description: "No se pudo cargar el producto", variant: "destructive" });
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    if (productoId) load();
  }, [productoId, router, toast]);

  const handleAddToCart = () => {
    if (!producto) return;
    
    // Si tiene variantes, debe seleccionar una
    if (producto.tieneVariantes && !varianteSeleccionada) {
      toast({ 
        title: "Selecciona una opción", 
        description: "Por favor selecciona una opción antes de agregar al carrito", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      const nombreCompleto = varianteSeleccionada 
        ? `${producto.nombre} - ${varianteSeleccionada.nombre}`
        : producto.nombre;
      
      setCartItems((prev) => {
        const existing = prev.find((c) => {
          if (varianteSeleccionada) {
            return c.producto.id === producto.id && c.variante?.id === varianteSeleccionada.id;
          }
          return c.producto.id === producto.id && !c.variante;
        });
        
        if (existing) {
          return prev.map((item) => {
            if (varianteSeleccionada) {
              if (item.producto.id === producto.id && item.variante?.id === varianteSeleccionada.id) {
                return { ...item, cantidad: item.cantidad + cantidad };
              }
            } else {
              if (item.producto.id === producto.id && !item.variante) {
                return { ...item, cantidad: item.cantidad + cantidad };
              }
            }
            return item;
          });
        }
        
        return [...prev, { 
          producto, 
          variante: varianteSeleccionada || undefined,
          cantidad,
          nombreCompleto
        }];
      });
      
      toast({ 
        title: "Producto agregado", 
        description: `${cantidad} x ${nombreCompleto} agregado al carrito` 
      });
    } catch {
      toast({ title: "Error", description: "No se pudo agregar al carrito", variant: "destructive" });
    }
  };

  const handleUpdateQuantity = (productoId: string, cantidad: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        // Si el item tiene variante, necesitamos una forma de identificarlo
        // Por ahora, usamos producto.id como clave (esto funciona si cada variante es un item separado)
        // Pero necesitamos una mejor solución: usar índice o clave única
        if (item.producto.id === productoId) {
          // Si hay múltiples items con el mismo productoId (diferentes variantes),
          // esto actualizará el primero. Necesitamos una mejor identificación.
          return { ...item, cantidad };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productoId: string) => {
    setCartItems((prev) => {
      const filtered = prev.filter((item) => item.producto.id !== productoId);
      if (filtered.length < prev.length) {
        toast({
          title: "Producto eliminado",
          description: "El producto fue removido del carrito",
        });
      }
      return filtered;
    });
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.cantidad, 0);
  
  const precioMostrar = varianteSeleccionada ? varianteSeleccionada.precio : (producto?.precio || 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <PublicHeader 
          cartItemCount={cartItemCount}
          onCartClick={() => setIsCartOpen(true)}
        />
        <div className="container mx-auto max-w-6xl p-6">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-40 mb-4" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="w-full aspect-[4/3] bg-gray-200 animate-pulse rounded" />
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 rounded animate-pulse w-2/3" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5" />
              <div className="h-10 bg-gray-200 rounded animate-pulse w-40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <PublicHeader 
          cartItemCount={cartItemCount}
          onCartClick={() => setIsCartOpen(true)}
        />
        <div className="container mx-auto max-w-6xl p-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted">Producto no encontrado</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Head>
        <title>{`${producto.nombre} | Eventos Salome`}</title>
        <meta name="description" content={producto.descripcion || producto.nombre} />
        {producto.imagen && <meta property="og:image" content={producto.imagen} />}
        <meta property="og:title" content={`${producto.nombre} | Eventos Salome`} />
        <meta property="og:description" content={producto.descripcion || producto.nombre} />
      </Head>
      <PublicHeader 
        cartItemCount={cartItemCount}
        onCartClick={() => setIsCartOpen(true)}
      />
      <div className="container mx-auto max-w-6xl p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Imagen */}
          <div className="w-full">
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded border bg-white">
              {producto.imagen ? (
                <img
                  src={producto.imagen}
                  alt={producto.nombre}
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => setIsImageOpen(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <ShoppingCart className="h-16 w-16 text-primary/30" />
                </div>
              )}
            </div>
          </div>
          {/* Detalle */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{producto.nombre}</CardTitle>
                {producto.descripcion && (
                  <CardDescription>{producto.descripcion}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {/* Mostrar opciones si el producto las tiene */}
                {producto.tieneVariantes && producto.variantes && producto.variantes.length > 0 ? (
                  <div className="space-y-4 mb-4">
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Selecciona una opción:</Label>
                      <RadioGroup 
                        value={varianteSeleccionada?.id || ""} 
                        onValueChange={(value) => {
                          const variante = producto.variantes?.find(v => v.id === value);
                          setVarianteSeleccionada(variante || null);
                        }}
                        className="space-y-3"
                      >
                        {producto.variantes
                          .sort((a, b) => a.orden - b.orden)
                          .map((variante) => (
                            <div 
                              key={variante.id} 
                              className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                                varianteSeleccionada?.id === variante.id 
                                  ? "border-primary bg-primary/5" 
                                  : "border-gray-200 hover:border-primary/50"
                              } ${!variante.disponible ? "opacity-50" : ""}`}
                            >
                              <RadioGroupItem 
                                value={variante.id} 
                                id={variante.id}
                                disabled={!variante.disponible}
                              />
                              <Label 
                                htmlFor={variante.id} 
                                className="flex-1 cursor-pointer"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-medium">{variante.nombre}</span>
                                    {variante.descripcion && (
                                      <p className="text-sm text-muted-foreground">{variante.descripcion}</p>
                                    )}
                                  </div>
                                  <span className="font-bold text-primary ml-4">
                                    {formatCOP(variante.precio)}
                                  </span>
                                </div>
                              </Label>
                              {!variante.disponible && (
                                <span className="text-xs text-muted-foreground">No disponible</span>
                              )}
                            </div>
                          ))}
                      </RadioGroup>
                    </div>
                  </div>
                ) : null}
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-bold text-primary">
                    {formatCOP(precioMostrar)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCantidad(Math.max(1, cantidad - 1))}>
                      -
                    </Button>
                    <span className="w-10 text-center font-medium">{cantidad}</span>
                    <Button variant="outline" size="icon" onClick={() => setCantidad(cantidad + 1)}>
                      +
                    </Button>
                  </div>
                </div>
                <Button 
                  className="w-full gap-2" 
                  onClick={handleAddToCart}
                  disabled={producto.tieneVariantes && !varianteSeleccionada}
                >
                  <ShoppingCart className="h-4 w-4" /> Agregar al carrito
                </Button>
                <Separator className="my-6" />
                <p className="text-sm text-muted">Categoría: <span className="font-medium">{producto.categoria}</span></p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de imagen ampliada */}
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle>{producto.nombre}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full">
            {producto.imagen ? (
              <img src={producto.imagen} alt={producto.nombre} className="w-full h-auto object-contain" />
            ) : (
              <div className="w-full h-96 flex items-center justify-center bg-gray-100">
                <ShoppingCart className="h-16 w-16 text-gray-300" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
