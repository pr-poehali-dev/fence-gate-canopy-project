-- 12 нераспределённых фото временно привязываем к profnastil, но прячем (is_hidden = TRUE)
-- Админ увидит их в /admin/media и сможет разметить вручную, на витрине они не появятся
UPDATE media_library
SET service = 'profnastil',
    is_hidden = TRUE,
    updated_at = NOW()
WHERE service IS NULL;
