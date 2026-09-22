CREATE TABLE `purchase_requests` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `branch_id` INTEGER UNSIGNED NOT NULL,
  `warehouse_id` INTEGER UNSIGNED NOT NULL,
  `requested_by_user_id` INTEGER UNSIGNED NOT NULL,
  `request_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `required_date` DATETIME(3) NOT NULL,
  `justification` TEXT NOT NULL,
  `status` ENUM('DRAFT','SUBMITTED','APPROVED','REJECTED','IN_QUOTATION','COMPLETED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `notes` TEXT NULL,
  `submitted_at` DATETIME(3) NULL,
  `approved_at` DATETIME(3) NULL,
  `approved_by_user_id` INTEGER UNSIGNED NULL,
  `rejected_at` DATETIME(3) NULL,
  `rejected_by_user_id` INTEGER UNSIGNED NULL,
  `rejection_reason` TEXT NULL,
  `cancelled_at` DATETIME(3) NULL,
  `cancelled_by_user_id` INTEGER UNSIGNED NULL,
  `cancellation_reason` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `purchase_requests_uuid_key` (`uuid`),
  UNIQUE INDEX `purchase_requests_company_code_key` (`company_id`,`code`),
  UNIQUE INDEX `purchase_requests_id_company_key` (`id`,`company_id`),
  INDEX `purchase_requests_company_status_date_idx` (`company_id`,`status`,`request_date`),
  INDEX `purchase_requests_destination_idx` (`company_id`,`branch_id`,`warehouse_id`),
  INDEX `purchase_requests_requester_date_idx` (`requested_by_user_id`,`request_date`),
  INDEX `purchase_requests_approved_by_idx` (`approved_by_user_id`),
  INDEX `purchase_requests_rejected_by_idx` (`rejected_by_user_id`),
  INDEX `purchase_requests_cancelled_by_idx` (`cancelled_by_user_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `purchase_request_details` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `purchase_request_id` INTEGER UNSIGNED NOT NULL,
  `line_number` SMALLINT UNSIGNED NOT NULL,
  `product_id` INTEGER UNSIGNED NOT NULL,
  `product_unit_id` INTEGER UNSIGNED NOT NULL,
  `quantity` DECIMAL(18,4) NOT NULL,
  `description` VARCHAR(500) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `purchase_request_details_line_key` (`company_id`,`purchase_request_id`,`line_number`),
  UNIQUE INDEX `purchase_request_details_product_unit_key` (`company_id`,`purchase_request_id`,`product_id`,`product_unit_id`),
  UNIQUE INDEX `purchase_request_details_id_company_key` (`id`,`company_id`),
  INDEX `purchase_request_details_product_idx` (`company_id`,`product_id`),
  INDEX `purchase_request_details_unit_idx` (`company_id`,`product_unit_id`),
  CONSTRAINT `purchase_request_details_positive_quantity_check` CHECK (`quantity` > 0),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `purchase_requests`
  ADD CONSTRAINT `purchase_requests_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_requests_branch_company_fkey` FOREIGN KEY (`branch_id`,`company_id`) REFERENCES `branches` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_requests_warehouse_company_fkey` FOREIGN KEY (`warehouse_id`,`company_id`) REFERENCES `warehouses` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_requests_requested_by_fkey` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_requests_approved_by_fkey` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_requests_rejected_by_fkey` FOREIGN KEY (`rejected_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_requests_cancelled_by_fkey` FOREIGN KEY (`cancelled_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `purchase_request_details`
  ADD CONSTRAINT `purchase_request_details_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_request_details_request_company_fkey` FOREIGN KEY (`purchase_request_id`,`company_id`) REFERENCES `purchase_requests` (`id`,`company_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_request_details_product_company_fkey` FOREIGN KEY (`product_id`,`company_id`) REFERENCES `products` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_request_details_unit_company_fkey` FOREIGN KEY (`product_unit_id`,`company_id`) REFERENCES `product_units` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO `permissions` (`code`,`resource`,`action`,`description`,`scope`,`created_at`) VALUES
('purchase_requests.read','purchase_requests','read','View purchase requests.','COMPANY',CURRENT_TIMESTAMP(3)),
('purchase_requests.create','purchase_requests','create','Create purchase requests.','COMPANY',CURRENT_TIMESTAMP(3)),
('purchase_requests.update','purchase_requests','update','Update draft purchase requests.','COMPANY',CURRENT_TIMESTAMP(3)),
('purchase_requests.submit','purchase_requests','submit','Submit purchase requests for approval.','COMPANY',CURRENT_TIMESTAMP(3)),
('purchase_requests.approve','purchase_requests','approve','Approve submitted purchase requests.','COMPANY',CURRENT_TIMESTAMP(3)),
('purchase_requests.reject','purchase_requests','reject','Reject submitted purchase requests.','COMPANY',CURRENT_TIMESTAMP(3)),
('purchase_requests.cancel','purchase_requests','cancel','Cancel purchase requests.','COMPANY',CURRENT_TIMESTAMP(3));

INSERT IGNORE INTO `company_role_permissions` (`role_id`,`permission_id`)
SELECT cr.`id`, p.`id` FROM `company_roles` cr JOIN `permissions` p
WHERE (cr.`code` IN ('OWNER','ADMIN') AND p.`code` LIKE 'purchase_requests.%')
   OR (cr.`code` = 'OPERATOR' AND p.`code` IN ('purchase_requests.read','purchase_requests.create','purchase_requests.update','purchase_requests.submit'))
   OR (cr.`code` = 'READ_ONLY' AND p.`code` = 'purchase_requests.read');
