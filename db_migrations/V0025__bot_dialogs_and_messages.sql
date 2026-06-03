-- Диалоги клиентов с MAX-ботом и история сообщений.

CREATE TABLE IF NOT EXISTS bot_dialogs (
    id            SERIAL PRIMARY KEY,
    chat_id       VARCHAR(64) NOT NULL UNIQUE,   -- chat_id в MAX
    user_id       VARCHAR(64) DEFAULT '',         -- user_id в MAX
    client_name   VARCHAR(200) DEFAULT '',
    client_phone  VARCHAR(32) DEFAULT '',
    last_message  TEXT DEFAULT '',
    last_at       TIMESTAMP DEFAULT NOW(),
    unread        INTEGER DEFAULT 0,              -- непрочитанных менеджером
    needs_manager BOOLEAN DEFAULT FALSE,          -- клиент позвал менеджера
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bot_messages (
    id          SERIAL PRIMARY KEY,
    chat_id     VARCHAR(64) NOT NULL,
    direction   VARCHAR(10) NOT NULL,             -- 'in' (от клиента) | 'out' (бот/менеджер)
    sender      VARCHAR(20) DEFAULT 'client',     -- client | bot | manager
    text        TEXT DEFAULT '',
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_messages_chat ON bot_messages (chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bot_dialogs_last ON bot_dialogs (last_at DESC);