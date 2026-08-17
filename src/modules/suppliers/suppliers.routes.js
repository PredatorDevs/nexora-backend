import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createSuppliersController } from './suppliers.controller.js';
import {
  createSupplierBody, createSupplierContactBody, setPrimarySupplierContactBody,
  supplierContactParams, supplierContactsListQuery, supplierIdParams, suppliersListQuery,
  updateSupplierBody, updateSupplierContactBody, updateSupplierContactStatusBody,
  updateSupplierStatusBody,
} from './suppliers.schemas.js';

export function createSuppliersRouter(service, auditService) {
  const router = Router();
  const controller = createSuppliersController(service, auditService);
  router.use(authenticate);
  router.get('/', authorizeCompany('suppliers.read'), validate({ query: suppliersListQuery }), controller.list);
  router.get('/:supplierId', authorizeCompany('suppliers.read'), validate({ params: supplierIdParams }), controller.get);
  router.post('/', authorizeCompany('suppliers.create'), validate({ body: createSupplierBody }), controller.create);
  router.put('/:supplierId', authorizeCompany('suppliers.update'), validate({ params: supplierIdParams, body: updateSupplierBody }), controller.update);
  router.patch('/:supplierId/status', authorizeCompany('suppliers.change_status'), validate({ params: supplierIdParams, body: updateSupplierStatusBody }), controller.changeStatus);
  router.get('/:supplierId/contacts', authorizeCompany('supplier_contacts.read'), validate({ params: supplierIdParams, query: supplierContactsListQuery }), controller.listContacts);
  router.get('/:supplierId/contacts/:contactId', authorizeCompany('supplier_contacts.read'), validate({ params: supplierContactParams }), controller.getContact);
  router.post('/:supplierId/contacts', authorizeCompany('supplier_contacts.create'), validate({ params: supplierIdParams, body: createSupplierContactBody }), controller.createContact);
  router.put('/:supplierId/contacts/:contactId', authorizeCompany('supplier_contacts.update'), validate({ params: supplierContactParams, body: updateSupplierContactBody }), controller.updateContact);
  router.patch('/:supplierId/contacts/:contactId/status', authorizeCompany('supplier_contacts.change_status'), validate({ params: supplierContactParams, body: updateSupplierContactStatusBody }), controller.changeContactStatus);
  router.patch('/:supplierId/contacts/:contactId/primary', authorizeCompany('supplier_contacts.set_primary'), validate({ params: supplierContactParams, body: setPrimarySupplierContactBody }), controller.setPrimaryContact);
  return router;
}
