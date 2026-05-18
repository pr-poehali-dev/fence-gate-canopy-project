import json
import os
import urllib.request
import urllib.parse
import urllib.error
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


MAX_API_HOSTS = ('https://botapi.max.ru', 'https://platform-api.max.ru')


def _max_request(bot_token, method, path, params=None, json_body=None):
    """Универсальный запрос к MAX Bot API. Пытается оба домена и оба способа авторизации
    (Authorization-заголовок и ?access_token=...). Возвращает (status, dict)."""
    if not bot_token:
        return 0, {}
    body = None
    headers = {'Accept': 'application/json'}
    if json_body is not None:
        body = json.dumps(json_body, ensure_ascii=False).encode('utf-8')
        headers['Content-Type'] = 'application/json; charset=utf-8'

    last_status, last_data = 0, {}
    for host in MAX_API_HOSTS:
        for auth_mode in ('header', 'query'):
            try:
                qs = dict(params or {})
                hdrs = dict(headers)
                if auth_mode == 'header':
                    hdrs['Authorization'] = f'Bearer {bot_token}'
                else:
                    qs['access_token'] = bot_token
                query = ('?' + urllib.parse.urlencode(qs)) if qs else ''
                url = host + path + query
                req = urllib.request.Request(url, data=body, headers=hdrs, method=method)
                with urllib.request.urlopen(req, timeout=8) as resp:
                    raw = resp.read().decode('utf-8') or '{}'
                    try:
                        data = json.loads(raw)
                    except Exception:
                        data = {'raw': raw}
                    return resp.status, data
            except urllib.error.HTTPError as e:
                try:
                    raw = e.read().decode('utf-8') or '{}'
                    data = json.loads(raw) if raw else {}
                except Exception:
                    data = {}
                last_status, last_data = e.code, data
                # 401/403 — пробуем следующий способ; 5xx — следующий хост; 4xx прочие — выходим
                if e.code in (401, 403):
                    continue
                if 500 <= e.code < 600:
                    break  # пробуем другой хост
                return e.code, data
            except Exception as e:
                last_status, last_data = 0, {'error': str(e)}
                continue
    return last_status, last_data


def _max_get(bot_token, path, params=None):
    """GET-запрос к MAX Bot API. Возвращает dict или {} при ошибке."""
    _, data = _max_request(bot_token, 'GET', path, params=params)
    return data or {}


def _send_to_max(bot_token, chat_id, text, phone='', pdf_url=''):
    """Отправка сообщения через MAX Messenger Bot API.
    Возвращает (ok, info_text) — info попадает в логи и в ответ API.
    """
    if not bot_token:
        return False, 'no_token'
    if not chat_id:
        return False, 'no_chat_id'
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
        # chat_id новые API принимают как число
        try:
            cid_val = int(str(chat_id).strip())
        except Exception:
            cid_val = str(chat_id).strip()
        status, data = _max_request(
            bot_token, 'POST', '/messages',
            params={'chat_id': cid_val},
            json_body=payload,
        )
        ok = 200 <= status < 300
        info = f'status={status}'
        if isinstance(data, dict):
            err_code = data.get('code') or data.get('error') or ''
            err_msg = data.get('message') or data.get('description') or ''
            if err_code or err_msg:
                info = f'{info} code={err_code} msg={err_msg}'
        # печатаем в лог для отладки
        print(f'[MAX] send chat_id={cid_val}: {info}', flush=True)
        return ok, info
    except Exception as e:
        return False, f'exception: {e}'


def _normalize_phone_ru(phone):
    """Приводит телефон РФ к виду 79991234567 (11 цифр, без +). Возвращает '' если не получилось."""
    if not phone:
        return ''
    digits = ''.join(ch for ch in str(phone) if ch.isdigit())
    if not digits:
        return ''
    if len(digits) == 11 and digits[0] == '8':
        digits = '7' + digits[1:]
    if len(digits) == 10:
        digits = '7' + digits
    if len(digits) == 11 and digits[0] == '7':
        return digits
    return ''


def _find_client_chat_in_max(bot_token, phone, name=''):
    """Ищет личный чат клиента с ботом в MAX по совпадению телефона/имени
    в недавних входящих сообщениях боту. Возвращает chat_id (str) или ''.
    Сценарий: клиент написал боту хоть раз — мы можем ему ответить."""
    if not bot_token:
        return ''
    norm_phone = _normalize_phone_ru(phone)
    name_lc = (name or '').strip().lower()
    try:
        ups = _max_get(bot_token, '/updates', {'limit': 100, 'types': 'message_created'})
        for u in (ups.get('updates') or []):
            msg = u.get('message') or {}
            sender = msg.get('sender') or {}
            recipient = msg.get('recipient') or {}
            # Совпадение по нормализованному телефону (если MAX отдаёт)
            sender_phone = _normalize_phone_ru(sender.get('phone') or '')
            if norm_phone and sender_phone and sender_phone == norm_phone:
                cid = recipient.get('chat_id') or sender.get('user_id')
                if cid:
                    return str(cid)
            # Совпадение по имени (fallback)
            sender_name = (sender.get('name') or sender.get('first_name') or '').strip().lower()
            if name_lc and sender_name and name_lc in sender_name:
                cid = recipient.get('chat_id') or sender.get('user_id')
                if cid:
                    return str(cid)
    except Exception:
        pass
    return ''


def _notify_client_via_max(bot_token, client_chat_id, text):
    """Шлёт клиенту приветственное сообщение в личку MAX (без inline-кнопок).
    Возвращает (ok, info)."""
    if not bot_token or not client_chat_id:
        return False, 'no_chat'
    try:
        try:
            cid_val = int(str(client_chat_id).strip())
        except Exception:
            cid_val = str(client_chat_id).strip()
        status, data = _max_request(
            bot_token, 'POST', '/messages',
            params={'chat_id': cid_val},
            json_body={'text': text, 'format': 'markdown'},
        )
        ok = 200 <= status < 300
        info = f'status={status}'
        if isinstance(data, dict):
            err = data.get('code') or data.get('message') or ''
            if err:
                info += f' err={err}'
        return ok, info
    except Exception as e:
        return False, f'exception: {e}'


def _send_email_smtp(settings, subject, body_text, body_html=''):
    """Отправляет email через SMTP с параметрами из site_settings.
    settings — dict из site_settings. Возвращает (ok, info)."""
    if (settings.get('notify_email_enabled') or '').lower() not in ('true', '1', 'yes'):
        return False, 'email_disabled'
    to_addr = (settings.get('notify_email_to') or '').strip()
    smtp_host = (settings.get('smtp_host') or '').strip()
    smtp_user = (settings.get('smtp_user') or '').strip()
    smtp_pass = (settings.get('smtp_password') or '').strip()
    if not to_addr or not smtp_host or not smtp_user or not smtp_pass:
        return False, 'smtp_not_configured'
    try:
        smtp_port = int(settings.get('smtp_port') or '465')
    except Exception:
        smtp_port = 465
    from_name = (settings.get('smtp_from_name') or 'СтальГрупп').strip()

    try:
        import smtplib
        import ssl
        from email.message import EmailMessage
        from email.utils import formataddr

        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = formataddr((from_name, smtp_user))
        msg['To'] = to_addr
        msg.set_content(body_text)
        if body_html:
            msg.add_alternative(body_html, subtype='html')

        if smtp_port == 465:
            ctx = ssl.create_default_context()
            with smtplib.SMTP_SSL(smtp_host, smtp_port, context=ctx, timeout=10) as srv:
                srv.login(smtp_user, smtp_pass)
                srv.send_message(msg)
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as srv:
                srv.ehlo()
                try:
                    srv.starttls(context=ssl.create_default_context())
                    srv.ehlo()
                except Exception:
                    pass
                srv.login(smtp_user, smtp_pass)
                srv.send_message(msg)
        return True, 'sent'
    except Exception as e:
        return False, f'smtp_error: {e}'


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
        # Секретные ключи: всегда маскируются в ответах. В админке
        # отдаём пустую строку — пользователь видит, заполнено или нет.
        SECRET_KEYS = {'max_bot_token', 'smtp_password', 'smtp_user',
                       'notify_email_to'}
        # Эти ключи никогда не отдаём в публичных настройках сайта
        PRIVATE_KEYS = SECRET_KEYS | {
            'max_chat_id', 'manager_max_chat_id',
            'smtp_host', 'smtp_port', 'smtp_from_name',
            'notify_email_enabled', 'notify_client_via_max',
            'client_notify_text',
        }

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
                    items = {}
                    flags = {}
                    for k, v in rows:
                        if k in SECRET_KEYS:
                            # отдаём пустую строку, но флаг заполнено/нет
                            items[k] = ''
                            flags[k + '_set'] = bool(v and v.strip())
                        else:
                            items[k] = v
                    items.update(flags)
                    return {'statusCode': 200, 'headers': cors,
                            'body': json.dumps({'items': items})}

                with conn.cursor() as cur:
                    cur.execute("SELECT key, value FROM site_settings")
                    rows = cur.fetchall()
                items = {k: v for k, v in rows if k not in PRIVATE_KEYS}
                # флаги для фронта (есть ли активный бот)
                items['max_bot_active'] = any(
                    k == 'max_bot_token' and v and v.strip() for k, v in rows
                )
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
                        # для секретных полей: пустое значение НЕ затирает
                        # уже сохранённое (иначе админка с маской «••••» сломала бы)
                        if k in SECRET_KEYS and not v:
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

                if bot_token and chat_id:
                    delivered, max_info = _send_to_max(
                        bot_token, chat_id, txt, phone=phone, pdf_url=pdf_url
                    )
                else:
                    delivered, max_info = False, 'no_settings'

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

            is_event = (object_type or '').startswith('[')  # [КП скачано], [Прайс PDF] — без уведомлений
            company_phone = settings.get('company_phone') or '8 800 123-45-67'
            company_name  = settings.get('company_name')  or 'СтальГрупп'

            # ── Уведомление клиенту в MAX-боте (если бот знает клиента) ──
            client_ok = False
            client_info = 'skipped'
            client_chat_id = ''
            if (not is_event and phone and phone not in ('—', '-') and bot_token
                    and (settings.get('notify_client_via_max') or 'true').lower() in ('true', '1', 'yes')):
                client_chat_id = _find_client_chat_in_max(bot_token, phone, name)
                if client_chat_id:
                    tmpl = settings.get('client_notify_text') or (
                        '🟧 *{company_name}*\n'
                        'Ваша заявка *№{order_num}* принята!\n\n'
                        'Менеджер свяжется в течение 10 минут.\n'
                        'Срочно? {company_phone}'
                    )
                    notify_text = (tmpl
                        .replace('{order_num}', order_num or '—')
                        .replace('{company_phone}', company_phone)
                        .replace('{company_name}', company_name)
                        .replace('{name}', name or 'клиент')
                    )
                    client_ok, client_info = _notify_client_via_max(
                        bot_token, client_chat_id, notify_text
                    )
                else:
                    client_info = 'client_not_in_max'

            # ── Email-дублирование менеджеру ─────────────────────
            email_ok = False
            email_info = 'skipped'
            if not is_event:
                total_fmt2 = ('{:,}'.format(int(total))).replace(',', ' ')
                subject = f'[Заявка №{order_num}] {object_type or "СтальГрупп"}'
                text_body = (
                    f'Новая заявка с сайта {company_name}\n'
                    f'{"=" * 40}\n'
                    f'Номер заявки: {order_num or "—"}\n'
                    f'Имя:          {name or "—"}\n'
                    f'Телефон:      {phone or "—"}\n'
                    f'Город:        {city or "—"}\n'
                    f'Адрес:        {address or "—"}\n'
                    f'Тип/услуга:   {object_type or "—"}\n'
                    f'Сумма:        {total_fmt2} ₽\n'
                    f'{"=" * 40}\n'
                    f'Доставлено в MAX:   {"да" if delivered else "нет (" + str(max_info) + ")"}\n'
                    f'Уведомление клиенту: {"да" if client_ok else "нет (" + str(client_info) + ")"}\n'
                )
                html_body = (
                    f'<div style="font-family:Arial,sans-serif;max-width:600px">'
                    f'<div style="background:#f97316;color:#fff;padding:16px;border-radius:8px 8px 0 0">'
                    f'<h2 style="margin:0">🔔 Новая заявка</h2>'
                    f'<div style="opacity:.9;font-size:13px">{company_name}</div>'
                    f'</div>'
                    f'<div style="border:1px solid #eee;border-top:0;padding:20px;border-radius:0 0 8px 8px">'
                    f'<table style="width:100%;font-size:14px;border-collapse:collapse">'
                    f'<tr><td style="padding:6px 0;color:#888">№ заявки</td><td><b>{order_num}</b></td></tr>'
                    f'<tr><td style="padding:6px 0;color:#888">Имя</td><td><b>{name or "—"}</b></td></tr>'
                    f'<tr><td style="padding:6px 0;color:#888">Телефон</td><td><a href="tel:{phone}"><b>{phone or "—"}</b></a></td></tr>'
                    f'<tr><td style="padding:6px 0;color:#888">Город</td><td>{city or "—"}</td></tr>'
                    f'<tr><td style="padding:6px 0;color:#888">Адрес</td><td>{address or "—"}</td></tr>'
                    f'<tr><td style="padding:6px 0;color:#888">Тип/услуга</td><td>{object_type or "—"}</td></tr>'
                    f'<tr><td style="padding:6px 0;color:#888">Сумма</td><td style="color:#f97316"><b>{total_fmt2} ₽</b></td></tr>'
                    f'</table>'
                    f'<div style="margin-top:16px;font-size:12px;color:#888">'
                    f'MAX: {"✅ доставлено" if delivered else "❌ " + str(max_info)} · '
                    f'Уведомление клиенту: {"✅" if client_ok else "❌ " + str(client_info)}'
                    f'</div>'
                    f'</div></div>'
                )
                email_ok, email_info = _send_email_smtp(settings, subject, text_body, html_body)

            # Сохраняем флаги доставки в БД (sms_sent теперь означает "уведомлён в MAX")
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        f"UPDATE leads SET sms_sent={client_ok} WHERE id={lead_id}"
                    )
                    conn.commit()
            except Exception:
                pass

            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({
                        'ok': True,
                        'id': lead_id,
                        'order_num': order_num,
                        'delivered': delivered,
                        'max_info': max_info,
                        'client_notified': client_ok,
                        'client_info': client_info,
                        'email_sent': email_ok,
                        'email_info': email_info,
                    }, default=str)}

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
                if bot_token and chat_id:
                    delivered, max_info = _send_to_max(
                        bot_token, chat_id, txt,
                        phone=phone or '', pdf_url=pdf_url
                    )
                else:
                    delivered, max_info = False, 'no_settings'

                cur.execute(
                    f"UPDATE leads SET delivered_to_max={delivered} WHERE id={lead_id}"
                )
                conn.commit()
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'ok': True, 'delivered': delivered,
                                         'max_info': max_info}, default=str)}

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
            ok, info = _send_to_max(
                bot_token, chat_id,
                "✅ *Тест соединения*\n────────────────\n"
                "Бот СтальГрупп подключён к этому чату.\n"
                "Заявки с сайта будут приходить сюда автоматически.",
                phone='', pdf_url=''
            )
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'ok': bool(ok), 'info': info}, default=str)}

        # ── ТЕСТОВОЕ EMAIL-СООБЩЕНИЕ МЕНЕДЖЕРУ ────────────────────
        if action == 'test_email' and method == 'POST':
            if not _auth_ok(event.get('headers'), conn):
                return {'statusCode': 401, 'headers': cors,
                        'body': json.dumps({'error': 'unauthorized'})}
            with conn.cursor() as cur:
                cur.execute("SELECT key,value FROM site_settings")
                settings = {r[0]: r[1] for r in cur.fetchall()}
            # принудительно включаем для теста (минуя флаг)
            forced = dict(settings)
            forced['notify_email_enabled'] = 'true'
            ok, info = _send_email_smtp(
                forced,
                '[Тест] СтальГрупп: проверка email-уведомлений',
                'Это тестовое письмо подтверждает, что SMTP-настройки указаны верно. '
                'Заявки с сайта будут приходить на этот адрес автоматически.',
                '<div style="font-family:Arial,sans-serif"><h2 style="color:#f97316">✅ Тест SMTP пройден</h2>'
                '<p>SMTP-настройки указаны верно. Заявки будут приходить сюда.</p></div>'
            )
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'ok': bool(ok), 'info': info}, default=str)}

        return {'statusCode': 400, 'headers': cors,
                'body': json.dumps({'error': 'unknown_action_or_method'})}
    finally:
        conn.close()