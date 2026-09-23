UPDATE `purchase_requests` AS `pr`
SET
  `status` = 'COMPLETED',
  `updated_at` = CURRENT_TIMESTAMP(3)
WHERE `pr`.`status` = 'IN_QUOTATION'
  AND EXISTS (
    SELECT 1
    FROM `purchase_quotation_requests` AS `pqr`
    INNER JOIN `purchase_quotation_request_details` AS `pqrd`
      ON `pqrd`.`purchase_quotation_request_id` = `pqr`.`id`
      AND `pqrd`.`company_id` = `pqr`.`company_id`
    WHERE `pqr`.`purchase_request_id` = `pr`.`id`
      AND `pqr`.`company_id` = `pr`.`company_id`
      AND `pqrd`.`awarded_quantity` > 0
  )
  AND NOT EXISTS (
    SELECT 1
    FROM `purchase_quotation_requests` AS `pqr`
    INNER JOIN `purchase_quotation_request_details` AS `pqrd`
      ON `pqrd`.`purchase_quotation_request_id` = `pqr`.`id`
      AND `pqrd`.`company_id` = `pqr`.`company_id`
    LEFT JOIN `purchase_order_details` AS `pod`
      ON `pod`.`purchase_quotation_request_detail_id` = `pqrd`.`id`
      AND `pod`.`company_id` = `pqrd`.`company_id`
    WHERE `pqr`.`purchase_request_id` = `pr`.`id`
      AND `pqr`.`company_id` = `pr`.`company_id`
      AND `pqrd`.`awarded_quantity` > 0
      AND `pod`.`id` IS NULL
  );
