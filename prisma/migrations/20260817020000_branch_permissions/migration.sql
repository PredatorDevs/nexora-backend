INSERT INTO `permissions`
  (`code`, `resource`, `action`, `description`, `scope`, `created_at`)
VALUES
  ('branches.read', 'branches', 'read', 'View company branches.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('branches.create', 'branches', 'create', 'Create company branches.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('branches.update', 'branches', 'update', 'Update company branches.', 'COMPANY', CURRENT_TIMESTAMP(3)),
  ('branches.change_status', 'branches', 'change_status', 'Change company branch status.', 'COMPANY', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `description` = VALUES(`description`),
  `scope` = 'COMPANY';
