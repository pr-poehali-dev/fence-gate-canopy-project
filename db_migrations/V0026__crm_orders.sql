-- Заказы CRM-кабинета менеджера.
CREATE TABLE IF NOT EXISTS orders (
    id            SERIAL PRIMARY KEY,
    order_num     VARCHAR(64) DEFAULT '',
    client_name   VARCHAR(200) DEFAULT '',
    client_phone  VARCHAR(32) DEFAULT '',
    address       VARCHAR(400) DEFAULT '',
    object_type   VARCHAR(200) DEFAULT '',
    source        VARCHAR(60) DEFAULT 'manual',   -- сайт | звонок | сарафан | manual ...
    status        VARCHAR(30) DEFAULT 'new',      -- new|measure|contract|production|montage|done|archive|cancelled
    montage_date  DATE,                            -- плановая дата монтажа
    total_rub     NUMERIC(12,2) DEFAULT 0,         -- сумма заказа
    materials_cost NUMERIC(12,2) DEFAULT 0,        -- себестоимость материалов
    fot           NUMERIC(12,2) DEFAULT 0,         -- ФОТ бригады
    profit        NUMERIC(12,2) DEFAULT 0,         -- выгода
    paid_rub      NUMERIC(12,2) DEFAULT 0,         -- оплачено
    comment       TEXT DEFAULT '',
    items_json    JSONB DEFAULT '[]'::jsonb,       -- позиции сметы
    lead_id       INTEGER,                         -- связь с заявкой
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_montage ON orders (montage_date);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC);