ALTER TABLE `purchase_quotations`
  ADD COLUMN `selected_at` DATETIME(3) NULL,
  ADD COLUMN `selected_by_user_id` INTEGER UNSIGNED NULL,
  ADD COLUMN `selection_reason` TEXT NULL,
  ADD COLUMN `rejected_at` DATETIME(3) NULL,
  ADD COLUMN `rejected_by_user_id` INTEGER UNSIGNED NULL,
  ADD COLUMN `rejection_reason` TEXT NULL,
  ADD INDEX `purchase_quotations_selected_by_idx` (`selected_by_user_id`),
  ADD INDEX `purchase_quotations_rejected_by_idx` (`rejected_by_user_id`),
  ADD CONSTRAINT `purchase_quotations_selected_by_fkey` FOREIGN KEY (`selected_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_quotations_rejected_by_fkey` FOREIGN KEY (`rejected_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `purchase_quotation_requests`
  ADD COLUMN `decided_at` DATETIME(3) NULL,
  ADD COLUMN `decided_by_user_id` INTEGER UNSIGNED NULL,
  ADD COLUMN `decision_reason` TEXT NULL,
  ADD INDEX `purchase_quotation_requests_decided_by_idx` (`decided_by_user_id`),
  ADD CONSTRAINT `purchase_quotation_requests_decided_by_fkey` FOREIGN KEY (`decided_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `purchase_quotation_request_details`
  ADD COLUMN `awarded_quantity` DECIMAL(18,4) NOT NULL DEFAULT 0,
  ADD CONSTRAINT `purchase_quotation_request_details_awarded_check`
    CHECK (`awarded_quantity` >= 0 AND `awarded_quantity` <= `quantity`);
