"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { useParams, useRouter } from "next/navigation";
import { PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Producto } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, ArrowLeft } from "lucide-react";

export default function ProductoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState<number>(1);
  const [isImageOpen, setIsImageOpen] = useState(false);

  const productoId = params?.id as string;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/productos/${productoId}`);
        if (!res.ok) throw new Error("Producto no encontrado");
        const data = await res.json();
        setProducto(data);
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
    try {
      const saved = localStorage.getItem("cart");
      let cart: Array<{ producto: Producto; cantidad: number }> = [];
      if (saved) cart = JSON.parse(saved);
      const existing = cart.find((c) => c.producto.id === producto.id);
      if (existing) existing.cantidad += cantidad;
      else cart.push({ producto, cantidad });
      localStorage.setItem("cart", JSON.stringify(cart));
      toast({ title: "Producto agregado", description: `${cantidad} x ${producto.nombre} agregado al carrito` });
    } catch {
      toast({ title: "Error", description: "No se pudo agregar al carrito", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <PublicHeader />
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
        <PublicHeader />
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
      <PublicHeader />
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
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-bold text-primary">${producto.precio.toFixed(2)}</span>
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
                <Button className="w-full gap-2" onClick={handleAddToCart}>
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
    </div>
  );
}
