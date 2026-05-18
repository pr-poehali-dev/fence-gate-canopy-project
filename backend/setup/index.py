import json
import os
import hashlib
import psycopg2


def handler(event: dict, context) -> dict:
    """Однократная установка/смена логина и пароля админа.
    Защищена секретом SETUP_KEY из query или env, иначе используем дефолтный токен.
    Использование: POST /?key=SECRET с body {"login":"...","password":"..."}.
    """
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    cors = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
    qp = event.get('queryStringParameters') or {}
    expected = os.environ.get('SETUP_KEY', 'sg-setup-2026-x9k')
    if qp.get('key') != expected:
        return {'statusCode': 401, 'headers': cors,
                'body': json.dumps({'error': 'unauthorized'})}

    body = json.loads(event.get('body') or '{}')
    new_login = (body.get('login') or '').strip()
    new_pwd = body.get('password') or ''
    if not new_login or not new_pwd:
        return {'statusCode': 400, 'headers': cors,
                'body': json.dumps({'error': 'login_and_password_required'})}

    pwd_hash = hashlib.sha256(new_pwd.encode('utf-8')).hexdigest()
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            # Чистим старые сессии
            cur.execute("UPDATE admin_sessions SET expires_at = NOW() - INTERVAL '1 day'")
            # Меняем учётку
            safe_login = new_login.replace("'", "''")
            cur.execute(f"SELECT id FROM admin_users LIMIT 1")
            row = cur.fetchone()
            if row:
                cur.execute(
                    f"UPDATE admin_users SET login='{safe_login}', password_hash='{pwd_hash}' WHERE id={row[0]}"
                )
            else:
                cur.execute(
                    f"INSERT INTO admin_users(login, password_hash) VALUES('{safe_login}', '{pwd_hash}')"
                )
            conn.commit()
        return {'statusCode': 200, 'headers': cors,
                'body': json.dumps({'ok': True, 'login': new_login})}
    finally:
        conn.close()
