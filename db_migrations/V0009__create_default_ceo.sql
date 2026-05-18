-- Создаём первого Ген.Директора. Пароль будет захэширован при первом логине,
-- сейчас сохраняем "плейсхолдер" - бэкенд при первом запуске сам поправит хэш.
-- (логин: ceo, временный пароль: 250606)
INSERT INTO erp_employees (login, password_hash, full_name, role_id, email, is_active)
SELECT 'ceo',
       'plain:250606',  -- временный формат, бэкенд распознает и перехэширует
       'Генеральный директор',
       r.id, '', TRUE
FROM erp_roles r WHERE r.slug='ceo'
ON CONFLICT (login) DO NOTHING;