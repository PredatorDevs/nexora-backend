# Códigos automáticos de negocio

Los códigos visibles de las entidades operativas son asignados exclusivamente por el backend. No forman parte de los formularios ni de los contratos de creación y permanecen inmutables durante toda la vida del registro.

## Generación

`code_sequences` mantiene contadores transaccionales por espacio de nombres. La reserva del número y la creación del registro ocurren dentro de la misma transacción, evitando la condición de carrera de estrategias basadas en `MAX(code) + 1`.

| Entidad | Formato | Alcance de la secuencia |
| --- | --- | --- |
| Empresa | `COM-000001` | Plataforma |
| Sucursal | `BR-000001` | Empresa |
| Categoría personalizada de almacén | `WCT-000001` | Empresa |
| Almacén | `WH-000001` | Empresa |
| Ubicación | `LOC-000001` | Almacén |
| Rol personalizado de plataforma | `ROL-000001` | Plataforma |
| Rol personalizado de empresa | `CRL-000001` | Empresa |

Los números no se reutilizan después de desactivar registros. Las restricciones únicas de cada entidad permanecen como protección adicional.

## Compatibilidad

Los códigos existentes se conservan. La migración inicializa cada secuencia a partir del mayor código que ya utilice el formato automático correspondiente.

Las categorías predeterminadas mantienen códigos semánticos como `QUARANTINE` porque son datos aprovisionados por el sistema. Las categorías creadas mediante la API reciben códigos `WCT-*`. De igual forma, los roles protegidos conservan identificadores como `OWNER` y `ADMIN`, mientras los roles personalizados reciben códigos automáticos.

## Exclusiones

No son códigos automáticos los identificadores definidos por estándares o por la aplicación: permisos RBAC, roles del sistema, países, monedas y actividades económicas. Las ubicaciones utilizan un código estable por almacén; su referencia formada por pasillo, estante, nivel y posición puede cambiar sin alterar la identidad histórica.
