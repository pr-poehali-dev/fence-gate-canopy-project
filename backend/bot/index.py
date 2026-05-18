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


def _max_get(bot_token, path, params=None):
    """GET-запрос к MAX Bot API. Возвращает dict или {} при ошибке."""
    if not bot_token:
        return {}
    try:
        qs = {'access_token': bot_token}
        if params:
            qs.update(params)
        query = urllib.parse.urlencode(qs)
        url = "https://botapi.max.ru" + path + "?" + query
        req = urllib.request.Request(url, headers={'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=12) as resp:
            return json.loads(resp.read().decode('utf-8') or '{}')
    except Exception:
        return {}


def _send_to_max(bot_token: str, chat_id: str, text: str,
                 phone: str = '', pdf_url: str = '') -> bool:
    """Отправка сообщения через MAX Messenger Bot API с inline-кнопками.
    Кнопки: «Перезвонить» (tel:) и «Открыть КП в PDF» (link).
    """
    if not bot_token or not chat_id:
        return False
    try:
        buttons = []
        if phone:
            digits = ''.join(ch for ch in phone if ch.isdigit() or ch == '+')
            if digits and not digits.startswith('+'):
                digits = '+' + digits
            buttons.append([
                {"type": "link", "text": f"📞 Перезвонить {phone}", "url": f"tel:{digits}"}
            ])
        if pdf_url:
            buttons.append([
                {"type": "link", "text": "📄 Открыть КП в PDF", "url": pdf_url}
            ])
        payload = {"text": text, "format": "markdown"}
        if buttons:
            payload["attachments"] = [{
                "type": "inline_keyboard",
                "payload": {"buttons": buttons}
            }]
        url = (
            f"https://botapi.max.ru/messages"
            f"?access_token={urllib.parse.quote(bot_token)}"
            f"&chat_id={urllib.parse.quote(str(chat_id))}"
        )
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        req = urllib.request.Request(
            url, data=body,
            headers={'Content-Type': 'application/json; charset=utf-8'}
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            return 200 <= resp.status < 300
    except Exception:
        return False


def _upload_pdf_to_s3(b64data: str, order_num: str) -> str:
    """Принимает data:application/pdf;base64,... или чистую base64-строку.
    Загружает PDF в S3 и возвращает CDN URL."""
    if not b64data:
        return ''
    try:
        import base64
        import boto3
        if ',' in b64data:
            _, b64data = b64data.split(',', 1)
        raw = base64.b64decode(b64data)
        safe_num = ''.join(ch for ch in (order_num or 'KP') if ch.isalnum() or ch in '-_')
        key = f"kp/{safe_num}.pdf"
        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
        )
        s3.put_object(Bucket='files', Key=key, Body=raw, ContentType='application/pdf')
        return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    except Exception:
        return ''


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
            pdf_b64 = body.get('pdf_base64') or ''

            # Загружаем PDF КП в S3 (для кнопки в MAX)
            pdf_url = _upload_pdf_to_s3(pdf_b64, order_num) if pdf_b64 else ''

            with conn.cursor() as cur:
                cur.execute("SELECT key, value FROM site_settings")
                settings = {r[0]: r[1] for r in cur.fetchall()}
                bot_token = settings.get('max_bot_token') or ''
                chat_id = settings.get('max_chat_id') or ''

                total_fmt = ('{:,}'.format(int(total))).replace(',', ' ')
                txt = (
                    "🔔 *НОВАЯ ЗАЯВКА — СтальГрупп*\n"
                    "────────────────\n"
                    f"📋 № заказа: `{order_num or '—'}`\n"
                    f"👤 Имя: *{name or '—'}*\n"
                    f"📱 Телефон: *{phone or '—'}*\n"
                    f"📍 Город: {city or '—'}\n"
                    f"🏠 Адрес: {address or '—'}\n"
                    f"🔧 Тип: {object_type or '—'}\n"
                    f"💰 Сумма: *{total_fmt} ₽*\n"
                    "────────────────"
                )

                delivered = _send_to_max(
                    bot_token, chat_id, txt, phone=phone, pdf_url=pdf_url
                ) if bot_token and chat_id else False

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

        # ── СПИСОК ЗАЯВОК ─────────────────────────────────────────
        if action == 'leads' and method == 'GET':
            if not _auth_ok(event.get('headers'), conn):
                return {'statusCode': 401, 'headers': cors,
                        'body': json.dumps({'error': 'unauthorized'})}
            date_from = qp.get('from')  # YYYY-MM-DD
            date_to = qp.get('to')      # YYYY-MM-DD
            status_f = qp.get('status') or 'all'  # all|delivered|failed
            try:
                limit = min(int(qp.get('limit') or 200), 500)
            except Exception:
                limit = 200

            where = ['1=1']
            if date_from:
                safe = ''.join(ch for ch in date_from if ch.isdigit() or ch == '-')[:10]
                if safe:
                    where.append(f"created_at >= '{safe}'::date")
            if date_to:
                safe = ''.join(ch for ch in date_to if ch.isdigit() or ch == '-')[:10]
                if safe:
                    where.append(f"created_at < ('{safe}'::date + INTERVAL '1 day')")
            if status_f == 'delivered':
                where.append("delivered_to_max = TRUE")
            elif status_f == 'failed':
                where.append("delivered_to_max = FALSE")

            sql = (
                "SELECT id, order_num, name, phone, city, address, object_type, "
                "total_rub, delivered_to_max, created_at "
                f"FROM leads WHERE {' AND '.join(where)} "
                f"ORDER BY created_at DESC LIMIT {limit}"
            )
            with conn.cursor() as cur:
                cur.execute(sql)
                rows = cur.fetchall()
                items = [{
                    'id': r[0], 'order_num': r[1], 'name': r[2], 'phone': r[3],
                    'city': r[4], 'address': r[5], 'object_type': r[6],
                    'total_rub': float(r[7] or 0),
                    'delivered_to_max': r[8],
                    'created_at': r[9].isoformat() if r[9] else None,
                } for r in rows]
                cur.execute(
                    f"SELECT COUNT(*), "
                    f"COUNT(*) FILTER (WHERE delivered_to_max=TRUE), "
                    f"COALESCE(SUM(total_rub),0) "
                    f"FROM leads WHERE {' AND '.join(where)}"
                )
                st = cur.fetchone()
                stats = {
                    'total': st[0] if st else 0,
                    'delivered': st[1] if st else 0,
                    'sum_rub': float(st[2] or 0) if st else 0,
                }
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'items': items, 'stats': stats})}

        # ── ПОВТОРНАЯ ОТПРАВКА ЗАЯВКИ В MAX ───────────────────────
        if action == 'resend' and method == 'POST':
            if not _auth_ok(event.get('headers'), conn):
                return {'statusCode': 401, 'headers': cors,
                        'body': json.dumps({'error': 'unauthorized'})}
            body = json.loads(event.get('body') or '{}')
            try:
                lead_id = int(body.get('id') or 0)
            except Exception:
                lead_id = 0
            if not lead_id:
                return {'statusCode': 400, 'headers': cors,
                        'body': json.dumps({'error': 'id_required'})}
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT order_num,name,phone,city,address,object_type,total_rub,payload_json "
                    f"FROM leads WHERE id={lead_id}"
                )
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 404, 'headers': cors,
                            'body': json.dumps({'error': 'lead_not_found'})}
                order_num, name, phone, city, address, object_type, total, payload = row

                cur.execute("SELECT key,value FROM site_settings")
                settings = {r[0]: r[1] for r in cur.fetchall()}
                bot_token = settings.get('max_bot_token') or ''
                chat_id = settings.get('max_chat_id') or ''

                pdf_url = ''
                if isinstance(payload, dict):
                    pdf_url = payload.get('pdf_url') or ''

                total_fmt = ('{:,}'.format(int(total or 0))).replace(',', ' ')
                txt = (
                    "🔁 *ПОВТОРНАЯ ОТПРАВКА — СтальГрупп*\n"
                    "────────────────\n"
                    f"📋 № заказа: `{order_num or '—'}`\n"
                    f"👤 Имя: *{name or '—'}*\n"
                    f"📱 Телефон: *{phone or '—'}*\n"
                    f"📍 Город: {city or '—'}\n"
                    f"🏠 Адрес: {address or '—'}\n"
                    f"🔧 Тип: {object_type or '—'}\n"
                    f"💰 Сумма: *{total_fmt} ₽*\n"
                    "────────────────"
                )
                delivered = _send_to_max(
                    bot_token, chat_id, txt,
                    phone=phone or '', pdf_url=pdf_url
                ) if bot_token and chat_id else False

                cur.execute(
                    f"UPDATE leads SET delivered_to_max={delivered} WHERE id={lead_id}"
                )
                conn.commit()
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'ok': True, 'delivered': delivered})}

        # ── АВТОПОИСК CHAT_ID (по обновлениям и подпискам) ────────
        if action == 'chats' and method == 'GET':
            if not _auth_ok(event.get('headers'), conn):
                return {'statusCode': 401, 'headers': cors,
                        'body': json.dumps({'error': 'unauthorized'})}
            with conn.cursor() as cur:
                cur.execute("SELECT value FROM site_settings WHERE key='max_bot_token'")
                row = cur.fetchone()
                bot_token = (row[0] if row else '') or ''
            if not bot_token:
                return {'statusCode': 200, 'headers': cors,
                        'body': json.dumps({
                            'ok': False,
                            'error': 'no_token',
                            'message': 'Сначала сохраните токен бота',
                            'items': [],
                        })}

            # Проверим что токен валидный — запросим /me
            me = _max_get(bot_token, '/me')
            bot_info = {}
            if isinstance(me, dict) and me.get('user_id'):
                bot_info = {
                    'user_id':    me.get('user_id'),
                    'name':       me.get('name') or me.get('first_name') or '',
                    'username':   me.get('username') or '',
                }
            elif isinstance(me, dict) and me.get('code'):
                return {'statusCode': 200, 'headers': cors,
                        'body': json.dumps({
                            'ok': False,
                            'error': 'bad_token',
                            'message': me.get('message') or 'Неверный токен',
                            'items': [],
                        })}

            # Собираем чаты из 3 источников
            chats_map = {}

            def _push(cid, title, ctype, user_label=''):
                if cid is None or cid == '':
                    return
                key = str(cid)
                if key not in chats_map:
                    chats_map[key] = {
                        'chat_id': key,
                        'title': title or user_label or 'Без названия',
                        'type': ctype or 'unknown',
                        'last_message': '',
                        'last_user': user_label,
                    }
                else:
                    if user_label and not chats_map[key].get('last_user'):
                        chats_map[key]['last_user'] = user_label

            # 1) Подписки (чаты где бот состоит)
            subs = _max_get(bot_token, '/chats', {'count': 50})
            for c in (subs.get('chats') or []):
                _push(
                    c.get('chat_id'),
                    c.get('title') or '',
                    c.get('type') or 'chat',
                )

            # 2) Свежие обновления (личные сообщения боту от пользователей)
            ups = _max_get(bot_token, '/updates', {'limit': 100, 'types': 'message_created'})
            for u in (ups.get('updates') or []):
                msg = u.get('message') or {}
                rec = (msg.get('recipient') or {})
                sender = (msg.get('sender') or {})
                body = (msg.get('body') or {})
                cid = rec.get('chat_id') or rec.get('user_id') or sender.get('user_id')
                ctype = rec.get('chat_type') or ('dialog' if rec.get('user_id') else 'chat')
                title = ''
                user_label = (sender.get('name') or sender.get('first_name')
                              or sender.get('username') or '').strip()
                _push(cid, title, ctype, user_label)
                if cid is not None and str(cid) in chats_map:
                    last_text = (body.get('text') or '').strip()
                    if last_text:
                        chats_map[str(cid)]['last_message'] = last_text[:120]

            items = list(chats_map.values())
            # сначала диалоги, потом группы
            items.sort(key=lambda x: (0 if x['type'] == 'dialog' else 1, x['title']))

            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({
                        'ok': True,
                        'bot': bot_info,
                        'items': items,
                        'hint': 'Если список пуст — напишите боту /start в личку, '
                                'или добавьте его в групповой чат и отправьте любое сообщение.',
                    })}

        # ── ТЕСТОВОЕ СООБЩЕНИЕ В MAX ──────────────────────────────
        if action == 'test_max' and method == 'POST':
            if not _auth_ok(event.get('headers'), conn):
                return {'statusCode': 401, 'headers': cors,
                        'body': json.dumps({'error': 'unauthorized'})}
            body = json.loads(event.get('body') or '{}')
            target_chat = str(body.get('chat_id') or '').strip()
            with conn.cursor() as cur:
                cur.execute("SELECT key,value FROM site_settings")
                settings = {r[0]: r[1] for r in cur.fetchall()}
            bot_token = settings.get('max_bot_token') or ''
            chat_id = target_chat or settings.get('max_chat_id') or ''
            if not bot_token or not chat_id:
                return {'statusCode': 200, 'headers': cors,
                        'body': json.dumps({'ok': False, 'error': 'no_token_or_chat'})}
            ok = _send_to_max(
                bot_token, chat_id,
                "✅ *Тест соединения*\n────────────────\n"
                "Бот СтальГрупп подключён к этому чату.\n"
                "Заявки с сайта будут приходить сюда автоматически.",
                phone='', pdf_url=''
            )
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'ok': bool(ok)})}

        return {'statusCode': 400, 'headers': cors,
                'body': json.dumps({'error': 'unknown_action_or_method'})}
    finally:
        conn.close()