CREATE TABLE `purchase_quotation_expenses` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `purchase_quotation_id` INTEGER UNSIGNED NOT NULL,
  `expense_type_id` INTEGER UNSIGNED NOT NULL,
  `line_number` SMALLINT UNSIGNED NOT NULL,
  `description` VARCHAR(500) NULL,
  `amount` DECIMAL(18,6) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `purchase_quotation_expenses_line_key` (`company_id`, `purchase_quotation_id`, `line_number`),
  UNIQUE INDEX `purchase_quotation_expenses_id_company_key` (`id`, `company_id`),
  INDEX `purchase_quotation_expenses_type_idx` (`company_id`, `expense_type_id`),
  CONSTRAINT `purchase_quotation_expenses_amount_check` CHECK (`amount` > 0),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `purchase_quotation_expenses`
  ADD CONSTRAINT `purchase_quotation_expenses_company_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_quotation_expenses_quotation_company_fkey` FOREIGN KEY (`purchase_quotation_id`, `company_id`) REFERENCES `purchase_quotations` (`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_quotation_expenses_type_company_fkey` FOREIGN KEY (`expense_type_id`, `company_id`) REFERENCES `expense_types` (`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO `permissions` (`code`, `resource`, `action`, `description`, `scope`, `created_at`)
VALUES ('purchase_quotations.manage_expenses', 'purchase_quotations', 'manage_expenses', 'Manage additional expenses on purchase quotations.', 'COMPANY', CURRENT_TIMESTAMP(3));

INSERT IGNORE INTO `company_role_permissions` (`role_id`, `permission_id`)
SELECT cr.`id`, p.`id`
FROM `company_roles` cr
JOIN `permissions` p ON p.`code` = 'purchase_quotations.manage_expenses'
WHERE cr.`code` IN ('OWNER', 'ADMIN', 'OPERATOR');
