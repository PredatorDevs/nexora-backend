const select = {
  id: true,
  companyId: true,
  productId: true,
  storageKey: true,
  altText: true,
  caption: true,
  sortOrder: true,
  isPrimary: true,
  createdAt: true,
  updatedAt: true,
};

export function createProductImagesRepository(prisma) {
  return {
    list(companyId, productId, client = prisma) {
      return client.productImage.findMany({
        where: { companyId, productId },
        select,
        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
      });
    },
    findProduct(companyId, productId, client = prisma) {
      return client.product.findFirst({
        where: { id: productId, companyId },
        select: { id: true, name: true },
      });
    },
    find(companyId, productId, imageId, client = prisma) {
      return client.productImage.findFirst({
        where: { id: imageId, productId, companyId },
        select,
      });
    },
    async stats(companyId, productId, client = prisma) {
      const [count, aggregate] = await Promise.all([
        client.productImage.count({ where: { companyId, productId } }),
        client.productImage.aggregate({
          where: { companyId, productId },
          _max: { sortOrder: true },
        }),
      ]);
      return { count, maxSortOrder: aggregate._max.sortOrder ?? -1 };
    },
    clearPrimary(companyId, productId, client = prisma) {
      return client.productImage.updateMany({
        where: { companyId, productId, isPrimary: true },
        data: { isPrimary: false },
      });
    },
    create(companyId, productId, data, client = prisma) {
      return client.productImage.create({
        data: { companyId, productId, ...data },
        select,
      });
    },
    async update(
      companyId,
      productId,
      imageId,
      expectedUpdatedAt,
      data,
      client = prisma,
    ) {
      const result = await client.productImage.updateMany({
        where: {
          id: imageId,
          productId,
          companyId,
          updatedAt: expectedUpdatedAt,
        },
        data,
      });
      return result.count === 1
        ? this.find(companyId, productId, imageId, client)
        : null;
    },
    async reorder(companyId, productId, imageIds, client = prisma) {
      await Promise.all(
        imageIds.map((id, sortOrder) =>
          client.productImage.updateMany({
            where: { id, productId, companyId },
            data: { sortOrder },
          }),
        ),
      );
      return this.list(companyId, productId, client);
    },
    async remove(
      companyId,
      productId,
      imageId,
      expectedUpdatedAt,
      client = prisma,
    ) {
      const result = await client.productImage.deleteMany({
        where: {
          id: imageId,
          productId,
          companyId,
          updatedAt: expectedUpdatedAt,
        },
      });
      return result.count === 1;
    },
    async promoteFirst(companyId, productId, client = prisma) {
      const first = await client.productImage.findFirst({
        where: { companyId, productId },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: { id: true },
      });
      if (first)
        await client.productImage.update({
          where: { id: first.id },
          data: { isPrimary: true },
        });
    },
  };
}
