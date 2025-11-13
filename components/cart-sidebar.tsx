"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ShoppingCart, Plus, Minus, Trash2, X } from "lucide-react";
import { Producto, VarianteProducto } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { formatCOP } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CartItem {
  producto: Producto;
  variante?: VarianteProducto;
  cantidad: number;
  nombreCompleto: string;
}

interface CartSidebarProps {
  cartItems: CartItem[];
  onUpdateQuantityAction: (productoId: string, cantidad: number) => void;
  onRemoveItemAction: (productoId: string) => void;
  isOpen: boolean;
  onOpenChangeAction: (open: boolean) => void;
  isAuthenticated: boolean;
}

export function CartSidebar({
  cartItems,
  onUpdateQuantityAction,
  onRemoveItemAction,
  isOpen,
  onOpenChangeAction,
  isAuthenticated,
}: CartSidebarProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  const subtotal = cartItems.reduce(
    (sum, item) => {
      const precio = item.variante ? item.variante.precio : item.producto.precio;
      return sum + precio * item.cantidad;
    },
    0
  );
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Guardar información de redirección para después del login
      localStorage.setItem("redirectAfterLogin", "/");
      onOpenChangeAction(false);
      toast({
        title: "Inicia sesión requerido",
        description: "Debes iniciar sesión para realizar un pedido. Tu carrito se mantendrá guardado.",
      });
      router.push("/login?from=checkout");
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos al carrito antes de continuar",
        variant: "destructive",
      });
      return;
    }

    // Abrir el diálogo de checkout
    onOpenChangeAction(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderPlaced = () => {
    // Limpiar carrito
    cartItems.forEach((item) => onRemoveItemAction(item.producto.id));
    setIsCheckoutOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChangeAction}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            Mi Carrito
          </SheetTitle>
          <SheetDescription aria-live="polite" role="status">
            {cartItems.length} {cartItems.length === 1 ? "producto" : "productos"} en tu carrito
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" aria-hidden="true" />
              <p className="text-muted font-medium">Tu carrito está vacío</p>
              <p className="text-sm text-gray-500 mt-2">
                Agrega productos desde el menú
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => {
                const isRemoving = removingItems.has(item.producto.id);
                return (
                <div
                  key={item.producto.id}
                  className={cn(
                    "flex gap-4 p-4 border rounded-lg bg-white transition-all duration-300",
                    isRemoving && "opacity-0 scale-95 translate-x-4"
                  )}
                >
                  {/* Imagen */}
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.producto.imagen ? (
                      <Image
                        src={item.producto.imagen}
                        alt={item.producto.nombre}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
                        <ShoppingCart className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">
                      {item.nombreCompleto || item.producto.nombre}
                    </h4>
                    <p className="text-primary font-bold mt-1">
                      {formatCOP(item.variante ? item.variante.precio : item.producto.precio)}
                    </p>

                    {/* Controles */}
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center gap-2 border rounded-lg" role="group" aria-label="Controles de cantidad">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 focus:ring-2 focus:ring-primary"
                          onClick={() =>
                            onUpdateQuantityAction(
                              item.producto.id,
                              Math.max(1, item.cantidad - 1)
                            )
                          }
                          aria-label={`Disminuir cantidad de ${item.producto.nombre}`}
                          disabled={item.cantidad <= 1}
                        >
                          <Minus className="h-3 w-3" aria-hidden="true" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium" aria-label={`Cantidad: ${item.cantidad}`} role="status">
                          {item.cantidad}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 focus:ring-2 focus:ring-primary"
                          onClick={() =>
                            onUpdateQuantityAction(item.producto.id, item.cantidad + 1)
                          }
                          aria-label={`Aumentar cantidad de ${item.producto.nombre}`}
                        >
                          <Plus className="h-3 w-3" aria-hidden="true" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 focus:ring-2 focus:ring-destructive"
                        onClick={() => {
                          setRemovingItems(prev => new Set(prev).add(item.producto.id));
                          setTimeout(() => {
                            setItemToRemove(item.producto.id);
                            setRemovingItems(prev => {
                              const next = new Set(prev);
                              next.delete(item.producto.id);
                              return next;
                            });
                          }, 300);
                        }}
                        aria-label={`Eliminar ${item.producto.nombre} del carrito`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumen y checkout */}
        {cartItems.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-medium">{formatCOP(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">IVA (16%)</span>
                <span className="font-medium">{formatCOP(iva)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">{formatCOP(total)}</span>
              </div>
            </div>

            {isAuthenticated ? (
              <Button
                className="w-full focus:ring-2 focus:ring-primary"
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessing}
                aria-label="Proceder al pago"
              >
                Proceder al Pago
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  className="w-full focus:ring-2 focus:ring-primary"
                  size="lg"
                  onClick={() => {
                    localStorage.setItem("redirectAfterLogin", "/");
                    onOpenChangeAction(false);
                    router.push("/register?from=checkout");
                  }}
                  aria-label="Crear cuenta y continuar con el pedido"
                >
                  Crear Cuenta y Continuar
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full focus:ring-2 focus:ring-primary"
                  size="lg"
                  onClick={() => {
                    localStorage.setItem("redirectAfterLogin", "/");
                    onOpenChangeAction(false);
                    router.push("/login?from=checkout");
                  }}
                  aria-label="Iniciar sesión para continuar con el pedido"
                >
                  Ya tengo cuenta - Iniciar Sesión
                </Button>

                <p className="text-xs text-center text-gray-500" aria-live="polite" role="status">
                  Regístrate o inicia sesión para realizar tu pedido. Tu carrito se mantendrá guardado.
                </p>
              </div>
            )}
          </div>
        )}
      </SheetContent>

      {/* Checkout Dialog */}
      <CheckoutDialog
        isOpen={isCheckoutOpen}
        onOpenChangeAction={setIsCheckoutOpen}
        cartItems={cartItems}
        onOrderPlacedAction={handleOrderPlaced}
      />

      {/* Confirmación de eliminación */}
      <AlertDialog open={!!itemToRemove} onOpenChange={(open) => !open && setItemToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este producto del carrito? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToRemove) {
                  onRemoveItemAction(itemToRemove);
                  setItemToRemove(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}

