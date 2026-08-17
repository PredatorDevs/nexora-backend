CREATE TABLE `company_invitations` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `status` ENUM('PENDING', 'ACCEPTED', 'REVOKED') NOT NULL DEFAULT 'PENDING',
  `expires_at` DATETIME(3) NOT NULL,
  `invited_by_user_id` INTEGER UNSIGNED NOT NULL,
  `accepted_by_user_id` INTEGER UNSIGNED NULL,
  `accepted_at` DATETIME(3) NULL,
  `revoked_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `company_invitations_token_hash_key`(`token_hash`),
  UNIQUE INDEX `company_invitations_id_company_key`(`id`, `company_id`),
  INDEX `company_invitations_company_status_idx`(`company_id`, `status`, `created_at`),
  INDEX `company_invitations_email_status_idx`(`email`, `status`),
  INDEX `company_invitations_expiry_status_idx`(`expires_at`, `status`),
  PRIMARY KEY (`id`),
  CONSTRAINT `company_invitations_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `company_invitations_invited_by_user_id_fkey` FOREIGN KEY (`invited_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `company_invitations_accepted_by_user_id_fkey` FOREIGN KEY (`accepted_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `company_invitation_roles` (
  `invitation_id` INTEGER UNSIGNED NOT NULL,
  `role_id` INTEGER UNSIGNED NOT NULL,
  `company_id` INTEGER UNSIGNED NOT NULL,
  PRIMARY KEY (`invitation_id`, `role_id`),
  INDEX `company_invitation_roles_role_company_idx`(`role_id`, `company_id`),
  INDEX `company_invitation_roles_company_idx`(`company_id`),
  CONSTRAINT `company_invitation_roles_invitation_company_fkey` FOREIGN KEY (`invitation_id`, `company_id`) REFERENCES `company_invitations`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `company_invitation_roles_role_company_fkey` FOREIGN KEY (`role_id`, `company_id`) REFERENCES `company_roles`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
