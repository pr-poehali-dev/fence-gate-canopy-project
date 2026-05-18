-- Новые настройки: уведомления клиенту в MAX + email-дублирование менеджеру
INSERT INTO site_settings (key, value) VALUES
  ('notify_client_via_max',  'true'),
  ('client_notify_text',     'СтальГрупп: ваша заявка №{order_num} принята! Менеджер свяжется в течение 10 минут. Срочно: {company_phone}'),
  ('notify_email_enabled',   'false'),
  ('notify_email_to',        ''),
  ('smtp_host',              'smtp.yandex.ru'),
  ('smtp_port',              '465'),
  ('smtp_user',              ''),
  ('smtp_password',          ''),
  ('smtp_from_name',         'СтальГрупп — заявки с сайта'),
  ('company_phone',          '8 800 123-45-67'),
  ('company_email',          'info@stalgrupp.ru'),
  ('company_name',           'СтальГрупп'),
  ('manager_max_chat_id',    '')
ON CONFLICT (key) DO NOTHING;