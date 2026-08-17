# Proveedores y contactos

`Supplier` es una contraparte comercial propia de cada empresa. `SupplierContact` representa las personas que gestionan la relación con esa contraparte y conserva los contactos anteriores mediante desactivación lógica.

## Proveedor

- El backend genera `code` con formato `SUP-000001` y secuencia por empresa.
- `nit` y `nrc` mantienen la misma interpretación utilizada en `Company`. Para países extranjeros la interfaz puede presentarlos como identificación y registro tributario equivalentes.
- NIT y NRC son opcionales y únicos por empresa y país cuando se proporcionan.
- La dirección utiliza el catálogo territorial salvadoreño o región/localidad libre para otros países.
- Teléfono y correo son canales institucionales del proveedor, distintos de los datos personales de sus contactos.
- Los proveedores se desactivan; nunca se eliminan físicamente.

## Contactos

Un proveedor puede tener varios contactos activos, pero solamente uno marcado como principal. Crear o seleccionar un nuevo contacto principal desmarca al anterior dentro de una transacción serializable y registra los cambios de ambos contactos.

`validFrom` y `validUntil` expresan la vigencia del contacto. Al desactivarlo se completa `validUntil`; al reactivarlo se limpia. Cambiar a la persona responsable requiere crear un contacto nuevo, no sobrescribir la identidad del anterior.

Un contacto inactivo o perteneciente a un proveedor inactivo no estará disponible para operaciones de compra. Los documentos históricos conservarán sus referencias.

## Seguridad

Ambas entidades contienen `companyId`. La FK compuesta `(supplier_id, company_id)` impide asociaciones entre tenants.

La API principal es `/api/v1/suppliers`; los contactos se administran en `/api/v1/suppliers/:supplierId/contacts`. Los permisos son:

- `suppliers.read`, `suppliers.create`, `suppliers.update`, `suppliers.change_status`
- `supplier_contacts.read`, `supplier_contacts.create`, `supplier_contacts.update`, `supplier_contacts.change_status`, `supplier_contacts.set_primary`

Owner y Administrator reciben mantenimiento completo. Operator y Read Only reciben lectura.
