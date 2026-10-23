# Alcance de la primera entrega de Inventario v1.0

## Estado del entregable

Este corte es funcional, demostrable y apto para pruebas de aceptación. No
representa todavía la totalidad de la ERS v1.0, pero cierra un flujo coherente
de inventario sin depender de módulos que aún no han sido desarrollados.

La presentación debe denominarlo **Primera entrega funcional del módulo de
Inventario v1.0**.

## Alcance incluido

### Entrada de mercancía

- Recepciones `VERIFIED` o `CLOSED` elegibles para ingreso.
- Costeo directo o costo definitivo desde retaceo cerrado.
- Conversión de unidad de compra a unidad base.
- Creación automática de un lote por detalle real de recepción.
- Protección contra ingresos duplicados.

### Almacenamiento y etiquetado

- Asignación total o parcial del lote a ubicaciones del almacén receptor.
- Existencias por lote, ubicación, almacén y sucursal.
- Etiquetas PDF con código interno, lote y fecha.
- Registro de impresiones y motivo obligatorio de reimpresión.

### Kardex y valoración

- Movimientos cronológicos e inmutables.
- Costo promedio ponderado global por producto y empresa.
- Consulta de existencias, Kardex, lotes, valoración y costo vigente.
- Filtros, paginación y aislamiento multiempresa.

### Movimientos físicos

- Traslados entre almacenes con preparación, tránsito, incidencia, recepción y
  cancelación previa al despacho.
- Salida en origen y entrada equivalente en destino.
- Reubicaciones inmediatas entre ubicaciones del mismo almacén.
- Conservación de lote y costo sin recalcular el promedio por movimientos
  internos.

### Correcciones autorizadas

- Ajustes de entrada y salida mediante borrador y aprobación.
- Validación de existencias y valoración no negativas.
- Reversiones compensatorias para movimientos de ajuste.
- Prevención de doble reversión.
- Auditoría y permisos separados para crear, aprobar y revertir.

## Exclusiones declaradas para esta entrega

Se difieren expresamente:

- ubicación física tipo vehículo durante el tránsito;
- integración del inventario con el módulo futuro de Flota;
- salidas automáticas por ventas entregadas;
- entradas por devoluciones aceptadas;
- recepción parcial de líneas de traslado;
- incidencias detalladas por línea;
- conciliación administrativa automatizada de saldos contra Kardex.

Estas exclusiones no impiden demostrar el ciclo de compras e inventario ya
implementado. Las integraciones con ventas, devoluciones y vehículos requieren
sus respectivos módulos y deben presentarse como fases posteriores.

## Flujo recomendado para la demostración

```text
Recepción verificada/cerrada
  -> Ingreso a inventario
  -> Creación de lote
  -> Impresión de etiqueta
  -> Asignación a ubicación
  -> Consulta de existencias y Kardex
  -> Reubicación interna
  -> Traslado a otro almacén
  -> Ajuste autorizado
  -> Reversión compensatoria del ajuste
```

Durante la demostración conviene abrir después de cada operación las pestañas
de Existencias, Kardex y Costos promedio para evidenciar qué cambia y qué debe
permanecer constante.

## Criterios para cerrar temporalmente el entregable

Antes de presentarlo:

1. Confirmar que `npx prisma migrate status` indique que la base está al día.
2. Ejecutar el seed y verificar el usuario administrador.
3. Asignar los permisos de inventario al rol utilizado en la demostración.
4. Preparar dos almacenes, al menos dos ubicaciones por almacén y productos con
   unidades correctamente configuradas.
5. Completar los casos relevantes de `docs/inventory-manual-testing.md`.
6. Registrar cualquier inconsistencia con pantalla, operación, datos usados y
   `requestId` de la API.

## Evidencia técnica del corte

Al momento de cerrar este entregable:

- el esquema y el historial de migraciones están sincronizados;
- las migraciones de inventario, traslados, ajustes y reubicaciones aplican en
  una reconstrucción limpia;
- el seed repone permisos y catálogos base;
- las pruebas unitarias, lint de ambos proyectos y build del frontend finalizan
  correctamente.

## Documentos relacionados

- `docs/inventory.md`
- `docs/inventory-transfers.md`
- `docs/inventory-adjustments.md`
- `docs/inventory-manual-testing.md`
- `docs/purchases.md`
- `docs/retaceos.md`
