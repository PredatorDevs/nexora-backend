const unitSelect = {
  id: true,
  code: true,
  name: true,
  type: true,
  isActive: true,
  measurementUnit: {
    select: {
      id: true,
      name: true,
      pluralName: true,
      symbol: true,
      mhCode: true,
    },
  },
};

const select = {
  id: true,
  uuid: true,
  companyId: true,
  productCategoryId: true,
  brandId: true,
  purchaseUnitId: true,
  saleUnitId: true,
  sku: true,
  originalCode: true,
  internalCode: true,
  name: true,
  size: true,
  dimensions: true,
  description: true,
  presentation: true,
  purchaseToSaleFactor: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  productCategory: {
    select: {
      id: true,
      code: true,
      name: true,
      isActive: true,
      parent: { select: { id: true, code: true, name: true, isActive: true } },
    },
  },
  brand: { select: { id: true, code: true, name: true, isActive: true } },
  purchaseUnit: { select: unitSelect },
  saleUnit: { select: unitSelect },
};

export function createProductsRepository(prisma) {
  return {
    async list(
      companyId,
      {
        page,
        pageSize,
        search,
        isActive,
        categoryId,
        subcategoryId,
        brandId,
        sortBy,
        sortOrder,
      },
    ) {
      const where = {
        companyId,
        ...(isActive === undefined ? {} : { isActive }),
        ...(subcategoryId ? { productCategoryId: subcategoryId } : {}),
        ...(categoryId
          ? { productCategory: { parentCategoryId: categoryId } }
          : {}),
        ...(brandId ? { brandId } : {}),
        ...(search
          ? {
              OR: [
                { internalCode: { contains: search } },
                { sku: { contains: search } },
                { originalCode: { contains: search } },
                { name: { contains: search } },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.product.findMany({
          where,
          select,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.product.count({ where }),
      ]);
      return { items, total };
    },
    find(companyId, id, client = prisma) {
      return client.product.findFirst({ where: { id, companyId }, select });
    },
    async findReferences(companyId, data, client = prisma) {
      const [company, category, brand, purchaseUnit, saleUnit] =
        await Promise.all([
          client.company.findUnique({
            where: { id: companyId },
            select: { id: true, status: true },
          }),
          client.productCategory.findFirst({
            where: { id: data.productCategoryId, companyId },
            select: {
              id: true,
              isActive: true,
              parentCategoryId: true,
              parent: { select: { id: true, isActive: true } },
              _count: { select: { children: true } },
            },
          }),
          data.brandId
            ? client.brand.findFirst({
                where: { id: data.brandId, companyId },
                select: { id: true, isActive: true },
              })
            : null,
          client.productUnit.findFirst({
            where: { id: data.purchaseUnitId, companyId },
            select: { id: true, type: true, isActive: true },
          }),
          client.productUnit.findFirst({
            where: { id: data.saleUnitId, companyId },
            select: { id: true, type: true, isActive: true },
          }),
        ]);
      return { company, category, brand, purchaseUnit, saleUnit };
    },
    create(companyId, data, client = prisma) {
      return client.product.create({ data: { companyId, ...data }, select });
    },
    async update(companyId, id, expectedUpdatedAt, data, client = prisma) {
      const result = await client.product.updateMany({
        where: { id, companyId, updatedAt: expectedUpdatedAt },
        data,
      });
      return result.count === 1 ? this.find(companyId, id, client) : null;
    },
  };
}
