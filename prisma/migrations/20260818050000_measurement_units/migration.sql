CREATE TABLE `measurement_units` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(64) NOT NULL,
  `plural_name` VARCHAR(64) NULL,
  `symbol` VARCHAR(32) NULL,
  `mh_code` VARCHAR(3) NULL,
  `comments` VARCHAR(1024) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `measurement_units_name_key`(`name`),
  UNIQUE INDEX `measurement_units_mh_code_key`(`mh_code`),
  INDEX `measurement_units_active_name_idx`(`is_active`, `name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `permissions` (`code`, `resource`, `action`, `description`, `scope`, `created_at`)
VALUES ('measurement_units.read', 'measurement_units', 'read', 'View the global measurement unit catalog.', 'COMPANY', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`), `scope` = 'COMPANY';

INSERT IGNORE INTO `company_role_permissions`
  (`role_id`, `permission_id`, `company_id`, `assigned_by_user_id`, `assigned_at`)
SELECT cr.`id`, p.`id`, cr.`company_id`, NULL, CURRENT_TIMESTAMP(3)
FROM `company_roles` cr
JOIN `permissions` p ON p.`code` = 'measurement_units.read'
WHERE cr.`code` IN ('OWNER', 'ADMIN', 'OPERATOR', 'READ_ONLY');
