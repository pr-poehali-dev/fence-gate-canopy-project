"""Integration with 1C.

GET    /?settings=1                  - read settings (admin)
POST   /?action=save_settings        - save settings (admin)
POST   /?action=push_lead            - push lead to 1C (admin)
POST   /?action=push_all_leads       - bulk push unsent leads (admin)
POST   /?action=webhook              - incoming webhook from 1C (HMAC by webhook_secret)
GET    /?log=1                       - sync log (admin, last 50)
GET    /?status=1                    - connection status (admin)
"""
import json
import os
import hmac
import hashlib
import base64
import urllib.request
import urllib.error
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Onec-Signature',
    'Access-Control-Max-Age': '86400',
}


def _resp(code, body):
    return {
        'statusCode': code,
        'headers': {**CORS, 'Content-Type': 'application/json; charset=utf-8'},
        'isBase64Encoded': False,
        'body': json.dumps(body, ensure_ascii=False, default=str),
    }


def _auth_ok(headers, conn):
    token = (headers or {}).get('X-Auth-Token') or (headers or {}).get('x-auth-token')
    if not token:
        return False
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM admin_sessions WHERE token=%s AND expires_at>NOW()", (token,))
        return cur.fetchone() is not None


def _safe(s, maxlen=255):
    return (str(s or '').replace("'", "''"))[:maxlen]


def _load_settings(cur):
    cur.execute(
        "SELECT base_url, username, password, webhook_secret, auto_sync_leads, "
        "auto_sync_prices, last_sync_at FROM onec_settings WHERE id=1"
    )
    r = cur.fetchone()
    if not r:
        return None
    return {
        'base_url': r[0], 'username': r[1], 'password': r[2],
        'webhook_secret': r[3], 'auto_sync_leads': r[4],
        'auto_sync_prices': r[5],
        'last_sync_at': r[6].isoformat() if r[6] else None,
    }


def _log_sync(cur, direction, entity_type, entity_id, status, payload, error=''):
    cur.execute(
        "INSERT INTO onec_sync_log (direction, entity_type, entity_id, status, payload, error_message) "
        "VALUES (%s,%s,%s,%s,%s,%s)",
        (direction, entity_type, str(entity_id or ''), status,
         json.dumps(payload or {}, ensure_ascii=False, default=str), error)
    )


def _push_to_onec(settings, endpoint, payload):
    """POST to 1C HTTP-service. Basic auth."""
    if not settings.get('base_url'):
        return False, 'no_base_url'
    base = settings['base_url'].rstrip('/')
    url = f"{base}/{endpoint.lstrip('/')}"
    body = json.dumps(payload, ensure_ascii=False, default=str).encode('utf-8')
    req = urllib.request.Request(url, data=body, method='POST')
    req.add_header('Content-Type', 'application/json; charset=utf-8')
    if settings.get('username'):
        creds = base64.b64encode(
            f"{settings['username']}:{settings['password']}".encode('utf-8')
        ).decode('ascii')
        req.add_header('Authorization', f'Basic {creds}')
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            text = resp.read().decode('utf-8', errors='replace')
            try:
                return True, json.loads(text)
            except Exception:
                return True, {'raw': text}
    except urllib.error.HTTPError as e:
        try:
            err_text = e.read().decode('utf-8', errors='replace')
        except Exception:
            err_text = str(e)
        return False, f'http_{e.code}: {err_text[:200]}'
    except Exception as e:
        return False, str(e)[:200]


def _verify_webhook_signature(headers, body_raw, secret):
    if not secret:
        return True
    sig = (headers or {}).get('X-Onec-Signature') or (headers or {}).get('x-onec-signature') or ''
    expected = hmac.new(secret.encode('utf-8'), body_raw.encode('utf-8'), hashlib.sha256).hexdigest()
    return hmac.compare_digest(sig.lower(), expected.lower())


def handler(event: dict, context) -> dict:
    """Интеграция сайта с программой 1С: настройки, отправка заявок, журнал."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    qs = event.get('queryStringParameters') or {}
    headers = event.get('headers') or {}
    body_raw = event.get('body') or ''
    try:
        body = json.loads(body_raw) if body_raw else {}
    except Exception:
        body = {}

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return _resp(500, {'error': 'no_database_url'})

    with psycopg2.connect(dsn) as conn:
        with conn.cursor() as cur:
            if method == 'GET':
                if qs.get('settings') in ('1', 'true'):
                    if not _auth_ok(headers, conn):
                        return _resp(401, {'error': 'unauthorized'})
                    settings = _load_settings(cur) or {}
                    safe = {**settings}
                    if safe.get('password'):
                        safe['password'] = '***'
                    return _resp(200, {'settings': safe})

                if qs.get('log') in ('1', 'true'):
                    if not _auth_ok(headers, conn):
                        return _resp(401, {'error': 'unauthorized'})
                    cur.execute(
                        "SELECT id, direction, entity_type, entity_id, status, error_message, created_at "
                        "FROM onec_sync_log ORDER BY id DESC LIMIT 50"
                    )
                    items = [
                        {
                            'id': r[0], 'direction': r[1], 'entity_type': r[2],
                            'entity_id': r[3], 'status': r[4], 'error': r[5],
                            'created_at': r[6].isoformat() if r[6] else None,
                        }
                        for r in cur.fetchall()
                    ]
                    return _resp(200, {'items': items})

                if qs.get('status') in ('1', 'true'):
                    if not _auth_ok(headers, conn):
                        return _resp(401, {'error': 'unauthorized'})
                    settings = _load_settings(cur) or {}
                    cur.execute(
                        "SELECT COUNT(*) FROM leads WHERE COALESCE(onec_id,'')=''"
                    )
                    unsent = cur.fetchone()[0]
                    cur.execute(
                        "SELECT COUNT(*) FROM onec_sync_log WHERE status='ok' "
                        "AND created_at > NOW() - INTERVAL '24 hours'"
                    )
                    ok_24h = cur.fetchone()[0]
                    cur.execute(
                        "SELECT COUNT(*) FROM onec_sync_log WHERE status='error' "
                        "AND created_at > NOW() - INTERVAL '24 hours'"
                    )
                    err_24h = cur.fetchone()[0]
                    return _resp(200, {
                        'configured': bool(settings.get('base_url')),
                        'last_sync_at': settings.get('last_sync_at'),
                        'unsent_leads': unsent,
                        'ok_24h': ok_24h,
                        'errors_24h': err_24h,
                    })

                return _resp(400, {'error': 'missing_param'})

            if method == 'POST':
                action = qs.get('action') or body.get('action') or ''

                if action == 'webhook':
                    settings = _load_settings(cur) or {}
                    secret = settings.get('webhook_secret') or ''
                    if not _verify_webhook_signature(headers, body_raw, secret):
                        return _resp(401, {'error': 'invalid_signature'})

                    entity = body.get('entity') or 'unknown'
                    eid = body.get('id') or ''
                    if entity == 'lead_status':
                        site_lead_id = body.get('site_lead_id') or 0
                        new_status = _safe(body.get('status'), 40)
                        if site_lead_id and new_status:
                            cur.execute(
                                "UPDATE leads SET status=%s WHERE id=%s",
                                (new_status, int(site_lead_id))
                            )
                    _log_sync(cur, 'in', entity, eid, 'ok', body)
                    conn.commit()
                    return _resp(200, {'ok': True})

                if not _auth_ok(headers, conn):
                    return _resp(401, {'error': 'unauthorized'})

                settings = _load_settings(cur) or {}

                if action == 'save_settings':
                    base_url = _safe(body.get('base_url'), 255)
                    username = _safe(body.get('username'), 120)
                    password = body.get('password')
                    if password == '***' or password is None:
                        password = settings.get('password', '')
                    password = _safe(password, 255)
                    webhook_secret = _safe(body.get('webhook_secret'), 128)
                    auto_leads = bool(body.get('auto_sync_leads', True))
                    auto_prices = bool(body.get('auto_sync_prices', False))
                    cur.execute(
                        "UPDATE onec_settings SET base_url=%s, username=%s, password=%s, "
                        "webhook_secret=%s, auto_sync_leads=%s, auto_sync_prices=%s, "
                        "updated_at=NOW() WHERE id=1",
                        (base_url, username, password, webhook_secret, auto_leads, auto_prices)
                    )
                    conn.commit()
                    return _resp(200, {'ok': True})

                if action == 'test_connection':
                    if not settings.get('base_url'):
                        return _resp(400, {'error': 'base_url_not_set'})
                    ok, info = _push_to_onec(settings, 'hs/site/ping', {'ping': True})
                    _log_sync(cur, 'out', 'ping', '', 'ok' if ok else 'error',
                              {'ping': True}, '' if ok else str(info))
                    conn.commit()
                    return _resp(200 if ok else 502, {'ok': ok, 'response': info})

                if action == 'push_lead':
                    lead_id = int(body.get('lead_id') or 0)
                    if not lead_id:
                        return _resp(400, {'error': 'lead_id_required'})
                    cur.execute(
                        "SELECT id, name, phone, message, source, city, address, object_type, "
                        "total_rub, order_num, payload, created_at "
                        "FROM leads WHERE id=%s", (lead_id,)
                    )
                    r = cur.fetchone()
                    if not r:
                        return _resp(404, {'error': 'lead_not_found'})
                    payload = {
                        'site_lead_id': r[0], 'name': r[1], 'phone': r[2],
                        'message': r[3] or '', 'source': r[4] or '',
                        'city': r[5] or '', 'address': r[6] or '',
                        'object_type': r[7] or '', 'total_rub': float(r[8] or 0),
                        'order_num': r[9] or '', 'extra': r[10] or {},
                        'created_at': r[11].isoformat() if r[11] else None,
                    }
                    ok, info = _push_to_onec(settings, 'hs/site/lead', payload)
                    if ok:
                        onec_id = (info or {}).get('id', '') if isinstance(info, dict) else ''
                        cur.execute(
                            "UPDATE leads SET onec_id=%s, onec_synced_at=NOW() WHERE id=%s",
                            (str(onec_id)[:64], lead_id)
                        )
                        cur.execute("UPDATE onec_settings SET last_sync_at=NOW() WHERE id=1")
                    _log_sync(cur, 'out', 'lead', lead_id, 'ok' if ok else 'error',
                              payload, '' if ok else str(info))
                    conn.commit()
                    return _resp(200 if ok else 502, {'ok': ok, 'response': info})

                if action == 'push_all_leads':
                    cur.execute(
                        "SELECT id FROM leads WHERE COALESCE(onec_id,'')='' ORDER BY id LIMIT 50"
                    )
                    ids = [r[0] for r in cur.fetchall()]
                    sent = 0
                    failed = 0
                    for lid in ids:
                        cur.execute(
                            "SELECT id, name, phone, message, source FROM leads WHERE id=%s", (lid,)
                        )
                        r = cur.fetchone()
                        if not r:
                            continue
                        payload = {
                            'site_lead_id': r[0], 'name': r[1], 'phone': r[2],
                            'message': r[3] or '', 'source': r[4] or '',
                        }
                        ok, info = _push_to_onec(settings, 'hs/site/lead', payload)
                        if ok:
                            onec_id = (info or {}).get('id', '') if isinstance(info, dict) else ''
                            cur.execute(
                                "UPDATE leads SET onec_id=%s, onec_synced_at=NOW() WHERE id=%s",
                                (str(onec_id)[:64], lid)
                            )
                            sent += 1
                        else:
                            failed += 1
                        _log_sync(cur, 'out', 'lead', lid, 'ok' if ok else 'error',
                                  payload, '' if ok else str(info))
                    cur.execute("UPDATE onec_settings SET last_sync_at=NOW() WHERE id=1")
                    conn.commit()
                    return _resp(200, {'ok': True, 'sent': sent, 'failed': failed})

                return _resp(400, {'error': 'unknown_action'})

            return _resp(405, {'error': 'method_not_allowed'})
