CREATE TABLE `code_sequences` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `namespace` VARCHAR(191) NOT NULL,
  `next_value` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `code_sequences_namespace_key`(`namespace`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `code_sequences` (`namespace`, `next_value`, `created_at`, `updated_at`)
SELECT 'company', COALESCE(MAX(CAST(SUBSTRING(`code`, 5) AS UNSIGNED)), 0) + 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `companies`
WHERE `code` REGEXP '^COM-[0-9]+$';

INSERT INTO `code_sequences` (`namespace`, `next_value`, `created_at`, `updated_at`)
SELECT CONCAT('branch:', `company_id`), COALESCE(MAX(CAST(SUBSTRING(`code`, 4) AS UNSIGNED)), 0) + 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `branches`
WHERE `code` REGEXP '^BR-[0-9]+$'
GROUP BY `company_id`;

INSERT INTO `code_sequences` (`namespace`, `next_value`, `created_at`, `updated_at`)
SELECT 'platform_role', COALESCE(MAX(CAST(SUBSTRING(`code`, 5) AS UNSIGNED)), 0) + 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `roles`
WHERE `code` REGEXP '^ROL-[0-9]+$';

INSERT INTO `code_sequences` (`namespace`, `next_value`, `created_at`, `updated_at`)
SELECT CONCAT('company_role:', `company_id`), COALESCE(MAX(CAST(SUBSTRING(`code`, 5) AS UNSIGNED)), 0) + 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `company_roles`
WHERE `code` REGEXP '^CRL-[0-9]+$'
GROUP BY `company_id`;

INSERT INTO `code_sequences` (`namespace`, `next_value`, `created_at`, `updated_at`)
SELECT CONCAT('warehouse_category:', `company_id`), COALESCE(MAX(CAST(SUBSTRING(`code`, 5) AS UNSIGNED)), 0) + 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `warehouse_categories`
WHERE `code` REGEXP '^WCT-[0-9]+$'
GROUP BY `company_id`;
