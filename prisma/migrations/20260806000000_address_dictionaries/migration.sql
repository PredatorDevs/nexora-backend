-- CreateTable
CREATE TABLE `countries` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(128) NOT NULL,
    `abbreviation` VARCHAR(5) NOT NULL,
    `mh_code` VARCHAR(5) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `countries_abbreviation_key`(`abbreviation`),
    UNIQUE INDEX `countries_mh_code_key`(`mh_code`),
    INDEX `countries_active_name_idx`(`is_active`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(80) NOT NULL,
    `abbreviation` VARCHAR(10) NOT NULL,
    `mh_code` VARCHAR(5) NOT NULL,
    `zone` TINYINT UNSIGNED NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `departments_abbreviation_key`(`abbreviation`),
    UNIQUE INDEX `departments_mh_code_key`(`mh_code`),
    INDEX `departments_active_name_idx`(`is_active`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `municipalities` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `department_id` INTEGER UNSIGNED NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `mh_code` VARCHAR(5) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `municipalities_department_mh_code_key`(`department_id`, `mh_code`),
    INDEX `municipalities_department_active_name_idx`(`department_id`, `is_active`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `districts` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `municipality_id` INTEGER UNSIGNED NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `mh_code` VARCHAR(5) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `districts_municipality_mh_code_key`(`municipality_id`, `mh_code`),
    INDEX `districts_municipality_active_name_idx`(`municipality_id`, `is_active`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `municipalities` ADD CONSTRAINT `municipalities_department_id_fkey`
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `districts` ADD CONSTRAINT `districts_municipality_id_fkey`
    FOREIGN KEY (`municipality_id`) REFERENCES `municipalities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;