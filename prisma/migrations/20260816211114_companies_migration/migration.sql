-- DropForeignKey
ALTER TABLE `audit_logs` DROP FOREIGN KEY `audit_logs_membership_company_fkey`;

-- DropForeignKey
ALTER TABLE `auth_sessions` DROP FOREIGN KEY `auth_sessions_membership_company_fkey`;

-- DropForeignKey
ALTER TABLE `company_membership_roles` DROP FOREIGN KEY `company_membership_roles_assigned_by_fkey`;

-- DropForeignKey
ALTER TABLE `company_membership_roles` DROP FOREIGN KEY `company_membership_roles_membership_fkey`;

-- DropForeignKey
ALTER TABLE `company_membership_roles` DROP FOREIGN KEY `company_membership_roles_role_fkey`;

-- DropForeignKey
ALTER TABLE `company_role_permissions` DROP FOREIGN KEY `company_role_permissions_assigned_by_fkey`;

-- DropForeignKey
ALTER TABLE `company_role_permissions` DROP FOREIGN KEY `company_role_permissions_permission_fkey`;

-- DropForeignKey
ALTER TABLE `company_role_permissions` DROP FOREIGN KEY `company_role_permissions_role_fkey`;

-- DropForeignKey
ALTER TABLE `entity_change_logs` DROP FOREIGN KEY `entity_change_logs_membership_company_fkey`;

-- AddForeignKey
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_membership_id_company_id_fkey` FOREIGN KEY (`membership_id`, `company_id`) REFERENCES `company_memberships`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_membership_id_company_id_fkey` FOREIGN KEY (`actor_membership_id`, `company_id`) REFERENCES `company_memberships`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entity_change_logs` ADD CONSTRAINT `entity_change_logs_actor_membership_id_company_id_fkey` FOREIGN KEY (`actor_membership_id`, `company_id`) REFERENCES `company_memberships`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_membership_roles` ADD CONSTRAINT `company_membership_roles_membership_id_company_id_fkey` FOREIGN KEY (`membership_id`, `company_id`) REFERENCES `company_memberships`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_membership_roles` ADD CONSTRAINT `company_membership_roles_role_id_company_id_fkey` FOREIGN KEY (`role_id`, `company_id`) REFERENCES `company_roles`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_membership_roles` ADD CONSTRAINT `company_membership_roles_assigned_by_user_id_fkey` FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_role_permissions` ADD CONSTRAINT `company_role_permissions_role_id_company_id_fkey` FOREIGN KEY (`role_id`, `company_id`) REFERENCES `company_roles`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_role_permissions` ADD CONSTRAINT `company_role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_role_permissions` ADD CONSTRAINT `company_role_permissions_assigned_by_user_id_fkey` FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
