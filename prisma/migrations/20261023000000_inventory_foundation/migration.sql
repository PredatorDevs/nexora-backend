ALTER TABLE `purchases`
  ADD COLUMN `costing_mode` ENUM('DIRECT','LANDED_COST') NOT NULL DEFAULT 'DIRECT' AFTER `total`;

CREATE TABLE `inventory_lots` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `product_id` INTEGER UNSIGNED NOT NULL,
  `purchase_detail_id` INTEGER UNSIGNED NOT NULL,
  `received_unit_id` INTEGER UNSIGNED NOT NULL,
  `stock_unit_id` INTEGER UNSIGNED NOT NULL,
  `received_quantity` DECIMAL(18,4) NOT NULL,
  `conversion_factor` DECIMAL(18,6) NOT NULL,
  `stock_quantity` DECIMAL(18,4) NOT NULL,
  `unit_cost` DECIMAL(18,6) NOT NULL,
  `total_cost` DECIMAL(18,6) NOT NULL,
  `received_at` DATETIME(3) NOT NULL,
  `status` ENUM('PENDING','AVAILABLE','DEPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `created_by_user_id` INTEGER UNSIGNED NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `inventory_lots_uuid_key` (`uuid`),
  UNIQUE INDEX `inventory_lots_company_code_key` (`company_id`,`code`),
  UNIQUE INDEX `inventory_lots_purchase_detail_key` (`purchase_detail_id`,`company_id`),
  UNIQUE INDEX `inventory_lots_id_company_key` (`id`,`company_id`),
  INDEX `inventory_lots_product_status_date_idx` (`company_id`,`product_id`,`status`,`received_at`),
  INDEX `inventory_lots_created_by_idx` (`created_by_user_id`),
  CONSTRAINT `inventory_lots_company_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_lots_product_fkey` FOREIGN KEY (`product_id`,`company_id`) REFERENCES `products` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_lots_purchase_detail_fkey` FOREIGN KEY (`purchase_detail_id`,`company_id`) REFERENCES `purchase_details` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_lots_received_unit_fkey` FOREIGN KEY (`received_unit_id`,`company_id`) REFERENCES `product_units` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_lots_stock_unit_fkey` FOREIGN KEY (`stock_unit_id`,`company_id`) REFERENCES `product_units` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_lots_created_by_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_lots_received_quantity_check` CHECK (`received_quantity` > 0),
  CONSTRAINT `inventory_lots_conversion_factor_check` CHECK (`conversion_factor` > 0),
  CONSTRAINT `inventory_lots_stock_quantity_check` CHECK (`stock_quantity` > 0),
  CONSTRAINT `inventory_lots_cost_check` CHECK (`unit_cost` >= 0 AND `total_cost` >= 0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `inventory_location_details` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `inventory_lot_id` INTEGER UNSIGNED NOT NULL,
  `location_id` INTEGER UNSIGNED NOT NULL,
  `quantity` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `inventory_location_details_lot_location_key` (`company_id`,`inventory_lot_id`,`location_id`),
  UNIQUE INDEX `inventory_location_details_id_company_key` (`id`,`company_id`),
  INDEX `inventory_location_details_location_idx` (`company_id`,`location_id`),
  CONSTRAINT `inventory_location_details_company_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_location_details_lot_fkey` FOREIGN KEY (`inventory_lot_id`,`company_id`) REFERENCES `inventory_lots` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_location_details_location_fkey` FOREIGN KEY (`location_id`,`company_id`) REFERENCES `locations` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_location_details_quantity_check` CHECK (`quantity` >= 0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `inventory_movements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `product_id` INTEGER UNSIGNED NOT NULL,
  `inventory_lot_id` INTEGER UNSIGNED NOT NULL,
  `warehouse_id` INTEGER UNSIGNED NOT NULL,
  `location_id` INTEGER UNSIGNED NULL,
  `movement_type` ENUM('PURCHASE_RECEIPT','TRANSFER_OUT','TRANSFER_IN','SALE_ISSUE','CUSTOMER_RETURN','ADJUSTMENT_IN','ADJUSTMENT_OUT','REVERSAL') NOT NULL,
  `movement_date` DATETIME(3) NOT NULL,
  `quantity_in` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `quantity_out` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `unit_cost` DECIMAL(18,6) NOT NULL,
  `total_cost` DECIMAL(18,6) NOT NULL,
  `reference_type` ENUM('PURCHASE','TRANSFER','SALE','RETURN','ADJUSTMENT') NOT NULL,
  `reference_id` INTEGER UNSIGNED NOT NULL,
  `reversal_of_movement_id` BIGINT UNSIGNED NULL,
  `reason` TEXT NULL,
  `confirmed_by_user_id` INTEGER UNSIGNED NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `inventory_movements_uuid_key` (`uuid`),
  INDEX `inventory_movements_product_date_idx` (`company_id`,`product_id`,`movement_date`),
  INDEX `inventory_movements_lot_date_idx` (`company_id`,`inventory_lot_id`,`movement_date`),
  INDEX `inventory_movements_location_date_idx` (`company_id`,`warehouse_id`,`location_id`,`movement_date`),
  INDEX `inventory_movements_reference_idx` (`company_id`,`reference_type`,`reference_id`),
  INDEX `inventory_movements_reversal_idx` (`reversal_of_movement_id`),
  INDEX `inventory_movements_confirmed_by_idx` (`confirmed_by_user_id`),
  CONSTRAINT `inventory_movements_company_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_movements_product_fkey` FOREIGN KEY (`product_id`,`company_id`) REFERENCES `products` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_movements_lot_fkey` FOREIGN KEY (`inventory_lot_id`,`company_id`) REFERENCES `inventory_lots` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_movements_warehouse_fkey` FOREIGN KEY (`warehouse_id`,`company_id`) REFERENCES `warehouses` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_movements_location_fkey` FOREIGN KEY (`location_id`,`company_id`) REFERENCES `locations` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_movements_user_fkey` FOREIGN KEY (`confirmed_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_movements_reversal_fkey` FOREIGN KEY (`reversal_of_movement_id`) REFERENCES `inventory_movements` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_movements_direction_check` CHECK ((`quantity_in` > 0 AND `quantity_out` = 0) OR (`quantity_out` > 0 AND `quantity_in` = 0)),
  CONSTRAINT `inventory_movements_cost_check` CHECK (`unit_cost` >= 0 AND `total_cost` >= 0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `inventory_cost_averages` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `product_id` INTEGER UNSIGNED NOT NULL,
  `quantity_on_hand` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `inventory_value` DECIMAL(18,6) NOT NULL DEFAULT 0,
  `average_unit_cost` DECIMAL(18,6) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `inventory_cost_averages_company_product_key` (`company_id`,`product_id`),
  UNIQUE INDEX `inventory_cost_averages_id_company_key` (`id`,`company_id`),
  CONSTRAINT `inventory_cost_averages_company_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_cost_averages_product_fkey` FOREIGN KEY (`product_id`,`company_id`) REFERENCES `products` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_cost_averages_nonnegative_check` CHECK (`quantity_on_hand` >= 0 AND `inventory_value` >= 0 AND `average_unit_cost` >= 0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `inventory_label_prints` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INTEGER UNSIGNED NOT NULL,
  `inventory_lot_id` INTEGER UNSIGNED NOT NULL,
  `quantity_printed` INTEGER UNSIGNED NOT NULL,
  `reprint_reason` VARCHAR(500) NULL,
  `printed_by_user_id` INTEGER UNSIGNED NOT NULL,
  `printed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `inventory_label_prints_lot_date_idx` (`company_id`,`inventory_lot_id`,`printed_at`),
  INDEX `inventory_label_prints_printed_by_idx` (`printed_by_user_id`),
  CONSTRAINT `inventory_label_prints_company_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_label_prints_lot_fkey` FOREIGN KEY (`inventory_lot_id`,`company_id`) REFERENCES `inventory_lots` (`id`,`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_label_prints_user_fkey` FOREIGN KEY (`printed_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_label_prints_quantity_check` CHECK (`quantity_printed` > 0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `permissions` (`code`,`resource`,`action`,`description`,`scope`,`created_at`)
VALUES
  ('inventory.read','inventory','read','Consultar existencias de inventario.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('inventory.lots_read','inventory','lots_read','Consultar lotes de inventario.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('inventory.receive','inventory','receive','Confirmar ingresos de mercancía.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('inventory.labels_print','inventory','labels_print','Imprimir etiquetas de inventario.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('inventory.locations_assign','inventory','locations_assign','Asignar mercancía a ubicaciones.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('inventory.kardex_read','inventory','kardex_read','Consultar Kardex.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('inventory.costs_read','inventory','costs_read','Consultar costos promedio y valoración.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('inventory.adjustments_create','inventory','adjustments_create','Crear ajustes de inventario.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('inventory.adjustments_approve','inventory','adjustments_approve','Aprobar ajustes de inventario.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('inventory.movements_reverse','inventory','movements_reverse','Revertir movimientos de inventario.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('inventory.transfers_create','inventory','transfers_create','Crear traslados de inventario.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('inventory.transfers_dispatch','inventory','transfers_dispatch','Despachar traslados de inventario.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('inventory.transfers_receive','inventory','transfers_receive','Recibir traslados de inventario.','COMPANY',CURRENT_TIMESTAMP(3)),
  ('inventory.transfers_cancel','inventory','transfers_cancel','Cancelar traslados de inventario.','COMPANY',CURRENT_TIMESTAMP(3));

INSERT IGNORE INTO `company_role_permissions` (`role_id`,`permission_id`,`company_id`)
SELECT `cr`.`id`, `p`.`id`, `cr`.`company_id`
FROM `company_roles` AS `cr`
INNER JOIN `permissions` AS `p` ON `p`.`code` LIKE 'inventory.%'
WHERE `cr`.`code` IN ('OWNER','ADMIN');
