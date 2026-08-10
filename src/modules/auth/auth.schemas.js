import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(191),
  password: z.string().min(1).max(1024),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(1024),
    newPassword: z.string().min(12).max(1024),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ['newPassword'],
    message: 'The new password must be different from the current password.',
  });
