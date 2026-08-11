import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompanyOrPlatform } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { sendSuccess } from '../../core/http/responses.js';
import { paginationMeta } from '../../core/validation/pagination.js';
import {
  countriesListQuery,
  departmentsListQuery,
  districtsListQuery,
  municipalitiesListQuery,
} from './address-dictionaries.schemas.js';

function listHandler(operation) {
  return async (request, response) => {
    const query = request.validated.query;
    const result = await operation(query);
    return sendSuccess(response, result.items, {
      meta: { pagination: paginationMeta({ ...query, total: result.total }) },
    });
  };
}

export function createAddressDictionariesRouter(repository) {
  const router = Router();
  router.use(
    authenticate,
    authorizeCompanyOrPlatform('address_dictionaries.read'),
  );

  router.get(
    '/countries',
    validate({ query: countriesListQuery }),
    listHandler((query) => repository.listCountries(query)),
  );
  router.get(
    '/departments',
    validate({ query: departmentsListQuery }),
    listHandler((query) => repository.listDepartments(query)),
  );
  router.get(
    '/municipalities',
    validate({ query: municipalitiesListQuery }),
    listHandler((query) => repository.listMunicipalities(query)),
  );
  router.get(
    '/districts',
    validate({ query: districtsListQuery }),
    listHandler((query) => repository.listDistricts(query)),
  );

  return router;
}
