INSERT INTO `permissions` (`code`, `resource`, `action`, `description`, `scope`, `created_at`) VALUES
  ('files.read', 'files', 'read', 'Create temporary read URLs for company files.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('files.create', 'files', 'create', 'Prepare direct uploads for company files.', 'COMPANY', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`), `scope` = 'COMPANY';

INSERT IGNORE INTO `company_role_permissions` (`role_id`, `permission_id`, `company_id`, `assigned_by_user_id`, `assigned_at`)
SELECT cr.`id`, p.`id`, cr.`company_id`, NULL, CURRENT_TIMESTAMP(3)
FROM `company_roles` cr CROSS JOIN `permissions` p
WHERE (cr.`code` IN ('OWNER', 'ADMIN') AND p.`code` IN ('files.read', 'files.create'))
   OR (cr.`code` IN ('OPERATOR', 'READ_ONLY') AND p.`code` = 'files.read');
