export const defaultWarehouseCategories = Object.freeze([
  ['FINISHED_GOODS', 'Producto terminado', 'Productos listos para venta o despacho.'],
  ['RAW_MATERIALS', 'Materia prima', 'Materiales destinados a procesos productivos.'],
  ['SPARE_PARTS', 'Repuestos', 'Repuestos y componentes de mantenimiento.'],
  ['RETURNS', 'Devoluciones', 'Productos recibidos por devolución.'],
  ['QUARANTINE', 'Cuarentena', 'Existencias pendientes de inspección o liberación.'],
  ['PRODUCTION', 'Producción', 'Existencias asociadas al proceso productivo.'],
  ['CONSIGNMENT', 'Consignación', 'Existencias administradas bajo consignación.'],
  ['IN_TRANSIT', 'Tránsito', 'Existencias temporalmente en traslado.'],
]);

export function provisionWarehouseCategories(client, companyId) {
  return client.warehouseCategory.createMany({
    data: defaultWarehouseCategories.map(([code, name, description]) => ({
      companyId,
      code,
      name,
      description,
    })),
    skipDuplicates: true,
  });
}
