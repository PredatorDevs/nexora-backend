import { auditRequestContext } from '../../core/audit/request-context.js';
import { sendSuccess } from '../../core/http/responses.js';
import { auditActions } from '../audit/audit.constants.js';
export function createPurchasesController(service,auditService){const context=(r)=>({actorUserId:r.auth.userId,requestId:r.id,companyId:r.tenant.companyId,membershipId:r.tenant.membershipId});const audited=(r,action,operation)=>auditService?auditService.execute({actorUserId:r.auth.userId,action,resourceType:'purchase',resourceId:r.validated.params?.id??((value)=>value.id),context:auditRequestContext(r),metadata:{companyId:r.tenant.companyId}},operation):Promise.resolve().then(operation);return{
 async list(r,s){const result=await service.list(r.tenant.companyId,r.validated.query);return sendSuccess(s,result.purchases,{meta:{pagination:result.pagination}});},
 async get(r,s){return sendSuccess(s,await service.get(r.tenant.companyId,r.validated.params.id));},
 async availability(r,s){return sendSuccess(s,await service.availability(r.tenant.companyId,r.validated.params.orderId));},
 async create(r,s){return sendSuccess(s,await audited(r,auditActions.purchaseCreated,()=>service.create(r.tenant.companyId,r.validated.body,context(r))),{statusCode:201});},
 async update(r,s){return sendSuccess(s,await audited(r,auditActions.purchaseUpdated,()=>service.update(r.tenant.companyId,r.validated.params.id,r.validated.body,context(r))));},
 async receive(r,s){return sendSuccess(s,await audited(r,auditActions.purchaseReceived,()=>service.receive(r.tenant.companyId,r.validated.params.id,r.validated.body,context(r))));},
};}
