-- Покрытие навеса: оставляем поликарбонат, профлист С21, металлочерепицу.
UPDATE calc_pricing SET is_active = FALSE
 WHERE category='canopy_cover' AND item_key IN ('profnastil','polycarb_4','profnastil_color');

UPDATE calc_pricing SET is_active = TRUE, label='Поликарбонат 8 мм', price=720
 WHERE category='canopy_cover' AND item_key='polycarb_8';

INSERT INTO calc_pricing (category,item_key,label,price,sort_order,is_active) VALUES
 ('canopy_cover','polycarb','Поликарбонат 8 мм',720,1,TRUE),
 ('canopy_cover','profnastil_c21','Профлист С21',540,2,TRUE),
 ('canopy_cover','metallocherepica','Металлочерепица',690,3,TRUE)
ON CONFLICT (category,item_key) DO UPDATE SET label=EXCLUDED.label, price=EXCLUDED.price, is_active=TRUE;

-- Профлист забора: оставляем С8, С20, С21.
UPDATE calc_pricing SET is_active = FALSE WHERE category='proflist' AND item_key IN ('HC35','C10','MP20');
UPDATE calc_pricing SET price=780 WHERE category='proflist' AND item_key='C8';
UPDATE calc_pricing SET price=1020 WHERE category='proflist' AND item_key='C20';
INSERT INTO calc_pricing (category,item_key,label,price,sort_order,is_active) VALUES
 ('proflist','C21','С21',1080,3,TRUE)
ON CONFLICT (category,item_key) DO UPDATE SET label=EXCLUDED.label, price=EXCLUDED.price, is_active=TRUE;