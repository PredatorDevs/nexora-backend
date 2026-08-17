CREATE TABLE `locations` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `warehouse_id` INTEGER UNSIGNED NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `aisle` VARCHAR(50) NOT NULL,
  `rack` VARCHAR(50) NOT NULL,
  `level` VARCHAR(50) NOT NULL,
  `position` VARCHAR(50) NOT NULL,
  `capacity` DECIMAL(18,4) NULL,
  `capacity_unit` ENUM('UNITS', 'KG', 'M3', 'PALLETS') NULL,
  `notes` TEXT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `locations_company_warehouse_code_key`(`company_id`, `warehouse_id`, `code`),
  UNIQUE INDEX `locations_physical_coordinates_key`(`company_id`, `warehouse_id`, `aisle`, `rack`, `level`, `position`),
  UNIQUE INDEX `locations_id_company_key`(`id`, `company_id`),
  INDEX `locations_company_warehouse_active_code_idx`(`company_id`, `warehouse_id`, `is_active`, `code`),
  PRIMARY KEY (`id`),
  CONSTRAINT `locations_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `locations_warehouse_company_fkey` FOREIGN KEY (`warehouse_id`, `company_id`) REFERENCES `warehouses`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `locations_capacity_pair_check` CHECK ((`capacity` IS NULL AND `capacity_unit` IS NULL) OR (`capacity` > 0 AND `capacity_unit` IS NOT NULL))
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `permissions` (`code`, `resource`, `action`, `description`, `scope`, `created_at`)
VALUES
  ('locations.read', 'locations', 'read', 'View warehouse locations.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('locations.create', 'locations', 'create', 'Create warehouse locations.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('locations.update', 'locations', 'update', 'Update warehouse locations.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('locations.change_status', 'locations', 'change_status', 'Activate or deactivate warehouse locations.', 'COMPANY', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`), `scope` = 'COMPANY';

INSERT IGNORE INTO `company_role_permissions`
  (`role_id`, `permission_id`, `company_id`, `assigned_by_user_id`, `assigned_at`)
SELECT cr.`id`, p.`id`, cr.`company_id`, NULL, CURRENT_TIMESTAMP(3)
FROM `company_roles` cr
CROSS JOIN `permissions` p
WHERE
  (cr.`code` IN ('OWNER', 'ADMIN') AND p.`code` IN (
    'locations.read', 'locations.create', 'locations.update', 'locations.change_status'
  ))
  OR (cr.`code` IN ('OPERATOR', 'READ_ONLY') AND p.`code` = 'locations.read');
