"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus, ShoppingCart, CheckCircle2 } from "lucide-react";
import { Producto, CategoriaProducto } from "@/types/domain";
import { cn, formatCOP } from "@/lib/utils";

interface ProductCardProps {
  producto: Producto;
  onAddToCartAction: (producto: Producto, cantidad: number) => void;
}

const categoriaLabels: Record<CategoriaProducto, string> = {
  [CategoriaProducto.BEBIDA]: "Bebida",
  [CategoriaProducto.COMIDA]: "Comida",
  [CategoriaProducto.POSTRE]: "Postre",
  [CategoriaProducto.SNACK]: "Snack",
  [CategoriaProducto.INGREDIENTE]: "Ingrediente",
};

const categoriaColors: Record<CategoriaProducto, string> = {
  [CategoriaProducto.BEBIDA]: "bg-info/20 text-info-700 border border-info/30",
  [CategoriaProducto.COMIDA]: "bg-success/20 text-success-700 border border-success/30",
  [CategoriaProducto.POSTRE]: "bg-pink-100 text-pink-700 border border-pink-300",
  [CategoriaProducto.SNACK]: "bg-warning/20 text-warning-700 border border-warning/30",
  [CategoriaProducto.INGREDIENTE]: "bg-gray-800 text-white border border-gray-700 shadow-md",
};

export function ProductCard({
  producto,
  onAddToCartAction,
}: ProductCardProps) {
  const [cantidad, setCantidad] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = async () => {
    if (!producto.disponible) {
      return;
    }

    setIsAdding(true);
    await onAddToCartAction(producto, cantidad);
    setCantidad(1);
    setIsAdding(false);
    
    // Mostrar feedback visual de éxito
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Image Container */}
      <Link 
        href={`/producto/${producto.id}`} 
        className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100 block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label={`Ver detalles de ${producto.nombre}`}
      >
        {producto.imagen && !imageError ? (
          <Image
            src={producto.imagen}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
            onError={() => {
              // Silenciar el error y mostrar placeholder
              setImageError(true);
            }}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5" aria-hidden="true">
            <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-primary/30" />
          </div>
        )}
        
        {/* Badge de categoría - mejor contraste */}
        <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 z-10">
          <span
            className={cn(
              "px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full border shadow-sm",
              categoriaColors[producto.categoria]
            )}
            aria-label={`Categoría: ${categoriaLabels[producto.categoria]}`}
            role="status"
          >
            {categoriaLabels[producto.categoria]}
          </span>
        </div>

        {/* Badge de no disponible - mejor contraste */}
        {!producto.disponible && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-20" role="alert" aria-label="Producto no disponible">
            <span className="text-white font-bold text-xs sm:text-base md:text-lg drop-shadow-lg">No disponible</span>
          </div>
        )}
      </Link>

      {/* Content - Optimizado para 3 columnas en móvil */}
      <CardContent className="p-2 sm:p-2.5 md:p-3 lg:p-4 flex flex-col flex-1">
        <Link 
          href={`/producto/${producto.id}`} 
          className="hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
        >
          <h3 className="font-bold text-[11px] sm:text-xs md:text-sm lg:text-base xl:text-lg mb-0.5 sm:mb-1 line-clamp-1 text-gray-900 leading-tight">{producto.nombre}</h3>
        </Link>
        {producto.descripcion && (
          <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-gray-700 mb-1.5 sm:mb-2 md:mb-3 line-clamp-2 flex-1 leading-relaxed">
            {producto.descripcion}
          </p>
        )}
        
        {/* Precio y controles */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-primary">
              {formatCOP(producto.precio)}
            </span>
          </div>

          {producto.disponible ? (
            <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
              {/* Controles de cantidad - Ultra compactos para 3 columnas */}
              <div className="flex items-center gap-1 sm:gap-1.5 border rounded-md justify-center px-0.5 sm:px-1 py-0.5" role="group" aria-label="Controles de cantidad">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 flex-shrink-0 p-0 focus:ring-2 focus:ring-primary"
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  disabled={cantidad <= 1}
                  aria-label="Disminuir cantidad"
                  aria-disabled={cantidad <= 1}
                >
                  <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" aria-hidden="true" />
                </Button>
                <span 
                  className="w-6 sm:w-8 md:w-10 text-center font-medium text-[10px] sm:text-xs md:text-sm lg:text-base" 
                  aria-label={`Cantidad: ${cantidad}`}
                  role="status"
                >
                  {cantidad}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 flex-shrink-0 p-0 focus:ring-2 focus:ring-primary"
                  onClick={() => setCantidad(cantidad + 1)}
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" aria-hidden="true" />
                </Button>
              </div>

              {/* Botón agregar - Compacto y funcional con animación de éxito */}
              <Button
                onClick={handleAddToCart}
                disabled={isAdding || showSuccess}
                className={cn(
                  "w-full gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs md:text-sm lg:text-base h-8 sm:h-9 md:h-10 lg:h-11 font-semibold relative overflow-hidden transition-all duration-300",
                  showSuccess && "bg-success hover:bg-success"
                )}
                size="sm"
                aria-label={showSuccess ? "Producto agregado al carrito" : `Agregar ${cantidad} ${producto.nombre} al carrito`}
                aria-live="polite"
              >
                {showSuccess ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 flex-shrink-0 animate-in zoom-in duration-300" />
                    <span className="truncate text-[10px] sm:text-xs md:text-sm">¡Agregado!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 flex-shrink-0" aria-hidden="true" />
                    <span className="truncate text-[10px] sm:text-xs md:text-sm">{isAdding ? "Agregando..." : "Agregar"}</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button 
              disabled 
              className="w-full text-[10px] sm:text-xs md:text-sm lg:text-base h-8 sm:h-9 md:h-10 lg:h-11" 
              variant="outline"
              aria-label="Producto no disponible"
              aria-disabled="true"
            >
              No disponible
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

