CREATE TABLE `expense_types` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `description` VARCHAR(500) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `expense_types_company_code_key` (`company_id`,`code`),
  UNIQUE INDEX `expense_types_company_name_key` (`company_id`,`name`),
  UNIQUE INDEX `expense_types_id_company_key` (`id`,`company_id`),
  INDEX `expense_types_company_active_name_idx` (`company_id`,`is_active`,`name`),
  PRIMARY KEY (`id`),
  CONSTRAINT `expense_types_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `expense_types` (`company_id`,`code`,`name`,`description`,`is_active`,`created_at`,`updated_at`)
SELECT c.`id`, template.`code`, template.`name`, template.`description`, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `companies` c
CROSS JOIN (
  SELECT 'TRANSPORT' AS `code`, 'Transporte' AS `name`, 'Traslado terrestre local o nacional.' AS `description`
  UNION ALL SELECT 'FREIGHT', 'Flete', 'Transporte principal nacional o internacional.'
  UNION ALL SELECT 'INSURANCE', 'Seguro', 'Cobertura asociada al transporte de mercancías.'
  UNION ALL SELECT 'CUSTOMS', 'Aduana', 'Trámites y servicios aduanales.'
  UNION ALL SELECT 'HANDLING', 'Manipulación', 'Carga, descarga y manipulación de mercancía.'
  UNION ALL SELECT 'STORAGE', 'Almacenamiento', 'Custodia o almacenamiento temporal.'
  UNION ALL SELECT 'OTHER', 'Otros', 'Otros gastos relacionados con la adquisición.'
) template;

INSERT INTO `permissions` (`code`,`resource`,`action`,`description`,`scope`,`created_at`) VALUES
('expense_types.read','expense_types','read','View expense types.','COMPANY',CURRENT_TIMESTAMP(3)),
('expense_types.create','expense_types','create','Create expense types.','COMPANY',CURRENT_TIMESTAMP(3)),
('expense_types.update','expense_types','update','Update expense types.','COMPANY',CURRENT_TIMESTAMP(3)),
('expense_types.change_status','expense_types','change_status','Activate or deactivate expense types.','COMPANY',CURRENT_TIMESTAMP(3));

INSERT IGNORE INTO `company_role_permissions` (`role_id`,`permission_id`)
SELECT cr.`id`, p.`id` FROM `company_roles` cr JOIN `permissions` p
WHERE (cr.`code` IN ('OWNER','ADMIN') AND p.`code` LIKE 'expense_types.%')
   OR (cr.`code` IN ('OPERATOR','READ_ONLY') AND p.`code` = 'expense_types.read');
