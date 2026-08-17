ALTER TABLE `companies`
  MODIFY `department_id` INTEGER UNSIGNED NULL,
  MODIFY `municipality_id` INTEGER UNSIGNED NULL,
  MODIFY `district_id` INTEGER UNSIGNED NULL,
  ADD COLUMN `foreign_administrative_area` VARCHAR(191) NULL,
  ADD COLUMN `foreign_locality` VARCHAR(191) NULL;

ALTER TABLE `branches`
  MODIFY `department_id` INTEGER UNSIGNED NULL,
  MODIFY `municipality_id` INTEGER UNSIGNED NULL,
  MODIFY `district_id` INTEGER UNSIGNED NULL,
  ADD COLUMN `foreign_administrative_area` VARCHAR(191) NULL,
  ADD COLUMN `foreign_locality` VARCHAR(191) NULL;
