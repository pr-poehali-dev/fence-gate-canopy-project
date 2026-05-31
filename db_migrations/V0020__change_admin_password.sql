-- Смена пароля администратора liha9953 на baltag1995
-- Пароль хранится как SHA-256 хэш (см. backend/auth/index.py)
UPDATE admin_users
SET password_hash = encode(sha256('baltag1995'::bytea), 'hex')
WHERE login = 'liha9953';
