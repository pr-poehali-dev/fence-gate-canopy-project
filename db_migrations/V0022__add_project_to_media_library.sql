ALTER TABLE media_library ADD COLUMN IF NOT EXISTS project VARCHAR(200) NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_media_project ON media_library (service, project);