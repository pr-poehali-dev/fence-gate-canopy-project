CREATE TABLE IF NOT EXISTS user_pages (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_pages_slug ON user_pages(slug);

CREATE TABLE IF NOT EXISTS page_blocks (
  id SERIAL PRIMARY KEY,
  page_id INTEGER NOT NULL REFERENCES user_pages(id),
  block_type VARCHAR(40) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_page_blocks_page ON page_blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_page_blocks_pos ON page_blocks(position);

INSERT INTO user_pages (slug, title, seo_description, is_published)
SELECT 'akciya', 'Akcia mesyaca', 'Skidka 10 procentov', TRUE
WHERE NOT EXISTS (SELECT 1 FROM user_pages WHERE slug = 'akciya');

INSERT INTO page_blocks (page_id, block_type, position, data)
SELECT p.id, 'hero', 0,
  '{"title":"Skidka 10 procentov na zabory","subtitle":"Pri zakaze do konca mesyaca","button_text":"Poluchit skidku","button_action":"lead","bg_color":"#f97316","text_color":"#ffffff"}'::jsonb
FROM user_pages p
WHERE p.slug = 'akciya'
  AND NOT EXISTS (SELECT 1 FROM page_blocks WHERE page_id = p.id);

CREATE TABLE IF NOT EXISTS onec_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  base_url VARCHAR(255) NOT NULL DEFAULT '',
  username VARCHAR(120) NOT NULL DEFAULT '',
  password VARCHAR(255) NOT NULL DEFAULT '',
  webhook_secret VARCHAR(128) NOT NULL DEFAULT '',
  auto_sync_leads BOOLEAN NOT NULL DEFAULT TRUE,
  auto_sync_prices BOOLEAN NOT NULL DEFAULT FALSE,
  last_sync_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO onec_settings (id) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM onec_settings WHERE id = 1);

CREATE TABLE IF NOT EXISTS onec_sync_log (
  id SERIAL PRIMARY KEY,
  direction VARCHAR(20) NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id VARCHAR(64) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'ok',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_onec_log_created ON onec_sync_log(created_at);
CREATE INDEX IF NOT EXISTS idx_onec_log_entity ON onec_sync_log(entity_type);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS onec_id VARCHAR(64) DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS onec_synced_at TIMESTAMP;
