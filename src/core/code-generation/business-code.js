export const businessCodeEntities = Object.freeze({
  company: 'company',
  branch: 'branch',
  warehouseCategory: 'warehouse_category',
  warehouse: 'warehouse',
  platformRole: 'platform_role',
  companyRole: 'company_role',
  location: 'location',
  supplier: 'supplier',
  brand: 'brand',
  productCategory: 'product_category',
  productUnit: 'product_unit',
});

const definitions = Object.freeze({
  [businessCodeEntities.company]: { prefix: 'COM', scope: 'platform' },
  [businessCodeEntities.branch]: { prefix: 'BR', scope: 'company' },
  [businessCodeEntities.warehouseCategory]: { prefix: 'WCT', scope: 'company' },
  [businessCodeEntities.warehouse]: { prefix: 'WH', scope: 'company' },
  [businessCodeEntities.platformRole]: { prefix: 'ROL', scope: 'platform' },
  [businessCodeEntities.companyRole]: { prefix: 'CRL', scope: 'company' },
  [businessCodeEntities.location]: { prefix: 'LOC', scope: 'warehouse' },
  [businessCodeEntities.supplier]: { prefix: 'SUP', scope: 'company' },
  [businessCodeEntities.brand]: { prefix: 'MAR', scope: 'company' },
  [businessCodeEntities.productCategory]: { prefix: 'CAT', scope: 'company' },
  [businessCodeEntities.productUnit]: { prefix: 'PUN', scope: 'company' },
});

export async function generateBusinessCode(
  client,
  entityType,
  { companyId, warehouseId } = {},
) {
  const definition = definitions[entityType];
  if (!definition)
    throw new TypeError(`Unknown business code entity: ${entityType}`);
  if (definition.scope === 'company' && !companyId) {
    throw new TypeError(`companyId is required for ${entityType} codes.`);
  }
  if (definition.scope === 'warehouse' && !warehouseId) {
    throw new TypeError(`warehouseId is required for ${entityType} codes.`);
  }
  const scopeId = definition.scope === 'company' ? companyId : warehouseId;
  const namespace =
    definition.scope === 'platform' ? entityType : `${entityType}:${scopeId}`;
  const sequence = await client.codeSequence.upsert({
    where: { namespace },
    create: { namespace, nextValue: 2n },
    update: { nextValue: { increment: 1n } },
    select: { nextValue: true },
  });
  const reservedValue = BigInt(sequence.nextValue) - 1n;
  return `${definition.prefix}-${reservedValue.toString().padStart(6, '0')}`;
}
