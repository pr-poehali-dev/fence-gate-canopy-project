import json
import os
import urllib.request
import urllib.parse
import psycopg2


def _auth_ok(headers, conn):
    token = (headers or {}).get('X-Auth-Token') or (headers or {}).get('x-auth-token')
    if not token:
        return False
    with conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM admin_sessions WHERE token=%s AND expires_at>NOW()",
            (token,)
        )
        return cur.fetchone() is not None


def _send_to_max(bot_token: str, chat_id: str, text: str) -> bool:
    """Отправка сообщения через MAX Messenger Bot API.
    POST https://botapi.max.ru/messages?access_token=...
    body: {"chat_id":"...","text":"..."}
    """
    if not bot_token or not chat_id:
        return False
    try:
        url = f"https://botapi.max.ru/messages?access_token={urllib.parse.quote(bot_token)}"
        body = json.dumps({"chat_id": chat_id, "text": text}).encode('utf-8')
        req = urllib.request.Request(
            url, data=body,
            headers={'Content-Type': 'application/json; charset=utf-8'}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return 200 <= resp.status < 300
    except Exception:
        return False


def handler(event: dict, context) -> dict:
    """
    Универсальная функция: настройки сайта + приём заявок + отправка в MAX-бот.

    GET  /?action=settings          — публичные настройки (без токенов)
    GET  /?action=settings&admin=1  — все настройки (требует X-Auth-Token)
    PUT  /?action=settings          — обновить настройки (только админ)
    POST /?action=lead              — создать заявку (отправит в MAX, если настроен)
    """
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    cors = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
    qp = event.get('queryStringParameters') or {}
    action = qp.get('action', '')

    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)

    try:
        # ── НАСТРОЙКИ ──────────────────────────────────────────────
        if action == 'settings':
            if method == 'GET':
                admin_mode = qp.get('admin') == '1'
                if admin_mode:
                    if not _auth_ok(event.get('headers'), conn):
                        return {'statusCode': 401, 'headers': cors,
                                'body': json.dumps({'error': 'unauthorized'})}
                    with conn.cursor() as cur:
                        cur.execute("SELECT key, value FROM site_settings ORDER BY key")
                        rows = cur.fetchall()
                        items = {r[0]: r[1] for r in rows}
                    return {'statusCode': 200, 'headers': cors,
                            'body': json.dumps({'items': items})}

                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT key, value FROM site_settings WHERE key NOT IN ('max_bot_token')"
                    )
                    rows = cur.fetchall()
                    items = {r[0]: r[1] for r in rows}
                    cur.execute("SELECT (value <> '') FROM site_settings WHERE key='max_bot_token'")
                    r2 = cur.fetchone()
                    items['max_bot_active'] = bool(r2 and r2[0])
                return {'statusCode': 200, 'headers': cors,
                        'body': json.dumps({'items': items})}

            if method == 'PUT':
                if not _auth_ok(event.get('headers'), conn):
                    return {'statusCode': 401, 'headers': cors,
                            'body': json.dumps({'error': 'unauthorized'})}
                body = json.loads(event.get('body') or '{}')
                items = body.get('items') or []
                with conn.cursor() as cur:
                    for it in items:
                        k = (it.get('key') or '').replace("'", "''")[:64]
                        v = (it.get('value') or '').replace("'", "''")[:4000]
                        if not k:
                            continue
                        cur.execute(
                            f"INSERT INTO site_settings(key,value,updated_at) "
                            f"VALUES('{k}','{v}',NOW()) "
                            f"ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()"
                        )
                    conn.commit()
                return {'statusCode': 200, 'headers': cors,
                        'body': json.dumps({'ok': True, 'updated': len(items)})}

        # ── ЗАЯВКИ ─────────────────────────────────────────────────
        if action == 'lead' and method == 'POST':
            body = json.loads(event.get('body') or '{}')
            name = (body.get('name') or '').strip()
            phone = (body.get('phone') or '').strip()
            if not name and not phone:
                return {'statusCode': 400, 'headers': cors,
                        'body': json.dumps({'error': 'name_or_phone_required'})}

            order_num = (body.get('order_num') or '').strip()[:32]
            city = (body.get('city') or '').strip()[:128]
            address = (body.get('address') or '').strip()[:255]
            object_type = (body.get('object_type') or '').strip()[:64]
            total = float(body.get('total_rub') or 0)
            payload = body.get('payload') or {}

            with conn.cursor() as cur:
                cur.execute("SELECT key, value FROM site_settings")
                settings = {r[0]: r[1] for r in cur.fetchall()}
                bot_token = settings.get('max_bot_token') or ''
                chat_id = settings.get('max_chat_id') or ''

                total_fmt = ('{:,}'.format(int(total))).replace(',', ' ')
                txt = (
                    "🔔 НОВАЯ ЗАЯВКА — СтальГрупп\n"
                    "────────────────\n"
                    f"№ заказа: {order_num or '—'}\n"
                    f"Имя: {name or '—'}\n"
                    f"Телефон: {phone or '—'}\n"
                    f"Город: {city or '—'}\n"
                    f"Адрес: {address or '—'}\n"
                    f"Тип: {object_type or '—'}\n"
                    f"Сумма: {total_fmt} ₽\n"
                    "────────────────"
                )

                delivered = _send_to_max(bot_token, chat_id, txt) if bot_token and chat_id else False

                safe_name = name.replace("'", "''")
                safe_phone = phone.replace("'", "''")
                safe_city = city.replace("'", "''")
                safe_addr = address.replace("'", "''")
                safe_ot = object_type.replace("'", "''")
                safe_on = order_num.replace("'", "''")
                payload_str = json.dumps(payload, ensure_ascii=False).replace("'", "''")
                cur.execute(
                    f"INSERT INTO leads(order_num,name,phone,city,address,object_type,"
                    f"total_rub,payload_json,delivered_to_max) "
                    f"VALUES('{safe_on}','{safe_name}','{safe_phone}','{safe_city}',"
                    f"'{safe_addr}','{safe_ot}',{total},'{payload_str}'::jsonb,{delivered}) "
                    f"RETURNING id"
                )
                lead_id = cur.fetchone()[0]
                conn.commit()

            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'ok': True, 'id': lead_id, 'delivered': delivered})}

        return {'statusCode': 400, 'headers': cors,
                'body': json.dumps({'error': 'unknown_action_or_method'})}
    finally:
        conn.close()
