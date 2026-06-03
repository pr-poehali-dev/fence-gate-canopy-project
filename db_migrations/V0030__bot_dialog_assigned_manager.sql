-- Автоназначение менеджера на диалог: кто первым ответил клиенту.
ALTER TABLE bot_dialogs ADD COLUMN IF NOT EXISTS assigned_manager VARCHAR(200) DEFAULT '';
ALTER TABLE bot_dialogs ADD COLUMN IF NOT EXISTS assigned_manager_id VARCHAR(80) DEFAULT '';