import { AppError } from '../../core/errors/app-error.js';
import { concurrencyConflict } from '../../core/errors/concurrency.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { paginationMeta } from '../../core/validation/pagination.js';
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
}) {
  async function validateReferences(data, client) {
    const address = await repository.findAddressContext(data, client);
    if (
      !address.country ||
      address.country.abbreviation !== 'SV' ||
      !address.district
    ) {
      throw validationError(
        'The selected address catalogs do not form an active valid hierarchy.',
        {
          fields: ['countryId', 'departmentId', 'municipalityId', 'districtId'],
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
      return runInTransaction(async (client) => {
        await validateReferences(data, client);
        const created = await repository.create(
          {
            ...data,
            economicActivities: activityRows(data.economicActivities),
          },
          client,
        );
        await recordChange(
          {
            operation: entityChangeOperations.create,
            context,
            newCompany: created,
          },
          client,
        );
        return created;
      });
    },

    async update(id, data, context) {
      const existing = await repository.findById(id);
      if (!existing) throw notFound();
      const { expectedUpdatedAt, ...changes } = data;
      return runInTransaction(async (client) => {
        const effective = {
          countryId: changes.countryId ?? existing.countryId,
          departmentId: changes.departmentId ?? existing.departmentId,
          municipalityId: changes.municipalityId ?? existing.municipalityId,
          districtId: changes.districtId ?? existing.districtId,
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
