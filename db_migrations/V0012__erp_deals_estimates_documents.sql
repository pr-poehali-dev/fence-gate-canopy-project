-- ERP: Deals (сделки), Estimates (сметы), Documents (документы)
-- Расширение существующей структуры lead -> deal -> estimate -> documents

CREATE TABLE IF NOT EXISTS erp_deals (
  id              SERIAL PRIMARY KEY,
  deal_num        VARCHAR(32) NOT NULL UNIQUE,
  lead_id         INTEGER,
  client_name     VARCHAR(255) NOT NULL,
  client_phone    VARCHAR(64),
  client_email    VARCHAR(255),
  client_address  VARCHAR(512),
  city            VARCHAR(128),
  service_type    VARCHAR(64) NOT NULL,
  status          VARCHAR(40) NOT NULL DEFAULT 'new',
  total_rub       NUMERIC(12,2) DEFAULT 0,
  prepay_rub      NUMERIC(12,2) DEFAULT 0,
  paid_rub        NUMERIC(12,2) DEFAULT 0,
  cost_rub        NUMERIC(12,2) DEFAULT 0,
  margin_rub      NUMERIC(12,2) DEFAULT 0,
  assigned_to     INTEGER,
  surveyor_id     INTEGER,
  installer_id    INTEGER,
  start_date      DATE,
  install_date    DATE,
  finish_date     DATE,
  notes           TEXT DEFAULT '',
  meta            JSONB DEFAULT '{}',
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_deals_lead     ON erp_deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_erp_deals_status   ON erp_deals(status);
CREATE INDEX IF NOT EXISTS idx_erp_deals_assigned ON erp_deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_erp_deals_created  ON erp_deals(created_at DESC);

CREATE TABLE IF NOT EXISTS erp_estimates (
  id            SERIAL PRIMARY KEY,
  deal_id       INTEGER,
  version       INTEGER NOT NULL DEFAULT 1,
  title         VARCHAR(255) DEFAULT '',
  service_type  VARCHAR(64) NOT NULL,
  params        JSONB NOT NULL DEFAULT '{}',
  items         JSONB NOT NULL DEFAULT '[]',
  totals        JSONB NOT NULL DEFAULT '{}',
  total_rub     NUMERIC(12,2) DEFAULT 0,
  cost_rub      NUMERIC(12,2) DEFAULT 0,
  margin_pct    NUMERIC(5,2) DEFAULT 25,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    INTEGER,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_estimates_deal   ON erp_estimates(deal_id);
CREATE INDEX IF NOT EXISTS idx_erp_estimates_active ON erp_estimates(deal_id, is_active);

CREATE TABLE IF NOT EXISTS erp_documents (
  id           SERIAL PRIMARY KEY,
  deal_id      INTEGER,
  estimate_id  INTEGER,
  doc_type     VARCHAR(40) NOT NULL,
  doc_num      VARCHAR(64) NOT NULL,
  title        VARCHAR(255),
  status       VARCHAR(40) NOT NULL DEFAULT 'draft',
  content      JSONB NOT NULL DEFAULT '{}',
  pdf_url      TEXT DEFAULT '',
  signed_at    TIMESTAMP,
  signed_by    VARCHAR(255),
  created_by   INTEGER,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_documents_deal   ON erp_documents(deal_id);
CREATE INDEX IF NOT EXISTS idx_erp_documents_type   ON erp_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_erp_documents_status ON erp_documents(status);

CREATE TABLE IF NOT EXISTS erp_materials (
  id           SERIAL PRIMARY KEY,
  sku          VARCHAR(64) UNIQUE NOT NULL,
  name         VARCHAR(255) NOT NULL,
  category     VARCHAR(64) NOT NULL,
  unit         VARCHAR(16) NOT NULL DEFAULT 'шт',
  price_buy    NUMERIC(10,2) DEFAULT 0,
  price_sell   NUMERIC(10,2) DEFAULT 0,
  meta         JSONB DEFAULT '{}',
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_materials_cat ON erp_materials(category);

CREATE TABLE IF NOT EXISTS erp_deal_events (
  id          SERIAL PRIMARY KEY,
  deal_id     INTEGER NOT NULL,
  employee_id INTEGER,
  event_type  VARCHAR(40) NOT NULL,
  payload     JSONB DEFAULT '{}',
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_deal_events_deal ON erp_deal_events(deal_id, created_at DESC);

INSERT INTO erp_materials (sku, name, category, unit, price_buy, price_sell, meta) VALUES
  ('PROF-C8-05',   'Профлист С8 0.5 мм RAL',    'proflist', 'м²', 480.0,  650.0,  '{"thickness":0.5,"profile":"C8"}'),
  ('PROF-C20-05',  'Профлист С20 0.5 мм RAL',   'proflist', 'м²', 510.0,  690.0,  '{"thickness":0.5,"profile":"C20"}'),
  ('PIPE-60-60-2', 'Профтруба 60x60x2 мм',       'pipe',     'м',  220.0,  290.0,  '{}'),
  ('PIPE-60-60-3', 'Профтруба 60x60x3 мм',       'pipe',     'м',  290.0,  380.0,  '{}'),
  ('PIPE-40-20-2', 'Профтруба 40x20x2 мм',       'pipe',     'м',  95.0,   135.0,  '{}'),
  ('PIPE-80-80-3', 'Профтруба 80x80x3 мм',       'pipe',     'м',  430.0,  580.0,  '{}'),
  ('SCREW-48-35',  'Саморез 4.8x35 с EPDM',      'fastener', 'шт', 3.5,    6.0,    '{}'),
  ('RIVET-48-19',  'Заклёпка 4.8x19 RAL',        'fastener', 'шт', 4.0,    8.0,    '{}'),
  ('CAP-60-60',    'Заглушка столба 60x60',      'fastener', 'шт', 15.0,   28.0,   '{}'),
  ('BRKT-X-LAGA',  'Кронштейн X-образный',       'fastener', 'шт', 35.0,   65.0,   '{}'),
  ('CEMENT-M500',  'Цемент М500 (мешок 50 кг)',  'beton',    'шт', 380.0,  450.0,  '{}'),
  ('GRAVEL-2040',  'Щебень фр. 20-40',           'beton',    'т',  2400.0, 2850.0, '{}'),
  ('SAND-RIVER',   'Песок речной',               'beton',    'т',  1200.0, 1450.0, '{}'),
  ('REBAR-12',     'Арматура А500С Ø12 мм',      'beton',    'м',  85.0,   115.0,  '{}'),
  ('MESH-100-100-4','Сетка ВР-1 100x100x4',       'beton',    'м²', 240.0,  320.0,  '{}'),
  ('PILE-86-2000', 'Свая винтовая Ø86x2000 мм',  'pile',     'шт', 2200.0, 2950.0, '{}'),
  ('PILE-108-2500','Свая винтовая Ø108x2500 мм', 'pile',     'шт', 3500.0, 4500.0, '{}'),
  ('PAINT-PROSH',  'Порошковая покраска RAL',    'paint',    'м²', 280.0,  450.0,  '{}'),
  ('PAINT-HAMM',   'Hammerite 3-в-1',            'paint',    'кг', 950.0,  1400.0, '{}'),
  ('PAINT-EMAL',   'Алкидная эмаль ПФ-115',      'paint',    'кг', 290.0,  430.0,  '{}')
ON CONFLICT (sku) DO NOTHING;

INSERT INTO erp_funnels (slug, title) VALUES ('deals', 'Сделки')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO erp_stages (funnel_id, slug, title, color, position, is_won, is_lost)
SELECT f.id, s.slug, s.title, s.color, s.pos, s.won, s.lost
FROM erp_funnels f, (VALUES
  ('tz_draft',        'ТЗ черновик',       '#94a3b8', 1,  FALSE, FALSE),
  ('tz_ready',        'ТЗ готово',         '#3b82f6', 2,  FALSE, FALSE),
  ('measure_assigned','Замер назначен',    '#8b5cf6', 3,  FALSE, FALSE),
  ('measure_done',    'Замер выполнен',    '#06b6d4', 4,  FALSE, FALSE),
  ('contract',        'Договор подписан',  '#f59e0b', 5,  FALSE, FALSE),
  ('prepay',          'Аванс получен',     '#fbbf24', 6,  FALSE, FALSE),
  ('production',      'В производстве',    '#ef4444', 7,  FALSE, FALSE),
  ('ready',           'Готово к монтажу',  '#10b981', 8,  FALSE, FALSE),
  ('install',         'На монтаже',        '#f97316', 9,  FALSE, FALSE),
  ('handover',        'Сдано клиенту',     '#22c55e', 10, TRUE,  FALSE),
  ('cancelled',       'Отменено',          '#6b7280', 11, FALSE, TRUE)
) AS s(slug, title, color, pos, won, lost)
WHERE f.slug = 'deals'
ON CONFLICT (funnel_id, slug) DO NOTHING;