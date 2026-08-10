export const entityChangeOperations = Object.freeze({
  create: 'CREATE',
  update: 'UPDATE',
  delete: 'DELETE',
});

export const entityChangeSources = Object.freeze({
  application: 'APPLICATION',
  systemJob: 'SYSTEM_JOB',
  migration: 'MIGRATION',
  databaseTrigger: 'DATABASE_TRIGGER',
});

export const entitySchemas = Object.freeze({
  administration: 'administration',
  companies: 'companies',
});

export const entityTypes = Object.freeze({
  user: 'user',
  role: 'role',
  company: 'company',
});
