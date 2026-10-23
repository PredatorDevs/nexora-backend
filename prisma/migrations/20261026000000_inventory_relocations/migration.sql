INSERT INTO `permissions` (`code`,`resource`,`action`,`description`,`scope`,`created_at`)
VALUES ('inventory.relocations_create','inventory','relocations_create','Reubicar existencias dentro de un almacén.','COMPANY',CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `resource` = VALUES(`resource`),
  `action` = VALUES(`action`),
  `description` = VALUES(`description`),
  `scope` = VALUES(`scope`);

INSERT IGNORE INTO `company_role_permissions` (`role_id`,`permission_id`,`company_id`)
SELECT `cr`.`id`, `p`.`id`, `cr`.`company_id`
FROM `company_roles` AS `cr`
INNER JOIN `permissions` AS `p` ON `p`.`code` = 'inventory.relocations_create'
WHERE `cr`.`code` IN ('OWNER','ADMIN','OPERATOR');
