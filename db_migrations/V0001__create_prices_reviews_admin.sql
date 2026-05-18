CREATE TABLE IF NOT EXISTS prices (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    unit VARCHAR(64) NOT NULL DEFAULT 'руб/м.п.',
    category VARCHAR(64) NOT NULL DEFAULT 'fence',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    city VARCHAR(128),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT NOT NULL,
    photo_url TEXT,
    service VARCHAR(64),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    login VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_sessions (
    token VARCHAR(128) PRIMARY KEY,
    user_id INTEGER REFERENCES admin_users(id),
    expires_at TIMESTAMP NOT NULL
);

INSERT INTO admin_users (login, password_hash)
VALUES ('admin', '3f5da76c2a8e0e57d7f8e4ddccae2e7a3a31cfa8e3e23f02bbd44b3b8e2d8e9e')
ON CONFLICT (login) DO NOTHING;

INSERT INTO prices (slug, title, price, unit, category) VALUES
  ('profnastil_zink',      'Профнастил оцинкованный (2 м, 0.45 мм)',  2800, 'руб/м.п.', 'profnastil'),
  ('profnastil_polymer',   'Профнастил полимер RAL',                  3100, 'руб/м.п.', 'profnastil'),
  ('profnastil_svai',      'Профнастил на винтовых сваях',            4200, 'руб/м.п.', 'profnastil'),
  ('shtaketnik_one',       'Евроштакетник одностороннее (зазор 4 см)', 3400, 'руб/м.п.', 'shtaketnik'),
  ('shtaketnik_chess',     'Евроштакетник шахматка двустороннее',     4500, 'руб/м.п.', 'shtaketnik'),
  ('gate_mechanical',      'Откатные ворота механические (4 м)',     75000, 'руб/шт',   'gate'),
  ('gate_automation',      'Откатные ворота с автоматикой',          115000, 'руб/шт',   'gate'),
  ('gate_decor',           'Откатные ворота с декор. панелью',       140000, 'руб/шт',   'gate'),
  ('mesh_3d',              '3D-сетка сварная (h=2 м)',               1900, 'руб/м.п.', 'mesh'),
  ('mesh_rabitsa',         'Сетка-рабица оцинкованная',               950, 'руб/м.п.', 'mesh'),
  ('kovka_standard',       'Кованый забор (стандарт)',               5500, 'руб/м.п.', 'kovka'),
  ('wicket_standard',      'Калитка стандарт',                       9500, 'руб/шт',   'wicket'),
  ('wicket_kovka',         'Калитка кованая',                       19500, 'руб/шт',   'wicket'),
  ('canopy_polycarb',      'Навес поликарбонат (за м²)',             3500, 'руб/м²',   'canopy'),
  ('canopy_profnastil',    'Навес профнастил (за м²)',               3200, 'руб/м²',   'canopy'),
  ('foundation_betonirovanie', 'Бетонирование столбов',              1500, 'руб/шт',   'foundation'),
  ('foundation_svai',      'Винтовые сваи',                          2400, 'руб/шт',   'foundation')
ON CONFLICT (slug) DO UPDATE SET price=EXCLUDED.price, updated_at=CURRENT_TIMESTAMP;

INSERT INTO reviews (name, city, rating, text, service, is_approved) VALUES
  ('Александр П.', 'Люберцы',  5, 'Поставили забор из евроштакетника шахматкой 85 м. Бригада за 1 день всё сделала, аккуратно. Сваркой и геометрией доволен.', 'Евроштакетник', TRUE),
  ('Марина К.',    'Чапаевка', 5, 'Заказывали откатные ворота 4 м с автоматикой DoorHan. Установили за полдня, работает как часы. Цена честная, без скрытых платежей.', 'Откатные ворота', TRUE),
  ('Дмитрий С.',   'Астрецово', 5, 'Профнастил С10, 120 м периметра. Грамотный замерщик, всё посчитали с вычетом ворот. Срок сдержали.', 'Профнастил', TRUE);
