CREATE TABLE IF NOT EXISTS `brands` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `description` VARCHAR(500) NULL,
  `website` VARCHAR(500) NULL,
  `logo_storage_key` VARCHAR(500) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `brands_company_code_key` (`company_id`, `code`),
  UNIQUE INDEX `brands_company_name_key` (`company_id`, `name`),
  UNIQUE INDEX `brands_id_company_key` (`id`, `company_id`),
  INDEX `brands_company_active_name_idx` (`company_id`, `is_active`, `name`),
  PRIMARY KEY (`id`),
  CONSTRAINT `brands_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_categories` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `parent_category_id` INTEGER UNSIGNED NULL,
  `parent_scope_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `name_key` VARCHAR(120) NOT NULL,
  `description` VARCHAR(500) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `product_categories_company_code_key` (`company_id`, `code`),
  UNIQUE INDEX `product_categories_sibling_name_key` (`company_id`, `parent_scope_id`, `name_key`),
  UNIQUE INDEX `product_categories_id_company_key` (`id`, `company_id`),
  INDEX `product_categories_parent_active_name_idx` (`company_id`, `parent_category_id`, `is_active`, `name`),
  PRIMARY KEY (`id`),
  CONSTRAINT `product_categories_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `product_categories_parent_company_fkey` FOREIGN KEY (`parent_category_id`, `company_id`) REFERENCES `product_categories` (`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `permissions` (`code`, `resource`, `action`, `description`, `scope`, `created_at`) VALUES
  ('brands.read', 'brands', 'read', 'View product brands.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('brands.create', 'brands', 'create', 'Create product brands.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('brands.update', 'brands', 'update', 'Update product brands.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('brands.change_status', 'brands', 'change_status', 'Activate or deactivate product brands.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('product_categories.read', 'product_categories', 'read', 'View product categories.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('product_categories.create', 'product_categories', 'create', 'Create product categories.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('product_categories.update', 'product_categories', 'update', 'Update product categories.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('product_categories.change_status', 'product_categories', 'change_status', 'Activate or deactivate product categories.', 'COMPANY', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`), `scope` = 'COMPANY';

INSERT IGNORE INTO `company_role_permissions` (`role_id`, `permission_id`, `company_id`, `assigned_by_user_id`, `assigned_at`)
SELECT cr.`id`, p.`id`, cr.`company_id`, NULL, CURRENT_TIMESTAMP(3)
FROM `company_roles` cr CROSS JOIN `permissions` p
WHERE (cr.`code` IN ('OWNER', 'ADMIN') AND p.`code` IN ('brands.read','brands.create','brands.update','brands.change_status','product_categories.read','product_categories.create','product_categories.update','product_categories.change_status'))
   OR (cr.`code` IN ('OPERATOR', 'READ_ONLY') AND p.`code` IN ('brands.read','product_categories.read'));
