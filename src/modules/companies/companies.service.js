import { AppError } from '../../core/errors/app-error.js';
import { concurrencyConflict } from '../../core/errors/concurrency.js';
import { errorCodes } from '../../core/errors/error-codes.js';
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
import { companySnapshot } from '../entity-changes/entity-change.snapshots.js';

const notFound = () =>
  new AppError({
    code: errorCodes.notFound,
    message: 'The requested company was not found.',
    statusCode: 404,
  });

const validationError = (message, details) =>
  new AppError({
    code: errorCodes.validation,
    message,
    statusCode: 400,
    details,
  });

function activityRows(activities) {
  return activities.map(({ economicActivityId, type }) => ({
    economicActivityId,
    type,
  }));
}

export function createCompaniesService({
  repository,
  entityChangeService,
  runInTransaction,
  provisionRoles = async () => {},
  provisionWarehouseCategories = async () => {},
  generateCode = generateBusinessCode,
}) {
  async function validateReferences(data, client) {
    const address = await repository.findAddressContext(data, client);
    if (!address.country) {
      throw validationError(
        'The selected country does not exist or is inactive.',
        { fields: ['countryId'] },
      );
    }
    if (address.country.abbreviation === 'SV' && !address.district) {
      throw validationError(
        'Department, municipality, and district are required and must form an active valid hierarchy for El Salvador.',
        { fields: ['departmentId', 'municipalityId', 'districtId'] },
      );
    }
    if (
      address.country.abbreviation === 'SV' &&
      (data.foreignAdministrativeArea || data.foreignLocality)
    ) {
      throw validationError(
        'Foreign administrative fields do not apply to an address in El Salvador.',
        { fields: ['foreignAdministrativeArea', 'foreignLocality'] },
      );
    }
    if (
      address.country.abbreviation !== 'SV' &&
      (!data.foreignAdministrativeArea ||
        !data.foreignLocality ||
        data.departmentId ||
        data.municipalityId ||
        data.districtId)
    ) {
      throw validationError(
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

    const requestedIds = data.economicActivities.map(
      ({ economicActivityId }) => economicActivityId,
    );
    const activities = await repository.findActiveEconomicActivities(
      requestedIds,
      client,
    );
    if (activities.length !== requestedIds.length) {
      const found = new Set(activities.map(({ id }) => id));
      throw validationError(
        'Some economic activities do not exist or are inactive.',
        {
          invalidEconomicActivityIds: requestedIds.filter(
            (id) => !found.has(id),
          ),
        },
      );
    }
  }

  const recordChange = (
    { operation, context, oldCompany = null, newCompany = null, metadata },
    client,
  ) =>
    entityChangeService?.record(
      {
        schemaName: entitySchemas.companies,
        entityType: entityTypes.company,
        entityId: newCompany?.id ?? oldCompany.id,
        operation,
        context,
        oldValues: companySnapshot(oldCompany),
        newValues: companySnapshot(newCompany),
        metadata,
      },
      client,
    );

  return {
    async list(query) {
      const result = await repository.list(query);
      return {
        companies: result.items,
        pagination: paginationMeta({ ...query, total: result.total }),
      };
    },

    async get(id) {
      const company = await repository.findById(id);
      if (!company) throw notFound();
      return company;
    },

    create(data, context) {
      return runInTransaction(
        async (client) => {
          await validateReferences(data, client);
          const code = await generateCode(client, businessCodeEntities.company);
          const created = await repository.create(
            {
              ...data,
              code,
              economicActivities: activityRows(data.economicActivities),
            },
            client,
          );
          await provisionRoles(client, created.id, context.actorUserId);
          await provisionWarehouseCategories(client, created.id);
          await recordChange(
            {
              operation: entityChangeOperations.create,
              context,
              newCompany: created,
            },
            client,
          );
          return created;
        },
        { maxWait: 10_000, timeout: 30_000 },
      );
    },

    async update(id, data, context) {
      const existing = await repository.findById(id);
      if (!existing) throw notFound();
      const { expectedUpdatedAt, ...changes } = data;
      return runInTransaction(async (client) => {
        const supplied = (field) =>
          Object.prototype.hasOwnProperty.call(changes, field);
        const effective = {
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
          foreignAdministrativeArea: supplied('foreignAdministrativeArea')
            ? changes.foreignAdministrativeArea
            : existing.foreignAdministrativeArea,
          foreignLocality: supplied('foreignLocality')
            ? changes.foreignLocality
            : existing.foreignLocality,
          economicActivities:
            changes.economicActivities ??
            existing.economicActivities.map(({ type, economicActivity }) => ({
              type,
              economicActivityId: economicActivity.id,
            })),
        };
        await validateReferences(effective, client);
        const updated = await repository.update(
          id,
          new Date(expectedUpdatedAt),
          changes.economicActivities
            ? {
                ...changes,
                economicActivities: activityRows(changes.economicActivities),
              }
            : changes,
          client,
        );
        if (!updated) throw concurrencyConflict('company', existing.updatedAt);
        await recordChange(
          {
            operation: entityChangeOperations.update,
            context,
            oldCompany: existing,
            newCompany: updated,
          },
          client,
        );
        return updated;
      });
    },

    async changeStatus(id, { status, expectedUpdatedAt }, context) {
      const existing = await repository.findById(id);
      if (!existing) throw notFound();
      return runInTransaction(async (client) => {
        const updated = await repository.updateStatus(
          id,
          new Date(expectedUpdatedAt),
          status,
          client,
        );
        if (!updated) throw concurrencyConflict('company', existing.updatedAt);
        await recordChange(
          {
            operation: entityChangeOperations.update,
            context,
            oldCompany: existing,
            newCompany: updated,
            metadata: { reason: 'STATUS_CHANGE' },
          },
          client,
        );
        return updated;
      });
    },
  };
}
