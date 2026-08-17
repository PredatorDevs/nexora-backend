CREATE TABLE `warehouses` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `branch_id` INTEGER UNSIGNED NOT NULL,
  `warehouse_category_id` INTEGER UNSIGNED NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(500) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `warehouses_company_code_key`(`company_id`, `code`),
  UNIQUE INDEX `warehouses_company_branch_name_key`(`company_id`, `branch_id`, `name`),
  UNIQUE INDEX `warehouses_id_company_key`(`id`, `company_id`),
  INDEX `warehouses_company_branch_active_name_idx`(`company_id`, `branch_id`, `is_active`, `name`),
  INDEX `warehouses_company_category_idx`(`company_id`, `warehouse_category_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `warehouses_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `warehouses_branch_company_fkey` FOREIGN KEY (`branch_id`, `company_id`) REFERENCES `branches`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `warehouses_category_company_fkey` FOREIGN KEY (`warehouse_category_id`, `company_id`) REFERENCES `warehouse_categories`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `permissions` (`code`, `resource`, `action`, `description`, `scope`, `created_at`)
VALUES
  ('warehouses.read', 'warehouses', 'read', 'View warehouses.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('warehouses.create', 'warehouses', 'create', 'Create warehouses.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('warehouses.update', 'warehouses', 'update', 'Update warehouses.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('warehouses.change_status', 'warehouses', 'change_status', 'Activate or deactivate warehouses.', 'COMPANY', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`), `scope` = 'COMPANY';

INSERT IGNORE INTO `company_role_permissions`
  (`role_id`, `permission_id`, `company_id`, `assigned_by_user_id`, `assigned_at`)
SELECT cr.`id`, p.`id`, cr.`company_id`, NULL, CURRENT_TIMESTAMP(3)
FROM `company_roles` cr
CROSS JOIN `permissions` p
WHERE
  (cr.`code` IN ('OWNER', 'ADMIN') AND p.`code` IN (
    'warehouses.read', 'warehouses.create', 'warehouses.update', 'warehouses.change_status'
  ))
  OR (cr.`code` IN ('OPERATOR', 'READ_ONLY') AND p.`code` = 'warehouses.read');
