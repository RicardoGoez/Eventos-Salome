"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coffee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Verificar si viene del checkout
  const fromCheckout = searchParams.get("from") === "checkout";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (!formData.nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }

    if (!formData.email.trim()) {
      setError("El email es requerido");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
          rol: "CLIENTE", // Los registros públicos siempre son clientes
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al registrar usuario");
        return;
      }

      // Después del registro, iniciar sesión automáticamente
      try {
        const loginResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok && loginData.usuario) {
          // Guardar usuario en localStorage
          localStorage.setItem("usuario", JSON.stringify(loginData.usuario));
          
          // Disparar evento para actualizar otros componentes
          window.dispatchEvent(new Event("authChange"));
          
          // Verificar si hay carrito guardado
          const savedCart = localStorage.getItem("cart");
          if (savedCart) {
            toast({
              title: "¡Bienvenido!",
              description: "Tu cuenta ha sido creada y tu carrito ha sido restaurado. Puedes continuar con tu pedido.",
            });
          } else {
            toast({
              title: "¡Registro exitoso!",
              description: "Tu cuenta ha sido creada correctamente.",
            });
          }

          // Redirigir según contexto
          if (fromCheckout) {
            // Si venía del checkout, volver a la página principal
            router.push("/");
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
        } else {
          // Si el login automático falla, redirigir a login
          toast({
            title: "¡Registro exitoso!",
            description: "Tu cuenta ha sido creada. Por favor inicia sesión.",
          });
          router.push("/login");
        }
      } catch (loginError) {
        // Si hay error en el login automático, redirigir a login
        toast({
          title: "¡Registro exitoso!",
          description: "Tu cuenta ha sido creada. Por favor inicia sesión.",
        });
        router.push("/login");
      }
    } catch (error) {
      setError("Error de conexión. Por favor intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Coffee className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">
            Crear Cuenta
          </CardTitle>
          <CardDescription className="text-center">
            {fromCheckout
              ? "Crea tu cuenta para realizar tu pedido. Tu carrito se mantendrá guardado."
              : "Regístrate para realizar pedidos"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input
                id="nombre"
                type="text"
                placeholder="Juan Pérez"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirma tu contraseña"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registrando..." : "Registrarse"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Inicia sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Coffee className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-2xl text-center">
              Cargando...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}

