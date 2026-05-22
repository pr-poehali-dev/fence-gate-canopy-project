-- Хранилище фото с тегами по услугам
CREATE TABLE IF NOT EXISTS media_library (
  id          SERIAL PRIMARY KEY,
  url         TEXT NOT NULL UNIQUE,
  s3_key      TEXT,
  service     TEXT,        -- slug услуги: profnastil, shtaketnik, ... NULL = не привязано
  position    INTEGER DEFAULT 0,  -- порядок в услуге (0 = hero)
  caption     TEXT DEFAULT '',
  alt_text    TEXT DEFAULT '',
  width       INTEGER,
  height      INTEGER,
  size_bytes  INTEGER,
  is_hidden   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_service ON media_library(service);
CREATE INDEX IF NOT EXISTS idx_media_position ON media_library(service, position);
