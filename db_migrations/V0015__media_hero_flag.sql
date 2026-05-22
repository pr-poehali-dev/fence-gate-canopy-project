-- Флаг "главное фото" услуги — у одной услуги может быть один hero
ALTER TABLE media_library
  ADD COLUMN IF NOT EXISTS is_hero BOOLEAN DEFAULT FALSE;

-- Частичный уникальный индекс: только одно is_hero=true в рамках одной услуги
CREATE UNIQUE INDEX IF NOT EXISTS uniq_hero_per_service
  ON media_library(service) WHERE is_hero = TRUE;
