# Datos de demostración

## Ejecución

El seed base debe ejecutarse antes del dataset de demostración:

```bash
npm run prisma:seed
npm run prisma:seed:demo
```

El segundo comando es idempotente: puede repetirse para restaurar nombres,
estados, roles y contraseñas de los registros identificados con códigos `DEMO-`.
No elimina datos operativos creados manualmente.

La contraseña se configura mediante `DEMO_SEED_PASSWORD`. Si no se define, en
desarrollo se utiliza:

```text
NexoraDemo#2026
```

El seed se bloquea cuando `NODE_ENV=production`. Para un entorno de demostración
autorizado que utilice ese valor se requieren explícitamente:

```text
DEMO_SEED_ALLOW_PRODUCTION=true
DEMO_SEED_PASSWORD=<contraseña segura>
```

## Accesos

Los cuatro usuarios tienen membresía en las tres empresas y permiten probar el
selector de compañía y el aislamiento multiempresa.

| Usuario | Rol en cada empresa | Uso sugerido |
|---|---|---|
| `owner.demo@nexora.local` | Owner | Configuración completa y asignación de permisos |
| `admin.demo@nexora.local` | Administrator | Aprobaciones y operación administrativa |
| `operator.demo@nexora.local` | Operator | Flujo operativo cotidiano |
| `readonly.demo@nexora.local` | Read Only | Validación de consultas sin escritura |

Todos utilizan `DEMO_SEED_PASSWORD` o la contraseña de desarrollo indicada
arriba. Estas credenciales son exclusivamente para demostración y nunca deben
habilitarse en una base productiva real.

## Empresas

- `DEMO-COMERCIAL`: Comercial Horizonte.
- `DEMO-DISTRIBUIDORA`: Distribuidora Central.
- `DEMO-IMPORTADORA`: Importadora del Pacífico.

Cada empresa incluye:

- Casa Matriz y Sucursal Oriente.
- Un almacén activo por sucursal.
- Cuatro ubicaciones por almacén.
- Categoría de almacén general.
- Dos proveedores y un contacto principal por proveedor.
- Unidades comerciales `CAJA` y `U`.
- Categorías Alimentos, Limpieza e Higiene.
- Cuatro marcas y cuatro productos.
- Roles de compañía y sus permisos vigentes.

No se generan compras, recepciones ni movimientos de inventario. Esos documentos
deben crearse durante las pruebas para demostrar el flujo real y evitar que el
Kardex comience con movimientos artificiales.
