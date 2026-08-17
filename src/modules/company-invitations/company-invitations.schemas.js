import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';
export const invitationCompanyParams = z.object({ companyId: z.coerce.number().int().positive() });
export const invitationParams = invitationCompanyParams.extend({ invitationId: z.coerce.number().int().positive() });
export const invitationTokenParams = z.object({ token: z.string().min(32).max(512) });
export const invitationsListQuery = createListQuerySchema(['createdAt', 'email', 'status', 'expiresAt']).extend({ status: z.enum(['PENDING', 'ACCEPTED', 'REVOKED']).optional() });
export const createInvitationBody = z.object({ email: z.string().trim().toLowerCase().email().max(191), roleIds: z.array(z.number().int().positive()).min(1).max(100) });
export const acceptInvitationBody = z.object({ displayName: z.string().trim().min(1).max(120).optional(), password: z.string().min(12).max(1024).optional() });
