-- Настройки CRM webhook
INSERT INTO site_settings (key, value) VALUES
  ('crm_webhook_enabled', 'false'),
  ('crm_webhook_url',     ''),
  ('crm_webhook_type',    'generic'),
  ('crm_webhook_secret',  '')
ON CONFLICT (key) DO NOTHING;

-- ============ ERP ============

-- Роли сотрудников
CREATE TABLE IF NOT EXISTS erp_roles (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(40) UNIQUE NOT NULL,
  title       VARCHAR(100) NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_owner    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO erp_roles (slug, title, is_owner, permissions) VALUES
  ('ceo',         'Генеральный директор',   TRUE,  '{"all":true}'),
  ('production',  'Начальник производства', FALSE, '{"leads_view":true,"leads_assign":true,"production":true}'),
  ('manager',     'Менеджер',               FALSE, '{"leads_view":true,"leads_edit":true}'),
  ('surveyor',    'Замерщик',               FALSE, '{"leads_view":true,"leads_my":true}'),
  ('installer',   'Монтажник',              FALSE, '{"leads_view":true,"leads_my":true}'),
  ('accountant',  'Бухгалтер',              FALSE, '{"leads_view":true,"finance":true}')
ON CONFLICT (slug) DO NOTHING;

-- Сотрудники
CREATE TABLE IF NOT EXISTS erp_employees (
  id            SERIAL PRIMARY KEY,
  login         VARCHAR(60)  UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(200) NOT NULL,
  role_id       INTEGER,
  email         VARCHAR(200) DEFAULT '',
  phone         VARCHAR(30)  DEFAULT '',
  avatar_url    TEXT         DEFAULT '',
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  notes         TEXT         DEFAULT '',
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  created_by    INTEGER
);

-- Сессии ERP-пользователей
CREATE TABLE IF NOT EXISTS erp_sessions (
  token       VARCHAR(64) PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_erp_sessions_emp ON erp_sessions(employee_id);

-- Воронки продаж
CREATE TABLE IF NOT EXISTS erp_funnels (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(40) UNIQUE NOT NULL,
  title       VARCHAR(100) NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  position    INTEGER NOT NULL DEFAULT 0
);

-- Этапы воронки (статусы)
CREATE TABLE IF NOT EXISTS erp_stages (
  id          SERIAL PRIMARY KEY,
  funnel_id   INTEGER NOT NULL,
  slug        VARCHAR(40) NOT NULL,
  title       VARCHAR(100) NOT NULL,
  color       VARCHAR(20)  NOT NULL DEFAULT '#6b7280',
  position    INTEGER NOT NULL DEFAULT 0,
  is_won      BOOLEAN NOT NULL DEFAULT FALSE,
  is_lost     BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (funnel_id, slug)
);

-- Базовая воронка "Продажи"
INSERT INTO erp_funnels (slug, title, is_default, position) VALUES
  ('sales', 'Продажи', TRUE, 0)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO erp_stages (funnel_id, slug, title, color, position, is_won, is_lost)
SELECT f.id, s.slug, s.title, s.color, s.position, s.is_won, s.is_lost
FROM erp_funnels f, (VALUES
  ('new',         'Новая заявка',     '#3b82f6', 0, FALSE, FALSE),
  ('contacted',   'Связались',        '#8b5cf6', 1, FALSE, FALSE),
  ('measure',     'Замер назначен',   '#06b6d4', 2, FALSE, FALSE),
  ('quote',       'КП отправлено',    '#f59e0b', 3, FALSE, FALSE),
  ('contract',    'Договор',          '#ec4899', 4, FALSE, FALSE),
  ('production',  'Производство',     '#10b981', 5, FALSE, FALSE),
  ('installation','Монтаж',           '#84cc16', 6, FALSE, FALSE),
  ('won',         'Успешно закрыта',  '#22c55e', 7, TRUE,  FALSE),
  ('losts',       'Отказ',            '#ef4444', 8, FALSE, TRUE)
) AS s(slug, title, color, position, is_won, is_lost)
WHERE f.slug='sales'
ON CONFLICT (funnel_id, slug) DO NOTHING;

-- Привязка заявок к сотрудникам и стадиям
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS funnel_id   INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage_id    INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS erp_notes   TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP DEFAULT NOW();

-- История изменений заявки
CREATE TABLE IF NOT EXISTS erp_lead_events (
  id          SERIAL PRIMARY KEY,
  lead_id     INTEGER NOT NULL,
  employee_id INTEGER,
  event_type  VARCHAR(40) NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_erp_events_lead ON erp_lead_events(lead_id);

-- Привязываем существующие заявки к стадии "Новая"
UPDATE leads SET
  funnel_id = (SELECT id FROM erp_funnels WHERE slug='sales' LIMIT 1),
  stage_id  = (SELECT s.id FROM erp_stages s JOIN erp_funnels f ON f.id=s.funnel_id WHERE f.slug='sales' AND s.slug='new' LIMIT 1)
WHERE funnel_id IS NULL;