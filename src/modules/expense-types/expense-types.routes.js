import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createExpenseTypesController } from './expense-types.controller.js';
import {
  createExpenseTypeBody,
  expenseTypeIdParams,
  expenseTypesListQuery,
  updateExpenseTypeBody,
  updateExpenseTypeStatusBody,
} from './expense-types.schemas.js';
export function createExpenseTypesRouter(service, auditService) {
  const router = Router();
  const controller = createExpenseTypesController(service, auditService);
  router.use(authenticate);
  router.get(
    '/',
    authorizeCompany('expense_types.read'),
    validate({ query: expenseTypesListQuery }),
    controller.list,
  );
  router.get(
    '/:id',
    authorizeCompany('expense_types.read'),
    validate({ params: expenseTypeIdParams }),
    controller.get,
  );
  router.post(
    '/',
    authorizeCompany('expense_types.create'),
    validate({ body: createExpenseTypeBody }),
    controller.create,
  );
  router.put(
    '/:id',
    authorizeCompany('expense_types.update'),
    validate({ params: expenseTypeIdParams, body: updateExpenseTypeBody }),
    controller.update,
  );
  router.patch(
    '/:id/status',
    authorizeCompany('expense_types.change_status'),
    validate({
      params: expenseTypeIdParams,
      body: updateExpenseTypeStatusBody,
    }),
    controller.changeStatus,
  );
  return router;
}
