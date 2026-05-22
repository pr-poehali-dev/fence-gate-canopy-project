-- Меню сайта: категории и пункты внутри них
CREATE TABLE IF NOT EXISTS site_menu (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER REFERENCES site_menu(id),
  label VARCHAR(128) NOT NULL,
  href VARCHAR(255) NOT NULL DEFAULT '',
  icon VARCHAR(64) DEFAULT '',
  badge VARCHAR(32) DEFAULT '',
  description VARCHAR(255) DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_menu_parent ON site_menu(parent_id);
CREATE INDEX IF NOT EXISTS idx_site_menu_position ON site_menu(position);

INSERT INTO site_menu (label, href, icon, position)
SELECT v.label, v.href, v.icon, v.position
FROM (VALUES
  ('Заборы',             '',                          'Fence',     1),
  ('Ворота и калитки',   '',                          'DoorOpen',  2),
  ('Навесы и беседки',   '',                          'Home',      3),
  ('Фундаменты',         '/services/fundamenty',      'Layers',    4),
  ('Столбы',             '/uslugi/stolby',            'Building',  5),
  ('Благоустройство',    '',                          'Trees',     6),
  ('Информация',         '',                          'FileText',  7)
) AS v(label, href, icon, position)
WHERE NOT EXISTS (
  SELECT 1 FROM site_menu m WHERE m.parent_id IS NULL AND m.label = v.label
);

INSERT INTO site_menu (parent_id, label, href, description, badge, position)
SELECT c.id, x.label, x.href, x.description, x.badge, x.position
FROM (SELECT id, label FROM site_menu WHERE parent_id IS NULL) c
JOIN (VALUES
  ('Заборы',           'Из профнастила',     '/services/profnastil',           'От 1 450 руб/м.п. — Глухой',         '',          1),
  ('Заборы',           'Евроштакетник',      '/services/shtaketnik',           'От 1 850 руб/м.п. — Полупрозрачный', '',          2),
  ('Заборы',           '3D-сетка',           '/services/3d-setka',             'От 1 200 руб/м.п. — Эконом',         '',          3),
  ('Заборы',           'Ковка',              '/services/kovka',                'От 4 800 руб/м.п. — Премиум',        'Премиум',   4),
  ('Заборы',           'Сетка-рабица',       '/services/setka-rabitsa',        'От 650 руб/м.п. — Дача',             '',          5),
  ('Ворота и калитки', 'Откатные ворота',    '/services/otkatnye-vorota',      'От 45 000 руб — Автоматика',         '',          1),
  ('Ворота и калитки', 'Распашные ворота',   '/services/raspashnye-vorota',    'От 28 000 руб — Классика',           '',          2),
  ('Ворота и калитки', 'Калитки',            '/services/kalitki',              'От 7 500 руб — С замком',            '',          3),
  ('Навесы и беседки', 'Навесы для авто',    '/services/navesy',               'От 18 000 руб/кв.м — Поликарбонат',  '',          1),
  ('Навесы и беседки', 'Беседки',            '/services/besedki',              'От 65 000 руб — Под ключ',           '',          2),
  ('Фундаменты',       'Бетонирование',      '/services/fundamenty#tab-betonirovanie', 'Универсал — М300 — 1.2 м',         'Рекомендуем', 1),
  ('Фундаменты',       'Бутование щебнем',   '/services/fundamenty#tab-butovanie',     'Лёгкие заборы — сухие грунты',     '',          2),
  ('Фундаменты',       'Винтовые сваи',      '/services/fundamenty#tab-svai',          'Торф — болото — круглый год',      '',          3),
  ('Фундаменты',       'Ленточный ростверк', '/services/fundamenty#tab-rostverk',      'Тяжёлые заборы — 50+ лет',         'Премиум',   4),
  ('Столбы',           'Из профильной трубы','/uslugi/stolby#tab-proftruba',           'От 1 200 руб — Стандарт',          '',          1),
  ('Столбы',           'Кирпичные',          '/uslugi/stolby#tab-kirpich',             'От 8 500 руб/м.п. — Премиум',      'Премиум',   2),
  ('Столбы',           'Из блоков',          '/uslugi/stolby#tab-bloki',               'От 6 500 руб/м.п. — Выгодно',      '',          3),
  ('Благоустройство',  'Бетонные площадки',  '/services/betonnye-ploschadki',  'От 2 200 руб/кв.м — Парковка',     '',          1),
  ('Благоустройство',  'Заезд на участок',   '/services/zaezd-na-uchastok',    'От 18 000 руб — Под ключ',         '',          2),
  ('Информация',       'Схемы и чертежи',    '/shemy-chertezi',                'Каталог технических узлов',        '',          1),
  ('Информация',       'Отзывы клиентов',    '/reviews',                       'Отзывы и оценки работ',            '',          2)
) AS x(cat_label, label, href, description, badge, position) ON x.cat_label = c.label
WHERE NOT EXISTS (
  SELECT 1 FROM site_menu m WHERE m.parent_id = c.id AND m.label = x.label
);
