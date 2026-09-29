ALTER TABLE `purchase_requests`
  MODIFY `status` ENUM('DRAFT','SUBMITTED','APPROVED','CONSOLIDATED','REJECTED','IN_QUOTATION','COMPLETED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN `request_type` ENUM('STANDARD','CONSOLIDATED') NOT NULL DEFAULT 'STANDARD' AFTER `code`,
  ADD COLUMN `consolidated_into_id` INTEGER UNSIGNED NULL AFTER `request_type`,
  ADD COLUMN `consolidated_at` DATETIME(3) NULL AFTER `consolidated_into_id`,
  ADD COLUMN `consolidated_by_user_id` INTEGER UNSIGNED NULL AFTER `consolidated_at`,
  ADD INDEX `purchase_requests_type_status_idx` (`company_id`,`request_type`,`status`),
  ADD INDEX `purchase_requests_consolidated_into_idx` (`consolidated_into_id`,`company_id`),
  ADD INDEX `purchase_requests_consolidated_by_idx` (`consolidated_by_user_id`),
  ADD CONSTRAINT `purchase_requests_consolidated_into_fkey`
    FOREIGN KEY (`consolidated_into_id`,`company_id`)
    REFERENCES `purchase_requests` (`id`,`company_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_requests_consolidated_by_fkey`
    FOREIGN KEY (`consolidated_by_user_id`)
    REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `purchase_request_consolidation_details` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `consolidated_request_detail_id` INTEGER UNSIGNED NOT NULL,
  `source_request_detail_id` INTEGER UNSIGNED NOT NULL,
  `quantity` DECIMAL(18,4) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `purchase_request_consolidation_details_pair_key`
    (`company_id`,`consolidated_request_detail_id`,`source_request_detail_id`),
  UNIQUE INDEX `purchase_request_consolidation_details_source_key`
    (`source_request_detail_id`,`company_id`),
  INDEX `purchase_request_consolidation_details_target_idx`
    (`company_id`,`consolidated_request_detail_id`),
  CONSTRAINT `purchase_request_consolidation_details_quantity_check`
    CHECK (`quantity` > 0),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `purchase_request_consolidation_details`
  ADD CONSTRAINT `purchase_request_consolidation_details_company_fkey`
    FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_request_consolidation_details_target_fkey`
    FOREIGN KEY (`consolidated_request_detail_id`,`company_id`)
    REFERENCES `purchase_request_details` (`id`,`company_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_request_consolidation_details_source_fkey`
    FOREIGN KEY (`source_request_detail_id`,`company_id`)
    REFERENCES `purchase_request_details` (`id`,`company_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO `permissions` (`code`,`resource`,`action`,`description`,`scope`,`created_at`)
VALUES (
  'purchase_requests.consolidate',
  'purchase_requests',
  'consolidate',
  'Consolidate approved purchase requests.',
  'COMPANY',
  CURRENT_TIMESTAMP(3)
);

INSERT IGNORE INTO `company_role_permissions` (`role_id`,`permission_id`,`company_id`)
SELECT `cr`.`id`, `p`.`id`, `cr`.`company_id`
FROM `company_roles` AS `cr`
INNER JOIN `permissions` AS `p`
  ON `p`.`code` = 'purchase_requests.consolidate'
WHERE `cr`.`code` IN ('OWNER','ADMIN');
