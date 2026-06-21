-- Обновляем реквизиты компании под ТЗ: Люберцы, режим работы, зона выезда
UPDATE site_settings SET value = 'Московская область, г. Люберцы (собственное производство)' WHERE key = 'company_address';
UPDATE site_settings SET value = 'Ежедневно 09:00–20:00' WHERE key = 'work_hours';
UPDATE site_settings SET value = 'Москва и МО, радиус 25 км от МКАД' WHERE key = 'region';