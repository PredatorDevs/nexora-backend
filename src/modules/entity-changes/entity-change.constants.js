export const entityChangeOperations = Object.freeze({
  create: 'CREATE',
  update: 'UPDATE',
  delete: 'DELETE',
});

export const entityChangeSources = Object.freeze({
  application: 'APPLICATION',
  systemJob: 'SYSTEM_JOB',
  migration: 'MIGRATION',
  databaseTrigger: 'DATABASE_TRIGGER',
});

export const entitySchemas = Object.freeze({
  administration: 'administration',
  companies: 'companies',
});

export const entityTypes = Object.freeze({
  user: 'user',
  role: 'role',
  company: 'company',
  companyMembership: 'company_membership',
  companyRole: 'company_role',
  branch: 'branch',
  warehouseCategory: 'warehouse_category',
  warehouse: 'warehouse',
  location: 'location',
  supplier: 'supplier',
  supplierContact: 'supplier_contact',
  brand: 'brand',
  productCategory: 'product_category',
  productUnit: 'product_unit',
});
