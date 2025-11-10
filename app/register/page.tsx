"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

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
  const [fieldErrors, setFieldErrors] = useState<{ 
    nombre?: string; 
    email?: string; 
    password?: string; 
    confirmPassword?: string;
  }>({});
  const [touched, setTouched] = useState<{ 
    nombre: boolean; 
    email: boolean; 
    password: boolean; 
    confirmPassword: boolean;
  }>({ nombre: false, email: false, password: false, confirmPassword: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Verificar si viene del checkout
  const fromCheckout = searchParams.get("from") === "checkout";

  // Validación en tiempo real
  const validateNombre = (value: string): string => {
    if (!value.trim()) {
      return "El nombre es requerido";
    }
    if (value.trim().length < 2) {
      return "El nombre debe tener al menos 2 caracteres";
    }
    return "";
  };

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

  const validateConfirmPassword = (value: string, password: string): string => {
    if (!value) {
      return "Confirma tu contraseña";
    }
    if (value !== password) {
      return "Las contraseñas no coinciden";
    }
    return "";
  };

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
    
    if (touched[field]) {
      let error = "";
      switch (field) {
        case 'nombre':
          error = validateNombre(value);
          break;
        case 'email':
          error = validateEmail(value);
          break;
        case 'password':
          error = validatePassword(value);
          // Si cambia la contraseña, revalidar confirmPassword
          if (touched.confirmPassword && formData.confirmPassword) {
            const confirmError = validateConfirmPassword(formData.confirmPassword, value);
            setFieldErrors(prev => ({ ...prev, confirmPassword: confirmError }));
          }
          break;
        case 'confirmPassword':
          error = validateConfirmPassword(value, formData.password);
          break;
      }
      setFieldErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setTouched({ nombre: true, email: true, password: true, confirmPassword: true });
    
    // Validar todos los campos
    const nombreError = validateNombre(formData.nombre);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);
    
    if (nombreError || emailError || passwordError || confirmPasswordError) {
      setFieldErrors({
        nombre: nombreError,
        email: emailError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
      });
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
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center mb-2">
            <Logo size="2xl" shadow priority />
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
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre Completo <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Juan Pérez"
                  value={formData.nombre}
                  onChange={(e) => handleFieldChange('nombre', e.target.value)}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, nombre: true }));
                    const error = validateNombre(formData.nombre);
                    setFieldErrors(prev => ({ ...prev, nombre: error }));
                  }}
                  className={cn(
                    touched.nombre && fieldErrors.nombre && "border-destructive focus-visible:ring-destructive",
                    touched.nombre && !fieldErrors.nombre && formData.nombre && "border-success"
                  )}
                  aria-invalid={touched.nombre && !!fieldErrors.nombre}
                  aria-describedby={touched.nombre && fieldErrors.nombre ? "nombre-error" : undefined}
                  required
                />
                {touched.nombre && !fieldErrors.nombre && formData.nombre && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" aria-hidden="true" />
                )}
              </div>
              {touched.nombre && fieldErrors.nombre && (
                <p id="nombre-error" className="text-xs text-destructive flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  {fieldErrors.nombre}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, email: true }));
                    const error = validateEmail(formData.email);
                    setFieldErrors(prev => ({ ...prev, email: error }));
                  }}
                  className={cn(
                    touched.email && fieldErrors.email && "border-destructive focus-visible:ring-destructive",
                    touched.email && !fieldErrors.email && formData.email && "border-success"
                  )}
                  aria-invalid={touched.email && !!fieldErrors.email}
                  aria-describedby={touched.email && fieldErrors.email ? "email-error" : undefined}
                  required
                />
                {touched.email && !fieldErrors.email && formData.email && (
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
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, password: true }));
                    const error = validatePassword(formData.password);
                    setFieldErrors(prev => ({ ...prev, password: error }));
                  }}
                  className={cn(
                    "pr-10",
                    touched.password && fieldErrors.password && "border-destructive focus-visible:ring-destructive",
                    touched.password && !fieldErrors.password && formData.password && "border-success"
                  )}
                  aria-invalid={touched.password && !!fieldErrors.password}
                  aria-describedby={touched.password && fieldErrors.password ? "password-error" : undefined}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
                {touched.password && !fieldErrors.password && formData.password && (
                  <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-success" aria-hidden="true" />
                )}
              </div>
              {touched.password && fieldErrors.password && (
                <p id="password-error" className="text-xs text-destructive flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirmar Contraseña <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirma tu contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, confirmPassword: true }));
                    const error = validateConfirmPassword(formData.confirmPassword, formData.password);
                    setFieldErrors(prev => ({ ...prev, confirmPassword: error }));
                  }}
                  className={cn(
                    "pr-10",
                    touched.confirmPassword && fieldErrors.confirmPassword && "border-destructive focus-visible:ring-destructive",
                    touched.confirmPassword && !fieldErrors.confirmPassword && formData.confirmPassword && formData.confirmPassword === formData.password && "border-success"
                  )}
                  aria-invalid={touched.confirmPassword && !!fieldErrors.confirmPassword}
                  aria-describedby={touched.confirmPassword && fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showConfirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
                {touched.confirmPassword && !fieldErrors.confirmPassword && formData.confirmPassword && formData.confirmPassword === formData.password && (
                  <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-success" aria-hidden="true" />
                )}
              </div>
              {touched.confirmPassword && fieldErrors.confirmPassword && (
                <p id="confirmPassword-error" className="text-xs text-destructive flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  {fieldErrors.confirmPassword}
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
              disabled={loading || (touched.nombre && !!fieldErrors.nombre) || (touched.email && !!fieldErrors.email) || (touched.password && !!fieldErrors.password) || (touched.confirmPassword && !!fieldErrors.confirmPassword)}
              aria-label="Registrarse"
            >
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
              <Logo size="xl" className="animate-pulse" priority />
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

