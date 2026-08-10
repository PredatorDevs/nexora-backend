-- AlterTable
ALTER TABLE `auth_sessions`
    ADD COLUMN `company_id` INTEGER UNSIGNED NULL,
    ADD COLUMN `membership_id` INTEGER UNSIGNED NULL;

-- AlterTable
ALTER TABLE `audit_logs`
    ADD COLUMN `company_id` INTEGER UNSIGNED NULL,
    ADD COLUMN `actor_membership_id` INTEGER UNSIGNED NULL;

-- AlterTable
ALTER TABLE `entity_change_logs`
    ADD COLUMN `company_id` INTEGER UNSIGNED NULL,
    ADD COLUMN `actor_membership_id` INTEGER UNSIGNED NULL;

-- CreateIndex
CREATE INDEX `auth_sessions_company_state_idx`
    ON `auth_sessions`(`company_id`, `revoked_at`, `expires_at`);

-- CreateIndex
CREATE INDEX `auth_sessions_membership_company_idx`
    ON `auth_sessions`(`membership_id`, `company_id`);

-- AddForeignKey
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_company_id_fkey`
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_membership_company_fkey`
    FOREIGN KEY (`membership_id`, `company_id`) REFERENCES `company_memberships`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX `audit_logs_company_created_at_idx`
    ON `audit_logs`(`company_id`, `created_at`);

-- CreateIndex
CREATE INDEX `audit_logs_company_actor_idx`
    ON `audit_logs`(`company_id`, `actor_user_id`, `created_at`);

-- CreateIndex
CREATE INDEX `entity_change_logs_company_date_idx`
    ON `entity_change_logs`(`company_id`, `created_at`);

-- CreateIndex
CREATE INDEX `entity_change_logs_company_entity_idx`
    ON `entity_change_logs`(`company_id`, `entity_type`, `entity_id`, `created_at`);

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_company_id_fkey`
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_membership_company_fkey`
    FOREIGN KEY (`actor_membership_id`, `company_id`) REFERENCES `company_memberships`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entity_change_logs` ADD CONSTRAINT `entity_change_logs_company_id_fkey`
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entity_change_logs` ADD CONSTRAINT `entity_change_logs_membership_company_fkey`
    FOREIGN KEY (`actor_membership_id`, `company_id`) REFERENCES `company_memberships`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
