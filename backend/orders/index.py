"""CRM-заказы: список, создание, обновление, статистика, табло по датам.

GET    /?action=list&status=all          — список заказов (+ фильтр статуса)
GET    /?action=stats                     — сводка: суммы, кол-во по статусам, выгода
GET    /?action=board                     — табло: заказы сгруппированы по дате монтажа (7 дней)
POST   /?action=upsert  body={order}      — создать/обновить заказ
POST   /?action=from_lead body={lead_id}  — создать заказ из заявки
POST   /?action=status  body={id,status}  — сменить статус
DELETE /?id=N                             — удалить заказ
Все методы (кроме OPTIONS) требуют X-Auth-Token админа.
"""
import json
import os
import urllib.request
import urllib.parse
from datetime import date, timedelta

import psycopg2


def _cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
    }


def _resp(status, data):
    return {'statusCode': status, 'headers': {**_cors(), 'Content-Type': 'application/json'},
            'body': json.dumps(data, ensure_ascii=False, default=str)}


def _auth_ok(headers, conn):
    token = (headers or {}).get('X-Auth-Token') or (headers or {}).get('x-auth-token')
    if not token:
        return False
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM admin_sessions WHERE token=%s AND expires_at>NOW()", (token,))
        return cur.fetchone() is not None


ORDER_COLS = ('id', 'order_num', 'client_name', 'client_phone', 'address', 'object_type',
              'source', 'status', 'montage_date', 'total_rub', 'materials_cost', 'fot',
              'profit', 'paid_rub', 'comment', 'items_json', 'lead_id', 'created_at')


def _row_to_dict(r):
    d = dict(zip(ORDER_COLS, r))
    for k in ('total_rub', 'materials_cost', 'fot', 'profit', 'paid_rub'):
        d[k] = float(d[k] or 0)
    if d.get('montage_date'):
        d['montage_date'] = d['montage_date'].isoformat()
    if d.get('created_at'):
        d['created_at'] = d['created_at'].isoformat()
    return d


STATUS_TEXT = {
    'new': 'принята в работу 🆕',
    'measure': 'переведена на этап замера 📐',
    'contract': 'договор согласован 📝',
    'production': 'передана в производство 🏭',
    'montage': 'передана в монтаж 🔧',
    'done': 'выполнена ✅',
    'archive': 'перемещена в архив 📦',
    'cancelled': 'отменена ❌',
}


def _notify_client_status(conn, order_num, phone, status):
    """Уведомляет клиента в MAX о смене статуса заявки.

    Находит chat_id клиента в истории диалогов бота по телефону, берёт токен
    бота из настроек и отправляет сообщение. Тихо пропускает, если данных нет.
    """
    try:
        import urllib.request
        digits = ''.join(ch for ch in (phone or '') if ch.isdigit())
        if len(digits) < 10:
            return False
        with conn.cursor() as cur:
            cur.execute("SELECT value FROM site_settings WHERE key='max_bot_token'")
            r = cur.fetchone()
            token = r[0] if r else ''
            if not token:
                return False
            cur.execute(
                "SELECT chat_id FROM bot_dialogs "
                "WHERE regexp_replace(client_phone,'[^0-9]','','g') LIKE %s "
                "AND chat_id <> '' ORDER BY last_at DESC LIMIT 1", ('%' + digits[-10:],))
            cr = cur.fetchone()
            if not cr or not cr[0]:
                return False
            chat_id = cr[0]
        phrase = STATUS_TEXT.get(status, f'обновлена: {status}')
        text = f'🔔 Ваша заявка {order_num} {phrase}.\nЕсли есть вопросы — напишите нам, мы на связи.'
        token = str(token).strip().strip('"').strip("'")
        if token.lower().startswith('bearer '):
            token = token[7:].strip()
        cid = int(chat_id) if str(chat_id).lstrip('-').isdigit() else chat_id
        payload = json.dumps({'text': text, 'format': 'markdown'},
                             ensure_ascii=False).encode('utf-8')
        headers = {
            'Accept': 'application/json',
            'Authorization': token,
            'Content-Type': 'application/json; charset=utf-8',
            'User-Agent': 'StalgrupSite/1.0',
        }
        query = '?' + urllib.parse.urlencode({'chat_id': cid})
        # перебираем оба домена MAX API
        for host in ('https://platform-api.max.ru', 'https://botapi.max.ru'):
            try:
                req = urllib.request.Request(host + '/messages' + query,
                                             data=payload, method='POST', headers=headers)
                with urllib.request.urlopen(req, timeout=8) as resp:
                    if 200 <= resp.status < 300:
                        return True
            except Exception:
                continue
        return False
    except Exception:
        return False


def handler(event, context):
    """CRM-заказы: CRUD, статистика и табло по датам монтажа."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': _cors(), 'body': ''}

    qp = event.get('queryStringParameters') or {}
    action = qp.get('action', 'list')
    conn = psycopg2.connect(os.environ['DATABASE_URL'])

    try:
        if not _auth_ok(event.get('headers'), conn):
            return _resp(401, {'error': 'unauthorized'})

        sel = "SELECT " + ", ".join(ORDER_COLS) + " FROM orders"

        if method == 'GET' and action == 'list':
            status_f = qp.get('status') or 'all'
            with conn.cursor() as cur:
                if status_f and status_f != 'all':
                    safe = ''.join(ch for ch in status_f if ch.isalpha())
                    cur.execute(sel + f" WHERE status='{safe}' ORDER BY created_at DESC LIMIT 500")
                else:
                    cur.execute(sel + " ORDER BY created_at DESC LIMIT 500")
                items = [_row_to_dict(r) for r in cur.fetchall()]
            return _resp(200, {'items': items})

        if method == 'GET' and action == 'stats':
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT status, COUNT(*), COALESCE(SUM(total_rub),0), "
                    "COALESCE(SUM(profit),0) FROM orders GROUP BY status"
                )
                by_status = {}
                tot_sum = tot_profit = tot_cnt = 0
                for st, cnt, s, p in cur.fetchall():
                    by_status[st] = {'count': cnt, 'sum': float(s), 'profit': float(p)}
                    if st not in ('archive', 'cancelled'):
                        tot_cnt += cnt
                        tot_sum += float(s)
                        tot_profit += float(p)
            return _resp(200, {'by_status': by_status, 'active_count': tot_cnt,
                               'active_sum': tot_sum, 'active_profit': tot_profit})

        if method == 'GET' and action == 'board':
            today = date.today()
            days = []
            with conn.cursor() as cur:
                for i in range(7):
                    d = today + timedelta(days=i)
                    cur.execute(
                        sel + " WHERE montage_date=%s AND status NOT IN ('archive','cancelled') "
                        "ORDER BY created_at", (d,)
                    )
                    orders = [_row_to_dict(r) for r in cur.fetchall()]
                    days.append({'date': d.isoformat(), 'orders': orders, 'count': len(orders)})
                # заказы без даты, но в активной работе
                cur.execute(
                    sel + " WHERE montage_date IS NULL AND status NOT IN "
                    "('archive','cancelled','done') ORDER BY created_at"
                )
                no_date = [_row_to_dict(r) for r in cur.fetchall()]
            return _resp(200, {'days': days, 'no_date': no_date})

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')

            if action == 'from_lead':
                lead_id = int(body.get('lead_id') or 0)
                if not lead_id:
                    return _resp(400, {'error': 'lead_id required'})
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT order_num,name,phone,address,object_type,total_rub,payload_json "
                        "FROM leads WHERE id=%s", (lead_id,)
                    )
                    row = cur.fetchone()
                    if not row:
                        return _resp(404, {'error': 'lead_not_found'})
                    onum, name, phone, addr, otype, total, payload = row
                    econ = (payload or {}).get('economics', {}) if isinstance(payload, dict) else {}
                    items = (payload or {}).get('items', []) if isinstance(payload, dict) else []
                    cur.execute(
                        "INSERT INTO orders(order_num,client_name,client_phone,address,object_type,"
                        "source,status,total_rub,materials_cost,fot,profit,items_json,lead_id) "
                        "VALUES(%s,%s,%s,%s,%s,'сайт','new',%s,%s,%s,%s,%s,%s) RETURNING id",
                        (onum or '', name or '', phone or '', addr or '', otype or '',
                         float(total or 0), float(econ.get('materialsCost') or 0),
                         float(econ.get('fot') or 0), float(econ.get('profit') or 0),
                         json.dumps(items, ensure_ascii=False), lead_id)
                    )
                    new_id = cur.fetchone()[0]
                    conn.commit()
                return _resp(200, {'ok': True, 'id': new_id})

            if action == 'status':
                oid = int(body.get('id') or 0)
                status = ''.join(ch for ch in (body.get('status') or '') if ch.isalpha())
                if not oid or not status:
                    return _resp(400, {'error': 'id_and_status required'})
                with conn.cursor() as cur:
                    cur.execute("UPDATE orders SET status=%s, updated_at=NOW() WHERE id=%s "
                                "RETURNING order_num, client_phone", (status, oid))
                    row = cur.fetchone()
                    conn.commit()
                notified = False
                if row:
                    notified = _notify_client_status(conn, row[0], row[1], status)
                return _resp(200, {'ok': True, 'client_notified': notified})

            if action == 'upsert':
                oid = int(body.get('id') or 0)
                fields = {
                    'order_num': body.get('order_num') or '',
                    'client_name': body.get('client_name') or '',
                    'client_phone': body.get('client_phone') or '',
                    'address': body.get('address') or '',
                    'object_type': body.get('object_type') or '',
                    'source': body.get('source') or 'manual',
                    'status': ''.join(ch for ch in (body.get('status') or 'new') if ch.isalpha()),
                    'total_rub': float(body.get('total_rub') or 0),
                    'materials_cost': float(body.get('materials_cost') or 0),
                    'fot': float(body.get('fot') or 0),
                    'profit': float(body.get('profit') or 0),
                    'paid_rub': float(body.get('paid_rub') or 0),
                    'comment': body.get('comment') or '',
                }
                montage = body.get('montage_date') or None
                items = json.dumps(body.get('items') or [], ensure_ascii=False)
                with conn.cursor() as cur:
                    if oid:
                        sets = ", ".join(f"{k}=%s" for k in fields)
                        cur.execute(
                            f"UPDATE orders SET {sets}, montage_date=%s, items_json=%s, "
                            f"updated_at=NOW() WHERE id=%s",
                            (*fields.values(), montage, items, oid)
                        )
                        conn.commit()
                        return _resp(200, {'ok': True, 'id': oid})
                    cols = ", ".join(fields.keys())
                    ph = ", ".join(['%s'] * len(fields))
                    cur.execute(
                        f"INSERT INTO orders({cols}, montage_date, items_json) "
                        f"VALUES({ph}, %s, %s) RETURNING id",
                        (*fields.values(), montage, items)
                    )
                    new_id = cur.fetchone()[0]
                    conn.commit()
                return _resp(200, {'ok': True, 'id': new_id})

            return _resp(400, {'error': 'unknown_action'})

        if method == 'DELETE':
            oid = int(qp.get('id') or 0)
            if not oid:
                return _resp(400, {'error': 'id required'})
            with conn.cursor() as cur:
                cur.execute("DELETE FROM orders WHERE id=%s", (oid,))
                conn.commit()
            return _resp(200, {'ok': True})

        return _resp(400, {'error': 'unknown_action_or_method'})
    finally:
        conn.close()