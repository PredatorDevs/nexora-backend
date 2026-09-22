# Cotizaciones de compra — Etapa 2

## Alcance

La etapa registra ofertas recibidas de proveedores y conserva su relación exacta con una o varias solicitudes aprobadas. Incluye condiciones comerciales, productos, disponibilidad, impuestos, gastos adicionales y estados previos a la comparación.

## Agregados previstos

- `purchase_quotations`: proveedor, contacto, referencia externa, moneda, tipo de cambio, condiciones, totales calculados, estado y trazabilidad.
- `purchase_quotation_details`: producto, unidad de compra, cantidades, disponibilidad, precio y cálculo fiscal por línea.
- `purchase_quotation_requests`: relación muchos a muchos entre cotizaciones y solicitudes.
- `purchase_quotation_request_details`: trazabilidad entre cada línea cotizada y cada línea solicitada.
- `expense_types`: catálogo empresarial reutilizable.
- `purchase_quotation_expenses`: gastos que forman parte del costo comparativo de una oferta.

Todas las entidades operativas incluirán `company_id` y claves compuestas para impedir referencias entre empresas.

## Cálculos

```text
gross_amount = quantity × unit_price
discount_amount = gross_amount × discount_rate / 100
subtotal = gross_amount - discount_amount
tax_amount = subtotal × tax_rate / 100
line_total = subtotal + tax_amount
```

Los totales de cabecera serán la suma de las líneas y serán calculados exclusivamente por el backend. Los gastos se mostrarán por separado mediante `expenseTotal`; el costo comparativo será `grandTotal = total + expenseTotal`.

## Estados

```text
DRAFT -> RECEIVED -> UNDER_REVIEW -> SELECTED | REJECTED
   \         \            \-------> EXPIRED
    \---------\--------------------> CANCELLED
```

La etapa 2 implementará captura, recepción, evaluación, cancelación y vencimiento. La selección competitiva y el rechazo se integrarán en la etapa 3.

## Reglas principales

- El proveedor debe estar activo al registrar una nueva cotización.
- La vigencia no puede ser anterior a la fecha de cotización.
- Solo solicitudes `APPROVED` o `IN_QUOTATION` pueden relacionarse.
- La primera cotización relacionada cambia la solicitud aprobada a `IN_QUOTATION`.
- Las unidades deben ser unidades de compra activas.
- Montos y cantidades no pueden ser negativos; las cantidades cotizadas deben ser mayores que cero.
- El tipo de cambio es obligatorio cuando la moneda difiere de la moneda de la empresa.
- Al entrar en evaluación, la cotización queda congelada.
- Todas las mutaciones utilizan transacciones, concurrencia optimista, auditoría e historial de cambios.

## Primer corte: tipos de gasto

`expense_types` pertenece a cada empresa, usa códigos automáticos `EXT-000001` para registros personalizados y provisiona los conceptos Transporte, Flete, Seguro, Aduana, Manipulación, Almacenamiento y Otros.

Permisos:

- `expense_types.read`
- `expense_types.create`
- `expense_types.update`
- `expense_types.change_status`
