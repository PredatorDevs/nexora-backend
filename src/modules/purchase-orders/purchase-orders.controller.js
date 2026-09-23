import { auditRequestContext } from '../../core/audit/request-context.js';
import { sendSuccess } from '../../core/http/responses.js';
import { auditActions } from '../audit/audit.constants.js';
export function createPurchaseOrdersController(service,auditService){
 const context=(r)=>({actorUserId:r.auth.userId,requestId:r.id,companyId:r.tenant.companyId,membershipId:r.tenant.membershipId});
 const audited=(r,action,resourceId,operation,metadata)=>auditService?auditService.execute({actorUserId:r.auth.userId,action,resourceType:'purchase_order',resourceId,context:auditRequestContext(r),metadata:{companyId:r.tenant.companyId,...metadata}},operation):Promise.resolve().then(operation);
 const mutate=(method,action)=>async(r,s)=>sendSuccess(s,await audited(r,action,r.validated.params.id,()=>service[method](r.tenant.companyId,r.validated.params.id,r.validated.body,context(r))));
 const expense=(method,action)=>async(r,s)=>sendSuccess(s,await audited(r,action,r.validated.params.id,()=>service[method](r.tenant.companyId,r.validated.params.id,r.validated.params.expenseId,r.validated.body,context(r)),{expenseId:r.validated.params.expenseId}),{statusCode:method==='createExpense'?201:200});
 return{
  async list(r,s){const value=await service.list(r.tenant.companyId,r.validated.query);return sendSuccess(s,value.purchaseOrders,{meta:{pagination:value.pagination}});},
  async get(r,s){return sendSuccess(s,await service.get(r.tenant.companyId,r.validated.params.id));},
  async generate(r,s){return sendSuccess(s,await audited(r,auditActions.purchaseOrderGenerated,(value)=>value.map((item)=>item.id).join(','),()=>service.generate(r.tenant.companyId,r.validated.body,context(r))),{statusCode:201});},
  submit:mutate('submit',auditActions.purchaseOrderSubmitted),approve:mutate('approve',auditActions.purchaseOrderApproved),send:mutate('send',auditActions.purchaseOrderSent),cancel:mutate('cancel',auditActions.purchaseOrderCancelled),
  createExpense:expense('createExpense',auditActions.purchaseOrderExpenseCreated),updateExpense:expense('updateExpense',auditActions.purchaseOrderExpenseUpdated),deleteExpense:expense('deleteExpense',auditActions.purchaseOrderExpenseDeleted),
  async prepareDocument(r,s){return sendSuccess(s,await service.prepareDocument(r.tenant.companyId,r.validated.params.id,r.validated.params.expenseId,r.validated.body),{statusCode:201});},
  async registerDocument(r,s){return sendSuccess(s,await audited(r,auditActions.purchaseOrderDocumentCreated,r.validated.params.id,()=>service.registerDocument(r.tenant.companyId,r.validated.params.id,r.validated.params.expenseId,r.validated.body,context(r)),{expenseId:r.validated.params.expenseId}),{statusCode:201});},
  async readDocument(r,s){return sendSuccess(s,await service.readDocument(r.tenant.companyId,r.validated.params.id,r.validated.params.expenseId,r.validated.params.documentId));},
  async deleteDocument(r,s){return sendSuccess(s,await audited(r,auditActions.purchaseOrderDocumentDeleted,r.validated.params.id,()=>service.deleteDocument(r.tenant.companyId,r.validated.params.id,r.validated.params.expenseId,r.validated.params.documentId,r.validated.body,context(r)),{expenseId:r.validated.params.expenseId,documentId:r.validated.params.documentId}));}
 };
}
