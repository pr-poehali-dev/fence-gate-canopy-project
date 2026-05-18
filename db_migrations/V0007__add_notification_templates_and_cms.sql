-- Новые настройки уведомлений + CMS
INSERT INTO site_settings (key, value) VALUES
  -- Тогглы каналов
  ('notify_manager_max',     'true'),
  ('notify_manager_email',   'true'),
  ('notify_client_email',    'true'),
  ('notify_client_sms',      'false'),
  -- Несколько email менеджеров через запятую
  ('manager_emails',         ''),
  -- Шаблон письма клиенту (HTML), переменные: {order_num} {name} {phone} {city} {object_type} {company_name} {company_phone} {company_email}
  ('client_email_subject',   'Ваша заявка №{order_num} принята — {company_name}'),
  ('client_email_html',      '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><div style="background:#f97316;color:#fff;padding:20px;border-radius:8px 8px 0 0"><h2 style="margin:0">Спасибо за заявку!</h2></div><div style="border:1px solid #eee;border-top:0;padding:24px;border-radius:0 0 8px 8px"><p>Здравствуйте, <b>{name}</b>!</p><p>Ваша заявка <b style="color:#f97316">№{order_num}</b> успешно принята.</p><p>Менеджер свяжется с вами в течение 15 минут по телефону <b>{phone}</b>.</p><p>Если у вас есть срочные вопросы — звоните: <a href="tel:{company_phone}" style="color:#f97316">{company_phone}</a></p><hr style="border:0;border-top:1px solid #eee;margin:24px 0"><p style="color:#888;font-size:12px">С уважением,<br>команда {company_name}<br>{company_email}</p></div></div>'),
  -- Шаблон письма менеджеру (HTML)
  ('manager_email_subject',  '[Заявка №{order_num}] {object_type}'),
  -- Шаблон сообщения в MAX менеджеру (markdown)
  ('manager_max_template',   '🔔 *НОВАЯ ЗАЯВКА — {company_name}*\n────────────────\n📋 № заказа: `{order_num}`\n👤 Имя: *{name}*\n📱 Телефон: *{phone}*\n📍 Город: {city}\n🏠 Адрес: {address}\n🔧 Тип: {object_type}\n💰 Сумма: *{total} ₽*\n────────────────'),
  -- Шаблон SMS клиенту
  ('client_sms_template',    '{company_name}: заявка №{order_num} принята. Менеджер свяжется в 15 мин. Срочно? {company_phone}')
ON CONFLICT (key) DO NOTHING;

-- Таблица CMS блоков контента (тексты, картинки, любые поля страниц)
CREATE TABLE IF NOT EXISTS site_content (
  id           SERIAL PRIMARY KEY,
  page_slug    VARCHAR(80)  NOT NULL,    -- например 'home', 'services/profnastil'
  block_key    VARCHAR(120) NOT NULL,    -- например 'hero_title', 'hero_image'
  block_type   VARCHAR(20)  NOT NULL DEFAULT 'text',  -- text | html | image | url
  value        TEXT         NOT NULL DEFAULT '',
  updated_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  UNIQUE (page_slug, block_key)
);
CREATE INDEX IF NOT EXISTS idx_site_content_page ON site_content(page_slug);

-- Расширяем leads: email клиента и трекинг доставки
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_email VARCHAR(200) DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_email_sent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_sms_sent  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS manager_email_sent BOOLEAN NOT NULL DEFAULT FALSE;