CREATE TABLE `purchase_request_supplier_segments` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `purchase_request_id` INTEGER UNSIGNED NOT NULL,
  `supplier_id` INTEGER UNSIGNED NOT NULL,
  `supplier_contact_id` INTEGER UNSIGNED NULL,
  `segment_number` SMALLINT UNSIGNED NOT NULL,
  `code` VARCHAR(70) NOT NULL,
  `status` ENUM('DRAFT','ISSUED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `notes` TEXT NULL,
  `created_by_user_id` INTEGER UNSIGNED NOT NULL,
  `issued_at` DATETIME(3) NULL,
  `issued_by_user_id` INTEGER UNSIGNED NULL,
  `cancelled_at` DATETIME(3) NULL,
  `cancelled_by_user_id` INTEGER UNSIGNED NULL,
  `cancellation_reason` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `purchase_request_supplier_segments_uuid_key` (`uuid`),
  UNIQUE INDEX `purchase_request_supplier_segments_company_code_key` (`company_id`,`code`),
  UNIQUE INDEX `purchase_request_supplier_segments_number_key` (`company_id`,`purchase_request_id`,`segment_number`),
  UNIQUE INDEX `purchase_request_supplier_segments_id_company_key` (`id`,`company_id`),
  INDEX `purchase_request_supplier_segments_request_status_idx` (`company_id`,`purchase_request_id`,`status`),
  INDEX `purchase_request_supplier_segments_supplier_status_idx` (`company_id`,`supplier_id`,`status`),
  INDEX `purchase_request_supplier_segments_contact_idx` (`company_id`,`supplier_contact_id`),
  INDEX `purchase_request_supplier_segments_created_by_idx` (`created_by_user_id`),
  INDEX `purchase_request_supplier_segments_issued_by_idx` (`issued_by_user_id`),
  INDEX `purchase_request_supplier_segments_cancelled_by_idx` (`cancelled_by_user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `purchase_request_supplier_segment_details` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `segment_id` INTEGER UNSIGNED NOT NULL,
  `purchase_request_detail_id` INTEGER UNSIGNED NOT NULL,
  `quantity` DECIMAL(18,4) NOT NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `purchase_request_supplier_segment_details_line_key` (`company_id`,`segment_id`,`purchase_request_detail_id`),
  INDEX `purchase_request_supplier_segment_details_request_line_idx` (`company_id`,`purchase_request_detail_id`),
  CONSTRAINT `purchase_request_supplier_segment_details_quantity_check` CHECK (`quantity` > 0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `purchase_request_supplier_segments`
  ADD CONSTRAINT `purchase_request_supplier_segments_company_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_request_supplier_segments_request_fkey` FOREIGN KEY (`purchase_request_id`,`company_id`) REFERENCES `purchase_requests` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_request_supplier_segments_supplier_fkey` FOREIGN KEY (`supplier_id`,`company_id`) REFERENCES `suppliers` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_request_supplier_segments_contact_fkey` FOREIGN KEY (`supplier_contact_id`,`company_id`) REFERENCES `supplier_contacts` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_request_supplier_segments_created_by_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_request_supplier_segments_issued_by_fkey` FOREIGN KEY (`issued_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_request_supplier_segments_cancelled_by_fkey` FOREIGN KEY (`cancelled_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `purchase_request_supplier_segment_details`
  ADD CONSTRAINT `purchase_request_supplier_segment_details_company_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_request_supplier_segment_details_segment_fkey` FOREIGN KEY (`segment_id`,`company_id`) REFERENCES `purchase_request_supplier_segments` (`id`,`company_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_request_supplier_segment_details_request_line_fkey` FOREIGN KEY (`purchase_request_detail_id`,`company_id`) REFERENCES `purchase_request_details` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO `permissions` (`code`,`resource`,`action`,`description`,`scope`,`created_at`)
VALUES ('purchase_requests.manage_segments','purchase_requests','manage_segments','Create, issue, and cancel supplier segments for consolidated purchase requests.','COMPANY',CURRENT_TIMESTAMP(3));

INSERT IGNORE INTO `company_role_permissions` (`role_id`,`permission_id`,`company_id`)
SELECT `cr`.`id`, `p`.`id`, `cr`.`company_id`
FROM `company_roles` AS `cr`
INNER JOIN `permissions` AS `p` ON `p`.`code` = 'purchase_requests.manage_segments'
WHERE `cr`.`code` IN ('OWNER','ADMIN');
