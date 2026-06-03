-- Доп. факторы расчёта: наценка за высоту >2м и коэффициент сложности участка.
INSERT INTO calc_pricing (category,item_key,label,price,descr,sort_order) VALUES
 ('param','height_surcharge','Наценка за высоту свыше 2 м',15,'% за каждые +0.5 м',11),
 ('param','complexity_hard','Сложный участок (уклон/рельеф)',20,'% наценка',12),
 ('param','shtak_chess','Штакетник шахматкой (2 стороны)',80,'% к наполнению',13)
ON CONFLICT (category,item_key) DO NOTHING;