import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { sendSuccess } from '../../core/http/responses.js';
import {
  createFileReadUrlBody,
  prepareImageUploadBody,
} from './files.schemas.js';

export function createFilesRouter(storage) {
  const router = Router();
  router.use(authenticate);
  router.post(
    '/image-upload',
    authorizeCompany('files.create'),
    validate({ body: prepareImageUploadBody }),
    async (request, response) => {
      const result = await storage.prepareImageUpload({
        companyId: request.tenant.companyId,
        ...request.validated.body,
      });
      return sendSuccess(response, result, { statusCode: 201 });
    },
  );
  router.post(
    '/read-url',
    authorizeCompany('files.read'),
    validate({ body: createFileReadUrlBody }),
    async (request, response) => {
      return sendSuccess(
        response,
        await storage.createReadUrl({
          companyId: request.tenant.companyId,
          ...request.validated.body,
        }),
      );
    },
  );
  return router;
}
