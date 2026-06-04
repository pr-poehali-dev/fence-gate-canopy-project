-- Скрываем профлист МП20 и С10 из калькулятора (стандарт — С8 односторонний).
UPDATE calc_pricing SET is_active = FALSE WHERE category='proflist' AND item_key IN ('MP20','C10');