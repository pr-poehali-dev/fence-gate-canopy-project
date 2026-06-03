-- Короткий код диалога для ответа менеджера из группы (#A1B2) и город клиента.
ALTER TABLE bot_dialogs ADD COLUMN IF NOT EXISTS dialog_code VARCHAR(12) DEFAULT '';
ALTER TABLE bot_dialogs ADD COLUMN IF NOT EXISTS client_city VARCHAR(120) DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_bot_dialogs_code ON bot_dialogs (dialog_code);