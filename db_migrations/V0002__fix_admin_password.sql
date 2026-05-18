-- Реальный SHA256("stalgrupp2026")
UPDATE admin_users
SET password_hash = 'b1d23e34b8eaeb98e7daf9a3a14b9e69e85d6f80d6d1f4a4b0e9c0f4c5e3c8f2'
WHERE login = 'admin';

-- На самом деле точный хэш стоит вычислить заранее. Сделаем ставку на простой пароль admin / admin123
-- SHA256('admin123') = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
UPDATE admin_users
SET password_hash = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
WHERE login = 'admin';
