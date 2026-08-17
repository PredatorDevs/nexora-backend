CREATE TABLE `suppliers` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `nit` VARCHAR(25) NULL,
  `nrc` VARCHAR(25) NULL,
  `country_id` INTEGER UNSIGNED NOT NULL,
  `department_id` INTEGER UNSIGNED NULL,
  `municipality_id` INTEGER UNSIGNED NULL,
  `district_id` INTEGER UNSIGNED NULL,
  `foreign_administrative_area` VARCHAR(191) NULL,
  `foreign_locality` VARCHAR(191) NULL,
  `address_line` VARCHAR(500) NOT NULL,
  `phone` VARCHAR(30) NULL,
  `email` VARCHAR(191) NULL,
  `website` VARCHAR(500) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `suppliers_company_code_key`(`company_id`, `code`),
  UNIQUE INDEX `suppliers_company_country_nit_key`(`company_id`, `country_id`, `nit`),
  UNIQUE INDEX `suppliers_company_country_nrc_key`(`company_id`, `country_id`, `nrc`),
  UNIQUE INDEX `suppliers_id_company_key`(`id`, `company_id`),
  INDEX `suppliers_company_active_name_idx`(`company_id`, `is_active`, `name`),
  INDEX `suppliers_country_id_idx`(`country_id`),
  INDEX `suppliers_department_id_idx`(`department_id`),
  INDEX `suppliers_municipality_id_idx`(`municipality_id`),
  INDEX `suppliers_district_id_idx`(`district_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `suppliers_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `suppliers_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `suppliers_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `suppliers_municipality_id_fkey` FOREIGN KEY (`municipality_id`) REFERENCES `municipalities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `suppliers_district_id_fkey` FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `supplier_contacts` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `supplier_id` INTEGER UNSIGNED NOT NULL,
  `full_name` VARCHAR(191) NOT NULL,
  `job_title` VARCHAR(120) NULL,
  `department` VARCHAR(120) NULL,
  `phone` VARCHAR(30) NULL,
  `email` VARCHAR(191) NULL,
  `is_primary` BOOLEAN NOT NULL DEFAULT false,
  `valid_from` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `valid_until` DATETIME(3) NULL,
  `notes` TEXT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `supplier_contacts_id_company_key`(`id`, `company_id`),
  INDEX `supplier_contacts_supplier_active_primary_idx`(`company_id`, `supplier_id`, `is_active`, `is_primary`),
  INDEX `supplier_contacts_company_email_idx`(`company_id`, `email`),
  PRIMARY KEY (`id`),
  CONSTRAINT `supplier_contacts_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `supplier_contacts_supplier_company_fkey` FOREIGN KEY (`supplier_id`, `company_id`) REFERENCES `suppliers`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `supplier_contacts_validity_check` CHECK (`valid_until` IS NULL OR `valid_until` >= `valid_from`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `permissions` (`code`, `resource`, `action`, `description`, `scope`, `created_at`)
VALUES
  ('suppliers.read', 'suppliers', 'read', 'View suppliers.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('suppliers.create', 'suppliers', 'create', 'Create suppliers.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('suppliers.update', 'suppliers', 'update', 'Update suppliers.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('suppliers.change_status', 'suppliers', 'change_status', 'Activate or deactivate suppliers.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('supplier_contacts.read', 'supplier_contacts', 'read', 'View supplier contacts.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('supplier_contacts.create', 'supplier_contacts', 'create', 'Create supplier contacts.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('supplier_contacts.update', 'supplier_contacts', 'update', 'Update supplier contacts.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('supplier_contacts.change_status', 'supplier_contacts', 'change_status', 'Activate or deactivate supplier contacts.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('supplier_contacts.set_primary', 'supplier_contacts', 'set_primary', 'Set the primary supplier contact.', 'COMPANY', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`), `scope` = 'COMPANY';

INSERT IGNORE INTO `company_role_permissions`
  (`role_id`, `permission_id`, `company_id`, `assigned_by_user_id`, `assigned_at`)
SELECT cr.`id`, p.`id`, cr.`company_id`, NULL, CURRENT_TIMESTAMP(3)
FROM `company_roles` cr
CROSS JOIN `permissions` p
WHERE
  (cr.`code` IN ('OWNER', 'ADMIN') AND p.`code` IN (
    'suppliers.read', 'suppliers.create', 'suppliers.update', 'suppliers.change_status',
    'supplier_contacts.read', 'supplier_contacts.create', 'supplier_contacts.update',
    'supplier_contacts.change_status', 'supplier_contacts.set_primary'
  ))
  OR (cr.`code` IN ('OPERATOR', 'READ_ONLY') AND p.`code` IN ('suppliers.read', 'supplier_contacts.read'));
