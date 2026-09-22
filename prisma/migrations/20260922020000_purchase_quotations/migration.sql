CREATE TABLE `purchase_quotations` (
 `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT, `uuid` CHAR(36) NOT NULL, `company_id` INTEGER UNSIGNED NOT NULL, `code` VARCHAR(50) NOT NULL,
 `supplier_id` INTEGER UNSIGNED NOT NULL, `supplier_contact_id` INTEGER UNSIGNED NULL, `supplier_quotation_number` VARCHAR(120) NULL,
 `quotation_date` DATETIME(3) NOT NULL, `valid_until` DATETIME(3) NOT NULL, `currency_code` CHAR(3) NOT NULL,
 `exchange_rate` DECIMAL(18,8) NOT NULL DEFAULT 1, `exchange_rate_date` DATE NULL, `payment_terms` VARCHAR(500) NULL, `delivery_days` SMALLINT UNSIGNED NULL,
 `subtotal` DECIMAL(18,6) NOT NULL DEFAULT 0, `discount` DECIMAL(18,6) NOT NULL DEFAULT 0, `tax` DECIMAL(18,6) NOT NULL DEFAULT 0, `total` DECIMAL(18,6) NOT NULL DEFAULT 0,
 `status` ENUM('DRAFT','RECEIVED','UNDER_REVIEW','SELECTED','REJECTED','EXPIRED','CANCELLED') NOT NULL DEFAULT 'DRAFT', `notes` TEXT NULL,
 `registered_by_user_id` INTEGER UNSIGNED NOT NULL, `received_at` DATETIME(3) NULL, `under_review_at` DATETIME(3) NULL,
 `cancelled_at` DATETIME(3) NULL, `cancelled_by_user_id` INTEGER UNSIGNED NULL, `cancellation_reason` TEXT NULL,
 `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updated_at` DATETIME(3) NOT NULL,
 UNIQUE INDEX `purchase_quotations_uuid_key` (`uuid`), UNIQUE INDEX `purchase_quotations_company_code_key` (`company_id`,`code`), UNIQUE INDEX `purchase_quotations_id_company_key` (`id`,`company_id`),
 INDEX `purchase_quotations_company_status_date_idx` (`company_id`,`status`,`quotation_date`), INDEX `purchase_quotations_supplier_idx` (`company_id`,`supplier_id`), INDEX `purchase_quotations_contact_idx` (`company_id`,`supplier_contact_id`), INDEX `purchase_quotations_registered_by_idx` (`registered_by_user_id`), INDEX `purchase_quotations_cancelled_by_idx` (`cancelled_by_user_id`),
 CONSTRAINT `purchase_quotations_nonnegative_totals_check` CHECK (`subtotal` >= 0 AND `discount` >= 0 AND `tax` >= 0 AND `total` >= 0),
 CONSTRAINT `purchase_quotations_positive_exchange_rate_check` CHECK (`exchange_rate` > 0), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `purchase_quotation_details` (
 `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT, `company_id` INTEGER UNSIGNED NOT NULL, `purchase_quotation_id` INTEGER UNSIGNED NOT NULL,
 `line_number` SMALLINT UNSIGNED NOT NULL, `product_id` INTEGER UNSIGNED NOT NULL, `product_unit_id` INTEGER UNSIGNED NOT NULL,
 `quantity` DECIMAL(18,4) NOT NULL, `unit_price` DECIMAL(18,6) NOT NULL, `gross_amount` DECIMAL(18,6) NOT NULL,
 `discount_rate` DECIMAL(9,6) NOT NULL DEFAULT 0, `discount_amount` DECIMAL(18,6) NOT NULL DEFAULT 0, `subtotal` DECIMAL(18,6) NOT NULL,
 `tax_rate` DECIMAL(9,6) NOT NULL DEFAULT 0, `tax_amount` DECIMAL(18,6) NOT NULL DEFAULT 0, `total` DECIMAL(18,6) NOT NULL,
 `delivery_days` SMALLINT UNSIGNED NULL, `available_quantity` DECIMAL(18,4) NULL, `notes` TEXT NULL,
 `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updated_at` DATETIME(3) NOT NULL,
 UNIQUE INDEX `purchase_quotation_details_line_key` (`company_id`,`purchase_quotation_id`,`line_number`), UNIQUE INDEX `purchase_quotation_details_product_unit_key` (`company_id`,`purchase_quotation_id`,`product_id`,`product_unit_id`), UNIQUE INDEX `purchase_quotation_details_id_company_key` (`id`,`company_id`),
 INDEX `purchase_quotation_details_product_idx` (`company_id`,`product_id`), INDEX `purchase_quotation_details_unit_idx` (`company_id`,`product_unit_id`),
 CONSTRAINT `purchase_quotation_details_values_check` CHECK (`quantity` > 0 AND `unit_price` >= 0 AND `gross_amount` >= 0 AND `discount_rate` BETWEEN 0 AND 100 AND `discount_amount` >= 0 AND `subtotal` >= 0 AND `tax_rate` BETWEEN 0 AND 100 AND `tax_amount` >= 0 AND `total` >= 0 AND (`available_quantity` IS NULL OR `available_quantity` >= 0)), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `purchase_quotations`
 ADD CONSTRAINT `purchase_quotations_company_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
 ADD CONSTRAINT `purchase_quotations_supplier_company_fkey` FOREIGN KEY (`supplier_id`,`company_id`) REFERENCES `suppliers` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
 ADD CONSTRAINT `purchase_quotations_contact_company_fkey` FOREIGN KEY (`supplier_contact_id`,`company_id`) REFERENCES `supplier_contacts` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
 ADD CONSTRAINT `purchase_quotations_registered_by_fkey` FOREIGN KEY (`registered_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
 ADD CONSTRAINT `purchase_quotations_cancelled_by_fkey` FOREIGN KEY (`cancelled_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `purchase_quotation_details`
 ADD CONSTRAINT `purchase_quotation_details_company_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
 ADD CONSTRAINT `purchase_quotation_details_quotation_company_fkey` FOREIGN KEY (`purchase_quotation_id`,`company_id`) REFERENCES `purchase_quotations` (`id`,`company_id`) ON DELETE CASCADE ON UPDATE CASCADE,
 ADD CONSTRAINT `purchase_quotation_details_product_company_fkey` FOREIGN KEY (`product_id`,`company_id`) REFERENCES `products` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
 ADD CONSTRAINT `purchase_quotation_details_unit_company_fkey` FOREIGN KEY (`product_unit_id`,`company_id`) REFERENCES `product_units` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO `permissions` (`code`,`resource`,`action`,`description`,`scope`,`created_at`) VALUES
('purchase_quotations.read','purchase_quotations','read','View purchase quotations.','COMPANY',CURRENT_TIMESTAMP(3)),
('purchase_quotations.create','purchase_quotations','create','Create purchase quotations.','COMPANY',CURRENT_TIMESTAMP(3)),
('purchase_quotations.update','purchase_quotations','update','Update draft purchase quotations.','COMPANY',CURRENT_TIMESTAMP(3)),
('purchase_quotations.receive','purchase_quotations','receive','Mark purchase quotations as received.','COMPANY',CURRENT_TIMESTAMP(3)),
('purchase_quotations.review','purchase_quotations','review','Put purchase quotations under review.','COMPANY',CURRENT_TIMESTAMP(3)),
('purchase_quotations.cancel','purchase_quotations','cancel','Cancel purchase quotations.','COMPANY',CURRENT_TIMESTAMP(3)),
('purchase_quotations.expire','purchase_quotations','expire','Mark purchase quotations as expired.','COMPANY',CURRENT_TIMESTAMP(3)),
('purchase_quotations.select','purchase_quotations','select','Select a purchase quotation.','COMPANY',CURRENT_TIMESTAMP(3)),
('purchase_quotations.reject','purchase_quotations','reject','Reject a purchase quotation.','COMPANY',CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO `company_role_permissions` (`role_id`,`permission_id`) SELECT cr.`id`,p.`id` FROM `company_roles` cr JOIN `permissions` p WHERE (cr.`code` IN ('OWNER','ADMIN') AND p.`code` LIKE 'purchase_quotations.%') OR (cr.`code`='OPERATOR' AND p.`code` IN ('purchase_quotations.read','purchase_quotations.create','purchase_quotations.update','purchase_quotations.receive')) OR (cr.`code`='READ_ONLY' AND p.`code`='purchase_quotations.read');
