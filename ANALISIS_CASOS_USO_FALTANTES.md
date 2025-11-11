# Análisis de Casos de Uso Faltantes - SIGEC

## 📊 Resumen Ejecutivo

Este documento identifica los casos de uso que faltan por implementar según los requerimientos del problema descrito para el Sistema Integrado de Gestión de Eventos (SIGEC) de la cafetería Eventos Salome.

---

## ✅ CASOS DE USO IMPLEMENTADOS

### 1. Módulo de Inventario
- ✅ CRUD completo de items de inventario
- ✅ Actualización automática post-venta
- ✅ Consulta de items con stock bajo (`findBajoStock`)
- ✅ Consulta de productos próximos a vencer (`findProximosVencimiento`)
- ✅ Movimientos de inventario (entrada, salida, ajuste)
- ✅ Gestión de ubicaciones
- ✅ Entradas de inventario desde proveedores

### 2. Módulo de Pedidos
- ✅ Estados en tiempo real (PENDIENTE → EN_PREPARACION → LISTO → ENTREGADO)
- ✅ Tablero Kanban digital para cocina
- ✅ Gestión de mesas
- ✅ Modificación de pedidos
- ✅ Validación de stock antes de crear pedido
- ✅ Actualización automática de inventario al entregar pedido

### 3. Módulo de Pagos y Facturación
- ✅ Múltiples métodos de pago (efectivo, tarjeta, transferencia)
- ✅ Ticket digital PDF con QR
- ✅ Generación de QR para tickets
- ✅ Cálculo de IVA (16%)
- ✅ Aplicación de descuentos
- ✅ Cierre de caja con conciliación

### 4. Panel de Control y Reportes
- ✅ Dashboard con KPIs básicos (6 métricas)
- ✅ Reportes de ventas (diarios, semanales)
- ✅ Reportes de productos más vendidos
- ✅ Reportes de inventario
- ✅ Exportación a Excel y PDF
- ✅ Ventas por franja horaria
- ✅ Métricas de tiempo promedio

### 5. Seguridad y Auditoría
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Sistema de auditoría (registro de actividades)
- ✅ Autenticación con JWT (localStorage)
- ✅ 4 roles: ADMIN, COCINA, MESERO, CLIENTE

### 6. Real-time
- ✅ Supabase Realtime para pedidos e inventario
- ✅ Actualización en tiempo real en dashboards
- ✅ Indicador de estado de conexión

---

## ❌ CASOS DE USO FALTANTES (Parcialmente Cubiertos)

### 🔴 PRIORIDAD ALTA - Funcionalidades Críticas

#### 1. **Alertas Automáticas de Reorden**
**Estado Actual:** Solo existe consulta manual (`findBajoStock()`)
**Falta:**
- ⚠️ Sistema de notificaciones automáticas cuando stock alcanza umbral mínimo
- ⚠️ Alertas proactivas por email/notificación push
- ⚠️ Configuración de umbrales inteligentes basados en histórico
- ⚠️ Dashboard de alertas en tiempo real

**Implementación Requerida:**
```typescript
// Servicio de alertas automáticas
class AlertaInventarioService {
  async verificarYNotificarStockBajo(): Promise<void>
  async configurarUmbralInteligente(productoId: string): Promise<void>
  async enviarNotificacionReorden(item: InventarioItem): Promise<void>
}
```

#### 2. **Análisis ABC de Inventario**
**Estado Actual:** No implementado
**Falta:**
- ⚠️ Clasificación ABC basada en Pareto 80/20
- ⚠️ Cálculo de valor de rotación (cantidad × costo unitario)
- ⚠️ Dashboard de clasificación ABC
- ⚠️ Reportes de análisis ABC

**Implementación Requerida:**
```typescript
class AnalisisABCService {
  async clasificarProductos(): Promise<{A: Producto[], B: Producto[], C: Producto[]}>
  async calcularValorRotacion(productoId: string, periodo: DateRange): Promise<number>
  async generarReporteABC(): Promise<ReporteABC>
}
```

#### 3. **Pronóstico de Demanda**
**Estado Actual:** No implementado
**Falta:**
- ⚠️ Algoritmo de suavizado exponencial triple
- ⚠️ Predicción de demanda futura por producto
- ⚠️ Visualización de tendencias
- ⚠️ Ajuste automático de stock mínimo basado en pronóstico

**Implementación Requerida:**
```typescript
class PronosticoDemandaService {
  async calcularSuavizadoExponencial(productoId: string, periodo: number): Promise<Pronostico>
  async predecirDemanda(productoId: string, dias: number): Promise<number>
  async ajustarStockMinimo(productoId: string): Promise<void>
}
```

#### 4. **Punto de Reorden Inteligente (Modelo s, Q)**
**Estado Actual:** Solo `cantidadMinima` estática
**Falta:**
- ⚠️ Cálculo dinámico de punto de reorden basado en:
  - Tiempo de entrega del proveedor
  - Demanda promedio
  - Nivel de servicio objetivo (95%)
- ⚠️ Actualización automática del punto de reorden
- ⚠️ Cálculo de cantidad de reorden óptima (Q)

**Implementación Requerida:**
```typescript
class PuntoReordenService {
  async calcularPuntoReorden(productoId: string): Promise<{s: number, Q: number}>
  async actualizarPuntoReordenAutomatico(): Promise<void>
  async obtenerNivelServicio(productoId: string): Promise<number>
}
```

#### 5. **Escaneo QR para Entradas Rápidas de Inventario**
**Estado Actual:** No implementado
**Falta:**
- ⚠️ Generación de códigos QR para productos
- ⚠️ Lector QR en interfaz de entradas de inventario
- ⚠️ Actualización rápida de stock mediante escaneo
- ⚠️ Validación de productos mediante QR

**Implementación Requerida:**
```typescript
// Componente de escaneo QR
<QRScanner 
  onScan={(productoId) => handleEntradaRapida(productoId)}
  onError={(error) => showError(error)}
/>
```

#### 6. **Notificaciones Push para Estados Críticos**
**Estado Actual:** Solo actualización en tiempo real en UI
**Falta:**
- ⚠️ Notificaciones push del navegador
- ⚠️ Notificaciones por email para eventos críticos
- ⚠️ Configuración de preferencias de notificación
- ⚠️ Notificaciones para pedidos urgentes

**Implementación Requerida:**
```typescript
class NotificacionService {
  async enviarNotificacionPush(usuarioId: string, mensaje: string): Promise<void>
  async enviarEmail(usuarioId: string, asunto: string, cuerpo: string): Promise<void>
  async configurarPreferencias(usuarioId: string, preferencias: PreferenciasNotificacion): Promise<void>
}
```

---

### 🟡 PRIORIDAD MEDIA - Funcionalidades Importantes

#### 7. **Integración con DIAN para Facturación Electrónica**
**Estado Actual:** Solo tickets PDF locales
**Falta:**
- ⚠️ Integración con API DIAN
- ⚠️ Generación de factura electrónica XML
- ⚠️ Firma digital de facturas
- ⚠️ Envío automático a DIAN
- ⚠️ Consulta de estado de facturación

**Implementación Requerida:**
```typescript
class FacturacionDIANService {
  async generarFacturaElectronica(pedidoId: string): Promise<FacturaElectronica>
  async firmarFactura(factura: FacturaElectronica): Promise<FacturaFirmada>
  async enviarADIAN(factura: FacturaFirmada): Promise<RespuestaDIAN>
  async consultarEstado(facturaId: string): Promise<EstadoFactura>
}
```

#### 8. **Geolocalización de Mesas**
**Estado Actual:** Solo gestión básica de mesas
**Falta:**
- ⚠️ Mapa de planta con ubicación de mesas
- ⚠️ Asignación de coordenadas a mesas
- ⚠️ Visualización de mesas ocupadas/libres en mapa
- ⚠️ Optimización de rutas para meseros

**Implementación Requerida:**
```typescript
interface Mesa {
  // ... campos existentes
  coordenadas?: { x: number, y: number }
  planta?: number
}

// Componente de mapa de mesas
<MapaMesas 
  mesas={mesas}
  onMesaClick={(mesa) => handleMesaClick(mesa)}
/>
```

#### 9. **Algoritmo de Priorización de Pedidos**
**Estado Actual:** Solo orden por fecha
**Falta:**
- ⚠️ Priorización basada en:
  - Tipo de pedido (comida rápida vs. elaborada)
  - Tiempo de espera
  - Urgencia del cliente
  - Capacidad de cocina
- ⚠️ Visualización de pedidos priorizados en cocina
- ⚠️ Ajuste automático de prioridades

**Implementación Requerida:**
```typescript
class PriorizacionPedidosService {
  async calcularPrioridad(pedido: Pedido): Promise<number>
  async ordenarPedidosPorPrioridad(pedidos: Pedido[]): Promise<Pedido[]>
  async ajustarPrioridadAutomatica(): Promise<void>
}
```

#### 10. **Dashboard con 15+ KPIs en Tiempo Real**
**Estado Actual:** Solo 6 KPIs básicos
**Falta:**
- ⚠️ KPIs adicionales:
  - Tiempo promedio de atención por transacción
  - Tasa de error en pedidos
  - Rotación de inventario
  - Margen de contribución por producto
  - Eficiencia por cajero
  - Ocupación de mesas
  - Tiempo promedio en cada estado
  - Tasa de cancelación
  - Satisfacción del cliente (si hay encuestas)
  - Costo por transacción
- ⚠️ Widgets personalizables
- ⚠️ Comparativos históricos

**Implementación Requerida:**
```typescript
interface KPI {
  id: string
  nombre: string
  valor: number
  unidad: string
  tendencia: 'up' | 'down' | 'stable'
  comparativo: number // % vs período anterior
}

class KPIService {
  async obtenerKPIs(periodo: DateRange): Promise<KPI[]>
  async calcularTiempoPromedioAtencion(): Promise<number>
  async calcularTasaError(): Promise<number>
  async calcularRotacionInventario(): Promise<number>
  // ... más métodos
}
```

#### 11. **Alertas de Negocio por Desviaciones**
**Estado Actual:** No implementado
**Falta:**
- ⚠️ Alertas cuando ventas caen por debajo de meta
- ⚠️ Alertas por desviaciones en tiempos de preparación
- ⚠️ Alertas por diferencias significativas en cierre de caja
- ⚠️ Configuración de umbrales de alerta

**Implementación Requerida:**
```typescript
class AlertaNegocioService {
  async verificarDesviacionesVentas(): Promise<Alerta[]>
  async verificarTiemposPreparacion(): Promise<Alerta[]>
  async verificarDiferenciasCaja(): Promise<Alerta[]>
  async configurarUmbrales(umbrales: UmbralesAlerta): Promise<void>
}
```

#### 12. **Proyecciones Predictivas con Machine Learning**
**Estado Actual:** No implementado
**Falta:**
- ⚠️ Modelo ML para predecir demanda
- ⚠️ Proyección de ventas futuras
- ⚠️ Predicción de productos más vendidos
- ⚠️ Optimización de inventario con ML

**Implementación Requerida:**
```typescript
class MLPredictionService {
  async predecirVentas(periodo: DateRange): Promise<ProyeccionVentas>
  async predecirProductosPopulares(dias: number): Promise<Producto[]>
  async optimizarInventario(): Promise<RecomendacionInventario>
}
```

---

### 🟢 PRIORIDAD BAJA - Mejoras y Optimizaciones

#### 13. **Pasarelas de Pago para Tarjetas**
**Estado Actual:** Solo registro de método de pago
**Falta:**
- ⚠️ Integración con pasarela de pago (Stripe, PayPal, etc.)
- ⚠️ Procesamiento real de pagos con tarjeta
- ⚠️ Validación de tarjetas
- ⚠️ Reembolsos

#### 14. **Autenticación Multifactor (MFA)**
**Estado Actual:** Solo usuario/contraseña
**Falta:**
- ⚠️ Autenticación de dos factores (2FA)
- ⚠️ Códigos SMS o TOTP
- ⚠️ Configuración de MFA por usuario

#### 15. **OAuth2 para Autenticación Externa**
**Estado Actual:** Solo autenticación local
**Falta:**
- ⚠️ Login con Google, Facebook, etc.
- ⚠️ Integración OAuth2
- ⚠️ Gestión de tokens OAuth

#### 16. **Sistema de Backup Automático**
**Estado Actual:** Depende de Supabase
**Falta:**
- ⚠️ Backup programado de base de datos
- ⚠️ Backup de archivos y configuraciones
- ⚠️ Plan de recuperación ante desastres (DR)
- ⚠️ Restauración de backups

#### 17. **Modificación de Pedidos en Tiempo Real**
**Estado Actual:** Parcialmente implementado
**Falta:**
- ⚠️ Modificación completa de items después de crear pedido
- ⚠️ Validación de modificaciones según estado
- ⚠️ Historial de modificaciones

#### 18. **Gestión de Recetas y Costos**
**Estado Actual:** No implementado
**Falta:**
- ⚠️ Definición de recetas (ingredientes por producto)
- ⚠️ Cálculo automático de costo basado en receta
- ⚠️ Alertas cuando costo supera precio de venta

---

## 📋 PLAN DE IMPLEMENTACIÓN SUGERIDO

### Fase 1: Funcionalidades Críticas (2-3 semanas)
1. Alertas automáticas de reorden
2. Análisis ABC de inventario
3. Escaneo QR para entradas rápidas
4. Notificaciones push básicas

### Fase 2: Optimización de Inventario (2-3 semanas)
1. Pronóstico de demanda
2. Punto de reorden inteligente
3. Dashboard con 15+ KPIs

### Fase 3: Integraciones Externas (3-4 semanas)
1. Integración DIAN
2. Pasarelas de pago
3. Geolocalización de mesas

### Fase 4: Inteligencia y ML (4-5 semanas)
1. Algoritmo de priorización
2. Proyecciones predictivas con ML
3. Alertas de negocio

### Fase 5: Seguridad y Backup (2 semanas)
1. Autenticación multifactor
2. OAuth2
3. Sistema de backup automático

---

## 📊 Métricas de Cobertura

| Categoría | Implementado | Faltante | Cobertura |
|-----------|--------------|----------|-----------|
| Inventario Básico | ✅ | ⚠️ | 70% |
| Optimización Inventario | ❌ | ✅ | 0% |
| Pedidos Básicos | ✅ | ⚠️ | 80% |
| Optimización Pedidos | ❌ | ✅ | 20% |
| Pagos Básicos | ✅ | ⚠️ | 60% |
| Facturación Electrónica | ❌ | ✅ | 0% |
| Reportes Básicos | ✅ | ⚠️ | 50% |
| Analytics Avanzado | ❌ | ✅ | 10% |
| Seguridad Básica | ✅ | ⚠️ | 60% |
| Seguridad Avanzada | ❌ | ✅ | 0% |
| **TOTAL** | - | - | **~45%** |

---

## 🎯 Conclusión

El sistema actual tiene una **base sólida** con funcionalidades core implementadas, pero le faltan **funcionalidades avanzadas de optimización, inteligencia de negocio e integraciones externas** que son críticas según los requerimientos del problema descrito.

**Prioridad de implementación:** Comenzar con las funcionalidades de **Prioridad Alta** que impactan directamente en la eficiencia operativa y la reducción de costos.

