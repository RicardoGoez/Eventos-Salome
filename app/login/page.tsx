"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({ email: false, password: false });
  
  // Verificar si viene del checkout
  const fromCheckout = searchParams.get("from") === "checkout";

  // Validación en tiempo real
  const validateEmail = (value: string): string => {
    if (!value.trim()) {
      return "El email es requerido";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "El email no es válido";
    }
    return "";
  };

  const validatePassword = (value: string): string => {
    if (!value) {
      return "La contraseña es requerida";
    }
    if (value.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres";
    }
    return "";
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched.email) {
      const error = validateEmail(value);
      setFieldErrors(prev => ({ ...prev, email: error }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      const error = validatePassword(value);
      setFieldErrors(prev => ({ ...prev, password: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setTouched({ email: true, password: true });
    
    // Validar todos los campos
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      setFieldErrors({ email: emailError, password: passwordError });
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      // Guardar usuario en localStorage (en producción usar cookies o JWT)
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      
      // Disparar evento para actualizar otros componentes
      window.dispatchEvent(new Event("authChange"));
      
      // Verificar si hay carrito guardado y restaurarlo
      const savedCart = localStorage.getItem("cart");
      if (savedCart && fromCheckout) {
        toast({
          title: "¡Bienvenido de vuelta!",
          description: "Tu carrito ha sido restaurado. Puedes continuar con tu pedido.",
        });
      }
      
      // Redirigir según contexto
      if (fromCheckout) {
        // Si venía del checkout, volver a la página principal (donde está el carrito)
        router.push("/");
      } else if (data.usuario.rol === "ADMIN") {
        router.push("/admin");
      } else if (data.usuario.rol === "COCINA") {
        router.push("/cocina");
      } else if (data.usuario.rol === "MESERO") {
        router.push("/mesero");
      } else {
        // Verificar si hay una ruta guardada de redirección
        const redirectPath = localStorage.getItem("redirectAfterLogin");
        if (redirectPath) {
          localStorage.removeItem("redirectAfterLogin");
          router.push(redirectPath);
        } else {
          router.push("/mi-cuenta");
        }
      }
    } catch (error) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-light p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center mb-2">
            <Logo size="2xl" shadow priority />
          </div>
          <CardTitle className="text-2xl text-center">
            Iniciar Sesión
          </CardTitle>
          <CardDescription className="text-center">
            {fromCheckout 
              ? "Inicia sesión para realizar tu pedido. Tu carrito se mantendrá guardado."
              : "Ingresa tus credenciales para continuar"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, email: true }));
                    const error = validateEmail(email);
                    setFieldErrors(prev => ({ ...prev, email: error }));
                  }}
                  className={cn(
                    touched.email && fieldErrors.email && "border-destructive focus-visible:ring-destructive",
                    touched.email && !fieldErrors.email && email && "border-success"
                  )}
                  aria-invalid={touched.email && !!fieldErrors.email}
                  aria-describedby={touched.email && fieldErrors.email ? "email-error" : undefined}
                  required
                />
                {touched.email && !fieldErrors.email && email && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" aria-hidden="true" />
                )}
              </div>
              {touched.email && fieldErrors.email && (
                <p id="email-error" className="text-xs text-destructive flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  {fieldErrors.email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Contraseña <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, password: true }));
                    const error = validatePassword(password);
                    setFieldErrors(prev => ({ ...prev, password: error }));
                  }}
                  className={cn(
                    touched.password && fieldErrors.password && "border-destructive focus-visible:ring-destructive",
                    touched.password && !fieldErrors.password && password && "border-success"
                  )}
                  aria-invalid={touched.password && !!fieldErrors.password}
                  aria-describedby={touched.password && fieldErrors.password ? "password-error" : undefined}
                  required
                />
                {touched.password && !fieldErrors.password && password && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" aria-hidden="true" />
                )}
              </div>
              {touched.password && fieldErrors.password && (
                <p id="password-error" className="text-xs text-destructive flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  {fieldErrors.password}
                </p>
              )}
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded flex items-start gap-2" role="alert">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full focus:ring-2 focus:ring-primary" 
              disabled={loading || (touched.email && !!fieldErrors.email) || (touched.password && !!fieldErrors.password)}
              aria-label="Iniciar sesión"
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>

            <div className="text-center text-sm text-gray-600 pt-2">
              ¿No tienes cuenta?{" "}
              <Link 
                href={fromCheckout ? "/register?from=checkout" : "/register"} 
                className="text-primary hover:underline font-medium"
              >
                Regístrate aquí
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-light p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Logo size="xl" className="animate-pulse" priority />
            </div>
            <CardTitle className="text-2xl text-center">
              Cargando...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
