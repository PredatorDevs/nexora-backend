CREATE TABLE `purchase_quotation_requests` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `purchase_quotation_id` INTEGER UNSIGNED NOT NULL,
  `purchase_request_id` INTEGER UNSIGNED NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `purchase_quotation_requests_pair_key` (`company_id`, `purchase_quotation_id`, `purchase_request_id`),
  UNIQUE INDEX `purchase_quotation_requests_id_company_key` (`id`, `company_id`),
  INDEX `purchase_quotation_requests_request_idx` (`company_id`, `purchase_request_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `purchase_quotation_request_details` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `purchase_quotation_request_id` INTEGER UNSIGNED NOT NULL,
  `purchase_quotation_detail_id` INTEGER UNSIGNED NOT NULL,
  `purchase_request_detail_id` INTEGER UNSIGNED NOT NULL,
  `quantity` DECIMAL(18,4) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `purchase_quotation_request_details_pair_key` (`company_id`, `purchase_quotation_detail_id`, `purchase_request_detail_id`),
  UNIQUE INDEX `purchase_quotation_request_details_id_company_key` (`id`, `company_id`),
  INDEX `purchase_quotation_request_details_link_idx` (`company_id`, `purchase_quotation_request_id`),
  INDEX `purchase_quotation_request_details_request_detail_idx` (`company_id`, `purchase_request_detail_id`),
  CONSTRAINT `purchase_quotation_request_details_quantity_check` CHECK (`quantity` > 0),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `purchase_quotation_requests`
  ADD CONSTRAINT `purchase_quotation_requests_company_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_quotation_requests_quotation_company_fkey` FOREIGN KEY (`purchase_quotation_id`, `company_id`) REFERENCES `purchase_quotations` (`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_quotation_requests_request_company_fkey` FOREIGN KEY (`purchase_request_id`, `company_id`) REFERENCES `purchase_requests` (`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `purchase_quotation_request_details`
  ADD CONSTRAINT `purchase_quotation_request_details_company_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_quotation_request_details_parent_company_fkey` FOREIGN KEY (`purchase_quotation_request_id`, `company_id`) REFERENCES `purchase_quotation_requests` (`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_quotation_request_details_quotation_detail_company_fkey` FOREIGN KEY (`purchase_quotation_detail_id`, `company_id`) REFERENCES `purchase_quotation_details` (`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_quotation_request_details_request_detail_company_fkey` FOREIGN KEY (`purchase_request_detail_id`, `company_id`) REFERENCES `purchase_request_details` (`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO `permissions` (`code`, `resource`, `action`, `description`, `scope`, `created_at`)
VALUES ('purchase_quotations.link_requests', 'purchase_quotations', 'link_requests', 'Link approved purchase requests to draft quotations.', 'COMPANY', CURRENT_TIMESTAMP(3));

INSERT IGNORE INTO `company_role_permissions` (`role_id`, `permission_id`)
SELECT cr.`id`, p.`id`
FROM `company_roles` cr
JOIN `permissions` p ON p.`code` = 'purchase_quotations.link_requests'
WHERE cr.`code` IN ('OWNER', 'ADMIN', 'OPERATOR');
