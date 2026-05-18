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


MAX_API_HOSTS = ('https://platform-api.max.ru', 'https://botapi.max.ru')


def _max_request(bot_token, method, path, params=None, json_body=None):
    """Запрос к MAX Bot API (актуальный формат с октября 2025).

    Авторизация: HTTP-заголовок ``Authorization: <token>`` БЕЗ префикса Bearer.
    Это подтверждено официальной документацией dev.max.ru/docs-api.

    Перебирает оба домена API. Возвращает (status, dict).
    """
    if not bot_token:
        return 0, {'error': 'no_token'}

    # Чистим токен от случайных пробелов/кавычек/префикса Bearer
    bot_token = str(bot_token).strip().strip('"').strip("'")
    if bot_token.lower().startswith('bearer '):
        bot_token = bot_token[7:].strip()

    body = None
    # КЛЮЧЕВОЙ МОМЕНТ: MAX требует ИМЕННО `Authorization: <token>` без "Bearer"
    headers = {
        'Accept': 'application/json',
        'Authorization': bot_token,
        'User-Agent': 'StalgrupSite/1.0',
    }
    if json_body is not None:
        body = json.dumps(json_body, ensure_ascii=False).encode('utf-8')
        headers['Content-Type'] = 'application/json; charset=utf-8'

    last_status, last_data = 0, {}
    for host in MAX_API_HOSTS:
        try:
            qs = dict(params or {})
            query = ('?' + urllib.parse.urlencode(qs)) if qs else ''
            url = host + path + query
            req = urllib.request.Request(url, data=body, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=8) as resp:
                raw = resp.read().decode('utf-8') or '{}'
                try:
                    data = json.loads(raw)
                except Exception:
                    data = {'raw': raw}
                return resp.status, data
        except urllib.error.HTTPError as e:
            try:
                raw_err = e.read().decode('utf-8') or '{}'
                data = json.loads(raw_err) if raw_err else {}
            except Exception:
                data = {}
            last_status, last_data = e.code, data
            # 5xx или сетевые ошибки — пробуем другой хост; всё остальное возвращаем как есть
            if 500 <= e.code < 600:
                continue
            return e.code, data
        except urllib.error.URLError as e:
            last_status, last_data = 0, {'error': f'network: {e.reason}'}
            continue
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
        # MAX поддерживает в inline_keyboard ТОЛЬКО http/https-ссылки.
        # tel: ссылки вызывают 400 — поэтому телефон уже включаем в текст
        # (там он кликабелен), а в кнопках оставляем только PDF КП.
        buttons = []
        if pdf_url and pdf_url.startswith(('http://', 'https://')):
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
    """Находит / создаёт личный чат клиента с ботом в MAX по номеру телефона.

    Поиск производится не только по тем, кто писал боту, а **активно**:
      1) GET  /users/by_phone?phone=79991234567       (если есть в публичном API)
      2) GET  /users/search?query=+7999…              (поиск по поисковику MAX)
      3) GET  /contacts/by_phone?phone=…              (контакты бота)
      4) POST /chats { "user_phone": "79991234567" }  (создать диалог с пользователем)
      5) GET  /chats — пробег по существующим диалогам бота
      6) GET  /updates — fallback (если клиент писал боту)

    После того как найден user_id — пытаемся открыть/получить диалог через
       POST /chats { "user_id": ... } или GET /chats/by_user/{user_id}.

    Возвращает chat_id (str) или ''.
    """
    if not bot_token:
        return ''
    norm_phone = _normalize_phone_ru(phone)
    name_lc = (name or '').strip().lower()

    def _phone_match(p) -> bool:
        return bool(norm_phone) and _normalize_phone_ru(p) == norm_phone

    # ── helper: открыть диалог с user_id (если ещё не существует) ────
    def _ensure_chat_with_user(uid):
        if not uid:
            return ''
        # Пробуем несколько эндпоинтов «создать/получить личный диалог»
        for path, body in [
            ('/chats',                {'user_id': uid}),
            ('/chats',                {'user_ids': [uid]}),
            ('/dialogs',              {'user_id': uid}),
            (f'/chats/by_user/{uid}', None),
        ]:
            try:
                if body is None:
                    status, data = _max_request(bot_token, 'GET', path)
                else:
                    status, data = _max_request(bot_token, 'POST', path, json_body=body)
                if 200 <= status < 300 and isinstance(data, dict):
                    cid = (data.get('chat_id') or data.get('id')
                           or (data.get('chat') or {}).get('chat_id')
                           or (data.get('chat') or {}).get('id'))
                    if cid:
                        print(f'[MAX] opened chat with user {uid} via {path}: {cid}', flush=True)
                        return str(cid)
            except Exception:
                pass
        # Если все попытки провалились — отдаём user_id как chat_id (в личке MAX это работает)
        return str(uid)

    # ── 1) Прямой поиск пользователя по номеру ──────────────────────
    if norm_phone:
        plus_phone = '+' + norm_phone
        candidates_endpoints = [
            ('/users/by_phone',       {'phone': norm_phone}),
            ('/users/by_phone',       {'phone': plus_phone}),
            ('/users/search',         {'query': plus_phone}),
            ('/users/search',         {'q':     plus_phone}),
            ('/contacts/by_phone',    {'phone': norm_phone}),
            ('/contacts/search',      {'phone': norm_phone}),
        ]
        for path, params in candidates_endpoints:
            try:
                status, data = _max_request(bot_token, 'GET', path, params=params)
                if not (200 <= status < 300) or not isinstance(data, dict):
                    continue
                # Возможные форматы ответа: {user: {...}}, {users: [...]}, {...}
                users = []
                if isinstance(data.get('users'), list):
                    users = data['users']
                elif isinstance(data.get('items'), list):
                    users = data['items']
                elif isinstance(data.get('user'), dict):
                    users = [data['user']]
                elif data.get('user_id') or data.get('id'):
                    users = [data]
                for u in users:
                    if not isinstance(u, dict):
                        continue
                    if _phone_match(u.get('phone') or u.get('phone_number') or ''):
                        uid = u.get('user_id') or u.get('id')
                        if uid:
                            cid = _ensure_chat_with_user(uid)
                            if cid:
                                print(f'[MAX] found user by {path}: uid={uid} -> chat_id={cid}', flush=True)
                                return cid
            except Exception as e:
                print(f'[MAX] lookup {path} failed: {e}', flush=True)

    # ── 2) Создать диалог напрямую по номеру (без user_id) ─────────
    if norm_phone:
        for path, body in [
            ('/chats', {'user_phone': norm_phone}),
            ('/chats', {'phone':      norm_phone}),
            ('/chats', {'user_phone': '+' + norm_phone}),
            ('/dialogs', {'phone':    norm_phone}),
        ]:
            try:
                status, data = _max_request(bot_token, 'POST', path, json_body=body)
                if 200 <= status < 300 and isinstance(data, dict):
                    cid = (data.get('chat_id') or data.get('id')
                           or (data.get('chat') or {}).get('chat_id'))
                    if cid:
                        print(f'[MAX] created direct chat by phone via {path}: {cid}', flush=True)
                        return str(cid)
            except Exception:
                pass

    # ── 3) Пройтись по существующим чатам бота ─────────────────────
    try:
        chats_resp = _max_get(bot_token, '/chats', {'count': 100})
        for ch in (chats_resp.get('chats') or []):
            chat_type = (ch.get('type') or '').lower()
            if chat_type and chat_type not in ('dialog', 'private', 'chat'):
                continue
            cid = ch.get('chat_id') or ch.get('id')
            if not cid:
                continue
            participants = ch.get('participants') or ch.get('members') or []
            if isinstance(participants, dict):
                participants = list(participants.values())
            owner = ch.get('owner') or ch.get('dialog_with') or {}
            candidates = list(participants) + ([owner] if owner else [])
            for p in candidates:
                if not isinstance(p, dict):
                    continue
                if _phone_match(p.get('phone') or p.get('phone_number') or ''):
                    print(f'[MAX] found existing chat by phone match: {cid}', flush=True)
                    return str(cid)
                if not norm_phone and name_lc:
                    pn = (p.get('name') or p.get('first_name') or '').strip().lower()
                    if pn and name_lc in pn:
                        return str(cid)
    except Exception as e:
        print(f'[MAX] /chats scan failed: {e}', flush=True)

    # ── 4) Fallback: те, кто писал боту ─────────────────────────────
    try:
        ups = _max_get(bot_token, '/updates', {'limit': 100, 'types': 'message_created'})
        for u in (ups.get('updates') or []):
            msg = u.get('message') or {}
            sender = msg.get('sender') or msg.get('from') or {}
            recipient = msg.get('recipient') or msg.get('chat') or {}
            sender_phone = sender.get('phone') or sender.get('phone_number') or ''
            if _phone_match(sender_phone):
                cid = (recipient.get('chat_id') or recipient.get('id')
                       or sender.get('user_id') or sender.get('id'))
                if cid:
                    print(f'[MAX] found chat by /updates phone match: {cid}', flush=True)
                    return str(cid)
            if not norm_phone and name_lc:
                sender_name = (sender.get('name') or sender.get('first_name') or '').strip().lower()
                if sender_name and name_lc in sender_name:
                    cid = (recipient.get('chat_id') or recipient.get('id')
                           or sender.get('user_id') or sender.get('id'))
                    if cid:
                        return str(cid)
    except Exception as e:
        print(f'[MAX] /updates fallback failed: {e}', flush=True)

    # ── 5) Подписки бота ────────────────────────────────────────────
    try:
        subs = _max_get(bot_token, '/subscriptions', {})
        for s in (subs.get('subscriptions') or []):
            if _phone_match(s.get('phone') or s.get('phone_number') or ''):
                cid = s.get('chat_id') or s.get('user_id')
                if cid:
                    print(f'[MAX] found chat by /subscriptions phone match: {cid}', flush=True)
                    return str(cid)
    except Exception as e:
        print(f'[MAX] /subscriptions fallback failed: {e}', flush=True)

    print(f'[MAX] client not found in MAX by phone={norm_phone} name={name_lc}', flush=True)
    return ''


def _notify_client_via_max(bot_token, client_chat_id, text, pdf_url=''):
    """Шлёт клиенту приветственное сообщение в личку MAX.
    Если задан pdf_url — прикрепляет inline-кнопку «📄 Открыть КП в PDF».
    Возвращает (ok, info)."""
    if not bot_token or not client_chat_id:
        return False, 'no_chat'
    try:
        try:
            cid_val = int(str(client_chat_id).strip())
        except Exception:
            cid_val = str(client_chat_id).strip()
        payload = {'text': text, 'format': 'markdown'}
        if pdf_url and pdf_url.startswith(('http://', 'https://')):
            payload['attachments'] = [{
                'type': 'inline_keyboard',
                'payload': {'buttons': [[
                    {'type': 'link', 'text': '📄 Открыть КП в PDF', 'url': pdf_url}
                ]]}
            }]
        status, data = _max_request(
            bot_token, 'POST', '/messages',
            params={'chat_id': cid_val},
            json_body=payload,
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


def _send_crm_webhook(settings, lead_data):
    """Отправляет данные заявки на webhook CRM (amoCRM/Bitrix24/generic).
    Возвращает (ok, info)."""
    if (settings.get('crm_webhook_enabled') or '').lower() not in ('true', '1', 'yes'):
        return False, 'disabled'
    url = (settings.get('crm_webhook_url') or '').strip()
    if not url or not url.startswith(('http://', 'https://')):
        return False, 'no_url'
    wtype = (settings.get('crm_webhook_type') or 'generic').lower()
    secret = (settings.get('crm_webhook_secret') or '').strip()

    # Формат payload зависит от типа CRM
    if wtype == 'amocrm':
        # https://www.amocrm.ru/developers/content/crm_platform/leads-api
        payload = {
            'add': [{
                'name': lead_data.get('object_type') or 'Заявка с сайта',
                'price': int(lead_data.get('total_rub') or 0),
                'custom_fields_values': [
                    {'field_code': 'PHONE', 'values': [{'value': lead_data.get('phone'), 'enum_code': 'WORK'}]},
                    {'field_code': 'EMAIL', 'values': [{'value': lead_data.get('email') or ''}]},
                ],
                '_embedded': {
                    'contacts': [{
                        'first_name': lead_data.get('name'),
                        'custom_fields_values': [
                            {'field_code': 'PHONE', 'values': [{'value': lead_data.get('phone'), 'enum_code': 'WORK'}]}
                        ]
                    }],
                    'tags': [{'name': 'Сайт'}],
                },
            }]
        }
    elif wtype == 'bitrix24':
        # Bitrix24 inbound webhook: crm.lead.add
        payload = {
            'fields': {
                'TITLE':   f'Заявка №{lead_data.get("order_num")} — {lead_data.get("object_type")}',
                'NAME':    lead_data.get('name'),
                'PHONE':   [{'VALUE': lead_data.get('phone'), 'VALUE_TYPE': 'WORK'}],
                'EMAIL':   [{'VALUE': lead_data.get('email') or '', 'VALUE_TYPE': 'WORK'}],
                'ADDRESS': lead_data.get('address') or '',
                'ADDRESS_CITY':    lead_data.get('city') or '',
                'OPPORTUNITY':     int(lead_data.get('total_rub') or 0),
                'COMMENTS':        lead_data.get('object_type') or '',
                'SOURCE_ID':       'WEB',
                'STATUS_ID':       'NEW',
            }
        }
    else:
        # generic — отправляем как есть
        payload = lead_data

    try:
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        hdrs = {
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json',
            'User-Agent': 'StalgrupSite/1.0',
        }
        if secret:
            hdrs['X-Webhook-Secret'] = secret
        req = urllib.request.Request(url, data=body, headers=hdrs, method='POST')
        with urllib.request.urlopen(req, timeout=8) as resp:
            return (200 <= resp.status < 300), f'status={resp.status}'
    except urllib.error.HTTPError as e:
        return False, f'http_{e.code}'
    except Exception as e:
        return False, f'error: {e}'[:200]


def _render_template(tmpl, ctx):
    """Подставляет {key} из ctx в tmpl. Пустые ключи → '—'."""
    if not tmpl:
        return ''
    out = tmpl
    for k, v in (ctx or {}).items():
        out = out.replace('{' + k + '}', str(v if v not in (None, '') else '—'))
    return out


def _collect_emails(*sources):
    """Собирает уникальные email из нескольких источников (строки через запятую/перенос)."""
    seen, out = set(), []
    for src in sources:
        if not src:
            continue
        for raw in str(src).replace(';', ',').replace('\n', ',').split(','):
            e = raw.strip()
            if e and '@' in e and e.lower() not in seen:
                seen.add(e.lower())
                out.append(e)
    return out


def _send_sms_smsru(phone, text):
    """SMS клиенту через sms.ru. Возвращает (ok, info).
    Если SMSRU_API_ID не задан — тихо возвращает (False, причина)."""
    api_id = (os.environ.get('SMSRU_API_ID') or '').strip()
    if not api_id:
        return False, 'no_api_id'
    num = _normalize_phone_ru(phone)
    if not num:
        return False, 'bad_phone'
    try:
        qs = urllib.parse.urlencode({
            'api_id': api_id, 'to': num, 'msg': text, 'json': '1',
        })
        req = urllib.request.Request('https://sms.ru/sms/send?' + qs)
        with urllib.request.urlopen(req, timeout=8) as resp:
            raw = resp.read().decode('utf-8') or '{}'
            try:
                data = json.loads(raw)
            except Exception:
                data = {'raw': raw}
            status = (data.get('status') or '').upper()
            if status == 'OK':
                return True, 'sent'
            return False, str(data)[:200]
    except Exception as e:
        return False, f'sms_error: {e}'


def _send_email_smtp(settings, subject, body_text, body_html='',
                     to_addrs=None, force_enabled=False,
                     pdf_base64='', pdf_filename=''):
    """Отправляет email через SMTP. to_addrs может быть list/str.
    force_enabled=True позволяет отправить даже если notify_email_enabled=false (для тестов).
    pdf_base64: если задан — будет прикреплён к письму как PDF-вложение.
    pdf_filename: имя файла вложения (по умолчанию "КП.pdf")."""
    if not force_enabled and (settings.get('notify_email_enabled') or '').lower() not in ('true', '1', 'yes'):
        return False, 'email_disabled'

    # Нормализуем получателей в список
    if to_addrs is None:
        to_addrs = settings.get('notify_email_to') or ''
    if isinstance(to_addrs, str):
        recipients = _collect_emails(to_addrs)
    else:
        recipients = _collect_emails(','.join(str(x) for x in to_addrs))
    if not recipients:
        return False, 'no_recipients'

    smtp_host = (settings.get('smtp_host') or '').strip()
    smtp_user = (settings.get('smtp_user') or '').strip()
    smtp_pass = (settings.get('smtp_password') or '').strip()
    if not smtp_host or not smtp_user or not smtp_pass:
        return False, 'smtp_not_configured'
    try:
        smtp_port = int(settings.get('smtp_port') or '465')
    except Exception:
        smtp_port = 465
    from_name = (settings.get('smtp_from_name') or 'СтальГрупп').strip()

    try:
        import smtplib
        import ssl
        import base64 as _b64
        from email.message import EmailMessage
        from email.utils import formataddr

        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = formataddr((from_name, smtp_user))
        msg['To'] = ', '.join(recipients)
        msg.set_content(body_text or '')
        if body_html:
            msg.add_alternative(body_html, subtype='html')

        # ── PDF-вложение (опционально) ─────────────────────────────
        if pdf_base64:
            try:
                raw_b64 = pdf_base64
                if ',' in raw_b64:
                    _, raw_b64 = raw_b64.split(',', 1)
                pdf_bytes = _b64.b64decode(raw_b64)
                fname = (pdf_filename or 'КП.pdf').strip() or 'КП.pdf'
                if not fname.lower().endswith('.pdf'):
                    fname += '.pdf'
                msg.add_attachment(
                    pdf_bytes,
                    maintype='application',
                    subtype='pdf',
                    filename=fname,
                )
            except Exception as e:
                # Не падаем — отправим письмо без вложения
                print(f'PDF attach failed: {e}')

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
        return True, f'sent to {len(recipients)}'
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
        # Секретные ключи: всегда маскируются. В админке отдаём пустую
        # строку + флаг {key}_set, чтобы UI знал — заполнено или нет.
        SECRET_KEYS = {'max_bot_token', 'smtp_password', 'smtp_user',
                       'notify_email_to', 'manager_emails',
                       'crm_webhook_url', 'crm_webhook_secret'}
        # Эти ключи никогда не отдаём в публичных настройках сайта
        PRIVATE_KEYS = SECRET_KEYS | {
            'max_chat_id', 'manager_max_chat_id',
            'smtp_host', 'smtp_port', 'smtp_from_name',
            'notify_email_enabled', 'notify_client_via_max',
            'client_notify_text',
            'notify_manager_max', 'notify_manager_email',
            'notify_client_email', 'notify_client_sms',
            'manager_max_template', 'manager_email_subject',
            'client_email_subject', 'client_email_html',
            'client_sms_template',
            'crm_webhook_enabled', 'crm_webhook_type',
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
            # email клиента может прийти явно или внутри payload
            client_email = (body.get('email') or (payload.get('email') if isinstance(payload, dict) else '') or '').strip()[:200]

            pdf_url = _upload_pdf_to_s3(pdf_b64, order_num) if pdf_b64 else ''

            with conn.cursor() as cur:
                cur.execute("SELECT key, value FROM site_settings")
                settings = {r[0]: r[1] for r in cur.fetchall()}

            bot_token     = settings.get('max_bot_token') or ''
            chat_id       = settings.get('max_chat_id') or ''
            company_phone = settings.get('company_phone') or '8 800 123-45-67'
            company_name  = settings.get('company_name')  or 'СтальГрупп'
            company_email = settings.get('company_email') or ''
            total_fmt = ('{:,}'.format(int(total))).replace(',', ' ')
            is_event = (object_type or '').startswith('[')  # [КП скачано] — без уведомлений клиенту

            # Контекст для всех шаблонов
            ctx = {
                'order_num':     order_num or '—',
                'name':          name or 'клиент',
                'phone':         phone or '—',
                'city':          city or '—',
                'address':       address or '—',
                'object_type':   object_type or '—',
                'total':         total_fmt,
                'total_rub':     total_fmt,
                'email':         client_email or '—',
                'company_name':  company_name,
                'company_phone': company_phone,
                'company_email': company_email,
            }

            def _tgl(key, default='true'):
                return (settings.get(key) or default).lower() in ('true', '1', 'yes', 'on')

            # ── 1) Сообщение менеджеру в MAX ────────────────────
            delivered, max_info = False, 'skipped'
            if not is_event and _tgl('notify_manager_max', 'true') and bot_token and chat_id:
                tmpl_max_mgr = settings.get('manager_max_template') or (
                    '🔔 *НОВАЯ ЗАЯВКА — {company_name}*\n'
                    '────────────────\n'
                    '📋 № заказа: `{order_num}`\n'
                    '👤 Имя: *{name}*\n'
                    '📱 Телефон: *{phone}*\n'
                    '📍 Город: {city}\n'
                    '🏠 Адрес: {address}\n'
                    '🔧 Тип: {object_type}\n'
                    '💰 Сумма: *{total} ₽*\n'
                    '────────────────'
                )
                txt = _render_template(tmpl_max_mgr, ctx)
                delivered, max_info = _send_to_max(
                    bot_token, chat_id, txt, phone=phone, pdf_url=pdf_url
                )

            # Сохраняем заявку
            with conn.cursor() as cur:
                safe_name  = name.replace("'", "''")
                safe_phone = phone.replace("'", "''")
                safe_city  = city.replace("'", "''")
                safe_addr  = address.replace("'", "''")
                safe_ot    = object_type.replace("'", "''")
                safe_on    = order_num.replace("'", "''")
                safe_em    = client_email.replace("'", "''")
                payload_str = json.dumps(payload, ensure_ascii=False).replace("'", "''")
                cur.execute(
                    f"INSERT INTO leads(order_num,name,phone,city,address,object_type,"
                    f"total_rub,payload_json,delivered_to_max,client_email) "
                    f"VALUES('{safe_on}','{safe_name}','{safe_phone}','{safe_city}',"
                    f"'{safe_addr}','{safe_ot}',{total},'{payload_str}'::jsonb,{delivered},'{safe_em}') "
                    f"RETURNING id"
                )
                lead_id = cur.fetchone()[0]
                conn.commit()

            # ── 2) Уведомление клиенту в MAX (если найден чат) ──
            client_max_ok, client_max_info = False, 'skipped'
            if (not is_event and phone and phone not in ('—', '-') and bot_token
                    and _tgl('notify_client_via_max', 'true')):
                client_chat_id = _find_client_chat_in_max(bot_token, phone, name)
                if client_chat_id:
                    tmpl_max_client = settings.get('client_notify_text') or (
                        '🟧 *{company_name}*\n'
                        'Ваша заявка *№{order_num}* принята!\n\n'
                        'Менеджер свяжется в течение 10 минут.\n'
                        'Срочно? {company_phone}'
                    )
                    notify_text = _render_template(tmpl_max_client, ctx)
                    client_max_ok, client_max_info = _notify_client_via_max(
                        bot_token, client_chat_id, notify_text, pdf_url=pdf_url
                    )
                else:
                    client_max_info = 'client_not_in_max'

            # ── 3) Email менеджеру (несколько адресов через запятую) ──
            mgr_email_ok, mgr_email_info = False, 'skipped'
            if not is_event and _tgl('notify_manager_email', 'true'):
                subj_tmpl = settings.get('manager_email_subject') or '[Заявка №{order_num}] {object_type}'
                subject = _render_template(subj_tmpl, ctx)
                text_body = (
                    f'Новая заявка с сайта {company_name}\n'
                    f'{"=" * 40}\n'
                    f'Номер заявки: {ctx["order_num"]}\n'
                    f'Имя:          {ctx["name"]}\n'
                    f'Телефон:      {ctx["phone"]}\n'
                    f'Email:        {ctx["email"]}\n'
                    f'Город:        {ctx["city"]}\n'
                    f'Адрес:        {ctx["address"]}\n'
                    f'Тип/услуга:   {ctx["object_type"]}\n'
                    f'Сумма:        {ctx["total"]} ₽\n'
                    f'{"=" * 40}\n'
                    f'MAX менеджеру:    {"да" if delivered else "нет (" + str(max_info) + ")"}\n'
                    f'MAX клиенту:      {"да" if client_max_ok else "нет (" + str(client_max_info) + ")"}\n'
                    + (f'КП (PDF): {pdf_url}\n' if pdf_url else '')
                    + ('PDF КП приложен к письму.\n' if pdf_b64 else '')
                )
                html_body = (
                    f'<div style="font-family:Arial,sans-serif;max-width:600px">'
                    f'<div style="background:#f97316;color:#fff;padding:16px;border-radius:8px 8px 0 0">'
                    f'<h2 style="margin:0">🔔 Новая заявка</h2>'
                    f'<div style="opacity:.9;font-size:13px">{company_name}</div>'
                    f'</div>'
                    f'<div style="border:1px solid #eee;border-top:0;padding:20px;border-radius:0 0 8px 8px">'
                    f'<table style="width:100%;font-size:14px;border-collapse:collapse">'
                    f'<tr><td style="padding:6px 0;color:#888">№ заявки</td><td><b>{ctx["order_num"]}</b></td></tr>'
                    f'<tr><td style="padding:6px 0;color:#888">Имя</td><td><b>{ctx["name"]}</b></td></tr>'
                    f'<tr><td style="padding:6px 0;color:#888">Телефон</td><td><a href="tel:{phone}"><b>{ctx["phone"]}</b></a></td></tr>'
                    f'<tr><td style="padding:6px 0;color:#888">Email</td><td>{ctx["email"]}</td></tr>'
                    f'<tr><td style="padding:6px 0;color:#888">Город</td><td>{ctx["city"]}</td></tr>'
                    f'<tr><td style="padding:6px 0;color:#888">Адрес</td><td>{ctx["address"]}</td></tr>'
                    f'<tr><td style="padding:6px 0;color:#888">Тип/услуга</td><td>{ctx["object_type"]}</td></tr>'
                    f'<tr><td style="padding:6px 0;color:#888">Сумма</td><td style="color:#f97316"><b>{ctx["total"]} ₽</b></td></tr>'
                    f'</table>'
                    f'<div style="margin-top:16px;font-size:12px;color:#888">'
                    f'MAX мен.: {"✅" if delivered else "❌ " + str(max_info)} · '
                    f'MAX клиенту: {"✅" if client_max_ok else "❌ " + str(client_max_info)}'
                    f'</div>'
                    f'</div></div>'
                )
                # Несколько адресов: manager_emails + старое notify_email_to
                recipients = _collect_emails(
                    settings.get('manager_emails'), settings.get('notify_email_to')
                )
                if recipients:
                    # Прикрепляем PDF КП, если есть
                    pdf_fname = f'KP-{order_num}.pdf' if order_num else 'КП.pdf'
                    mgr_email_ok, mgr_email_info = _send_email_smtp(
                        settings, subject, text_body, html_body, to_addrs=recipients,
                        force_enabled=True,
                        pdf_base64=pdf_b64,
                        pdf_filename=pdf_fname,
                    )
                else:
                    mgr_email_info = 'no_recipients'

            # ── 4) Email клиенту ─────────────────────────────────
            # Правило: КП клиенту уходит в MAX, если найден в MAX.
            # Если в MAX не нашли — отправляем КП на email (как резервный канал).
            cli_email_ok, cli_email_info = False, 'skipped'
            should_email_client = (
                not is_event
                and client_email and '@' in client_email
                and _tgl('notify_client_email', 'true')
                and not client_max_ok   # email — только если MAX не доставлен
            )
            if not should_email_client and client_max_ok:
                cli_email_info = 'sent_via_max'
            if should_email_client:
                subj_c = _render_template(
                    settings.get('client_email_subject') or 'Ваша заявка №{order_num} принята — {company_name}',
                    ctx
                )
                html_base = settings.get('client_email_html') or (
                    '<p>Здравствуйте, <b>{name}</b>!</p>'
                    '<p>Ваша заявка <b>№{order_num}</b> принята.</p>'
                    '<p>Менеджер свяжется в течение 15 минут.</p>'
                    '<p>Срочно: {company_phone}</p>'
                )
                if pdf_url:
                    html_base += (
                        f'<p style="margin-top:16px"><a href="{pdf_url}" '
                        f'style="display:inline-block;background:#f97316;color:#fff;'
                        f'padding:10px 18px;border-radius:8px;text-decoration:none;'
                        f'font-weight:bold">📄 Открыть КП в PDF</a></p>'
                    )
                elif pdf_b64:
                    html_base += '<p style="color:#666;font-size:13px">📎 Коммерческое предложение приложено к письму в формате PDF.</p>'
                html_c = _render_template(html_base, ctx)
                text_c = (
                    f'Здравствуйте, {ctx["name"]}!\n\n'
                    f'Ваша заявка №{ctx["order_num"]} принята.\n'
                    f'Менеджер свяжется в течение 15 минут.\n\n'
                    + (f'Коммерческое предложение (PDF): {pdf_url}\n\n' if pdf_url else '')
                    + ('Файл КП приложен к этому письму.\n\n' if pdf_b64 else '')
                    + f'Срочно: {company_phone}\n'
                    + f'— {company_name}'
                )
                pdf_fname_cli = f'КП-{order_num}.pdf' if order_num else 'КП.pdf'
                cli_email_ok, cli_email_info = _send_email_smtp(
                    settings, subj_c, text_c, html_c, to_addrs=[client_email],
                    force_enabled=True,
                    pdf_base64=pdf_b64,
                    pdf_filename=pdf_fname_cli,
                )

            # ── 5) SMS клиенту через sms.ru ─────────────────────
            sms_ok, sms_info = False, 'skipped'
            if not is_event and _tgl('notify_client_sms', 'false') and phone:
                sms_tmpl = settings.get('client_sms_template') or (
                    '{company_name}: заявка №{order_num} принята. '
                    'Менеджер свяжется в 15 мин. Срочно? {company_phone}'
                )
                sms_text = _render_template(sms_tmpl, ctx)
                sms_ok, sms_info = _send_sms_smsru(phone, sms_text)

            # ── 6) CRM webhook ──────────────────────────────────
            crm_ok, crm_info = False, 'skipped'
            if not is_event:
                lead_for_crm = {
                    'order_num':   order_num,
                    'name':        name,
                    'phone':       phone,
                    'email':       client_email,
                    'city':        city,
                    'address':     address,
                    'object_type': object_type,
                    'total_rub':   total,
                    'source':      'website',
                    'page_url':    (payload or {}).get('page_url', '') if isinstance(payload, dict) else '',
                }
                crm_ok, crm_info = _send_crm_webhook(settings, lead_for_crm)

            # Сохраняем флаги доставки в БД
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        f"UPDATE leads SET sms_sent={client_max_ok}, "
                        f"client_email_sent={cli_email_ok}, "
                        f"client_sms_sent={sms_ok}, "
                        f"manager_email_sent={mgr_email_ok} "
                        f"WHERE id={lead_id}"
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
                        'client_notified': client_max_ok,
                        'client_info': client_max_info,
                        'email_sent': mgr_email_ok,
                        'email_info': mgr_email_info,
                        'client_email_sent': cli_email_ok,
                        'client_email_info': cli_email_info,
                        'client_sms_sent': sms_ok,
                        'client_sms_info': sms_info,
                        'crm_sent': crm_ok,
                        'crm_info': crm_info,
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
            body = json.loads(event.get('body') or '{}')
            custom_to = (body.get('to') or '').strip()
            with conn.cursor() as cur:
                cur.execute("SELECT key,value FROM site_settings")
                settings = {r[0]: r[1] for r in cur.fetchall()}
            # принудительно включаем для теста + используем все источники
            recipients = _collect_emails(custom_to) if custom_to else _collect_emails(
                settings.get('manager_emails'), settings.get('notify_email_to')
            )
            if not recipients:
                return {'statusCode': 200, 'headers': cors,
                        'body': json.dumps({'ok': False, 'info': 'no_recipients',
                                             'message': 'Укажите email или сохраните "Email менеджеров"'})}
            ok, info = _send_email_smtp(
                settings,
                '[Тест] СтальГрупп: проверка email-уведомлений',
                'Это тестовое письмо подтверждает, что SMTP-настройки указаны верно. '
                'Заявки с сайта будут приходить на этот адрес автоматически.',
                '<div style="font-family:Arial,sans-serif"><h2 style="color:#f97316">✅ Тест SMTP пройден</h2>'
                '<p>SMTP-настройки указаны верно. Заявки будут приходить сюда.</p></div>',
                to_addrs=recipients, force_enabled=True,
            )
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'ok': bool(ok), 'info': info,
                                         'recipients': recipients}, default=str)}

        # ── ТЕСТОВАЯ SMS ──────────────────────────────────────────
        if action == 'test_sms' and method == 'POST':
            if not _auth_ok(event.get('headers'), conn):
                return {'statusCode': 401, 'headers': cors,
                        'body': json.dumps({'error': 'unauthorized'})}
            body = json.loads(event.get('body') or '{}')
            phone = (body.get('phone') or '').strip()
            if not phone:
                return {'statusCode': 200, 'headers': cors,
                        'body': json.dumps({'ok': False, 'info': 'no_phone',
                                             'message': 'Укажите телефон для теста'})}
            ok, info = _send_sms_smsru(
                phone,
                'Тест SMS от СтальГрупп. Если получили — SMS-канал работает корректно.'
            )
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'ok': bool(ok), 'info': info}, default=str)}

        # ── ПОИСК КЛИЕНТА В MAX ПО НОМЕРУ ─────────────────────────
        # Используется в админке для проверки: «Найдёт ли бот клиента в MAX
        # по этому номеру до того, как тот оформит заявку?»
        # POST /?action=find_max_user  body={"phone": "+79991234567", "send_test": false}
        if action == 'find_max_user' and method == 'POST':
            if not _auth_ok(event.get('headers'), conn):
                return {'statusCode': 401, 'headers': cors,
                        'body': json.dumps({'error': 'unauthorized'})}
            body = json.loads(event.get('body') or '{}')
            phone_raw = (body.get('phone') or '').strip()
            send_test = bool(body.get('send_test') or False)
            with conn.cursor() as cur:
                cur.execute("SELECT value FROM site_settings WHERE key='max_bot_token'")
                row = cur.fetchone()
                bot_token = (row[0] if row else '') or ''
            if not bot_token:
                return {'statusCode': 200, 'headers': cors,
                        'body': json.dumps({
                            'ok': False, 'found': False,
                            'error': 'no_token',
                            'message': 'Сначала сохраните токен MAX-бота в настройках',
                        })}
            norm_phone = _normalize_phone_ru(phone_raw)
            if not norm_phone:
                return {'statusCode': 200, 'headers': cors,
                        'body': json.dumps({
                            'ok': False, 'found': False,
                            'error': 'bad_phone',
                            'message': 'Введите корректный номер РФ',
                            'phone_normalized': norm_phone,
                        })}
            chat_id = _find_client_chat_in_max(bot_token, norm_phone, name='')
            result = {
                'ok': True,
                'found': bool(chat_id),
                'phone_normalized': '+' + norm_phone,
                'chat_id': chat_id or '',
            }
            if chat_id:
                result['message'] = f'Клиент найден в MAX. chat_id={chat_id}'
                if send_test:
                    ok, info = _send_to_max(
                        bot_token, chat_id,
                        '✅ *Тест поиска*\n'
                        '────────────────\n'
                        f'Здравствуйте! Это тестовое сообщение от СтальГрупп.\n'
                        'Ваш номер найден в MAX — мы сможем присылать вам КП в личку.',
                        phone='', pdf_url=''
                    )
                    result['test_sent'] = bool(ok)
                    result['test_info'] = info
            else:
                result['message'] = (
                    'Клиент с этим номером не найден в MAX. '
                    'Возможные причины: пользователь не зарегистрирован в MAX, '
                    'скрыл телефон в настройках приватности, или MAX Bot API '
                    'не отдаёт его в выдаче. Заявка такому клиенту будет отправлена на email.'
                )
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps(result, default=str, ensure_ascii=False)}

        return {'statusCode': 400, 'headers': cors,
                'body': json.dumps({'error': 'unknown_action_or_method'})}
    finally:
        conn.close()