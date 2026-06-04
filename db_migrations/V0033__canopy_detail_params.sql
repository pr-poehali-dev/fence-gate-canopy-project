-- Параметры детального расчёта навеса: каркас (фермы/опоры), снеговая нагрузка.
INSERT INTO calc_pricing (category,item_key,label,price,descr,sort_order) VALUES
 ('param','canopy_frame_m2','Каркас навеса (фермы+опоры)',1450,'₽/м² базовый каркас',14),
 ('param','canopy_snow_light','Снеговая нагрузка: обычная',0,'% (до 180 кг/м²)',15),
 ('param','canopy_snow_heavy','Снеговая нагрузка: усиленная',18,'% (усиление ферм)',16),
 ('param','canopy_post_price','Опорный столб навеса',1800,'₽/шт',17)
ON CONFLICT (category,item_key) DO NOTHING;