CREATE TABLE `purchases` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `purchase_order_id` INTEGER UNSIGNED NOT NULL,
  `supplier_id` INTEGER UNSIGNED NOT NULL,
  `branch_id` INTEGER UNSIGNED NOT NULL,
  `warehouse_id` INTEGER UNSIGNED NOT NULL,
  `received_by_user_id` INTEGER UNSIGNED NOT NULL,
  `purchase_date` DATETIME(3) NOT NULL,
  `supplier_invoice_number` VARCHAR(100) NULL,
  `supplier_invoice_date` DATE NULL,
  `currency_code` CHAR(3) NOT NULL,
  `exchange_rate` DECIMAL(18,8) NOT NULL DEFAULT 1,
  `exchange_rate_date` DATE NULL,
  `subtotal` DECIMAL(18,6) NOT NULL DEFAULT 0,
  `discount` DECIMAL(18,6) NOT NULL DEFAULT 0,
  `tax` DECIMAL(18,6) NOT NULL DEFAULT 0,
  `total` DECIMAL(18,6) NOT NULL DEFAULT 0,
  `status` ENUM('DRAFT','RECEIVED','VERIFIED','CANCELLED','CLOSED') NOT NULL DEFAULT 'DRAFT',
  `notes` TEXT NULL,
  `received_at` DATETIME(3) NULL,
  `verified_at` DATETIME(3) NULL,
  `verified_by_user_id` INTEGER UNSIGNED NULL,
  `cancelled_at` DATETIME(3) NULL,
  `cancelled_by_user_id` INTEGER UNSIGNED NULL,
  `cancellation_reason` TEXT NULL,
  `closed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `purchases_uuid_key` (`uuid`),
  UNIQUE INDEX `purchases_company_code_key` (`company_id`,`code`),
  UNIQUE INDEX `purchases_company_supplier_invoice_key` (`company_id`,`supplier_id`,`supplier_invoice_number`),
  UNIQUE INDEX `purchases_id_company_key` (`id`,`company_id`),
  INDEX `purchases_company_status_date_idx` (`company_id`,`status`,`purchase_date`),
  INDEX `purchases_order_idx` (`company_id`,`purchase_order_id`),
  INDEX `purchases_destination_idx` (`company_id`,`branch_id`,`warehouse_id`),
  INDEX `purchases_received_by_idx` (`received_by_user_id`),
  INDEX `purchases_verified_by_idx` (`verified_by_user_id`),
  INDEX `purchases_cancelled_by_idx` (`cancelled_by_user_id`),
  CONSTRAINT `purchases_exchange_rate_check` CHECK (`exchange_rate` > 0),
  CONSTRAINT `purchases_totals_check` CHECK (`subtotal` >= 0 AND `discount` >= 0 AND `tax` >= 0 AND `total` >= 0),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `purchase_details` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `purchase_id` INTEGER UNSIGNED NOT NULL,
  `purchase_order_detail_id` INTEGER UNSIGNED NOT NULL,
  `line_number` SMALLINT UNSIGNED NOT NULL,
  `product_id` INTEGER UNSIGNED NOT NULL,
  `product_unit_id` INTEGER UNSIGNED NOT NULL,
  `quantity_ordered` DECIMAL(18,4) NOT NULL,
  `quantity_received` DECIMAL(18,4) NOT NULL,
  `unit_price` DECIMAL(18,6) NOT NULL,
  `gross_amount` DECIMAL(18,6) NOT NULL,
  `discount_rate` DECIMAL(9,6) NOT NULL DEFAULT 0,
  `discount_amount` DECIMAL(18,6) NOT NULL DEFAULT 0,
  `subtotal` DECIMAL(18,6) NOT NULL,
  `tax_rate` DECIMAL(9,6) NOT NULL DEFAULT 0,
  `tax_amount` DECIMAL(18,6) NOT NULL DEFAULT 0,
  `total` DECIMAL(18,6) NOT NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `purchase_details_line_key` (`company_id`,`purchase_id`,`line_number`),
  UNIQUE INDEX `purchase_details_order_line_key` (`company_id`,`purchase_id`,`purchase_order_detail_id`),
  UNIQUE INDEX `purchase_details_id_company_key` (`id`,`company_id`),
  INDEX `purchase_details_order_detail_idx` (`company_id`,`purchase_order_detail_id`),
  INDEX `purchase_details_product_idx` (`company_id`,`product_id`),
  CONSTRAINT `purchase_details_values_check` CHECK (`quantity_ordered` > 0 AND `quantity_received` > 0 AND `quantity_received` <= `quantity_ordered` AND `unit_price` >= 0 AND `gross_amount` >= 0 AND `discount_rate` BETWEEN 0 AND 100 AND `discount_amount` >= 0 AND `subtotal` >= 0 AND `tax_rate` BETWEEN 0 AND 100 AND `tax_amount` >= 0 AND `total` >= 0),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `purchases`
  ADD CONSTRAINT `purchases_company_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchases_order_company_fkey` FOREIGN KEY (`purchase_order_id`,`company_id`) REFERENCES `purchase_orders` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchases_supplier_company_fkey` FOREIGN KEY (`supplier_id`,`company_id`) REFERENCES `suppliers` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchases_branch_company_fkey` FOREIGN KEY (`branch_id`,`company_id`) REFERENCES `branches` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchases_warehouse_company_fkey` FOREIGN KEY (`warehouse_id`,`company_id`) REFERENCES `warehouses` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchases_received_by_fkey` FOREIGN KEY (`received_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchases_verified_by_fkey` FOREIGN KEY (`verified_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchases_cancelled_by_fkey` FOREIGN KEY (`cancelled_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `purchase_details`
  ADD CONSTRAINT `purchase_details_company_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_details_purchase_company_fkey` FOREIGN KEY (`purchase_id`,`company_id`) REFERENCES `purchases` (`id`,`company_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_details_order_detail_company_fkey` FOREIGN KEY (`purchase_order_detail_id`,`company_id`) REFERENCES `purchase_order_details` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_details_product_company_fkey` FOREIGN KEY (`product_id`,`company_id`) REFERENCES `products` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_details_unit_company_fkey` FOREIGN KEY (`product_unit_id`,`company_id`) REFERENCES `product_units` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO `permissions` (`code`,`resource`,`action`,`description`,`scope`,`created_at`) VALUES
  ('purchases.read','purchases','read','View purchases and goods receipts.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('purchases.create','purchases','create','Create purchase receipt drafts.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('purchases.update','purchases','update','Edit purchase receipt drafts.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('purchases.receive','purchases','receive','Confirm received merchandise.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('purchases.verify','purchases','verify','Verify received purchases.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('purchases.close','purchases','close','Close verified purchases.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('purchases.cancel','purchases','cancel','Cancel purchase receipt drafts.','COMPANY',CURRENT_TIMESTAMP(3));

INSERT IGNORE INTO `company_role_permissions` (`role_id`,`permission_id`)
SELECT cr.`id`,p.`id`
FROM `company_roles` cr
JOIN `permissions` p
WHERE (cr.`code` IN ('OWNER','ADMIN') AND p.`code` LIKE 'purchases.%')
   OR (cr.`code`='OPERATOR' AND p.`code` IN ('purchases.read','purchases.create','purchases.update','purchases.receive'))
   OR (cr.`code`='READ_ONLY' AND p.`code`='purchases.read');
