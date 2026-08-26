import {
  businessCodeEntities,
  generateBusinessCode,
  generateBusinessCodes,
} from '../../core/code-generation/business-code.js';
import { AppError } from '../../core/errors/app-error.js';
import { concurrencyConflict } from '../../core/errors/concurrency.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { paginationMeta } from '../../core/validation/pagination.js';
import {
  entityChangeOperations,
  entitySchemas,
  entityTypes,
} from '../entity-changes/entity-change.constants.js';
import { locationSnapshot } from '../entity-changes/entity-change.snapshots.js';

const notFound = () =>
  new AppError({
    code: errorCodes.notFound,
    message: 'The requested location was not found.',
    statusCode: 404,
  });
const invalid = (message, fields) =>
  new AppError({
    code: errorCodes.validation,
    message,
    details: fields ? { fields } : undefined,
    statusCode: 400,
  });

export function createLocationsService({
  repository,
  entityChangeService,
  runInTransaction,
  generateCode = generateBusinessCode,
  generateCodes = generateBusinessCodes,
}) {
  async function requireActiveWarehouse(companyId, warehouseId, client) {
    const warehouse = await repository.findWarehouse(
      companyId,
      warehouseId,
      client,
    );
    if (
      !warehouse ||
      !warehouse.isActive ||
      warehouse.company.status !== 'ACTIVE'
    ) {
      throw invalid(
        'The selected warehouse must exist and be active in this company.',
        ['warehouseId'],
      );
    }
  }
  function validateCapacity(capacity, capacityUnit) {
    if ((capacity != null) !== (capacityUnit != null)) {
      throw invalid('Capacity and capacity unit must be provided together.', [
        'capacity',
        'capacityUnit',
      ]);
    }
    if (capacity != null && capacity <= 0) {
      throw invalid('Capacity must be greater than zero.', ['capacity']);
    }
  }
  const record = (companyId, oldValue, newValue, context, metadata, client) =>
    entityChangeService?.record(
      {
        schemaName: entitySchemas.companies,
        entityType: entityTypes.location,
        entityId: newValue?.id ?? oldValue.id,
        companyId,
        operation: oldValue
          ? entityChangeOperations.update
          : entityChangeOperations.create,
        context,
        oldValues: locationSnapshot(oldValue),
        newValues: locationSnapshot(newValue),
        metadata,
      },
      client,
    );
  return {
    async list(companyId, query) {
      const result = await repository.list(companyId, query);
      return {
        locations: result.items,
        pagination: paginationMeta({ ...query, total: result.total }),
      };
    },
    async get(companyId, id) {
      const location = await repository.find(companyId, id);
      if (!location) throw notFound();
      return location;
    },
    create(companyId, data, context) {
      return runInTransaction(async (client) => {
        await requireActiveWarehouse(companyId, data.warehouseId, client);
        validateCapacity(data.capacity, data.capacityUnit);
        const code = await generateCode(client, businessCodeEntities.location, {
          warehouseId: data.warehouseId,
        });
        const created = await repository.create(
          companyId,
          { ...data, code },
          client,
        );
        await record(companyId, null, created, context, null, client);
        return created;
      });
    },
    createBulk(companyId, data, context) {
      const {
        levelCount,
        positionsPerLevel,
        warehouseId,
        aisle,
        rack,
        ...shared
      } = data;
      const coordinates = Array.from({ length: levelCount }, (_, level) =>
        Array.from({ length: positionsPerLevel }, (_unused, position) => ({
          aisle,
          rack,
          level: String(level + 1),
          position: String(position + 1),
        })),
      ).flat();
      return runInTransaction(
        async (client) => {
          await requireActiveWarehouse(companyId, warehouseId, client);
          validateCapacity(shared.capacity, shared.capacityUnit);
          const conflicts = await repository.findCoordinateConflicts(
            companyId,
            warehouseId,
            coordinates,
            client,
          );
          if (conflicts.length) {
            const preview = conflicts
              .slice(0, 5)
              .map(
                (value) =>
                  `${value.aisle}/${value.rack}/${value.level}/${value.position}`,
              )
              .join(', ');
            throw invalid(
              `Some generated locations already exist: ${preview}${conflicts.length > 5 ? '…' : ''}`,
              ['aisle', 'rack', 'levelCount', 'positionsPerLevel'],
            );
          }
          const codes = await generateCodes(
            client,
            businessCodeEntities.location,
            coordinates.length,
            { warehouseId },
          );
          const created = await repository.createBulk(
            companyId,
            coordinates.map((coordinate, index) => ({
              warehouseId,
              ...coordinate,
              ...shared,
              code: codes[index],
            })),
            client,
          );
          await entityChangeService?.recordMany(
            created.map((location) => ({
              schemaName: entitySchemas.companies,
              entityType: entityTypes.location,
              entityId: location.id,
              companyId,
              operation: entityChangeOperations.create,
              context,
              oldValues: null,
              newValues: locationSnapshot(location),
              metadata: {
                reason: 'BULK_CREATE',
                bulkSize: created.length,
              },
            })),
            client,
          );
          return { locations: created, createdCount: created.length };
        },
        {
          isolationLevel: 'Serializable',
          maxWait: 5_000,
          timeout: 20_000,
        },
      );
    },
    async update(companyId, id, data, context) {
      const existing = await this.get(companyId, id);
      const { expectedUpdatedAt, ...changes } = data;
      const supplied = (field) =>
        Object.prototype.hasOwnProperty.call(changes, field);
      validateCapacity(
        supplied('capacity') ? changes.capacity : existing.capacity,
        supplied('capacityUnit') ? changes.capacityUnit : existing.capacityUnit,
      );
      return runInTransaction(async (client) => {
        const updated = await repository.update(
          companyId,
          id,
          new Date(expectedUpdatedAt),
          changes,
          client,
        );
        if (!updated) throw concurrencyConflict('location', existing.updatedAt);
        await record(companyId, existing, updated, context, null, client);
        return updated;
      });
    },
    async changeStatus(
      companyId,
      id,
      { isActive, expectedUpdatedAt },
      context,
    ) {
      const existing = await this.get(companyId, id);
      return runInTransaction(async (client) => {
        if (isActive)
          await requireActiveWarehouse(companyId, existing.warehouseId, client);
        const updated = await repository.update(
          companyId,
          id,
          new Date(expectedUpdatedAt),
          { isActive },
          client,
        );
        if (!updated) throw concurrencyConflict('location', existing.updatedAt);
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
