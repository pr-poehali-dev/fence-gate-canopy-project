-- Сохраняем токен MAX-бота, переданный администратором
UPDATE site_settings
SET value = 'f9LHodD0cOKVk9z8MoxNtxxXWqCp5u_T9vWrkVBt2P4sLlDtGa-IfHddlCMUL1SMrmJRcZBhHlx5zNzHPZE8',
    updated_at = NOW()
WHERE key = 'max_bot_token';
