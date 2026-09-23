import { Prisma } from '@prisma/client';
const user = { id: true, displayName: true, email: true };
const select = {
  id:true, uuid:true, companyId:true, code:true, supplierId:true, supplierContactId:true, branchId:true, warehouseId:true,
  purchaseQuotationId:true, createdByUserId:true, orderDate:true, expectedDate:true, currencyCode:true, exchangeRate:true,
  exchangeRateDate:true, paymentTerms:true, subtotal:true, discount:true, tax:true, additionalExpenses:true, total:true,
  status:true, notes:true, submittedAt:true, approvedAt:true, approvedByUserId:true, sentAt:true, sentByUserId:true,
  cancelledAt:true, cancelledByUserId:true, cancellationReason:true, createdAt:true, updatedAt:true,
  supplier:{select:{id:true,code:true,name:true}}, supplierContact:{select:{id:true,fullName:true,email:true}},
  branch:{select:{id:true,code:true,name:true}}, warehouse:{select:{id:true,code:true,name:true}},
  purchaseQuotation:{select:{id:true,code:true,status:true}}, createdBy:{select:user}, approvedBy:{select:user}, sentBy:{select:user}, cancelledBy:{select:user},
  details:{orderBy:{lineNumber:'asc'},include:{product:{select:{internalCode:true,name:true}},productUnit:{select:{code:true,name:true}}}},
  expenses:{orderBy:{lineNumber:'asc'},include:{expenseType:{select:{code:true,name:true}},documents:true}},
};
export function createPurchaseOrdersRepository(prisma) {
  return {
    async list(companyId,query){const where={companyId,...(query.status?{status:query.status}:{}),...(query.supplierId?{supplierId:query.supplierId}:{}),...(query.search?{OR:[{code:{contains:query.search}},{supplier:{name:{contains:query.search}}}]}:{})};const [items,total]=await Promise.all([prisma.purchaseOrder.findMany({where,select,skip:(query.page-1)*query.pageSize,take:query.pageSize,orderBy:{[query.sortBy]:query.sortOrder}}),prisma.purchaseOrder.count({where})]);return{items,total};},
    find(companyId,id,client=prisma){return client.purchaseOrder.findFirst({where:{id,companyId},select});},
    findAwards(companyId,purchaseRequestId,client=prisma){return client.purchaseRequest.findFirst({where:{id:purchaseRequestId,companyId,status:'IN_QUOTATION'},select:{id:true,branchId:true,warehouseId:true,branch:{select:{status:true}},warehouse:{select:{isActive:true}},quotationLinks:{select:{purchaseQuotation:{select:{id:true,supplierId:true,supplierContactId:true,status:true,currencyCode:true,exchangeRate:true,exchangeRateDate:true,paymentTerms:true,subtotal:true,expenses:true}},details:{where:{awardedQuantity:{gt:0},purchaseOrderDetail:{is:null}},include:{quotationDetail:true}}}}}});},
    create(data,client=prisma){return client.purchaseOrder.create({data,select});},
    async transition(companyId,id,expected,from,data,client=prisma){const result=await client.purchaseOrder.updateMany({where:{id,companyId,updatedAt:expected,status:{in:from}},data});return result.count===1?this.find(companyId,id,client):null;},
    findExpense(companyId,orderId,expenseId,client=prisma){return client.purchaseOrderExpense.findFirst({where:{id:expenseId,purchaseOrderId:orderId,companyId},include:{expenseType:{select:{code:true,name:true}},documents:true}});},
    findExpenseType(companyId,id,client=prisma){return client.expenseType.findFirst({where:{id,companyId,isActive:true},select:{id:true}});},
    nextExpenseLine(companyId,orderId,client=prisma){return client.purchaseOrderExpense.aggregate({where:{companyId,purchaseOrderId:orderId},_max:{lineNumber:true}});},
    createExpense(data,client=prisma){return client.purchaseOrderExpense.create({data,include:{expenseType:{select:{code:true,name:true}},documents:true}});},
    async updateExpense(companyId,orderId,expenseId,expected,data,client=prisma){const result=await client.purchaseOrderExpense.updateMany({where:{id:expenseId,purchaseOrderId:orderId,companyId,updatedAt:expected},data});return result.count===1?this.findExpense(companyId,orderId,expenseId,client):null;},
    async deleteExpense(companyId,orderId,expenseId,expected,client=prisma){const result=await client.purchaseOrderExpense.deleteMany({where:{id:expenseId,purchaseOrderId:orderId,companyId,updatedAt:expected}});return result.count===1;},
    async recalculate(companyId,orderId,expected,client=prisma){const [order,sum]=await Promise.all([client.purchaseOrder.findFirst({where:{id:orderId,companyId},select:{subtotal:true,discount:true,tax:true}}),client.purchaseOrderExpense.aggregate({where:{companyId,purchaseOrderId:orderId},_sum:{amount:true}})]);if(!order)return null;const additional=sum._sum.amount??0;const total=new Prisma.Decimal(order.subtotal).sub(order.discount).add(order.tax).add(additional);const result=await client.purchaseOrder.updateMany({where:{id:orderId,companyId,updatedAt:expected},data:{additionalExpenses:additional,total}});return result.count===1?this.find(companyId,orderId,client):null;},
    findDocument(companyId,orderId,expenseId,documentId,client=prisma){return client.purchaseOrderExpenseDocument.findFirst({where:{id:documentId,companyId,purchaseOrderExpenseId:expenseId,purchaseOrderExpense:{purchaseOrderId:orderId}},include:{uploadedBy:{select:user}}});},
    createDocument(data,client=prisma){return client.purchaseOrderExpenseDocument.create({data,include:{uploadedBy:{select:user}}});},
    async deleteDocument(companyId,orderId,expenseId,documentId,client=prisma){const found=await this.findDocument(companyId,orderId,expenseId,documentId,client);if(!found)return null;await client.purchaseOrderExpenseDocument.delete({where:{id:documentId}});return found;},
  };
}
