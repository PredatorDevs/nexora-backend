import {
  businessCodeEntities,
  generateBusinessCode,
} from '../../core/code-generation/business-code.js';
import { AppError } from '../../core/errors/app-error.js';
import { concurrencyConflict } from '../../core/errors/concurrency.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { paginationMeta } from '../../core/validation/pagination.js';
import { entityChangeOperations, entitySchemas, entityTypes } from '../entity-changes/entity-change.constants.js';
import { supplierContactSnapshot, supplierSnapshot } from '../entity-changes/entity-change.snapshots.js';

const notFound = (resource) => new AppError({
  code: errorCodes.notFound,
  message: `The requested ${resource} was not found.`,
  statusCode: 404,
});
const invalid = (message, fields) => new AppError({
  code: errorCodes.validation,
  message,
  details: fields ? { fields } : undefined,
  statusCode: 400,
});

export function createSuppliersService({
  repository,
  entityChangeService,
  runInTransaction,
  generateCode = generateBusinessCode,
}) {
  async function validateAddress(companyId, data, requireActiveCompany, client) {
    const value = await repository.findAddressContext(companyId, data, client);
    if (!value.company || (requireActiveCompany && value.company.status !== 'ACTIVE'))
      throw invalid('An active company is required.');
    if (!value.country)
      throw invalid('The selected country does not exist or is inactive.', ['countryId']);
    if (value.country.abbreviation === 'SV' && !value.district)
      throw invalid('Department, municipality, and district are required and must form an active valid hierarchy for El Salvador.', ['departmentId', 'municipalityId', 'districtId']);
    if (value.country.abbreviation === 'SV' && (data.foreignAdministrativeArea || data.foreignLocality))
      throw invalid('Foreign administrative fields do not apply to an address in El Salvador.', ['foreignAdministrativeArea', 'foreignLocality']);
    if (
      value.country.abbreviation !== 'SV' &&
      (!data.foreignAdministrativeArea || !data.foreignLocality || data.departmentId || data.municipalityId || data.districtId)
    )
      throw invalid('A foreign address requires administrative area and locality and cannot use El Salvador subdivision catalogs.', [
        'departmentId', 'municipalityId', 'districtId', 'foreignAdministrativeArea', 'foreignLocality',
      ]);
  }
  const record = (entityType, companyId, oldValue, newValue, context, metadata, client) =>
    entityChangeService?.record({
      schemaName: entitySchemas.companies,
      entityType,
      entityId: newValue?.id ?? oldValue.id,
      companyId,
      operation: oldValue ? entityChangeOperations.update : entityChangeOperations.create,
      context,
      oldValues: entityType === entityTypes.supplier ? supplierSnapshot(oldValue) : supplierContactSnapshot(oldValue),
      newValues: entityType === entityTypes.supplier ? supplierSnapshot(newValue) : supplierContactSnapshot(newValue),
      metadata,
    }, client);
  async function getSupplier(companyId, supplierId, client) {
    const supplier = await repository.findSupplier(companyId, supplierId, client);
    if (!supplier) throw notFound('supplier');
    return supplier;
  }
  async function getContact(companyId, supplierId, contactId, client) {
    const contact = await repository.findContact(companyId, supplierId, contactId, client);
    if (!contact) throw notFound('supplier contact');
    return contact;
  }
  async function unsetPreviousPrimary(companyId, supplierId, exceptId, context, client) {
    const previous = await repository.findPrimaryContact(companyId, supplierId, client);
    if (!previous || previous.id === exceptId) return previous;
    const updated = await repository.updateContact(
      companyId, supplierId, previous.id, previous.updatedAt, { isPrimary: false }, client,
    );
    if (!updated) throw concurrencyConflict('supplier contact', previous.updatedAt);
    await record(entityTypes.supplierContact, companyId, previous, updated, context, { reason: 'PRIMARY_CONTACT_CHANGED' }, client);
    return previous;
  }
  return {
    async list(companyId, query) {
      const result = await repository.list(companyId, query);
      return { suppliers: result.items, pagination: paginationMeta({ ...query, total: result.total }) };
    },
    get(companyId, supplierId) {
      return getSupplier(companyId, supplierId);
    },
    create(companyId, data, context) {
      return runInTransaction(async (client) => {
        await validateAddress(companyId, data, true, client);
        const code = await generateCode(client, businessCodeEntities.supplier, { companyId });
        const created = await repository.createSupplier(companyId, { ...data, code }, client);
        await record(entityTypes.supplier, companyId, null, created, context, null, client);
        return created;
      });
    },
    async update(companyId, supplierId, data, context) {
      const existing = await getSupplier(companyId, supplierId);
      const { expectedUpdatedAt, ...changes } = data;
      const addressFields = [
        'countryId', 'departmentId', 'municipalityId', 'districtId',
        'foreignAdministrativeArea', 'foreignLocality',
      ];
      return runInTransaction(async (client) => {
        if (addressFields.some((field) => Object.prototype.hasOwnProperty.call(changes, field))) {
          const supplied = (field) => Object.prototype.hasOwnProperty.call(changes, field);
          await validateAddress(companyId, {
            countryId: changes.countryId ?? existing.countryId,
            departmentId: supplied('departmentId') ? changes.departmentId : existing.departmentId,
            municipalityId: supplied('municipalityId') ? changes.municipalityId : existing.municipalityId,
            districtId: supplied('districtId') ? changes.districtId : existing.districtId,
            foreignAdministrativeArea: supplied('foreignAdministrativeArea') ? changes.foreignAdministrativeArea : existing.foreignAdministrativeArea,
            foreignLocality: supplied('foreignLocality') ? changes.foreignLocality : existing.foreignLocality,
          }, false, client);
        }
        const updated = await repository.updateSupplier(companyId, supplierId, new Date(expectedUpdatedAt), changes, client);
        if (!updated) throw concurrencyConflict('supplier', existing.updatedAt);
        await record(entityTypes.supplier, companyId, existing, updated, context, null, client);
        return updated;
      });
    },
    async changeStatus(companyId, supplierId, { isActive, expectedUpdatedAt }, context) {
      const existing = await getSupplier(companyId, supplierId);
      return runInTransaction(async (client) => {
        if (isActive) await validateAddress(companyId, existing, true, client);
        const updated = await repository.updateSupplier(
          companyId, supplierId, new Date(expectedUpdatedAt), { isActive }, client,
        );
        if (!updated) throw concurrencyConflict('supplier', existing.updatedAt);
        await record(entityTypes.supplier, companyId, existing, updated, context, { reason: 'STATUS_CHANGE' }, client);
        return updated;
      });
    },
    async listContacts(companyId, supplierId, query) {
      await getSupplier(companyId, supplierId);
      const result = await repository.listContacts(companyId, supplierId, query);
      return { contacts: result.items, pagination: paginationMeta({ ...query, total: result.total }) };
    },
    getContact(companyId, supplierId, contactId) {
      return getContact(companyId, supplierId, contactId);
    },
    createContact(companyId, supplierId, data, context) {
      return runInTransaction(async (client) => {
        const supplier = await getSupplier(companyId, supplierId, client);
        if (!supplier.isActive) throw invalid('An active supplier is required.', ['supplierId']);
        const { validFrom, ...fields } = data;
        if (fields.isPrimary)
          await unsetPreviousPrimary(companyId, supplierId, null, context, client);
        const created = await repository.createContact(companyId, supplierId, {
          ...fields,
          ...(validFrom ? { validFrom: new Date(validFrom) } : {}),
        }, client);
        await record(entityTypes.supplierContact, companyId, null, created, context, null, client);
        return created;
      }, { isolationLevel: 'Serializable' });
    },
    async updateContact(companyId, supplierId, contactId, data, context) {
      const existing = await getContact(companyId, supplierId, contactId);
      const { expectedUpdatedAt, ...changes } = data;
      return runInTransaction(async (client) => {
        const updated = await repository.updateContact(
          companyId, supplierId, contactId, new Date(expectedUpdatedAt), changes, client,
        );
        if (!updated) throw concurrencyConflict('supplier contact', existing.updatedAt);
        await record(entityTypes.supplierContact, companyId, existing, updated, context, null, client);
        return updated;
      });
    },
    async changeContactStatus(companyId, supplierId, contactId, { isActive, expectedUpdatedAt }, context) {
      const existing = await getContact(companyId, supplierId, contactId);
      return runInTransaction(async (client) => {
        if (isActive) {
          const supplier = await getSupplier(companyId, supplierId, client);
          if (!supplier.isActive) throw invalid('An active supplier is required.', ['supplierId']);
        }
        const end = new Date(Math.max(Date.now(), new Date(existing.validFrom).getTime()));
        const updated = await repository.updateContact(
          companyId, supplierId, contactId, new Date(expectedUpdatedAt),
          isActive
            ? { isActive: true, validUntil: null }
            : { isActive: false, isPrimary: false, validUntil: end },
          client,
        );
        if (!updated) throw concurrencyConflict('supplier contact', existing.updatedAt);
        await record(entityTypes.supplierContact, companyId, existing, updated, context, { reason: 'STATUS_CHANGE' }, client);
        return updated;
      });
    },
    async setPrimaryContact(companyId, supplierId, contactId, { expectedUpdatedAt }, context) {
      const existing = await getContact(companyId, supplierId, contactId);
      if (!existing.isActive) throw invalid('Only an active contact can be primary.', ['contactId']);
      return runInTransaction(async (client) => {
        const supplier = await getSupplier(companyId, supplierId, client);
        if (!supplier.isActive) throw invalid('An active supplier is required.', ['supplierId']);
        await unsetPreviousPrimary(companyId, supplierId, contactId, context, client);
        if (existing.isPrimary) return existing;
        const updated = await repository.updateContact(
          companyId, supplierId, contactId, new Date(expectedUpdatedAt), { isPrimary: true }, client,
        );
        if (!updated) throw concurrencyConflict('supplier contact', existing.updatedAt);
        await record(entityTypes.supplierContact, companyId, existing, updated, context, { reason: 'PRIMARY_CONTACT_CHANGED' }, client);
        return updated;
      }, { isolationLevel: 'Serializable' });
    },
  };
}
