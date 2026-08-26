CREATE TABLE `product_units` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `measurement_unit_id` INTEGER UNSIGNED NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `type` ENUM('PURCHASE', 'SALE') NOT NULL,
  `description` VARCHAR(500) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `product_units_company_code_key` (`company_id`, `code`),
  UNIQUE INDEX `product_units_company_type_name_key` (`company_id`, `type`, `name`),
  UNIQUE INDEX `product_units_id_company_key` (`id`, `company_id`),
  INDEX `product_units_company_type_active_name_idx` (`company_id`, `type`, `is_active`, `name`),
  INDEX `product_units_measurement_unit_id_idx` (`measurement_unit_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `product_units_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `product_units_measurement_unit_id_fkey` FOREIGN KEY (`measurement_unit_id`) REFERENCES `measurement_units` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `permissions` (`code`, `resource`, `action`, `description`, `scope`, `created_at`) VALUES
  ('product_units.read', 'product_units', 'read', 'View company product units.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('product_units.create', 'product_units', 'create', 'Create company product units.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('product_units.update', 'product_units', 'update', 'Update company product units.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('product_units.change_status', 'product_units', 'change_status', 'Activate or deactivate company product units.', 'COMPANY', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`), `scope` = 'COMPANY';

INSERT IGNORE INTO `company_role_permissions` (`role_id`, `permission_id`, `company_id`, `assigned_by_user_id`, `assigned_at`)
SELECT cr.`id`, p.`id`, cr.`company_id`, NULL, CURRENT_TIMESTAMP(3)
FROM `company_roles` cr CROSS JOIN `permissions` p
WHERE (cr.`code` IN ('OWNER', 'ADMIN') AND p.`code` IN ('product_units.read', 'product_units.create', 'product_units.update', 'product_units.change_status'))
   OR (cr.`code` IN ('OPERATOR', 'READ_ONLY') AND p.`code` = 'product_units.read');
