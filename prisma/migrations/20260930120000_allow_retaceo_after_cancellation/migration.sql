-- Preserve cancelled retaceos as history while allowing the purchase to be
-- processed again. Application transactions enforce at most one active
-- retaceo per purchase.
-- MySQL requires a supporting index for the composite purchase foreign key.
-- Create its non-unique replacement before dropping the original unique one.
ALTER TABLE `retaceos`
  ADD INDEX `retaceos_purchase_company_idx` (`purchase_id`, `company_id`);

ALTER TABLE `retaceos`
  DROP INDEX `retaceos_company_purchase_key`;

ALTER TABLE `retaceos`
  ADD INDEX `retaceos_company_purchase_status_idx` (`company_id`, `purchase_id`, `status`);
