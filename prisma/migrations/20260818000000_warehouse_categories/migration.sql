CREATE TABLE `warehouse_categories` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `description` VARCHAR(500) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `warehouse_categories_company_code_key`(`company_id`, `code`),
  UNIQUE INDEX `warehouse_categories_company_name_key`(`company_id`, `name`),
  UNIQUE INDEX `warehouse_categories_id_company_key`(`id`, `company_id`),
  INDEX `warehouse_categories_company_active_name_idx`(`company_id`, `is_active`, `name`),
  PRIMARY KEY (`id`),
  CONSTRAINT `warehouse_categories_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `permissions` (`code`, `resource`, `action`, `description`, `scope`, `created_at`)
VALUES
  ('warehouse_categories.read', 'warehouse_categories', 'read', 'View warehouse categories.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('warehouse_categories.create', 'warehouse_categories', 'create', 'Create warehouse categories.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('warehouse_categories.update', 'warehouse_categories', 'update', 'Update warehouse categories.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('warehouse_categories.change_status', 'warehouse_categories', 'change_status', 'Activate or deactivate warehouse categories.', 'COMPANY', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`), `scope` = 'COMPANY';

INSERT IGNORE INTO `company_role_permissions`
  (`role_id`, `permission_id`, `company_id`, `assigned_by_user_id`, `assigned_at`)
SELECT cr.`id`, p.`id`, cr.`company_id`, NULL, CURRENT_TIMESTAMP(3)
FROM `company_roles` cr
CROSS JOIN `permissions` p
WHERE
  (cr.`code` IN ('OWNER', 'ADMIN') AND p.`code` IN (
    'warehouse_categories.read',
    'warehouse_categories.create',
    'warehouse_categories.update',
    'warehouse_categories.change_status'
  ))
  OR (cr.`code` IN ('OPERATOR', 'READ_ONLY') AND p.`code` = 'warehouse_categories.read');

INSERT INTO `warehouse_categories` (`company_id`, `code`, `name`, `description`, `is_active`, `created_at`, `updated_at`)
SELECT c.`id`, defaults.`code`, defaults.`name`, defaults.`description`, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `companies` c
CROSS JOIN (
  SELECT 'FINISHED_GOODS' AS `code`, 'Producto terminado' AS `name`, 'Productos listos para venta o despacho.' AS `description`
  UNION ALL SELECT 'RAW_MATERIALS', 'Materia prima', 'Materiales destinados a procesos productivos.'
  UNION ALL SELECT 'SPARE_PARTS', 'Repuestos', 'Repuestos y componentes de mantenimiento.'
  UNION ALL SELECT 'RETURNS', 'Devoluciones', 'Productos recibidos por devolución.'
  UNION ALL SELECT 'QUARANTINE', 'Cuarentena', 'Existencias pendientes de inspección o liberación.'
  UNION ALL SELECT 'PRODUCTION', 'Producción', 'Existencias asociadas al proceso productivo.'
  UNION ALL SELECT 'CONSIGNMENT', 'Consignación', 'Existencias administradas bajo consignación.'
  UNION ALL SELECT 'IN_TRANSIT', 'Tránsito', 'Existencias temporalmente en traslado.'
) defaults;
