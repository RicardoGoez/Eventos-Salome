"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumb } from "@/components/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Search, Upload, X, Image as ImageIcon, Layers } from "lucide-react";
import { Producto, CategoriaProducto, VarianteProducto } from "@/types/domain";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AdminWrapper } from "@/components/admin-wrapper";
import { useAdminData } from "@/contexts/admin-data-context";
import { Logo } from "@/components/logo";
import { formatCOP } from "@/lib/utils";

function ProductosPageContent() {
  const { toast } = useToast();
  const {
    productos,
    loadingProductos,
    loadProductos,
    updateProducto,
  } = useAdminData();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    categoria: CategoriaProducto.COMIDA_RAPIDA,
    precio: 0,
    costo: 0,
    disponible: true,
    imagen: "",
  });
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isVariantesDialogOpen, setIsVariantesDialogOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [variantes, setVariantes] = useState<VarianteProducto[]>([]);
  const [loadingVariantes, setLoadingVariantes] = useState(false);
  const [isVarianteDialogOpen, setIsVarianteDialogOpen] = useState(false);
  const [editingVariante, setEditingVariante] = useState<VarianteProducto | null>(null);
  const [varianteFormData, setVarianteFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: 0,
    costo: 0,
    disponible: true,
    imagen: "",
    orden: 0,
  });
  const [varianteImagePreview, setVarianteImagePreview] = useState<string>("");
  const [uploadingVarianteImage, setUploadingVarianteImage] = useState(false);

  // Los productos se cargan desde el contexto
  // Filtrar productos (memoizado)
  const productosFiltrados = useMemo(() => {
    if (!Array.isArray(productos)) return [];

    let filtered = productos;

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nombre.toLowerCase().includes(query) ||
          p.descripcion?.toLowerCase().includes(query)
      );
    }

    // Filtrar por categoría
    if (categoriaFiltro !== "all") {
      filtered = filtered.filter((p) => p.categoria === categoriaFiltro);
    }

    return filtered;
  }, [productos, categoriaFiltro, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = editingProducto
        ? await fetch(`/api/productos/${editingProducto.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          })
        : await fetch("/api/productos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });

      if (!response.ok) {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Error al guardar producto",
        });
        return;
      }

      toast({
        variant: "success",
        title: "Éxito",
        description: editingProducto
          ? "Producto actualizado correctamente"
          : "Producto creado correctamente",
      });

      setIsDialogOpen(false);
      setEditingProducto(null);
      setFormData({
        nombre: "",
        descripcion: "",
        categoria: CategoriaProducto.COMIDA_RAPIDA,
        precio: 0,
        costo: 0,
        disponible: true,
        imagen: "",
      });
      setImagePreview("");
      loadProductos();
      setSearchQuery("");
      setCategoriaFiltro("all");
    } catch (error) {
      console.error("Error al guardar producto:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al guardar producto",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (producto: Producto) => {
    setEditingProducto(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || "",
      categoria: producto.categoria,
      precio: producto.precio,
      costo: producto.costo,
      disponible: producto.disponible,
      imagen: producto.imagen || "",
    });
    setImagePreview(producto.imagen || "");
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El archivo debe ser una imagen",
      });
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La imagen no debe exceder 5MB",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Error al subir la imagen",
        });
        return;
      }

      const data = await response.json();
      setFormData({ ...formData, imagen: data.url });
      setImagePreview(data.url);

      toast({
        variant: "success",
        title: "Éxito",
        description: "Imagen subida correctamente",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al subir la imagen",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, imagen: "" });
    setImagePreview("");
  };

  const handleManageVariantes = async (producto: Producto) => {
    setProductoSeleccionado(producto);
    setIsVariantesDialogOpen(true);
    await loadVariantes(producto.id);
  };

  const loadVariantes = async (productoId: string) => {
    setLoadingVariantes(true);
    try {
      const response = await fetch(`/api/variantes-producto?productoId=${productoId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setVariantes(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error loading variantes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudieron cargar las opciones",
      });
      setVariantes([]);
    } finally {
      setLoadingVariantes(false);
    }
  };

  const handleAddVariante = () => {
    setEditingVariante(null);
    setVarianteFormData({
      nombre: "",
      descripcion: "",
      precio: 0,
      costo: 0,
      disponible: true,
      imagen: "",
      orden: variantes.length,
    });
    setVarianteImagePreview("");
    setIsVarianteDialogOpen(true);
  };

  const handleEditVariante = (variante: VarianteProducto) => {
    setEditingVariante(variante);
    setVarianteFormData({
      nombre: variante.nombre,
      descripcion: variante.descripcion || "",
      precio: variante.precio,
      costo: variante.costo,
      disponible: variante.disponible,
      imagen: variante.imagen || "",
      orden: variante.orden,
    });
    setVarianteImagePreview(variante.imagen || "");
    setIsVarianteDialogOpen(true);
  };

  const handleSaveVariante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoSeleccionado) return;

    // Validar campos requeridos
    if (!varianteFormData.nombre.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre de la opción es requerido",
      });
      return;
    }

    if (varianteFormData.precio <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El precio debe ser mayor a 0",
      });
      return;
    }

    setLoadingVariantes(true);
    try {
      const url = editingVariante
        ? `/api/variantes-producto/${editingVariante.id}`
        : "/api/variantes-producto";
      const method = editingVariante ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoId: productoSeleccionado.id,
          nombre: varianteFormData.nombre.trim(),
          descripcion: varianteFormData.descripcion.trim() || null,
          precio: varianteFormData.precio,
          costo: varianteFormData.costo || 0,
          disponible: varianteFormData.disponible,
          imagen: varianteFormData.imagen || null,
          orden: varianteFormData.orden || 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar variante");
      }

      toast({
        variant: "success",
        title: "Éxito",
        description: editingVariante
          ? "Opción actualizada correctamente"
          : "Opción creada correctamente",
      });

      setIsVarianteDialogOpen(false);
      setEditingVariante(null);
      setVarianteImagePreview("");
      await loadVariantes(productoSeleccionado.id);
      loadProductos(); // Recargar productos para actualizar tiene_variantes
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al guardar opción",
      });
    } finally {
      setLoadingVariantes(false);
    }
  };

  const handleVarianteImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El archivo debe ser una imagen",
      });
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La imagen no debe exceder 5MB",
      });
      return;
    }

    setUploadingVarianteImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Error al subir la imagen",
        });
        return;
      }

      const data = await response.json();
      setVarianteFormData({ ...varianteFormData, imagen: data.url });
      setVarianteImagePreview(data.url);

      toast({
        variant: "success",
        title: "Éxito",
        description: "Imagen subida correctamente",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al subir la imagen",
      });
    } finally {
      setUploadingVarianteImage(false);
    }
  };

  const handleRemoveVarianteImage = () => {
    setVarianteFormData({ ...varianteFormData, imagen: "" });
    setVarianteImagePreview("");
  };

  const handleDeleteVariante = async (id: string) => {
    if (!productoSeleccionado) return;

    try {
      const response = await fetch(`/api/variantes-producto/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar variante");
      }

      toast({
        variant: "success",
        title: "Éxito",
        description: "Opción eliminada correctamente",
      });

      await loadVariantes(productoSeleccionado.id);
      loadProductos(); // Recargar productos para actualizar tiene_variantes
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al eliminar opción",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/productos/${id}`, { method: "DELETE" });
      const data = await response.json();
      
      if (!response.ok && response.status !== 200) {
        // Error real (no soft delete)
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Error al eliminar producto",
        });
        return;
      }

      // Éxito (puede ser eliminación física o soft delete)
      if (data.softDeleted || data.message?.includes("marcado como no disponible")) {
        toast({
          variant: "default",
          title: "Producto deshabilitado",
          description: "El producto fue marcado como no disponible porque está incluido en pedidos existentes. Puedes reactivarlo editando el producto.",
        });
      } else {
        toast({
          variant: "success",
          title: "Éxito",
          description: data.message || "Producto eliminado correctamente",
        });
      }
      
      loadProductos();
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al eliminar producto",
      });
    }
  };

  return (
    <div className="flex min-h-screen lg:h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-light p-4 lg:p-8 lg:ml-0" role="main" id="main-content">
        <div className="mx-auto max-w-7xl">
          <Breadcrumb items={[{ label: "Productos" }]} />
          <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Logo size="lg" shadow />
              <h1 className="text-2xl sm:text-3xl font-bold text-dark">Productos</h1>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full md:w-64"
                />
              </div>
              <Select
                value={categoriaFiltro}
                onValueChange={setCategoriaFiltro}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {Object.values(CategoriaProducto).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingProducto(null);
                  setFormData({
                    nombre: "",
                    descripcion: "",
                    categoria: CategoriaProducto.COMIDA_RAPIDA,
                    precio: 0,
                    costo: 0,
                    disponible: true,
                    imagen: "",
                  });
                  setImagePreview("");
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingProducto ? "Editar Producto" : "Nuevo Producto"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingProducto
                        ? "Modifica la información del producto"
                        : "Completa la información del nuevo producto"}
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
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Input
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            descripcion: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="categoria">Categoría</Label>
                      <select
                        id="categoria"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={formData.categoria}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            categoria: e.target.value as CategoriaProducto,
                          })
                        }
                      >
                        {Object.values(CategoriaProducto).map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="imagen">Imagen del Producto</Label>
                      <div className="space-y-2">
                        {imagePreview || formData.imagen ? (
                          <div className="relative inline-block">
                            <img
                              src={imagePreview || formData.imagen}
                              alt="Vista previa"
                              className="h-32 w-32 rounded-lg object-cover border border-gray-300"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                              onClick={handleRemoveImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-full">
                            <label
                              htmlFor="imagen-upload"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-gray-600" />
                                <p className="mb-2 text-sm text-gray-700">
                                  <span className="font-semibold">Click para subir</span> o arrastra y suelta
                                </p>
                                <p className="text-xs text-gray-600">
                                  PNG, JPG, WEBP (MAX. 5MB)
                                </p>
                              </div>
                              <input
                                id="imagen-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploadingImage}
                              />
                            </label>
                          </div>
                        )}
                        {uploadingImage && (
                          <p className="text-sm text-muted-foreground">
                            Subiendo imagen...
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="precio">Precio</Label>
                      <Input
                        id="precio"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.precio}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            precio: parseFloat(e.target.value) || 0,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="costo">Costo</Label>
                      <Input
                        id="costo"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.costo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            costo: parseFloat(e.target.value) || 0,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="disponible"
                        checked={formData.disponible}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            disponible: e.target.checked,
                          })
                        }
                        className="h-4 w-4"
                      />
                      <Label htmlFor="disponible">Disponible</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Guardando..." : "Guardar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Productos</CardTitle>
              <CardDescription>
                Gestiona los productos de Eventos Salome
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imagen</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        {productos.length === 0
                          ? "No hay productos registrados"
                          : "No se encontraron productos con los filtros aplicados"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    productosFiltrados.map((producto) => (
                      <TableRow key={producto.id}>
                        <TableCell>
                          {producto.imagen ? (
                            <img
                              src={producto.imagen}
                              alt={producto.nombre}
                              className="h-12 w-12 rounded object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {producto.nombre}
                        </TableCell>
                        <TableCell>{producto.categoria}</TableCell>
                        <TableCell>{formatCOP(producto.precio)}</TableCell>
                        <TableCell>{formatCOP(producto.costo)}</TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              producto.disponible
                                ? "bg-success/20 text-success"
                                : "bg-gray-medium/20 text-gray-medium"
                            }`}
                          >
                            {producto.disponible ? "Disponible" : "No disponible"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleManageVariantes(producto)}
                              title="Gestionar opciones"
                            >
                              <Layers className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(producto)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Se eliminará permanentemente el producto &quot;{producto.nombre}&quot;.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(producto.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {productosFiltrados.length > 0 && productos.length > productosFiltrados.length && (
            <div className="mt-4 text-sm text-gray-600">
              Mostrando {productosFiltrados.length} de {productos.length} productos
            </div>
          )}
        </div>

        {/* Dialog para gestionar opciones */}
        <Dialog open={isVariantesDialogOpen} onOpenChange={setIsVariantesDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Opciones de {productoSeleccionado?.nombre}
              </DialogTitle>
              <DialogDescription>
                Gestiona las opciones de este producto (ej: tamaños, sabores, tipos)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={handleAddVariante}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Opción
                </Button>
              </div>
              {loadingVariantes ? (
                <div className="text-center py-8">Cargando opciones...</div>
              ) : variantes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay opciones. Agrega una para que los clientes puedan elegir.
                </div>
              ) : (
                <div className="space-y-2">
                  {variantes.map((variante) => (
                    <div
                      key={variante.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-semibold">{variante.nombre}</div>
                        {variante.descripcion && (
                          <div className="text-sm text-gray-600">{variante.descripcion}</div>
                        )}
                        <div className="flex gap-4 mt-2 text-sm">
                          <span>Precio: {formatCOP(variante.precio)}</span>
                          <span>Costo: {formatCOP(variante.costo)}</span>
                          <span
                            className={
                              variante.disponible
                                ? "text-success"
                                : "text-gray-medium"
                            }
                          >
                            {variante.disponible ? "Disponible" : "No disponible"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditVariante(variante)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar opción?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará la opción &quot;{variante.nombre}&quot;.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteVariante(variante.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para agregar/editar opción */}
        <Dialog open={isVarianteDialogOpen} onOpenChange={setIsVarianteDialogOpen}>
          <DialogContent>
            <form onSubmit={handleSaveVariante}>
              <DialogHeader>
                <DialogTitle>
                  {editingVariante ? "Editar Opción" : "Nueva Opción"}
                </DialogTitle>
                <DialogDescription>
                  {editingVariante
                    ? "Modifica la información de la opción"
                    : "Completa la información de la nueva opción"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="variante-nombre">Nombre de la opción *</Label>
                  <Input
                    id="variante-nombre"
                    value={varianteFormData.nombre}
                    onChange={(e) =>
                      setVarianteFormData({
                        ...varianteFormData,
                        nombre: e.target.value,
                      })
                    }
                    placeholder="Ej: 1 Litro, De Carne, De Mora"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="variante-descripcion">Descripción</Label>
                  <Input
                    id="variante-descripcion"
                    value={varianteFormData.descripcion}
                    onChange={(e) =>
                      setVarianteFormData({
                        ...varianteFormData,
                        descripcion: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="variante-precio">Precio *</Label>
                  <Input
                    id="variante-precio"
                    type="number"
                    step="0.01"
                    min="0"
                    value={varianteFormData.precio}
                    onChange={(e) =>
                      setVarianteFormData({
                        ...varianteFormData,
                        precio: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="variante-costo">Costo</Label>
                  <Input
                    id="variante-costo"
                    type="number"
                    step="0.01"
                    min="0"
                    value={varianteFormData.costo}
                    onChange={(e) =>
                      setVarianteFormData({
                        ...varianteFormData,
                        costo: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="variante-imagen">Imagen de la Opción</Label>
                  <div className="space-y-2">
                    {varianteImagePreview || varianteFormData.imagen ? (
                      <div className="relative inline-block">
                        <img
                          src={varianteImagePreview || varianteFormData.imagen}
                          alt="Vista previa"
                          className="h-32 w-32 rounded-lg object-cover border border-gray-300"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={handleRemoveVarianteImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="variante-imagen-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-600" />
                            <p className="mb-2 text-sm text-gray-700">
                              <span className="font-semibold">Click para subir</span> o arrastra y suelta
                            </p>
                            <p className="text-xs text-gray-600">
                              PNG, JPG, WEBP (MAX. 5MB)
                            </p>
                          </div>
                          <input
                            id="variante-imagen-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleVarianteImageUpload}
                            disabled={uploadingVarianteImage}
                          />
                        </label>
                      </div>
                    )}
                    {uploadingVarianteImage && (
                      <p className="text-sm text-muted-foreground">
                        Subiendo imagen...
                      </p>
                    )}
                    {varianteFormData.imagen && (
                      <div className="mt-2">
                        <Label htmlFor="variante-imagen-url" className="text-xs text-gray-600">
                          O ingresa una URL:
                        </Label>
                        <Input
                          id="variante-imagen-url"
                          value={varianteFormData.imagen}
                          onChange={(e) => {
                            setVarianteFormData({
                              ...varianteFormData,
                              imagen: e.target.value,
                            });
                            setVarianteImagePreview(e.target.value);
                          }}
                          placeholder="https://..."
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="variante-orden">Orden</Label>
                  <Input
                    id="variante-orden"
                    type="number"
                    value={varianteFormData.orden}
                    onChange={(e) =>
                      setVarianteFormData({
                        ...varianteFormData,
                        orden: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    El orden determina cómo se muestran las opciones (menor número = primero)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="variante-disponible"
                    checked={varianteFormData.disponible}
                    onChange={(e) =>
                      setVarianteFormData({
                        ...varianteFormData,
                        disponible: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="variante-disponible">Disponible</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsVarianteDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loadingVariantes}>
                  {loadingVariantes ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default function ProductosPage() {
  return (
    <AdminWrapper>
      <ProductosPageContent />
    </AdminWrapper>
  );
}
