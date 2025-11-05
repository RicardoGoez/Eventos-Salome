"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coffee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Verificar si viene del checkout
  const fromCheckout = searchParams.get("from") === "checkout";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Coffee className="h-12 w-12 text-primary" />
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
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
