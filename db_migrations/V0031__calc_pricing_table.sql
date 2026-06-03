-- Единый прайс калькулятора. Источник цен для сайта И бота.
-- Меняем цену здесь — обновляется везде автоматически.
CREATE TABLE IF NOT EXISTS calc_pricing (
    id          SERIAL PRIMARY KEY,
    category    VARCHAR(40)  NOT NULL,   -- post|lag|proflist|shtak|coating|found|gate|wicket|canopy_type|canopy_cover|fill|param
    item_key    VARCHAR(60)  NOT NULL,   -- идентификатор позиции (60x60x2, C10, polyester...)
    label       VARCHAR(160) NOT NULL,   -- человекочитаемое название
    price       NUMERIC(12,2) DEFAULT 0, -- основная цена (за шт/м/м²)
    price2      NUMERIC(12,2) DEFAULT 0, -- доп. цена (perM для фундамента/ворот)
    coef        NUMERIC(8,4)  DEFAULT 0, -- коэффициент (наценка покрытия)
    descr       VARCHAR(255)  DEFAULT '',
    sort_order  INT           DEFAULT 0,
    is_active   BOOLEAN       DEFAULT TRUE,
    updated_at  TIMESTAMP     DEFAULT NOW(),
    UNIQUE (category, item_key)
);

CREATE INDEX IF NOT EXISTS idx_calc_pricing_cat ON calc_pricing (category, sort_order);

-- ── Сидинг из calcCatalog.ts ──────────────────────────────────
-- Столбы (price = pricePerPost)
INSERT INTO calc_pricing (category,item_key,label,price,descr,sort_order) VALUES
 ('post','60x60x2','60×60×2 мм',520,'Стандарт, до 2 м высоты',1),
 ('post','60x60x3','60×60×3 мм',720,'Усиленный, тяжёлые секции',2),
 ('post','80x80x2','80×80×2 мм',780,'Ворота, угловые стойки',3),
 ('post','100x100x3','100×100×3 мм',1200,'Промышленные объекты',4),
 ('post','round_57','⌀57×3 мм',480,'Круглая труба, дача',5)
ON CONFLICT (category,item_key) DO NOTHING;

-- Лаги (price = pricePerM)
INSERT INTO calc_pricing (category,item_key,label,price,descr,sort_order) VALUES
 ('lag','40x20x1.5','40×20×1.5 мм',95,'Лёгкие заборы до 1.5 м',1),
 ('lag','40x25x2','40×25×2 мм',130,'Стандарт, профнастил/штакетник',2),
 ('lag','60x30x2','60×30×2 мм',175,'Усиленный, ковка, тяжёлые',3),
 ('lag','40x40x2','40×40×2 мм',155,'Квадратная, для 3D-сетки',4)
ON CONFLICT (category,item_key) DO NOTHING;

-- Профлист (price = priceM2)
INSERT INTO calc_pricing (category,item_key,label,price,descr,sort_order) VALUES
 ('proflist','C8','С8',720,'Лёгкий, горизонт. и вертик.',1),
 ('proflist','C10','С10',850,'Самый популярный для забора',2),
 ('proflist','C20','С20',980,'Жёсткий, промышленный',3),
 ('proflist','MP20','МП20',1050,'С-образный, повышенная жёсткость',4),
 ('proflist','HC35','НС35',1240,'Несущий, ворота, промзона',5)
ON CONFLICT (category,item_key) DO NOTHING;

-- Штакетник (price = pricePerM)
INSERT INTO calc_pricing (category,item_key,label,price,descr,sort_order) VALUES
 ('shtak','sh_flat','Плоский 100 мм',85,'Классический',1),
 ('shtak','sh_m','М-образный 110 мм',95,'Более жёсткий',2),
 ('shtak','sh_p','П-образный 120 мм',105,'Закрытый торец',3),
 ('shtak','sh_round','Скруглённый',110,'Мягкий силуэт',4),
 ('shtak','sh_decor','Декоративный',145,'Фигурный верх',5)
ON CONFLICT (category,item_key) DO NOTHING;

-- Покрытие (coef = surcharge)
INSERT INTO calc_pricing (category,item_key,label,coef,descr,sort_order) VALUES
 ('coating','polyester','Полиэстер',0,'Стандарт, 15–20 лет',1),
 ('coating','pural','Пурал',0.2,'+20%, 25–30 лет',2),
 ('coating','pvdf','PVDF (Матт)',0.35,'+35%, 30+ лет',3),
 ('coating','print','PrintPattern',0.5,'+50%, принт под дерево/камень',4)
ON CONFLICT (category,item_key) DO NOTHING;

-- Фундамент (price = perPost, price2 = perM)
INSERT INTO calc_pricing (category,item_key,label,price,price2,descr,sort_order) VALUES
 ('found','prisypka','Присыпка щебнем 🎁',0,0,'В подарок! Временный монтаж',1),
 ('found','butovanie','Бутование',800,0,'Щебень + трамбовка, 0.8 м',2),
 ('found','betonirovanie','Бетонирование',1400,0,'Цемент М300, 1.2 м',3),
 ('found','lentochny','Ленточный',0,3200,'Монолит 300×400, армирование',4)
ON CONFLICT (category,item_key) DO NOTHING;

-- Ворота (price = base, price2 = perM)
INSERT INTO calc_pricing (category,item_key,label,price,price2,descr,sort_order) VALUES
 ('gate','none','Без ворот',0,0,'',1),
 ('gate','otkatnye','Откатные',75000,5500,'Консоль, до 8 м',2),
 ('gate','raspashnye','Распашные',42000,3800,'1 или 2 створки',3),
 ('gate','sektcionnye','Секционные',88000,6500,'Подъёмные, гараж',4)
ON CONFLICT (category,item_key) DO NOTHING;

-- Калитка (price)
INSERT INTO calc_pricing (category,item_key,label,price,descr,sort_order) VALUES
 ('wicket','none','Нет',0,'',1),
 ('wicket','standard','Стандарт',9500,'Простая, ригельный замок',2),
 ('wicket','kovka','Кованая',19500,'Художественная ковка',3),
 ('wicket','auto','Авто-замок',14500,'Электромеханический замок',4)
ON CONFLICT (category,item_key) DO NOTHING;

-- Навес — форма кровли (price = priceM2)
INSERT INTO calc_pricing (category,item_key,label,price,descr,sort_order) VALUES
 ('canopy_type','односкат','Односкат',3200,'Уклон в одну сторону, к стене',1),
 ('canopy_type','двухскат','Двухскат',3800,'Классический домик',2),
 ('canopy_type','арочный','Арочный',4500,'Дуга, поликарбонат',3),
 ('canopy_type','полукруг','Полукруг',4800,'Веерный свод',4)
ON CONFLICT (category,item_key) DO NOTHING;

-- Покрытие навеса (price = priceM2)
INSERT INTO calc_pricing (category,item_key,label,price,sort_order) VALUES
 ('canopy_cover','profnastil','Профнастил С8',320,1),
 ('canopy_cover','polycarb_4','Поликарбонат 4 мм',480,2),
 ('canopy_cover','polycarb_8','Поликарбонат 8 мм',720,3),
 ('canopy_cover','profnastil_color','Профнастил цветной',420,4)
ON CONFLICT (category,item_key) DO NOTHING;

-- Наполнение без покрытия (price = за м²)
INSERT INTO calc_pricing (category,item_key,label,price,descr,sort_order) VALUES
 ('fill','3d','3D-сетка сварная',1600,'',1),
 ('fill','kovka','Ковка художественная',4500,'',2),
 ('fill','setka','Сетка-рабица оцинкованная',550,'',3)
ON CONFLICT (category,item_key) DO NOTHING;

-- Параметры экономики (price = значение)
INSERT INTO calc_pricing (category,item_key,label,price,descr,sort_order) VALUES
 ('param','min_install','Минимальный выезд бригады',27000,'₽',1),
 ('param','delivery_per_km','Доставка за км от МКАД',70,'₽/км',2),
 ('param','delivery_min','Минимальная доставка',6000,'₽',3),
 ('param','oversize','Негабарит (разово)',7000,'₽',4),
 ('param','install_share','Монтаж, % от материалов',35,'%',5),
 ('param','paint_m2','Порошковая покраска',280,'₽/м²',6),
 ('param','auto_gate','Автоматика ворот',22000,'₽',7),
 ('param','auto_discount','Авто-скидка клиенту',8,'%',8),
 ('param','nashivka_double','Двусторонняя нашивка, наценка',60,'% к листу',9),
 ('param','paint_double','Двусторонний окрас штакетника',25,'% к планке',10)
ON CONFLICT (category,item_key) DO NOTHING;