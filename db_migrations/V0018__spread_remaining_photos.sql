-- Раскидываем 12 ранее скрытых фото по сервисам с малым количеством фото
-- по id равномерно, делая видимыми
UPDATE media_library SET service = 'shtaketnik', is_hidden = FALSE, updated_at = NOW() WHERE id IN (1, 2);
UPDATE media_library SET service = '3d-setka',   is_hidden = FALSE, updated_at = NOW() WHERE id IN (3, 4);
UPDATE media_library SET service = 'kovka',      is_hidden = FALSE, updated_at = NOW() WHERE id IN (5, 6);
UPDATE media_library SET service = 'kalitki',    is_hidden = FALSE, updated_at = NOW() WHERE id IN (7, 9);
UPDATE media_library SET service = 'fundamenty', is_hidden = FALSE, updated_at = NOW() WHERE id IN (10, 11);
UPDATE media_library SET service = 'setka-rabitsa', is_hidden = FALSE, updated_at = NOW() WHERE id IN (47, 48);
