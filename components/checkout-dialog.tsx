"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditCard, DollarSign, Banknote, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Producto, MetodoPago } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import { validateCardNumber, validateExpiryDate, validateCVV, validateCardName, detectCardType } from "@/lib/utils/validation";
import { formatCOP } from "@/lib/utils";

interface CartItem {
  producto: Producto;
  cantidad: number;
}

interface CheckoutDialogProps {
  isOpen: boolean;
  onOpenChangeAction: (open: boolean) => void;
  cartItems: CartItem[];
  onOrderPlacedAction: () => void;
}

const metodoPagoLabels: Record<MetodoPago, string> = {
  [MetodoPago.EFECTIVO]: "Efectivo",
  [MetodoPago.TARJETA]: "Tarjeta",
  [MetodoPago.TRANSFERENCIA]: "Transferencia",
};

const metodoPagoIcons: Record<MetodoPago, typeof CreditCard> = {
  [MetodoPago.EFECTIVO]: DollarSign,
  [MetodoPago.TARJETA]: CreditCard,
  [MetodoPago.TRANSFERENCIA]: Banknote,
};

export function CheckoutDialog({
  isOpen,
  onOpenChangeAction,
  cartItems,
  onOrderPlacedAction,
}: CheckoutDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(MetodoPago.EFECTIVO);
  const [notas, setNotas] = useState("");
  const [datosTarjeta, setDatosTarjeta] = useState({
    numero: "",
    nombre: "",
    vencimiento: "",
    cvv: "",
  });
  const [datosTransferencia, setDatosTransferencia] = useState({
    referencia: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"payment" | "processing" | "success">("payment");
  const [cardErrors, setCardErrors] = useState({
    numero: "",
    nombre: "",
    vencimiento: "",
    cvv: "",
  });
  const [retryCount, setRetryCount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<any | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [recoProductos, setRecoProductos] = useState<Producto[]>([]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.producto.precio * item.cantidad,
    0
  );
  const descuento = useMemo(() => {
    if (!coupon) return 0;
    // Soportar porcentaje o monto fijo
    const porcentaje = coupon.porcentaje ?? coupon.porcentaje_descuento ?? coupon.percent ?? 0;
    const monto = coupon.monto ?? coupon.monto_descuento ?? coupon.amount ?? 0;
    const por = typeof porcentaje === "number" ? (subtotal * (porcentaje / 100)) : 0;
    const mon = typeof monto === "number" ? monto : 0;
    return Math.min(subtotal, Math.max(por, mon));
  }, [coupon, subtotal]);
  const subtotalDesc = Math.max(0, subtotal - descuento);
  const iva = subtotalDesc * 0.16;
  const total = subtotalDesc + iva;

  useEffect(() => {
    // Recomendaciones básicas: productos de la misma categoría del primero
    const loadRecos = async () => {
      try {
        const cats = Array.from(new Set(cartItems.map(ci => ci.producto.categoria)));
        const res = await fetch("/api/productos");
        const data = await res.json();
        const idsEnCarrito = new Set(cartItems.map(ci => ci.producto.id));
        const recos = (Array.isArray(data) ? data : [])
          .filter((p: Producto) => cats.includes(p.categoria) && !idsEnCarrito.has(p.id))
          .slice(0, 4);
        setRecoProductos(recos);
      } catch {}
    };
    if (cartItems.length > 0) loadRecos();
  }, [cartItems]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const res = await fetch(`/api/descuentos?codigo=${encodeURIComponent(couponCode.trim())}`);
      const data = await res.json();
      const found = Array.isArray(data) ? data[0] : data;
      if (!found) {
        setCoupon(null);
        toast({ title: "Cupón inválido", description: "Verifica el código o su vigencia", variant: "destructive" });
      } else {
        setCoupon(found);
        toast({ title: "Cupón aplicado", description: "El descuento se reflejó en el total" });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo validar el cupón", variant: "destructive" });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleAddReco = (p: Producto) => {
    try {
      const saved = localStorage.getItem("cart");
      let cart: Array<{ producto: Producto; cantidad: number }> = saved ? JSON.parse(saved) : [];
      const ex = cart.find(c => c.producto.id === p.id);
      if (ex) ex.cantidad += 1; else cart.push({ producto: p, cantidad: 1 });
      localStorage.setItem("cart", JSON.stringify(cart));
      toast({ title: "Agregado", description: `${p.nombre} añadido al carrito` });
    } catch {}
  };

  const handleSubmit = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos al carrito antes de continuar",
        variant: "destructive",
      });
      return;
    }

    // Validar datos de pago según el método
    if (metodoPago === MetodoPago.TARJETA) {
      const errors: any = {};
      let hasErrors = false;

      // Validar número de tarjeta
      if (!datosTarjeta.numero || datosTarjeta.numero.replace(/\s/g, "").length < 13) {
        errors.numero = "El número de tarjeta es requerido";
        hasErrors = true;
      } else if (!validateCardNumber(datosTarjeta.numero)) {
        errors.numero = "El número de tarjeta no es válido";
        hasErrors = true;
      }

      // Validar nombre
      if (!datosTarjeta.nombre || !validateCardName(datosTarjeta.nombre)) {
        errors.nombre = "El nombre debe tener al menos 3 caracteres";
        hasErrors = true;
      }

      // Validar fecha de vencimiento
      const expiryValidation = validateExpiryDate(datosTarjeta.vencimiento);
      if (!datosTarjeta.vencimiento || !expiryValidation.valid) {
        errors.vencimiento = expiryValidation.error || "La fecha de vencimiento no es válida";
        hasErrors = true;
      }

      // Validar CVV
      if (!datosTarjeta.cvv || !validateCVV(datosTarjeta.cvv)) {
        errors.cvv = "El CVV debe tener 3 o 4 dígitos";
        hasErrors = true;
      }

      if (hasErrors) {
        setCardErrors(errors);
        toast({
          title: "Datos de tarjeta inválidos",
          description: "Por favor corrige los errores en el formulario",
          variant: "destructive",
        });
        return;
      }

      setCardErrors({ numero: "", nombre: "", vencimiento: "", cvv: "" });
    }

    if (metodoPago === MetodoPago.TRANSFERENCIA) {
      if (!datosTransferencia.referencia) {
        toast({
          title: "Referencia requerida",
          description: "Por favor ingresa el número de referencia de la transferencia",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessing(true);
    setStep("processing");

    try {
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
      
      const items = cartItems.map((item) => ({
        productoId: item.producto.id,
        cantidad: item.cantidad,
      }));

      const pedidoData: any = {
        items,
        clienteId: usuario.id,
        clienteNombre: usuario.nombre,
        metodoPago,
        notas: notas.trim() || undefined,
      };

      // Agregar datos de pago según el método
      if (metodoPago === MetodoPago.TRANSFERENCIA) {
        pedidoData.notas = (pedidoData.notas ? pedidoData.notas + "\n" : "") + 
          `Referencia de transferencia: ${datosTransferencia.referencia}`;
      }

      // Intentar con retry automático
      let response;
      let lastError;
      const maxRetries = 3;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          response = await fetch("/api/pedidos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pedidoData),
          });

          if (response.ok) {
            break; // Éxito, salir del loop
          }

          const errorData = await response.json();
          lastError = new Error(errorData.error || "Error al crear el pedido");

          // Si no es un error de red, no reintentar
          if (response.status >= 400 && response.status < 500) {
            throw lastError;
          }

          // Esperar antes de reintentar (exponential backoff)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            setRetryCount(attempt + 1);
          }
        } catch (error: any) {
          lastError = error;
          // Si es un error de red y aún hay intentos, continuar
          if (attempt < maxRetries && error.message.includes("fetch")) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            setRetryCount(attempt + 1);
            continue;
          }
          throw error;
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error("Error al crear el pedido después de varios intentos");
      }

      const pedido = await response.json();
      
      setStep("success");
      setRetryCount(0);
      
      setTimeout(() => {
        onOrderPlacedAction();
        onOpenChangeAction(false);
        setStep("payment");
        setMetodoPago(MetodoPago.EFECTIVO);
        setNotas("");
        setDatosTarjeta({ numero: "", nombre: "", vencimiento: "", cvv: "" });
        setDatosTransferencia({ referencia: "" });
        setCardErrors({ numero: "", nombre: "", vencimiento: "", cvv: "" });
        
        toast({
          title: "¡Pedido realizado!",
          description: `Tu pedido #${pedido.numero} ha sido creado exitosamente`,
        });
        
        router.push(`/seguimiento/${pedido.id}`);
      }, 2000);
    } catch (error: any) {
      setStep("payment");
      setRetryCount(0);
      
      const errorMessage = error.message || "No se pudo procesar el pedido";
      const isNetworkError = errorMessage.includes("fetch") || errorMessage.includes("network");
      
      toast({
        title: isNetworkError ? "Error de conexión" : "Error",
        description: isNetworkError 
          ? "No se pudo conectar con el servidor. Por favor verifica tu conexión a internet e intenta nuevamente."
          : errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const MetodoPagoIcon = metodoPagoIcons[metodoPago];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">Proceso de Pago</DialogTitle>
          <DialogDescription>
            Completa la información para finalizar tu pedido
          </DialogDescription>
        </DialogHeader>

        {step === "payment" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Resumen del Pedido */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen del Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cupón */}
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label htmlFor="coupon">Cupón de descuento</Label>
                      <Input id="coupon" placeholder="INGRESA TU CUPÓN" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                    </div>
                    <Button onClick={applyCoupon} disabled={applyingCoupon} className="min-w-[140px]">{applyingCoupon ? "Aplicando..." : "Aplicar"}</Button>
                  </div>

                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item.producto.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{item.producto.nombre}</p>
                          <p className="text-sm text-gray-700">
                            {item.cantidad} x {formatCOP(item.producto.precio)}
                          </p>
                        </div>
                        <p className="font-medium">
                          {formatCOP(item.producto.precio * item.cantidad)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Subtotal</span>
                      <span className="font-medium">{formatCOP(subtotal)}</span>
                    </div>
                    {descuento > 0 && (
                      <div className="flex justify-between text-success">
                        <span>Descuento</span>
                        <span>- {formatCOP(descuento)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-700">IVA (16%)</span>
                      <span className="font-medium">{formatCOP(iva)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold pt-2">
                      <span>Total</span>
                      <span className="text-primary">{formatCOP(total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recomendaciones */}
              {recoProductos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recomendados para ti</CardTitle>
                    <CardDescription>Frecuentemente comprados juntos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {recoProductos.map((p) => (
                        <div key={p.id} className="flex items-center justify-between border rounded-lg p-3">
                          <div>
                            <p className="font-medium line-clamp-1">{p.nombre}</p>
                            <p className="text-sm text-gray-700">{formatCOP(p.precio)}</p>
                          </div>
                          <Button size="sm" onClick={() => handleAddReco(p)}>Agregar</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Formulario de Pago */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Método de Pago</CardTitle>
                  <CardDescription>Selecciona cómo deseas pagar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="metodoPago">Método</Label>
                    <Select
                      value={metodoPago}
                      onValueChange={(value) => setMetodoPago(value as MetodoPago)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(MetodoPago).map((metodo) => {
                          const Icon = metodoPagoIcons[metodo];
                          return (
                            <SelectItem key={metodo} value={metodo}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {metodoPagoLabels[metodo]}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Formulario según método de pago */}
                  {metodoPago === MetodoPago.TARJETA && (
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Datos de Tarjeta</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="numeroTarjeta">Número de Tarjeta</Label>
                          <Input
                            id="numeroTarjeta"
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            value={datosTarjeta.numero}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\s/g, "");
                              const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
                              setDatosTarjeta({ ...datosTarjeta, numero: formatted });
                              // Validar en tiempo real
                              if (formatted.replace(/\s/g, "").length >= 13) {
                                if (validateCardNumber(formatted)) {
                                  setCardErrors({ ...cardErrors, numero: "" });
                                } else if (formatted.replace(/\s/g, "").length >= 13) {
                                  setCardErrors({ ...cardErrors, numero: "Número de tarjeta inválido" });
                                }
                              } else {
                                setCardErrors({ ...cardErrors, numero: "" });
                              }
                            }}
                            className={cardErrors.numero ? "border-destructive" : ""}
                          />
                          {cardErrors.numero && (
                            <p className="text-xs text-destructive">{cardErrors.numero}</p>
                          )}
                          {datosTarjeta.numero.replace(/\s/g, "").length >= 13 && !cardErrors.numero && (
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {detectCardType(datosTarjeta.numero)}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nombreTarjeta">Nombre en la Tarjeta</Label>
                          <Input
                            id="nombreTarjeta"
                            type="text"
                            placeholder="JUAN PÉREZ"
                            value={datosTarjeta.nombre}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase();
                              setDatosTarjeta({ ...datosTarjeta, nombre: value });
                              if (value.length >= 3 && validateCardName(value)) {
                                setCardErrors({ ...cardErrors, nombre: "" });
                              } else if (value.length > 0) {
                                setCardErrors({ ...cardErrors, nombre: "Nombre inválido" });
                              } else {
                                setCardErrors({ ...cardErrors, nombre: "" });
                              }
                            }}
                            className={cardErrors.nombre ? "border-destructive" : ""}
                          />
                          {cardErrors.nombre && (
                            <p className="text-xs text-destructive">{cardErrors.nombre}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="vencimiento">Vencimiento</Label>
                            <Input
                              id="vencimiento"
                              type="text"
                              placeholder="MM/AA"
                              maxLength={5}
                              value={datosTarjeta.vencimiento}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, "");
                                if (value.length >= 2) {
                                  value = value.slice(0, 2) + "/" + value.slice(2, 4);
                                }
                                setDatosTarjeta({ ...datosTarjeta, vencimiento: value });
                                if (value.length === 5) {
                                  const validation = validateExpiryDate(value);
                                  if (validation.valid) {
                                    setCardErrors({ ...cardErrors, vencimiento: "" });
                                  } else {
                                    setCardErrors({ ...cardErrors, vencimiento: validation.error || "" });
                                  }
                                } else {
                                  setCardErrors({ ...cardErrors, vencimiento: "" });
                                }
                              }}
                              className={cardErrors.vencimiento ? "border-destructive" : ""}
                            />
                            {cardErrors.vencimiento && (
                              <p className="text-xs text-destructive">{cardErrors.vencimiento}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              type="text"
                              placeholder="123"
                              maxLength={4}
                              value={datosTarjeta.cvv}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "");
                                setDatosTarjeta({ ...datosTarjeta, cvv: value });
                                if (value.length >= 3 && validateCVV(value)) {
                                  setCardErrors({ ...cardErrors, cvv: "" });
                                } else if (value.length > 0) {
                                  setCardErrors({ ...cardErrors, cvv: "CVV inválido" });
                                } else {
                                  setCardErrors({ ...cardErrors, cvv: "" });
                                }
                              }}
                              className={cardErrors.cvv ? "border-destructive" : ""}
                            />
                            {cardErrors.cvv && (
                              <p className="text-xs text-destructive">{cardErrors.cvv}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {metodoPago === MetodoPago.TRANSFERENCIA && (
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 mb-4">
                        <Banknote className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Datos de Transferencia</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-semibold text-blue-900 mb-2">Información de la cuenta:</p>
                          <p className="text-sm text-blue-800">Banco: Banco Ejemplo</p>
                          <p className="text-sm text-blue-800">Cuenta: 1234-5678-9012-3456</p>
                          <p className="text-sm text-blue-800">CLABE: 123456789012345678</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="referencia">Número de Referencia</Label>
                          <Input
                            id="referencia"
                            type="text"
                            placeholder="Ingresa el número de referencia de tu transferencia"
                            value={datosTransferencia.referencia}
                            onChange={(e) =>
                              setDatosTransferencia({ ...datosTransferencia, referencia: e.target.value })
                            }
                          />
                          <p className="text-xs text-gray-600">
                            Encuentra este número en el comprobante de tu transferencia bancaria
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {metodoPago === MetodoPago.EFECTIVO && (
                    <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold text-green-900">Pago en Efectivo</h3>
                      </div>
                      <p className="text-sm text-green-800">
                        El pago se realizará al momento de la entrega o recogida del pedido.
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="notas">Notas adicionales (opcional)</Label>
                    <Textarea
                      id="notas"
                      placeholder="Instrucciones especiales, alergias, etc."
                      rows={3}
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <MetodoPagoIcon className="mr-2 h-4 w-4" />
                    Confirmar Pedido - {formatCOP(total)}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <h3 className="text-xl font-semibold">Procesando tu pedido...</h3>
            {retryCount > 0 && (
              <p className="text-sm text-warning">
                Reintentando... (Intento {retryCount + 1}/4)
              </p>
            )}
            <p className="text-gray-700">Por favor espera un momento</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">¡Pedido realizado exitosamente!</h3>
            <p className="text-gray-700">Redirigiendo a la página de seguimiento...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

