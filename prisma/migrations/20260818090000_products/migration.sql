CREATE TABLE `products` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `product_category_id` INTEGER UNSIGNED NOT NULL,
  `brand_id` INTEGER UNSIGNED NULL,
  `purchase_unit_id` INTEGER UNSIGNED NOT NULL,
  `sale_unit_id` INTEGER UNSIGNED NOT NULL,
  `sku` VARCHAR(100) NULL,
  `original_code` VARCHAR(120) NULL,
  `internal_code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `size` VARCHAR(120) NULL,
  `dimensions` VARCHAR(191) NULL,
  `description` TEXT NULL,
  `presentation` VARCHAR(191) NULL,
  `purchase_to_sale_factor` DECIMAL(18, 6) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `products_uuid_key` (`uuid`),
  UNIQUE INDEX `products_company_internal_code_key` (`company_id`, `internal_code`),
  UNIQUE INDEX `products_company_sku_key` (`company_id`, `sku`),
  UNIQUE INDEX `products_id_company_key` (`id`, `company_id`),
  INDEX `products_company_active_name_idx` (`company_id`, `is_active`, `name`),
  INDEX `products_company_category_idx` (`company_id`, `product_category_id`),
  INDEX `products_company_brand_idx` (`company_id`, `brand_id`),
  CONSTRAINT `products_positive_conversion_factor_check` CHECK (`purchase_to_sale_factor` > 0),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `products`
  ADD CONSTRAINT `products_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `products_category_company_fkey` FOREIGN KEY (`product_category_id`, `company_id`) REFERENCES `product_categories` (`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `products_brand_company_fkey` FOREIGN KEY (`brand_id`, `company_id`) REFERENCES `brands` (`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `products_purchase_unit_company_fkey` FOREIGN KEY (`purchase_unit_id`, `company_id`) REFERENCES `product_units` (`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `products_sale_unit_company_fkey` FOREIGN KEY (`sale_unit_id`, `company_id`) REFERENCES `product_units` (`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO `permissions` (`code`, `resource`, `action`, `description`, `scope`, `created_at`)
VALUES
  ('products.read', 'products', 'read', 'View products.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('products.create', 'products', 'create', 'Create products.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('products.update', 'products', 'update', 'Update products.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('products.change_status', 'products', 'change_status', 'Activate or deactivate products.', 'COMPANY', CURRENT_TIMESTAMP(3));

INSERT IGNORE INTO `company_role_permissions` (`role_id`, `permission_id`)
SELECT cr.`id`, p.`id`
FROM `company_roles` cr
JOIN `permissions` p
WHERE (cr.`code` IN ('OWNER', 'ADMIN') AND p.`code` IN ('products.read','products.create','products.update','products.change_status'))
   OR (cr.`code` IN ('OPERATOR', 'READ_ONLY') AND p.`code` = 'products.read');
