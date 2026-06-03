-- Состояние диалога бота: пошаговый сценарий, черновик расчёта, имя клиента.
ALTER TABLE bot_dialogs ADD COLUMN IF NOT EXISTS stage VARCHAR(40) DEFAULT '';
ALTER TABLE bot_dialogs ADD COLUMN IF NOT EXISTS draft_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE bot_dialogs ADD COLUMN IF NOT EXISTS known_name VARCHAR(200) DEFAULT '';