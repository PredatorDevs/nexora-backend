-- AddIndex
CREATE INDEX `entity_change_logs_schema_date_idx`
    ON `entity_change_logs`(`schema_name`, `created_at`);

-- AddIndex
CREATE INDEX `entity_change_logs_type_date_idx`
    ON `entity_change_logs`(`schema_name`, `entity_type`, `created_at`);
