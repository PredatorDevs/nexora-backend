-- Platform roles must never retain company-scoped permissions.
DELETE rp
FROM `role_permissions` rp
JOIN `permissions` p ON p.`id` = rp.`permission_id`
WHERE p.`scope` = 'COMPANY';

-- Repair the grants omitted by the original Products migration.
INSERT IGNORE INTO `company_role_permissions`
  (`role_id`, `permission_id`, `company_id`, `assigned_by_user_id`, `assigned_at`)
SELECT cr.`id`, p.`id`, cr.`company_id`, NULL, CURRENT_TIMESTAMP(3)
FROM `company_roles` cr CROSS JOIN `permissions` p
WHERE (cr.`code` IN ('OWNER', 'ADMIN') AND p.`code` IN
  ('products.read', 'products.create', 'products.update', 'products.change_status'))
   OR (cr.`code` IN ('OPERATOR', 'READ_ONLY') AND p.`code` = 'products.read');

-- Repair the grants omitted by the original Product Images migration.
INSERT IGNORE INTO `company_role_permissions`
  (`role_id`, `permission_id`, `company_id`, `assigned_by_user_id`, `assigned_at`)
SELECT cr.`id`, p.`id`, cr.`company_id`, NULL, CURRENT_TIMESTAMP(3)
FROM `company_roles` cr CROSS JOIN `permissions` p
WHERE (cr.`code` IN ('OWNER', 'ADMIN') AND p.`code` IN
  ('product_images.read', 'product_images.create', 'product_images.update', 'product_images.delete'))
   OR (cr.`code` IN ('OPERATOR', 'READ_ONLY') AND p.`code` = 'product_images.read');
