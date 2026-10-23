-- DropForeignKey
ALTER TABLE `company_invitation_roles` DROP FOREIGN KEY `company_invitation_roles_invitation_company_fkey`;

-- DropForeignKey
ALTER TABLE `company_invitation_roles` DROP FOREIGN KEY `company_invitation_roles_role_company_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_cost_averages` DROP FOREIGN KEY `inventory_cost_averages_company_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_cost_averages` DROP FOREIGN KEY `inventory_cost_averages_product_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_label_prints` DROP FOREIGN KEY `inventory_label_prints_company_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_label_prints` DROP FOREIGN KEY `inventory_label_prints_lot_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_label_prints` DROP FOREIGN KEY `inventory_label_prints_user_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_location_details` DROP FOREIGN KEY `inventory_location_details_company_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_location_details` DROP FOREIGN KEY `inventory_location_details_location_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_location_details` DROP FOREIGN KEY `inventory_location_details_lot_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_lots` DROP FOREIGN KEY `inventory_lots_company_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_lots` DROP FOREIGN KEY `inventory_lots_created_by_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_lots` DROP FOREIGN KEY `inventory_lots_product_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_lots` DROP FOREIGN KEY `inventory_lots_purchase_detail_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_lots` DROP FOREIGN KEY `inventory_lots_received_unit_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_lots` DROP FOREIGN KEY `inventory_lots_stock_unit_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_movements` DROP FOREIGN KEY `inventory_movements_company_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_movements` DROP FOREIGN KEY `inventory_movements_location_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_movements` DROP FOREIGN KEY `inventory_movements_lot_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_movements` DROP FOREIGN KEY `inventory_movements_product_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_movements` DROP FOREIGN KEY `inventory_movements_reversal_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_movements` DROP FOREIGN KEY `inventory_movements_user_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_movements` DROP FOREIGN KEY `inventory_movements_warehouse_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_transfer_details` DROP FOREIGN KEY `inventory_transfer_details_company_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_transfer_details` DROP FOREIGN KEY `inventory_transfer_details_destination_location_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_transfer_details` DROP FOREIGN KEY `inventory_transfer_details_lot_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_transfer_details` DROP FOREIGN KEY `inventory_transfer_details_source_location_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_transfer_details` DROP FOREIGN KEY `inventory_transfer_details_transfer_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_transfers` DROP FOREIGN KEY `inventory_transfers_cancelled_by_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_transfers` DROP FOREIGN KEY `inventory_transfers_company_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_transfers` DROP FOREIGN KEY `inventory_transfers_created_by_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_transfers` DROP FOREIGN KEY `inventory_transfers_destination_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_transfers` DROP FOREIGN KEY `inventory_transfers_dispatched_by_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_transfers` DROP FOREIGN KEY `inventory_transfers_received_by_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_transfers` DROP FOREIGN KEY `inventory_transfers_source_fkey`;

-- DropForeignKey
ALTER TABLE `locations` DROP FOREIGN KEY `locations_warehouse_company_fkey`;

-- DropForeignKey
ALTER TABLE `product_categories` DROP FOREIGN KEY `product_categories_parent_company_fkey`;

-- DropForeignKey
ALTER TABLE `product_images` DROP FOREIGN KEY `product_images_product_company_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_brand_company_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_category_company_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_purchase_unit_company_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_sale_unit_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_details` DROP FOREIGN KEY `purchase_details_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_details` DROP FOREIGN KEY `purchase_details_order_detail_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_details` DROP FOREIGN KEY `purchase_details_product_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_details` DROP FOREIGN KEY `purchase_details_purchase_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_details` DROP FOREIGN KEY `purchase_details_unit_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_order_details` DROP FOREIGN KEY `purchase_order_details_award_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_order_details` DROP FOREIGN KEY `purchase_order_details_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_order_details` DROP FOREIGN KEY `purchase_order_details_order_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_order_details` DROP FOREIGN KEY `purchase_order_details_product_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_order_details` DROP FOREIGN KEY `purchase_order_details_unit_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_order_expense_documents` DROP FOREIGN KEY `purchase_order_expense_documents_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_order_expense_documents` DROP FOREIGN KEY `purchase_order_expense_documents_expense_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_order_expense_documents` DROP FOREIGN KEY `purchase_order_expense_documents_uploaded_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_order_expenses` DROP FOREIGN KEY `purchase_order_expenses_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_order_expenses` DROP FOREIGN KEY `purchase_order_expenses_order_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_order_expenses` DROP FOREIGN KEY `purchase_order_expenses_type_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_orders` DROP FOREIGN KEY `purchase_orders_approved_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_orders` DROP FOREIGN KEY `purchase_orders_branch_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_orders` DROP FOREIGN KEY `purchase_orders_cancelled_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_orders` DROP FOREIGN KEY `purchase_orders_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_orders` DROP FOREIGN KEY `purchase_orders_contact_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_orders` DROP FOREIGN KEY `purchase_orders_created_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_orders` DROP FOREIGN KEY `purchase_orders_quotation_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_orders` DROP FOREIGN KEY `purchase_orders_sent_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_orders` DROP FOREIGN KEY `purchase_orders_supplier_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_orders` DROP FOREIGN KEY `purchase_orders_warehouse_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotation_details` DROP FOREIGN KEY `purchase_quotation_details_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotation_details` DROP FOREIGN KEY `purchase_quotation_details_product_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotation_details` DROP FOREIGN KEY `purchase_quotation_details_quotation_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotation_details` DROP FOREIGN KEY `purchase_quotation_details_unit_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotation_expenses` DROP FOREIGN KEY `purchase_quotation_expenses_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotation_expenses` DROP FOREIGN KEY `purchase_quotation_expenses_quotation_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotation_expenses` DROP FOREIGN KEY `purchase_quotation_expenses_type_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotation_request_details` DROP FOREIGN KEY `purchase_quotation_request_details_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotation_request_details` DROP FOREIGN KEY `purchase_quotation_request_details_parent_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotation_request_details` DROP FOREIGN KEY `purchase_quotation_request_details_quotation_detail_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotation_request_details` DROP FOREIGN KEY `purchase_quotation_request_details_request_detail_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotation_requests` DROP FOREIGN KEY `purchase_quotation_requests_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotation_requests` DROP FOREIGN KEY `purchase_quotation_requests_decided_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotation_requests` DROP FOREIGN KEY `purchase_quotation_requests_quotation_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotation_requests` DROP FOREIGN KEY `purchase_quotation_requests_request_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotations` DROP FOREIGN KEY `purchase_quotations_cancelled_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotations` DROP FOREIGN KEY `purchase_quotations_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotations` DROP FOREIGN KEY `purchase_quotations_contact_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotations` DROP FOREIGN KEY `purchase_quotations_registered_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotations` DROP FOREIGN KEY `purchase_quotations_rejected_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotations` DROP FOREIGN KEY `purchase_quotations_selected_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_quotations` DROP FOREIGN KEY `purchase_quotations_supplier_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_request_consolidation_details` DROP FOREIGN KEY `purchase_request_consolidation_details_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_request_consolidation_details` DROP FOREIGN KEY `purchase_request_consolidation_details_source_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_request_consolidation_details` DROP FOREIGN KEY `purchase_request_consolidation_details_target_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_request_details` DROP FOREIGN KEY `purchase_request_details_product_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_request_details` DROP FOREIGN KEY `purchase_request_details_request_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_request_details` DROP FOREIGN KEY `purchase_request_details_unit_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_request_supplier_segment_details` DROP FOREIGN KEY `purchase_request_supplier_segment_details_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_request_supplier_segment_details` DROP FOREIGN KEY `purchase_request_supplier_segment_details_request_line_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_request_supplier_segment_details` DROP FOREIGN KEY `purchase_request_supplier_segment_details_segment_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_request_supplier_segments` DROP FOREIGN KEY `purchase_request_supplier_segments_cancelled_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_request_supplier_segments` DROP FOREIGN KEY `purchase_request_supplier_segments_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_request_supplier_segments` DROP FOREIGN KEY `purchase_request_supplier_segments_contact_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_request_supplier_segments` DROP FOREIGN KEY `purchase_request_supplier_segments_created_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_request_supplier_segments` DROP FOREIGN KEY `purchase_request_supplier_segments_issued_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_request_supplier_segments` DROP FOREIGN KEY `purchase_request_supplier_segments_request_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_request_supplier_segments` DROP FOREIGN KEY `purchase_request_supplier_segments_supplier_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_requests` DROP FOREIGN KEY `purchase_requests_approved_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_requests` DROP FOREIGN KEY `purchase_requests_branch_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_requests` DROP FOREIGN KEY `purchase_requests_cancelled_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_requests` DROP FOREIGN KEY `purchase_requests_consolidated_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_requests` DROP FOREIGN KEY `purchase_requests_consolidated_into_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_requests` DROP FOREIGN KEY `purchase_requests_rejected_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_requests` DROP FOREIGN KEY `purchase_requests_requested_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_requests` DROP FOREIGN KEY `purchase_requests_warehouse_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchases` DROP FOREIGN KEY `purchases_branch_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchases` DROP FOREIGN KEY `purchases_cancelled_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchases` DROP FOREIGN KEY `purchases_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchases` DROP FOREIGN KEY `purchases_order_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchases` DROP FOREIGN KEY `purchases_received_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchases` DROP FOREIGN KEY `purchases_supplier_company_fkey`;

-- DropForeignKey
ALTER TABLE `purchases` DROP FOREIGN KEY `purchases_verified_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchases` DROP FOREIGN KEY `purchases_warehouse_company_fkey`;

-- DropForeignKey
ALTER TABLE `retaceo_allocations` DROP FOREIGN KEY `retaceo_allocations_company_fkey`;

-- DropForeignKey
ALTER TABLE `retaceo_allocations` DROP FOREIGN KEY `retaceo_allocations_cost_company_fkey`;

-- DropForeignKey
ALTER TABLE `retaceo_allocations` DROP FOREIGN KEY `retaceo_allocations_detail_company_fkey`;

-- DropForeignKey
ALTER TABLE `retaceo_costs` DROP FOREIGN KEY `retaceo_costs_company_fkey`;

-- DropForeignKey
ALTER TABLE `retaceo_costs` DROP FOREIGN KEY `retaceo_costs_created_by_fkey`;

-- DropForeignKey
ALTER TABLE `retaceo_costs` DROP FOREIGN KEY `retaceo_costs_expense_type_company_fkey`;

-- DropForeignKey
ALTER TABLE `retaceo_costs` DROP FOREIGN KEY `retaceo_costs_order_expense_company_fkey`;

-- DropForeignKey
ALTER TABLE `retaceo_costs` DROP FOREIGN KEY `retaceo_costs_retaceo_company_fkey`;

-- DropForeignKey
ALTER TABLE `retaceo_details` DROP FOREIGN KEY `retaceo_details_company_fkey`;

-- DropForeignKey
ALTER TABLE `retaceo_details` DROP FOREIGN KEY `retaceo_details_product_company_fkey`;

-- DropForeignKey
ALTER TABLE `retaceo_details` DROP FOREIGN KEY `retaceo_details_purchase_detail_company_fkey`;

-- DropForeignKey
ALTER TABLE `retaceo_details` DROP FOREIGN KEY `retaceo_details_retaceo_company_fkey`;

-- DropForeignKey
ALTER TABLE `retaceo_details` DROP FOREIGN KEY `retaceo_details_unit_company_fkey`;

-- DropForeignKey
ALTER TABLE `retaceos` DROP FOREIGN KEY `retaceos_calculated_by_fkey`;

-- DropForeignKey
ALTER TABLE `retaceos` DROP FOREIGN KEY `retaceos_cancelled_by_fkey`;

-- DropForeignKey
ALTER TABLE `retaceos` DROP FOREIGN KEY `retaceos_closed_by_fkey`;

-- DropForeignKey
ALTER TABLE `retaceos` DROP FOREIGN KEY `retaceos_company_fkey`;

-- DropForeignKey
ALTER TABLE `retaceos` DROP FOREIGN KEY `retaceos_created_by_fkey`;

-- DropForeignKey
ALTER TABLE `retaceos` DROP FOREIGN KEY `retaceos_origin_country_fkey`;

-- DropForeignKey
ALTER TABLE `retaceos` DROP FOREIGN KEY `retaceos_purchase_company_fkey`;

-- DropForeignKey
ALTER TABLE `retaceos` DROP FOREIGN KEY `retaceos_supplier_company_fkey`;

-- DropForeignKey
ALTER TABLE `retaceos` DROP FOREIGN KEY `retaceos_verified_by_fkey`;

-- DropForeignKey
ALTER TABLE `supplier_contacts` DROP FOREIGN KEY `supplier_contacts_supplier_company_fkey`;

-- DropForeignKey
ALTER TABLE `warehouses` DROP FOREIGN KEY `warehouses_branch_company_fkey`;

-- DropForeignKey
ALTER TABLE `warehouses` DROP FOREIGN KEY `warehouses_category_company_fkey`;

-- AddForeignKey
ALTER TABLE `product_categories` ADD CONSTRAINT `product_categories_parent_category_id_company_id_fkey` FOREIGN KEY (`parent_category_id`, `company_id`) REFERENCES `product_categories`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_product_category_id_company_id_fkey` FOREIGN KEY (`product_category_id`, `company_id`) REFERENCES `product_categories`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_brand_id_company_id_fkey` FOREIGN KEY (`brand_id`, `company_id`) REFERENCES `brands`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_purchase_unit_id_company_id_fkey` FOREIGN KEY (`purchase_unit_id`, `company_id`) REFERENCES `product_units`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_sale_unit_id_company_id_fkey` FOREIGN KEY (`sale_unit_id`, `company_id`) REFERENCES `product_units`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_company_id_fkey` FOREIGN KEY (`product_id`, `company_id`) REFERENCES `products`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warehouses` ADD CONSTRAINT `warehouses_branch_id_company_id_fkey` FOREIGN KEY (`branch_id`, `company_id`) REFERENCES `branches`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warehouses` ADD CONSTRAINT `warehouses_warehouse_category_id_company_id_fkey` FOREIGN KEY (`warehouse_category_id`, `company_id`) REFERENCES `warehouse_categories`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `locations` ADD CONSTRAINT `locations_warehouse_id_company_id_fkey` FOREIGN KEY (`warehouse_id`, `company_id`) REFERENCES `warehouses`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_contacts` ADD CONSTRAINT `supplier_contacts_supplier_id_company_id_fkey` FOREIGN KEY (`supplier_id`, `company_id`) REFERENCES `suppliers`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_requests` ADD CONSTRAINT `purchase_requests_branch_id_company_id_fkey` FOREIGN KEY (`branch_id`, `company_id`) REFERENCES `branches`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_requests` ADD CONSTRAINT `purchase_requests_warehouse_id_company_id_fkey` FOREIGN KEY (`warehouse_id`, `company_id`) REFERENCES `warehouses`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_requests` ADD CONSTRAINT `purchase_requests_requested_by_user_id_fkey` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_requests` ADD CONSTRAINT `purchase_requests_approved_by_user_id_fkey` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_requests` ADD CONSTRAINT `purchase_requests_rejected_by_user_id_fkey` FOREIGN KEY (`rejected_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_requests` ADD CONSTRAINT `purchase_requests_cancelled_by_user_id_fkey` FOREIGN KEY (`cancelled_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_requests` ADD CONSTRAINT `purchase_requests_consolidated_by_user_id_fkey` FOREIGN KEY (`consolidated_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_requests` ADD CONSTRAINT `purchase_requests_consolidated_into_id_company_id_fkey` FOREIGN KEY (`consolidated_into_id`, `company_id`) REFERENCES `purchase_requests`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_request_details` ADD CONSTRAINT `purchase_request_details_purchase_request_id_company_id_fkey` FOREIGN KEY (`purchase_request_id`, `company_id`) REFERENCES `purchase_requests`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_request_details` ADD CONSTRAINT `purchase_request_details_product_id_company_id_fkey` FOREIGN KEY (`product_id`, `company_id`) REFERENCES `products`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_request_details` ADD CONSTRAINT `purchase_request_details_product_unit_id_company_id_fkey` FOREIGN KEY (`product_unit_id`, `company_id`) REFERENCES `product_units`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_request_consolidation_details` ADD CONSTRAINT `purchase_request_consolidation_details_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_request_consolidation_details` ADD CONSTRAINT `purchase_request_consolidation_details_consolidated_request_fkey` FOREIGN KEY (`consolidated_request_detail_id`, `company_id`) REFERENCES `purchase_request_details`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_request_consolidation_details` ADD CONSTRAINT `purchase_request_consolidation_details_source_request_detai_fkey` FOREIGN KEY (`source_request_detail_id`, `company_id`) REFERENCES `purchase_request_details`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_request_supplier_segments` ADD CONSTRAINT `purchase_request_supplier_segments_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_request_supplier_segments` ADD CONSTRAINT `purchase_request_supplier_segments_purchase_request_id_comp_fkey` FOREIGN KEY (`purchase_request_id`, `company_id`) REFERENCES `purchase_requests`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_request_supplier_segments` ADD CONSTRAINT `purchase_request_supplier_segments_supplier_id_company_id_fkey` FOREIGN KEY (`supplier_id`, `company_id`) REFERENCES `suppliers`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_request_supplier_segments` ADD CONSTRAINT `purchase_request_supplier_segments_supplier_contact_id_comp_fkey` FOREIGN KEY (`supplier_contact_id`, `company_id`) REFERENCES `supplier_contacts`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_request_supplier_segments` ADD CONSTRAINT `purchase_request_supplier_segments_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_request_supplier_segments` ADD CONSTRAINT `purchase_request_supplier_segments_issued_by_user_id_fkey` FOREIGN KEY (`issued_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_request_supplier_segments` ADD CONSTRAINT `purchase_request_supplier_segments_cancelled_by_user_id_fkey` FOREIGN KEY (`cancelled_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_request_supplier_segment_details` ADD CONSTRAINT `purchase_request_supplier_segment_details_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_request_supplier_segment_details` ADD CONSTRAINT `purchase_request_supplier_segment_details_segment_id_compan_fkey` FOREIGN KEY (`segment_id`, `company_id`) REFERENCES `purchase_request_supplier_segments`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_request_supplier_segment_details` ADD CONSTRAINT `purchase_request_supplier_segment_details_purchase_request__fkey` FOREIGN KEY (`purchase_request_detail_id`, `company_id`) REFERENCES `purchase_request_details`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotations` ADD CONSTRAINT `purchase_quotations_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotations` ADD CONSTRAINT `purchase_quotations_supplier_id_company_id_fkey` FOREIGN KEY (`supplier_id`, `company_id`) REFERENCES `suppliers`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotations` ADD CONSTRAINT `purchase_quotations_supplier_contact_id_company_id_fkey` FOREIGN KEY (`supplier_contact_id`, `company_id`) REFERENCES `supplier_contacts`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotations` ADD CONSTRAINT `purchase_quotations_registered_by_user_id_fkey` FOREIGN KEY (`registered_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotations` ADD CONSTRAINT `purchase_quotations_cancelled_by_user_id_fkey` FOREIGN KEY (`cancelled_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotations` ADD CONSTRAINT `purchase_quotations_selected_by_user_id_fkey` FOREIGN KEY (`selected_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotations` ADD CONSTRAINT `purchase_quotations_rejected_by_user_id_fkey` FOREIGN KEY (`rejected_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotation_details` ADD CONSTRAINT `purchase_quotation_details_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotation_details` ADD CONSTRAINT `purchase_quotation_details_purchase_quotation_id_company_id_fkey` FOREIGN KEY (`purchase_quotation_id`, `company_id`) REFERENCES `purchase_quotations`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotation_details` ADD CONSTRAINT `purchase_quotation_details_product_id_company_id_fkey` FOREIGN KEY (`product_id`, `company_id`) REFERENCES `products`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotation_details` ADD CONSTRAINT `purchase_quotation_details_product_unit_id_company_id_fkey` FOREIGN KEY (`product_unit_id`, `company_id`) REFERENCES `product_units`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotation_requests` ADD CONSTRAINT `purchase_quotation_requests_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotation_requests` ADD CONSTRAINT `purchase_quotation_requests_purchase_quotation_id_company_i_fkey` FOREIGN KEY (`purchase_quotation_id`, `company_id`) REFERENCES `purchase_quotations`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotation_requests` ADD CONSTRAINT `purchase_quotation_requests_purchase_request_id_company_id_fkey` FOREIGN KEY (`purchase_request_id`, `company_id`) REFERENCES `purchase_requests`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotation_requests` ADD CONSTRAINT `purchase_quotation_requests_decided_by_user_id_fkey` FOREIGN KEY (`decided_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotation_request_details` ADD CONSTRAINT `purchase_quotation_request_details_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotation_request_details` ADD CONSTRAINT `purchase_quotation_request_details_purchase_quotation_reque_fkey` FOREIGN KEY (`purchase_quotation_request_id`, `company_id`) REFERENCES `purchase_quotation_requests`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotation_request_details` ADD CONSTRAINT `purchase_quotation_request_details_purchase_quotation_detai_fkey` FOREIGN KEY (`purchase_quotation_detail_id`, `company_id`) REFERENCES `purchase_quotation_details`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotation_request_details` ADD CONSTRAINT `purchase_quotation_request_details_purchase_request_detail__fkey` FOREIGN KEY (`purchase_request_detail_id`, `company_id`) REFERENCES `purchase_request_details`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotation_expenses` ADD CONSTRAINT `purchase_quotation_expenses_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotation_expenses` ADD CONSTRAINT `purchase_quotation_expenses_purchase_quotation_id_company_i_fkey` FOREIGN KEY (`purchase_quotation_id`, `company_id`) REFERENCES `purchase_quotations`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_quotation_expenses` ADD CONSTRAINT `purchase_quotation_expenses_expense_type_id_company_id_fkey` FOREIGN KEY (`expense_type_id`, `company_id`) REFERENCES `expense_types`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_supplier_id_company_id_fkey` FOREIGN KEY (`supplier_id`, `company_id`) REFERENCES `suppliers`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_supplier_contact_id_company_id_fkey` FOREIGN KEY (`supplier_contact_id`, `company_id`) REFERENCES `supplier_contacts`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_branch_id_company_id_fkey` FOREIGN KEY (`branch_id`, `company_id`) REFERENCES `branches`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_warehouse_id_company_id_fkey` FOREIGN KEY (`warehouse_id`, `company_id`) REFERENCES `warehouses`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_purchase_quotation_id_company_id_fkey` FOREIGN KEY (`purchase_quotation_id`, `company_id`) REFERENCES `purchase_quotations`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_approved_by_user_id_fkey` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_sent_by_user_id_fkey` FOREIGN KEY (`sent_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_cancelled_by_user_id_fkey` FOREIGN KEY (`cancelled_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_details` ADD CONSTRAINT `purchase_order_details_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_details` ADD CONSTRAINT `purchase_order_details_purchase_order_id_company_id_fkey` FOREIGN KEY (`purchase_order_id`, `company_id`) REFERENCES `purchase_orders`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_details` ADD CONSTRAINT `purchase_order_details_purchase_quotation_request_detail_id_fkey` FOREIGN KEY (`purchase_quotation_request_detail_id`, `company_id`) REFERENCES `purchase_quotation_request_details`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_details` ADD CONSTRAINT `purchase_order_details_product_id_company_id_fkey` FOREIGN KEY (`product_id`, `company_id`) REFERENCES `products`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_details` ADD CONSTRAINT `purchase_order_details_product_unit_id_company_id_fkey` FOREIGN KEY (`product_unit_id`, `company_id`) REFERENCES `product_units`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_purchase_order_id_company_id_fkey` FOREIGN KEY (`purchase_order_id`, `company_id`) REFERENCES `purchase_orders`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_supplier_id_company_id_fkey` FOREIGN KEY (`supplier_id`, `company_id`) REFERENCES `suppliers`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_branch_id_company_id_fkey` FOREIGN KEY (`branch_id`, `company_id`) REFERENCES `branches`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_warehouse_id_company_id_fkey` FOREIGN KEY (`warehouse_id`, `company_id`) REFERENCES `warehouses`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_received_by_user_id_fkey` FOREIGN KEY (`received_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_verified_by_user_id_fkey` FOREIGN KEY (`verified_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_cancelled_by_user_id_fkey` FOREIGN KEY (`cancelled_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_details` ADD CONSTRAINT `purchase_details_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_details` ADD CONSTRAINT `purchase_details_purchase_id_company_id_fkey` FOREIGN KEY (`purchase_id`, `company_id`) REFERENCES `purchases`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_details` ADD CONSTRAINT `purchase_details_purchase_order_detail_id_company_id_fkey` FOREIGN KEY (`purchase_order_detail_id`, `company_id`) REFERENCES `purchase_order_details`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_details` ADD CONSTRAINT `purchase_details_product_id_company_id_fkey` FOREIGN KEY (`product_id`, `company_id`) REFERENCES `products`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_details` ADD CONSTRAINT `purchase_details_product_unit_id_company_id_fkey` FOREIGN KEY (`product_unit_id`, `company_id`) REFERENCES `product_units`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceos` ADD CONSTRAINT `retaceos_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceos` ADD CONSTRAINT `retaceos_purchase_id_company_id_fkey` FOREIGN KEY (`purchase_id`, `company_id`) REFERENCES `purchases`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceos` ADD CONSTRAINT `retaceos_supplier_id_company_id_fkey` FOREIGN KEY (`supplier_id`, `company_id`) REFERENCES `suppliers`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceos` ADD CONSTRAINT `retaceos_origin_country_id_fkey` FOREIGN KEY (`origin_country_id`) REFERENCES `countries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceos` ADD CONSTRAINT `retaceos_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceos` ADD CONSTRAINT `retaceos_calculated_by_user_id_fkey` FOREIGN KEY (`calculated_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceos` ADD CONSTRAINT `retaceos_verified_by_user_id_fkey` FOREIGN KEY (`verified_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceos` ADD CONSTRAINT `retaceos_closed_by_user_id_fkey` FOREIGN KEY (`closed_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceos` ADD CONSTRAINT `retaceos_cancelled_by_user_id_fkey` FOREIGN KEY (`cancelled_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceo_details` ADD CONSTRAINT `retaceo_details_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceo_details` ADD CONSTRAINT `retaceo_details_retaceo_id_company_id_fkey` FOREIGN KEY (`retaceo_id`, `company_id`) REFERENCES `retaceos`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceo_details` ADD CONSTRAINT `retaceo_details_purchase_detail_id_company_id_fkey` FOREIGN KEY (`purchase_detail_id`, `company_id`) REFERENCES `purchase_details`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceo_details` ADD CONSTRAINT `retaceo_details_product_id_company_id_fkey` FOREIGN KEY (`product_id`, `company_id`) REFERENCES `products`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceo_details` ADD CONSTRAINT `retaceo_details_product_unit_id_company_id_fkey` FOREIGN KEY (`product_unit_id`, `company_id`) REFERENCES `product_units`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceo_costs` ADD CONSTRAINT `retaceo_costs_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceo_costs` ADD CONSTRAINT `retaceo_costs_retaceo_id_company_id_fkey` FOREIGN KEY (`retaceo_id`, `company_id`) REFERENCES `retaceos`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceo_costs` ADD CONSTRAINT `retaceo_costs_expense_type_id_company_id_fkey` FOREIGN KEY (`expense_type_id`, `company_id`) REFERENCES `expense_types`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceo_costs` ADD CONSTRAINT `retaceo_costs_purchase_order_expense_id_company_id_fkey` FOREIGN KEY (`purchase_order_expense_id`, `company_id`) REFERENCES `purchase_order_expenses`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceo_costs` ADD CONSTRAINT `retaceo_costs_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceo_allocations` ADD CONSTRAINT `retaceo_allocations_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceo_allocations` ADD CONSTRAINT `retaceo_allocations_retaceo_cost_id_company_id_fkey` FOREIGN KEY (`retaceo_cost_id`, `company_id`) REFERENCES `retaceo_costs`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retaceo_allocations` ADD CONSTRAINT `retaceo_allocations_retaceo_detail_id_company_id_fkey` FOREIGN KEY (`retaceo_detail_id`, `company_id`) REFERENCES `retaceo_details`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_lots` ADD CONSTRAINT `inventory_lots_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_lots` ADD CONSTRAINT `inventory_lots_product_id_company_id_fkey` FOREIGN KEY (`product_id`, `company_id`) REFERENCES `products`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_lots` ADD CONSTRAINT `inventory_lots_purchase_detail_id_company_id_fkey` FOREIGN KEY (`purchase_detail_id`, `company_id`) REFERENCES `purchase_details`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_lots` ADD CONSTRAINT `inventory_lots_received_unit_id_company_id_fkey` FOREIGN KEY (`received_unit_id`, `company_id`) REFERENCES `product_units`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_lots` ADD CONSTRAINT `inventory_lots_stock_unit_id_company_id_fkey` FOREIGN KEY (`stock_unit_id`, `company_id`) REFERENCES `product_units`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_lots` ADD CONSTRAINT `inventory_lots_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_location_details` ADD CONSTRAINT `inventory_location_details_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_location_details` ADD CONSTRAINT `inventory_location_details_inventory_lot_id_company_id_fkey` FOREIGN KEY (`inventory_lot_id`, `company_id`) REFERENCES `inventory_lots`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_location_details` ADD CONSTRAINT `inventory_location_details_location_id_company_id_fkey` FOREIGN KEY (`location_id`, `company_id`) REFERENCES `locations`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_product_id_company_id_fkey` FOREIGN KEY (`product_id`, `company_id`) REFERENCES `products`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_inventory_lot_id_company_id_fkey` FOREIGN KEY (`inventory_lot_id`, `company_id`) REFERENCES `inventory_lots`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_warehouse_id_company_id_fkey` FOREIGN KEY (`warehouse_id`, `company_id`) REFERENCES `warehouses`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_location_id_company_id_fkey` FOREIGN KEY (`location_id`, `company_id`) REFERENCES `locations`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_confirmed_by_user_id_fkey` FOREIGN KEY (`confirmed_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_reversal_of_movement_id_fkey` FOREIGN KEY (`reversal_of_movement_id`) REFERENCES `inventory_movements`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_cost_averages` ADD CONSTRAINT `inventory_cost_averages_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_cost_averages` ADD CONSTRAINT `inventory_cost_averages_product_id_company_id_fkey` FOREIGN KEY (`product_id`, `company_id`) REFERENCES `products`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_label_prints` ADD CONSTRAINT `inventory_label_prints_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_label_prints` ADD CONSTRAINT `inventory_label_prints_inventory_lot_id_company_id_fkey` FOREIGN KEY (`inventory_lot_id`, `company_id`) REFERENCES `inventory_lots`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_label_prints` ADD CONSTRAINT `inventory_label_prints_printed_by_user_id_fkey` FOREIGN KEY (`printed_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transfers` ADD CONSTRAINT `inventory_transfers_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transfers` ADD CONSTRAINT `inventory_transfers_source_warehouse_id_company_id_fkey` FOREIGN KEY (`source_warehouse_id`, `company_id`) REFERENCES `warehouses`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transfers` ADD CONSTRAINT `inventory_transfers_destination_warehouse_id_company_id_fkey` FOREIGN KEY (`destination_warehouse_id`, `company_id`) REFERENCES `warehouses`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transfers` ADD CONSTRAINT `inventory_transfers_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transfers` ADD CONSTRAINT `inventory_transfers_dispatched_by_user_id_fkey` FOREIGN KEY (`dispatched_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transfers` ADD CONSTRAINT `inventory_transfers_received_by_user_id_fkey` FOREIGN KEY (`received_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transfers` ADD CONSTRAINT `inventory_transfers_cancelled_by_user_id_fkey` FOREIGN KEY (`cancelled_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transfer_details` ADD CONSTRAINT `inventory_transfer_details_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transfer_details` ADD CONSTRAINT `inventory_transfer_details_inventory_transfer_id_company_id_fkey` FOREIGN KEY (`inventory_transfer_id`, `company_id`) REFERENCES `inventory_transfers`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transfer_details` ADD CONSTRAINT `inventory_transfer_details_inventory_lot_id_company_id_fkey` FOREIGN KEY (`inventory_lot_id`, `company_id`) REFERENCES `inventory_lots`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transfer_details` ADD CONSTRAINT `inventory_transfer_details_source_location_id_company_id_fkey` FOREIGN KEY (`source_location_id`, `company_id`) REFERENCES `locations`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transfer_details` ADD CONSTRAINT `inventory_transfer_details_destination_location_id_company__fkey` FOREIGN KEY (`destination_location_id`, `company_id`) REFERENCES `locations`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_expenses` ADD CONSTRAINT `purchase_order_expenses_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_expenses` ADD CONSTRAINT `purchase_order_expenses_purchase_order_id_company_id_fkey` FOREIGN KEY (`purchase_order_id`, `company_id`) REFERENCES `purchase_orders`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_expenses` ADD CONSTRAINT `purchase_order_expenses_expense_type_id_company_id_fkey` FOREIGN KEY (`expense_type_id`, `company_id`) REFERENCES `expense_types`(`id`, `company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_expense_documents` ADD CONSTRAINT `purchase_order_expense_documents_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_expense_documents` ADD CONSTRAINT `purchase_order_expense_documents_purchase_order_expense_id__fkey` FOREIGN KEY (`purchase_order_expense_id`, `company_id`) REFERENCES `purchase_order_expenses`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_expense_documents` ADD CONSTRAINT `purchase_order_expense_documents_uploaded_by_user_id_fkey` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_invitation_roles` ADD CONSTRAINT `company_invitation_roles_invitation_id_company_id_fkey` FOREIGN KEY (`invitation_id`, `company_id`) REFERENCES `company_invitations`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_invitation_roles` ADD CONSTRAINT `company_invitation_roles_role_id_company_id_fkey` FOREIGN KEY (`role_id`, `company_id`) REFERENCES `company_roles`(`id`, `company_id`) ON DELETE CASCADE ON UPDATE CASCADE;
