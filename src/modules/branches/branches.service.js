import { AppError } from '../../core/errors/app-error.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { concurrencyConflict } from '../../core/errors/concurrency.js';
import { paginationMeta } from '../../core/validation/pagination.js';
import {
  businessCodeEntities,
  generateBusinessCode,
} from '../../core/code-generation/business-code.js';
import {
  entityChangeOperations,
  entitySchemas,
  entityTypes,
} from '../entity-changes/entity-change.constants.js';
import { branchSnapshot } from '../entity-changes/entity-change.snapshots.js';
const notFound = () =>
  new AppError({
    code: errorCodes.notFound,
    message: 'The requested branch was not found.',
    statusCode: 404,
  });
const invalid = (message, details) =>
  new AppError({
    code: errorCodes.validation,
    message,
    details,
    statusCode: 400,
  });
export function createBranchesService({
  repository,
  entityChangeService,
  runInTransaction,
  generateCode = generateBusinessCode,
}) {
  async function validate(companyId, address, requireActiveCompany, client) {
    const [company, value] = await Promise.all([
      repository.findCompany(companyId, client),
      repository.findAddress(address, client),
    ]);
    if (!company || (requireActiveCompany && company.status !== 'ACTIVE'))
      throw invalid('An active company is required.');
    if (!value.country)
      throw invalid(
        'The selected country does not exist or is inactive.',
        { fields: ['countryId'] },
      );
    if (value.country.abbreviation === 'SV' && !value.district)
      throw invalid(
        'Department, municipality, and district are required and must form an active valid hierarchy for El Salvador.',
        { fields: ['departmentId', 'municipalityId', 'districtId'] },
      );
    if (
      value.country.abbreviation === 'SV' &&
      (address.foreignAdministrativeArea || address.foreignLocality)
    )
      throw invalid(
        'Foreign administrative fields do not apply to an address in El Salvador.',
        { fields: ['foreignAdministrativeArea', 'foreignLocality'] },
      );
    if (
      value.country.abbreviation !== 'SV' &&
      (!address.foreignAdministrativeArea ||
        !address.foreignLocality ||
        address.departmentId ||
        address.municipalityId ||
        address.districtId)
    )
      throw invalid(
        'A foreign address requires administrative area and locality and cannot use El Salvador subdivision catalogs.',
        {
          fields: [
            'departmentId',
            'municipalityId',
            'districtId',
            'foreignAdministrativeArea',
            'foreignLocality',
          ],
        },
      );
  }
  const record = (companyId, oldBranch, newBranch, context, metadata, client) =>
    entityChangeService?.record(
      {
        schemaName: entitySchemas.companies,
        entityType: entityTypes.branch,
        entityId: newBranch?.id ?? oldBranch.id,
        companyId,
        operation: oldBranch
          ? entityChangeOperations.update
          : entityChangeOperations.create,
        context,
        oldValues: branchSnapshot(oldBranch),
        newValues: branchSnapshot(newBranch),
        metadata,
      },
      client,
    );
  return {
    async list(companyId, query) {
      const result = await repository.list(companyId, query);
      return {
        branches: result.items,
        pagination: paginationMeta({ ...query, total: result.total }),
      };
    },
    async get(companyId, id) {
      const branch = await repository.find(companyId, id);
      if (!branch) throw notFound();
      return branch;
    },
    create(companyId, data, context) {
      return runInTransaction(
        async (client) => {
          await validate(companyId, data, true, client);
          const code = await generateCode(client, businessCodeEntities.branch, {
            companyId,
          });
          if (data.isHeadquarters)
            await repository.clearHeadquarters(companyId, null, client);
          const created = await repository.create(
            companyId,
            { ...data, code },
            client,
          );
          await record(companyId, null, created, context, null, client);
          return created;
        },
        { isolationLevel: 'Serializable' },
      );
    },
    async update(companyId, id, data, context) {
      const existing = await this.get(companyId, id);
      const { expectedUpdatedAt, ...changes } = data;
      return runInTransaction(
        async (client) => {
          const supplied = (field) =>
            Object.prototype.hasOwnProperty.call(changes, field);
          await validate(
            companyId,
            {
              countryId: changes.countryId ?? existing.countryId,
              departmentId: supplied('departmentId')
                ? changes.departmentId
                : existing.departmentId,
              municipalityId: supplied('municipalityId')
                ? changes.municipalityId
                : existing.municipalityId,
              districtId: supplied('districtId')
                ? changes.districtId
                : existing.districtId,
              foreignAdministrativeArea: supplied(
                'foreignAdministrativeArea',
              )
                ? changes.foreignAdministrativeArea
                : existing.foreignAdministrativeArea,
              foreignLocality: supplied('foreignLocality')
                ? changes.foreignLocality
                : existing.foreignLocality,
            },
            false,
            client,
          );
          if (changes.isHeadquarters)
            await repository.clearHeadquarters(companyId, id, client);
          const updated = await repository.update(
            companyId,
            id,
            new Date(expectedUpdatedAt),
            changes,
            client,
          );
          if (!updated) throw concurrencyConflict('branch', existing.updatedAt);
          await record(companyId, existing, updated, context, null, client);
          return updated;
        },
        { isolationLevel: 'Serializable' },
      );
    },
    async changeStatus(companyId, id, { status, expectedUpdatedAt }, context) {
      const existing = await this.get(companyId, id);
      return runInTransaction(async (client) => {
        if (status === 'ACTIVE')
          await validate(companyId, existing, true, client);
        const updated = await repository.update(
          companyId,
          id,
          new Date(expectedUpdatedAt),
          { status },
          client,
        );
        if (!updated) throw concurrencyConflict('branch', existing.updatedAt);
        await record(
          companyId,
          existing,
          updated,
          context,
          { reason: 'STATUS_CHANGE' },
          client,
        );
        return updated;
      });
    },
  };
}
