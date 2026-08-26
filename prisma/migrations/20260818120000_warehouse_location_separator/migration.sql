ALTER TABLE `warehouses`
  ADD COLUMN `location_separator` VARCHAR(3) NOT NULL DEFAULT '/';

ALTER TABLE `warehouses`
  ADD CONSTRAINT `warehouses_location_separator_check`
  CHECK (`location_separator` IN ('/', '-', '.', '|', '·'));
