"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Shield, User as UserIcon, UserCheck } from "lucide-react";
import { Usuario, RolUsuario } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";

export default function UsuariosPage() {
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: RolUsuario.CLIENTE,
    activo: true,
  });

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      const response = await fetch("/api/usuarios");
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = selectedUsuario 
        ? `/api/usuarios/${selectedUsuario.id}`
        : "/api/usuarios";
      
      const method = selectedUsuario ? "PUT" : "POST";
      const body = selectedUsuario 
        ? { ...formData, password: formData.password || undefined }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Error al guardar usuario",
        });
        return;
      }

      toast({
        variant: "success",
        title: "Éxito",
        description: selectedUsuario
          ? "Usuario actualizado correctamente"
          : "Usuario creado correctamente",
      });

      setIsDialogOpen(false);
      resetForm();
      loadUsuarios();
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al guardar usuario",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      password: "",
      rol: usuario.rol,
      activo: usuario.activo,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUsuario) return;

    try {
      const response = await fetch(`/api/usuarios/${selectedUsuario.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok && response.status !== 200) {
        // Error real (no soft delete)
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Error al eliminar usuario",
        });
        return;
      }

      // Éxito (puede ser eliminación física o soft delete)
      if (data.softDeleted || data.message?.includes("marcado como inactivo")) {
        toast({
          variant: "default",
          title: "Usuario deshabilitado",
          description: "El usuario fue marcado como inactivo porque tiene registros asociados (entradas de inventario, cierres de caja o actividades de auditoría). Puedes reactivarlo editando el usuario.",
        });
      } else {
        toast({
          variant: "success",
          title: "Éxito",
          description: data.message || "Usuario eliminado correctamente",
        });
      }

      setIsDeleteDialogOpen(false);
      setSelectedUsuario(null);
      loadUsuarios();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al eliminar usuario",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      email: "",
      password: "",
      rol: RolUsuario.CLIENTE,
      activo: true,
    });
    setSelectedUsuario(null);
  };

  const getRolIcon = (rol: RolUsuario) => {
    switch (rol) {
      case RolUsuario.ADMIN:
        return <Shield className="h-4 w-4 text-danger" />;
      case RolUsuario.MESERO:
        return <UserCheck className="h-4 w-4 text-info" />;
      case RolUsuario.COCINA:
        return <UserCheck className="h-4 w-4 text-warning" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-medium" />;
    }
  };

  const getRolColor = (rol: RolUsuario) => {
    switch (rol) {
      case RolUsuario.ADMIN:
        return "bg-danger/20 text-danger";
      case RolUsuario.MESERO:
        return "bg-info/20 text-info";
      case RolUsuario.COCINA:
        return "bg-warning/20 text-warning";
      default:
        return "bg-gray-medium/20 text-gray-medium";
    }
  };

  return (
    <div className="flex min-h-screen lg:h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-light p-4 lg:p-8 lg:ml-0">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-dark">Gestión de Usuarios</h1>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {selectedUsuario ? "Editar Usuario" : "Nuevo Usuario"}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedUsuario 
                        ? "Actualiza la información del usuario"
                        : "Crea un nuevo usuario en el sistema"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">
                        Contraseña {selectedUsuario && "(Dejar vacío para mantener la actual)"}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        required={!selectedUsuario}
                        minLength={6}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="rol">Rol</Label>
                      <Select
                        value={formData.rol}
                        onValueChange={(value) =>
                          setFormData({ ...formData, rol: value as RolUsuario })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={RolUsuario.ADMIN}>Administrador</SelectItem>
                          <SelectItem value={RolUsuario.MESERO}>Mesero</SelectItem>
                          <SelectItem value={RolUsuario.COCINA}>Cocina</SelectItem>
                          <SelectItem value={RolUsuario.CLIENTE}>Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="activo"
                        checked={formData.activo}
                        onChange={(e) =>
                          setFormData({ ...formData, activo: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="activo" className="cursor-pointer">
                        Usuario activo
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {selectedUsuario ? "Actualizar" : "Crear"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuarios</CardTitle>
              <CardDescription>
                Gestiona los usuarios del sistema de Eventos Salome
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No hay usuarios registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    usuarios.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getRolIcon(usuario.rol)}
                            {usuario.nombre}
                          </div>
                        </TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getRolColor(usuario.rol)}`}>
                            {usuario.rol === RolUsuario.ADMIN && "Administrador"}
                            {usuario.rol === RolUsuario.MESERO && "Mesero"}
                            {usuario.rol === RolUsuario.COCINA && "Cocina"}
                            {usuario.rol === RolUsuario.CLIENTE && "Cliente"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              usuario.activo
                                ? "bg-success/20 text-success"
                                : "bg-gray-medium/20 text-gray-medium"
                            }`}
                          >
                            {usuario.activo ? "Activo" : "Inactivo"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(usuario.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(usuario)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUsuario(usuario);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-danger" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{" "}
                  <strong>{selectedUsuario?.nombre}</strong> del sistema.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-danger hover:bg-danger/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
}

