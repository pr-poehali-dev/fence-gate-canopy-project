-- Настройки сайта (key/value): max_bot_token, max_chat_id и т.п.
CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO site_settings(key, value) VALUES
  ('max_bot_token', ''),
  ('max_chat_id',   '')
ON CONFLICT (key) DO NOTHING;

-- Журнал заявок (для аудита)
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    order_num VARCHAR(32),
    name VARCHAR(128),
    phone VARCHAR(64),
    city VARCHAR(128),
    address VARCHAR(255),
    object_type VARCHAR(64),
    total_rub NUMERIC(12,2),
    payload_json JSONB,
    delivered_to_max BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
