import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
import psycopg2


def handler(event: dict, context) -> dict:
    """
    Авторизация админа: POST /login (login, password) — возвращает токен.
                       GET /verify — проверяет токен из X-Auth-Token.
                       POST /logout — удаляет сессию.
    """
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    cors = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)

    try:
        path = event.get('queryStringParameters') or {}
        action = path.get('action', 'login')

        if method == 'POST' and action == 'login':
            body = json.loads(event.get('body') or '{}')
            login = (body.get('login') or '').strip()
            password = body.get('password') or ''
            pwd_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()

            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id FROM admin_users WHERE login = %s AND password_hash = %s",
                    (login, pwd_hash)
                )
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 401, 'headers': cors,
                            'body': json.dumps({'error': 'invalid_credentials'})}

                user_id = row[0]
                token = secrets.token_urlsafe(32)
                expires = datetime.utcnow() + timedelta(days=7)
                cur.execute(
                    "INSERT INTO admin_sessions (token, user_id, expires_at) VALUES (%s, %s, %s)",
                    (token, user_id, expires)
                )
                conn.commit()
                return {
                    'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'token': token, 'expires_at': expires.isoformat()})
                }

        if method == 'GET' and action == 'verify':
            token = (event.get('headers') or {}).get('X-Auth-Token') or \
                    (event.get('headers') or {}).get('x-auth-token')
            if not token:
                return {'statusCode': 401, 'headers': cors,
                        'body': json.dumps({'authorized': False})}
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT user_id FROM admin_sessions WHERE token = %s AND expires_at > NOW()",
                    (token,)
                )
                row = cur.fetchone()
                return {
                    'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'authorized': bool(row)})
                }

        if method == 'POST' and action == 'logout':
            token = (event.get('headers') or {}).get('X-Auth-Token') or \
                    (event.get('headers') or {}).get('x-auth-token')
            if token:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM admin_sessions WHERE token = %s", (token,))
                    conn.commit()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        return {'statusCode': 400, 'headers': cors,
                'body': json.dumps({'error': 'unknown_action'})}
    finally:
        conn.close()
