-- CreateTable
CREATE TABLE `companies` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `legal_name` VARCHAR(191) NOT NULL,
    `commercial_name` VARCHAR(191) NOT NULL,
    `nit` VARCHAR(25) NOT NULL,
    `nrc` VARCHAR(25) NOT NULL,
    `country_id` INTEGER UNSIGNED NOT NULL,
    `department_id` INTEGER UNSIGNED NOT NULL,
    `municipality_id` INTEGER UNSIGNED NOT NULL,
    `district_id` INTEGER UNSIGNED NOT NULL,
    `address_line` VARCHAR(500) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `email` VARCHAR(191) NULL,
    `website` VARCHAR(500) NULL,
    `logo_storage_key` VARCHAR(500) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `default_currency_code` CHAR(3) NOT NULL DEFAULT 'USD',
    `timezone` VARCHAR(100) NOT NULL DEFAULT 'America/El_Salvador',
    `locale` VARCHAR(20) NOT NULL DEFAULT 'es-SV',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `companies_code_key`(`code`),
    UNIQUE INDEX `companies_nit_key`(`nit`),
    UNIQUE INDEX `companies_nrc_key`(`nrc`),
    INDEX `companies_status_legal_name_idx`(`status`, `legal_name`),
    INDEX `companies_country_id_idx`(`country_id`),
    INDEX `companies_department_id_idx`(`department_id`),
    INDEX `companies_municipality_id_idx`(`municipality_id`),
    INDEX `companies_district_id_idx`(`district_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_economic_activities` (
    `company_id` INTEGER UNSIGNED NOT NULL,
    `economic_activity_id` INTEGER UNSIGNED NOT NULL,
    `type` ENUM('PRIMARY', 'SECONDARY', 'TERTIARY') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `company_economic_activities_activity_key`(`company_id`, `economic_activity_id`),
    INDEX `company_economic_activities_activity_id_idx`(`economic_activity_id`),
    PRIMARY KEY (`company_id`, `type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `companies_country_id_fkey`
    FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `companies_department_id_fkey`
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `companies_municipality_id_fkey`
    FOREIGN KEY (`municipality_id`) REFERENCES `municipalities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `companies_district_id_fkey`
    FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_economic_activities` ADD CONSTRAINT `company_economic_activities_company_id_fkey`
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_economic_activities` ADD CONSTRAINT `company_economic_activities_economic_activity_id_fkey`
    FOREIGN KEY (`economic_activity_id`) REFERENCES `economic_activities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
