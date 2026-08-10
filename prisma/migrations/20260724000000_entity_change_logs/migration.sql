-- CreateTable
CREATE TABLE `entity_change_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `schema_name` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(100) NOT NULL,
    `entity_id` VARCHAR(191) NOT NULL,
    `operation` ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    `source` ENUM('APPLICATION', 'SYSTEM_JOB', 'MIGRATION', 'DATABASE_TRIGGER') NOT NULL DEFAULT 'APPLICATION',
    `actor_user_id` INTEGER UNSIGNED NULL,
    `request_id` VARCHAR(128) NOT NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `changed_fields` JSON NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `entity_change_logs_entity_idx`(`schema_name`, `entity_type`, `entity_id`, `created_at`),
    INDEX `entity_change_logs_actor_idx`(`actor_user_id`, `created_at`),
    INDEX `entity_change_logs_request_id_idx`(`request_id`),
    INDEX `entity_change_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `entity_change_logs`
    ADD CONSTRAINT `entity_change_logs_actor_user_id_fkey`
    FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
