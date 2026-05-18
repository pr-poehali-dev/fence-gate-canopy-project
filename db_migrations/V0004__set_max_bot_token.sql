-- Сохраняем токен MAX-бота, переданный администратором
UPDATE site_settings
SET value = 'f9LHodD0cOJWe5ghTSpNvAVxlM4Gp5JaRoXofOT_r9j3JFEiFJOXYf9zEGNZkuJFN2DtA0ZpAvcHl85dhDvz',
    updated_at = NOW()
WHERE key = 'max_bot_token';