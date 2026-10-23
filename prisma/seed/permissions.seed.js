import {
  permissionCodes,
  permissionScopeForCode,
} from '../../src/modules/rbac/rbac.constants.js';
import { mapWithConcurrency } from './seed.utils.js';

export async function seedPermissions(prisma) {
  return mapWithConcurrency(
    permissionCodes,
    (code) => {
      const [resource, action] = code.split('.');
      const data = {
        code,
        resource,
        action,
        description: `Allows ${action.replaceAll('_', ' ')} on ${resource}.`,
        scope: permissionScopeForCode(code),
      };

      return prisma.permission.upsert({
        where: { code },
        create: data,
        update: data,
      });
    },
  );
}
