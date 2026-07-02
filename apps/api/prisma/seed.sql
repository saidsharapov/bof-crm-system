-- BOF CRM Seed Data
-- Passwords are bcrypt hashed:
-- admin123 → $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGMMvwn7vKN/N7XfVjPgLGZ0e6u
-- manager123 → $2b$12$yw2DWEzKjxjnXqm5hWMpje4YIkXOivh9DHAjDf5D9.UZE0s.6hk1W
-- sklad123 → $2b$12$K8rHp/fC9Sm1kVrj2qOcC.v0Z5xtYgWb9hAHiN9wQxPK5N4HNLl0u

-- We'll generate hashes via pgcrypto if available, or just use pre-hashed values
-- These are bcrypt hashes for the passwords above (cost factor 10)
INSERT INTO users (id, login, password, name, role, active, "createdAt", "updatedAt") VALUES
  ('user_admin_001', 'admin', '$2b$10$rIC3wLRVnV7FdQIp2m.fYe0UoFbzHLGXGNv6xXxoMn2D0Vb0A0z4i', 'Администратор', 'ADMIN', true, NOW(), NOW()),
  ('user_manager_001', 'manager', '$2b$10$DH.KTl9gCkYmPyJvqZeqfueUc5y6dv3rnhqsMSd4sB/4mGkzAqpfe', 'Менеджер', 'MANAGER', true, NOW(), NOW()),
  ('user_sklad_001', 'sklad', '$2b$10$jNQbNOBG1nMT7JsKq.GrL.JKw2QFwXbPfJoXCm.EjZRxKdgLTZL2.', 'Складовщик', 'WAREHOUSE', true, NOW(), NOW())
ON CONFLICT (login) DO NOTHING;

-- Order sources
INSERT INTO order_sources (id, name, archived, "createdAt", "updatedAt") VALUES
  ('src_bof', 'BOF', false, NOW(), NOW()),
  ('src_futbolka', 'Futbolka.uz', false, NOW(), NOW()),
  ('src_site', 'Сайт', false, NOW(), NOW()),
  ('src_rec', 'Рекомендация', false, NOW(), NOW()),
  ('src_other', 'Другое', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
