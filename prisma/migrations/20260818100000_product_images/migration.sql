CREATE TABLE `product_images` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `product_id` INTEGER UNSIGNED NOT NULL,
  `storage_key` VARCHAR(500) NOT NULL,
  `alt_text` VARCHAR(191) NULL,
  `caption` VARCHAR(500) NULL,
  `sort_order` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  `is_primary` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `product_images_storage_key_key` (`storage_key`),
  UNIQUE INDEX `product_images_id_product_company_key` (`id`, `product_id`, `company_id`),
  INDEX `product_images_product_order_idx` (`company_id`, `product_id`, `is_primary`, `sort_order`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `product_images`
  ADD CONSTRAINT `product_images_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `product_images_product_company_fkey` FOREIGN KEY (`product_id`, `company_id`) REFERENCES `products` (`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO `permissions` (`code`, `resource`, `action`, `description`, `scope`, `created_at`)
VALUES
  ('product_images.read', 'product_images', 'read', 'View product images.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('product_images.create', 'product_images', 'create', 'Attach images to products.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('product_images.update', 'product_images', 'update', 'Edit, order, and select the primary product image.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('product_images.delete', 'product_images', 'delete', 'Remove product images.', 'COMPANY', CURRENT_TIMESTAMP(3));

INSERT IGNORE INTO `company_role_permissions` (`role_id`, `permission_id`)
SELECT cr.`id`, p.`id`
FROM `company_roles` cr
JOIN `permissions` p
WHERE (cr.`code` IN ('OWNER', 'ADMIN') AND p.`code` IN ('product_images.read','product_images.create','product_images.update','product_images.delete'))
   OR (cr.`code` IN ('OPERATOR', 'READ_ONLY') AND p.`code` = 'product_images.read');
