import { AppError } from '../../core/errors/app-error.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { paginationMeta } from '../../core/validation/pagination.js';
import { generateInvitationToken, hashInvitationToken } from './company-invitations.tokens.js';

const invalid = (message, details) => new AppError({ code: errorCodes.validation, message, details, statusCode: 400 });
const conflict = (message) => new AppError({ code: errorCodes.conflict, message, statusCode: 409 });
const unavailable = () => new AppError({ code: errorCodes.notFound, message: 'The invitation is invalid, expired, or unavailable.', statusCode: 404 });

export function createCompanyInvitationsService({ repository, runInTransaction, passwordHasher, frontendBaseUrl, exposeLinks = false, now = () => new Date() }) {
  async function requireRoles(companyId, roleIds, client) {
    const ids = [...new Set(roleIds)];
    const roles = await repository.findRoles(companyId, ids, client);
    if (roles.length !== ids.length) throw invalid('Some roles do not belong to this company.', { invalidRoleIds: ids.filter((id) => !roles.some((role) => role.id === id)) });
    return ids;
  }
  async function validInvitation(token, client) {
    const invitation = await repository.findByTokenHash(hashInvitationToken(token), client);
    if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt <= now() || invitation.company.status !== 'ACTIVE') throw unavailable();
    return invitation;
  }
  return {
    async list(companyId, query) {
      const result = await repository.list(companyId, query);
      return { invitations: result.items, pagination: paginationMeta({ ...query, total: result.total }) };
    },
    invite(companyId, { email, roleIds }, actorUserId) {
      return runInTransaction(async (client) => {
        if (!(await repository.findCompany(companyId, client))) throw unavailable();
        const ids = await requireRoles(companyId, roleIds, client);
        const existingUser = await repository.findUser(email, client);
        if (existingUser && (await repository.findMembership(companyId, existingUser.id, client))) throw conflict('This user already belongs to the company.');
        const issuedAt = now();
        const expiresAt = new Date(issuedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
        const token = generateInvitationToken();
        await repository.revokePending(companyId, email, issuedAt, client);
        const invitation = await repository.create({ companyId, email, roleIds: ids, tokenHash: hashInvitationToken(token), invitedByUserId: actorUserId, expiresAt }, client);
        return { ...invitation, ...(exposeLinks ? { acceptanceUrl: `${frontendBaseUrl}/accept-invitation?token=${encodeURIComponent(token)}` } : {}) };
      }, { maxWait: 10_000, timeout: 30_000 });
    },
    async preview(token) {
      const invitation = await validInvitation(token);
      const user = await repository.findUser(invitation.email);
      return { email: invitation.email, company: invitation.company, roles: invitation.roles, expiresAt: invitation.expiresAt, requiresAccountCreation: !user };
    },
    accept(token, { displayName, password }) {
      return runInTransaction(async (client) => {
        const invitation = await validInvitation(token, client);
        let user = await repository.findUser(invitation.email, client);
        if (user && user.status !== 'ACTIVE') throw conflict('The account associated with this invitation is inactive.');
        if (!user) {
          if (!displayName || !password) throw invalid('Display name and password are required to create the account.', { fields: ['displayName', 'password'] });
          user = await repository.createUser({ email: invitation.email, displayName, passwordHash: await passwordHasher(password), status: 'ACTIVE', mustChangePassword: false }, client);
        }
        if (await repository.findMembership(invitation.companyId, user.id, client)) throw conflict('This user already belongs to the company.');
        const roleIds = invitation.roles.map(({ role }) => role.id);
        const membership = await repository.createMembership(invitation.companyId, user.id, roleIds, invitation.invitedBy.id, client);
        const accepted = await repository.accept(invitation.id, user.id, now(), client);
        if (accepted.count !== 1) throw unavailable();
        return { invitationId: invitation.id, companyId: invitation.companyId, membership, existingUser: !displayName };
      }, { maxWait: 10_000, timeout: 30_000 });
    },
    async revoke(companyId, invitationId) {
      const result = await repository.revoke(companyId, invitationId, now());
      if (result.count !== 1) throw unavailable();
    },
  };
}
