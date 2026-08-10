-- AlterTable
ALTER TABLE `permissions`
    ADD COLUMN `scope` ENUM('PLATFORM', 'COMPANY') NOT NULL DEFAULT 'PLATFORM';

-- Shared catalogs are consumed from company context.
UPDATE `permissions`
SET `scope` = 'COMPANY'
WHERE `code` IN ('address_dictionaries.read', 'economic_activities.read');

-- CreateTable
CREATE TABLE `company_memberships` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER UNSIGNED NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `security_version` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `company_memberships_company_user_key`(`company_id`, `user_id`),
    UNIQUE INDEX `company_memberships_id_company_key`(`id`, `company_id`),
    INDEX `company_memberships_user_status_idx`(`user_id`, `status`),
    INDEX `company_memberships_company_status_idx`(`company_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_roles` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER UNSIGNED NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` VARCHAR(500) NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `company_roles_company_code_key`(`company_id`, `code`),
    UNIQUE INDEX `company_roles_id_company_key`(`id`, `company_id`),
    INDEX `company_roles_company_system_idx`(`company_id`, `is_system`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_membership_roles` (
    `membership_id` INTEGER UNSIGNED NOT NULL,
    `role_id` INTEGER UNSIGNED NOT NULL,
    `company_id` INTEGER UNSIGNED NOT NULL,
    `assigned_by_user_id` INTEGER UNSIGNED NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `company_membership_roles_role_company_idx`(`role_id`, `company_id`),
    INDEX `company_membership_roles_company_idx`(`company_id`),
    INDEX `company_membership_roles_assigned_by_idx`(`assigned_by_user_id`),
    PRIMARY KEY (`membership_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_role_permissions` (
    `role_id` INTEGER UNSIGNED NOT NULL,
    `permission_id` INTEGER UNSIGNED NOT NULL,
    `company_id` INTEGER UNSIGNED NOT NULL,
    `assigned_by_user_id` INTEGER UNSIGNED NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `company_role_permissions_permission_idx`(`permission_id`),
    INDEX `company_role_permissions_company_idx`(`company_id`),
    INDEX `company_role_permissions_assigned_by_idx`(`assigned_by_user_id`),
    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `company_memberships` ADD CONSTRAINT `company_memberships_company_id_fkey`
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_memberships` ADD CONSTRAINT `company_memberships_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_roles` ADD CONSTRAINT `company_roles_company_id_fkey`
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_membership_roles` ADD CONSTRAINT `company_membership_roles_membership_fkey`
    FOREIGN KEY (`membership_id`, `company_id`) REFERENCES `company_memberships`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_membership_roles` ADD CONSTRAINT `company_membership_roles_role_fkey`
    FOREIGN KEY (`role_id`, `company_id`) REFERENCES `company_roles`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_membership_roles` ADD CONSTRAINT `company_membership_roles_assigned_by_fkey`
    FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_role_permissions` ADD CONSTRAINT `company_role_permissions_role_fkey`
    FOREIGN KEY (`role_id`, `company_id`) REFERENCES `company_roles`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_role_permissions` ADD CONSTRAINT `company_role_permissions_permission_fkey`
    FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_role_permissions` ADD CONSTRAINT `company_role_permissions_assigned_by_fkey`
    FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
