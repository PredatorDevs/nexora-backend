import { loadEnvironment } from '../../src/config/environment.js';
import { createPrismaClient } from '../../src/database/prisma.js';
import { hashPassword } from '../../src/core/security/password.js';
import { provisionCompanyRoles } from '../../src/modules/company-access/company-role-templates.js';

const companies = [
  { code: 'DEMO-COMERCIAL', legalName: 'Comercializadora Horizonte, S.A. de C.V.', commercialName: 'Comercial Horizonte', nit: '0614-010126-101-1', nrc: '310101-1', email: 'contacto@horizonte.demo' },
  { code: 'DEMO-DISTRIBUIDORA', legalName: 'Distribuidora Central, S.A. de C.V.', commercialName: 'Distribuidora Central', nit: '0614-010126-102-2', nrc: '310102-2', email: 'contacto@central.demo' },
  { code: 'DEMO-IMPORTADORA', legalName: 'Importadora del Pacífico, S.A. de C.V.', commercialName: 'Importadora del Pacífico', nit: '0614-010126-103-3', nrc: '310103-3', email: 'contacto@pacifico.demo' },
];

const users = [
  { email: 'owner.demo@nexora.local', displayName: 'Olivia Owner', role: 'OWNER' },
  { email: 'admin.demo@nexora.local', displayName: 'Adriana Administradora', role: 'ADMIN' },
  { email: 'operator.demo@nexora.local', displayName: 'Óscar Operador', role: 'OPERATOR' },
  { email: 'readonly.demo@nexora.local', displayName: 'Renata Consulta', role: 'READ_ONLY' },
];

const productTemplates = [
  { code: 'PRD-DEMO-001', sku: '750100000001', name: 'Café soluble 200 g', brand: 'Aroma', category: 'Alimentos', factor: 12 },
  { code: 'PRD-DEMO-002', sku: '750100000002', name: 'Leche entera 1 L', brand: 'Buen Día', category: 'Alimentos', factor: 12 },
  { code: 'PRD-DEMO-003', sku: '750100000003', name: 'Detergente líquido 1 L', brand: 'LimpioMax', category: 'Limpieza', factor: 6 },
  { code: 'PRD-DEMO-004', sku: '750100000004', name: 'Papel higiénico paquete 4', brand: 'HogarPlus', category: 'Higiene', factor: 8 },
];

async function seedCompanyCatalogs(client, company, address, measurementUnit) {
  const branches = [];
  for (const [index, branchData] of [
    { code: 'M001', name: 'Casa Matriz', isHeadquarters: true, addressLine: 'Avenida principal, zona industrial' },
    { code: 'S002', name: 'Sucursal Oriente', isHeadquarters: false, addressLine: 'Centro comercial regional, local 12' },
  ].entries()) {
    const branch = await client.branch.upsert({
      where: { companyId_code: { companyId: company.id, code: branchData.code } },
      create: { companyId: company.id, ...branchData, ...address, phone: `+503 2200-${company.id}${index + 1}00`, email: `${branchData.code.toLowerCase()}@${company.code.toLowerCase()}.demo` },
      update: { name: branchData.name, isHeadquarters: branchData.isHeadquarters, status: 'ACTIVE' },
    });
    branches.push(branch);
  }

  const warehouseCategory = await client.warehouseCategory.upsert({
    where: { companyId_code: { companyId: company.id, code: 'WCT-DEMO' } },
    create: { companyId: company.id, code: 'WCT-DEMO', name: 'Almacén general', description: 'Categoría creada por el seed de demostración.' },
    update: { name: 'Almacén general', isActive: true },
  });
  for (const [index, branch] of branches.entries()) {
    const warehouse = await client.warehouse.upsert({
      where: { companyId_code: { companyId: company.id, code: `WH-DEMO-${index + 1}` } },
      create: { companyId: company.id, branchId: branch.id, warehouseCategoryId: warehouseCategory.id, code: `WH-DEMO-${index + 1}`, name: index === 0 ? 'Bodega principal' : 'Bodega de sucursal', description: 'Almacén de demostración', locationSeparator: index === 0 ? '-' : '/' },
      update: { branchId: branch.id, warehouseCategoryId: warehouseCategory.id, isActive: true },
    });
    for (let position = 1; position <= 4; position += 1) {
      await client.location.upsert({
        where: { companyId_warehouseId_code: { companyId: company.id, warehouseId: warehouse.id, code: `A01${warehouse.locationSeparator}R01${warehouse.locationSeparator}N01${warehouse.locationSeparator}P0${position}` } },
        create: { companyId: company.id, warehouseId: warehouse.id, code: `A01${warehouse.locationSeparator}R01${warehouse.locationSeparator}N01${warehouse.locationSeparator}P0${position}`, aisle: 'A01', rack: 'R01', level: 'N01', position: `P0${position}`, capacity: 500, capacityUnit: 'UNITS', notes: 'Ubicación de demostración' },
        update: { isActive: true, capacity: 500 },
      });
    }
  }

  for (let index = 1; index <= 2; index += 1) {
    const supplier = await client.supplier.upsert({
      where: { companyId_code: { companyId: company.id, code: `SUP-DEMO-00${index}` } },
      create: { companyId: company.id, code: `SUP-DEMO-00${index}`, name: index === 1 ? 'Suministros Regionales' : 'Importaciones La Fuente', nit: `0614-020226-${company.id}${index}0-${index}`, nrc: `320${company.id}${index}0-${index}`, ...address, addressLine: `Dirección comercial proveedor ${index}`, phone: `+503 2300-${company.id}${index}00`, email: `ventas${index}@proveedor${company.id}.demo`, website: `https://proveedor${company.id}${index}.example` },
      update: { isActive: true },
    });
    const existingContact = await client.supplierContact.findFirst({ where: { companyId: company.id, supplierId: supplier.id, email: `contacto${index}@proveedor${company.id}.demo` } });
    if (!existingContact) await client.supplierContact.create({ data: { companyId: company.id, supplierId: supplier.id, fullName: index === 1 ? 'Carolina Méndez' : 'Roberto Flores', jobTitle: 'Ejecutivo de cuenta', phone: `+503 7100-${company.id}${index}00`, email: `contacto${index}@proveedor${company.id}.demo`, isPrimary: true } });
  }

  const saleUnit = await client.productUnit.upsert({
    where: { companyId_code: { companyId: company.id, code: 'U' } },
    create: { companyId: company.id, measurementUnitId: measurementUnit.id, code: 'U', name: 'Unidad', type: 'SALE', description: 'Unidad base de inventario' },
    update: { measurementUnitId: measurementUnit.id, isActive: true },
  });
  const purchaseUnit = await client.productUnit.upsert({
    where: { companyId_code: { companyId: company.id, code: 'CAJA' } },
    create: { companyId: company.id, measurementUnitId: measurementUnit.id, code: 'CAJA', name: 'Caja', type: 'PURCHASE', description: 'Caja de compra' },
    update: { measurementUnitId: measurementUnit.id, isActive: true },
  });

  const categoryByName = new Map();
  const brandByName = new Map();
  for (const [index, template] of productTemplates.entries()) {
    if (!categoryByName.has(template.category)) {
      const category = await client.productCategory.upsert({
        where: { companyId_code: { companyId: company.id, code: `CAT-DEMO-${categoryByName.size + 1}` } },
        create: { companyId: company.id, code: `CAT-DEMO-${categoryByName.size + 1}`, name: template.category, nameKey: template.category.toLowerCase(), description: 'Categoría de demostración' },
        update: { name: template.category, nameKey: template.category.toLowerCase(), isActive: true },
      });
      categoryByName.set(template.category, category);
    }
    if (!brandByName.has(template.brand)) {
      const brand = await client.brand.upsert({
        where: { companyId_code: { companyId: company.id, code: `MAR-DEMO-${brandByName.size + 1}` } },
        create: { companyId: company.id, code: `MAR-DEMO-${brandByName.size + 1}`, name: template.brand, description: 'Marca de demostración' },
        update: { name: template.brand, isActive: true },
      });
      brandByName.set(template.brand, brand);
    }
    await client.product.upsert({
      where: { companyId_internalCode: { companyId: company.id, internalCode: template.code } },
      create: { companyId: company.id, internalCode: template.code, sku: `${company.id}${template.sku}`, originalCode: `FAB-${company.id}-${index + 1}`, name: template.name, description: 'Producto creado para pruebas y demostraciones.', presentation: 'Caja', productCategoryId: categoryByName.get(template.category).id, brandId: brandByName.get(template.brand).id, purchaseUnitId: purchaseUnit.id, saleUnitId: saleUnit.id, purchaseToSaleFactor: template.factor },
      update: { name: template.name, isActive: true, productCategoryId: categoryByName.get(template.category).id, brandId: brandByName.get(template.brand).id, purchaseUnitId: purchaseUnit.id, saleUnitId: saleUnit.id, purchaseToSaleFactor: template.factor },
    });
  }
}

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.DEMO_SEED_ALLOW_PRODUCTION !== 'true') throw new Error('Demo seed is disabled in production. Set DEMO_SEED_ALLOW_PRODUCTION=true only for an authorized demo environment.');
  const environment = loadEnvironment();
  const client = createPrismaClient({ databaseUrl: environment.databaseUrl });
  const password = process.env.DEMO_SEED_PASSWORD ?? 'NexoraDemo#2026';
  try {
    await client.$connect();
    const country = await client.country.findFirst({ where: { name: { contains: 'SALVADOR' }, isActive: true } });
    const department = await client.department.findFirst({ where: { isActive: true }, orderBy: { id: 'asc' } });
    const municipality = await client.municipality.findFirst({ where: { departmentId: department?.id, isActive: true }, orderBy: { id: 'asc' } });
    const district = await client.district.findFirst({ where: { municipalityId: municipality?.id, isActive: true }, orderBy: { id: 'asc' } });
    const measurementUnit = await client.measurementUnit.findUnique({ where: { name: 'UNIDAD' } });
    if (!country || !department || !municipality || !district || !measurementUnit) throw new Error('Run npm run prisma:seed before the demo seed.');
    const address = { countryId: country.id, departmentId: department.id, municipalityId: municipality.id, districtId: district.id };
    const passwordHash = await hashPassword(password);
    const seededUsers = new Map();
    for (const definition of users) {
      const user = await client.user.upsert({ where: { email: definition.email }, create: { email: definition.email, displayName: definition.displayName, passwordHash, mustChangePassword: false }, update: { displayName: definition.displayName, passwordHash, status: 'ACTIVE', mustChangePassword: false } });
      seededUsers.set(definition.email, user);
    }
    for (const definition of companies) {
      const company = await client.company.upsert({
        where: { code: definition.code },
        create: { ...definition, ...address, addressLine: 'Dirección de demostración, San Salvador', phone: '+503 2200-0000' },
        update: { legalName: definition.legalName, commercialName: definition.commercialName, status: 'ACTIVE' },
      });
      await client.$transaction((transaction) => provisionCompanyRoles(transaction, company.id));
      const roles = await client.companyRole.findMany({ where: { companyId: company.id }, select: { id: true, code: true } });
      const roleByCode = new Map(roles.map((role) => [role.code, role]));
      for (const definition of users) {
        const user = seededUsers.get(definition.email);
        const membership = await client.companyMembership.upsert({ where: { companyId_userId: { companyId: company.id, userId: user.id } }, create: { companyId: company.id, userId: user.id }, update: { status: 'ACTIVE' } });
        const role = roleByCode.get(definition.role);
        await client.companyMembershipRole.upsert({ where: { membershipId_roleId: { membershipId: membership.id, roleId: role.id } }, create: { membershipId: membership.id, roleId: role.id, companyId: company.id, assignedByUserId: seededUsers.get('owner.demo@nexora.local').id }, update: {} });
      }
      await seedCompanyCatalogs(client, company, address, measurementUnit);
    }
    process.stdout.write(`Demo seed completed: ${companies.length} companies, ${users.length} users.\n`);
  } finally {
    await client.$disconnect();
  }
}

await main();
