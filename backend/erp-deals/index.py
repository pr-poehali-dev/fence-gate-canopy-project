"""ERP — Сделки, Сметы, Документы (часть 2 ERP).

Эндпоинты:
  GET    /?action=deals                — список сделок (Kanban)
  POST   /?action=deals                — создать сделку (из лида или с нуля)
  GET    /?action=deal&id=N            — карточка сделки + сметы + документы + события
  PATCH  /?action=deal&id=N            — обновить сделку
  POST   /?action=estimate             — создать смету для сделки
  PATCH  /?action=estimate&id=N        — обновить смету
  POST   /?action=document             — сгенерировать документ (ТЗ, договор, акт и т.д.)
  GET    /?action=documents&deal=N     — список документов сделки
  PATCH  /?action=document&id=N        — обновить документ (статус, подпись)
  GET    /?action=materials            — каталог материалов
  GET    /?action=stats                — общая статистика по ERP

Все запросы требуют X-Erp-Token.
"""
import hashlib
import json
import os
import secrets
import psycopg2


def _safe(s, n=255):
    return (str(s or '').replace("'", "''"))[:n]


def _session(headers, conn):
    token = (headers or {}).get('X-Erp-Token') or (headers or {}).get('x-erp-token')
    if not token:
        return None, None, False
    with conn.cursor() as cur:
        cur.execute(
            "SELECT e.id, r.slug, r.is_owner "
            "FROM erp_sessions s "
            "JOIN erp_employees e ON e.id=s.employee_id AND e.is_active=TRUE "
            "LEFT JOIN erp_roles r ON r.id=e.role_id "
            "WHERE s.token=%s AND s.expires_at>NOW()",
            (token,)
        )
        row = cur.fetchone()
    if not row:
        return None, None, False
    return row[0], row[1], bool(row[2])


def _ev(conn, deal_id, employee_id, event_type, payload=None):
    """Записать событие в журнал."""
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO erp_deal_events (deal_id, employee_id, event_type, payload) "
            "VALUES (%s, %s, %s, %s::jsonb)",
            (deal_id, employee_id, event_type, json.dumps(payload or {}, ensure_ascii=False))
        )


def _resp(status, data):
    return {
        'statusCode': status,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps(data, ensure_ascii=False, default=str)
    }


def handler(event: dict, context) -> dict:
    """ERP-расширение: сделки, сметы, документы, материалы."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Erp-Token',
                'Access-Control-Max-Age': '86400',
            }, 'body': ''
        }

    qp = event.get('queryStringParameters') or {}
    action = qp.get('action', '')
    headers = event.get('headers') or {}
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return _resp(500, {'error': 'no DATABASE_URL'})

    body_raw = event.get('body') or '{}'
    try:
        body = json.loads(body_raw) if isinstance(body_raw, str) else (body_raw or {})
    except Exception:
        body = {}

    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    try:
        eid, role, owner = _session(headers, conn)
        if not eid:
            return _resp(401, {'error': 'unauthorized'})

        # ─────── DEALS ───────
        if action == 'deals' and method == 'GET':
            search = _safe(qp.get('q', ''), 100)
            status_filter = _safe(qp.get('status', ''), 40)
            mine = qp.get('mine') == '1'
            where = []
            if search:
                where.append(f"(d.client_name ILIKE '%{search}%' OR d.client_phone ILIKE '%{search}%' OR d.deal_num ILIKE '%{search}%')")
            if status_filter:
                where.append(f"d.status='{status_filter}'")
            if mine or role not in ('ceo', 'production', 'manager'):
                where.append(f"d.assigned_to={eid}")
            wsql = (' WHERE ' + ' AND '.join(where)) if where else ''
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT d.id, d.deal_num, d.client_name, d.client_phone, d.city, "
                    f"  d.service_type, d.status, d.total_rub, d.prepay_rub, d.paid_rub, "
                    f"  d.assigned_to, d.created_at, d.updated_at, d.install_date, "
                    f"  e.full_name "
                    f"FROM erp_deals d "
                    f"LEFT JOIN erp_employees e ON e.id=d.assigned_to "
                    f"{wsql} "
                    f"ORDER BY d.created_at DESC LIMIT 500"
                )
                rows = cur.fetchall()
            items = [{
                'id': r[0], 'deal_num': r[1], 'client_name': r[2], 'client_phone': r[3],
                'city': r[4], 'service_type': r[5], 'status': r[6],
                'total_rub': float(r[7] or 0), 'prepay_rub': float(r[8] or 0), 'paid_rub': float(r[9] or 0),
                'assigned_to': r[10], 'created_at': str(r[11]), 'updated_at': str(r[12]),
                'install_date': str(r[13]) if r[13] else None, 'assigned_name': r[14],
            } for r in rows]
            return _resp(200, {'items': items})

        if action == 'deals' and method == 'POST':
            client_name = _safe(body.get('client_name', ''), 255)
            if not client_name:
                return _resp(400, {'error': 'client_name required'})
            service_type = _safe(body.get('service_type', 'profnastil'), 64)
            client_phone = _safe(body.get('client_phone', ''), 64)
            client_email = _safe(body.get('client_email', ''), 255)
            client_address = _safe(body.get('client_address', ''), 512)
            city = _safe(body.get('city', ''), 128)
            lead_id = body.get('lead_id')
            notes = _safe(body.get('notes', ''), 2000)
            deal_num = f"СД-{secrets.token_hex(3).upper()}"
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO erp_deals (deal_num, lead_id, client_name, client_phone, "
                    "client_email, client_address, city, service_type, status, assigned_to, notes) "
                    "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,'tz_draft',%s,%s) RETURNING id",
                    (deal_num, lead_id, client_name, client_phone, client_email,
                     client_address, city, service_type, eid, notes)
                )
                new_id = cur.fetchone()[0]
            _ev(conn, new_id, eid, 'deal_created', {'deal_num': deal_num})
            return _resp(200, {'ok': True, 'id': new_id, 'deal_num': deal_num})

        if action == 'deal' and method == 'GET':
            did = int(qp.get('id', 0))
            if not did:
                return _resp(400, {'error': 'id required'})
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, deal_num, lead_id, client_name, client_phone, client_email, "
                    "client_address, city, service_type, status, total_rub, prepay_rub, "
                    "paid_rub, cost_rub, margin_rub, assigned_to, surveyor_id, installer_id, "
                    "start_date, install_date, finish_date, notes, meta, created_at, updated_at "
                    "FROM erp_deals WHERE id=%s", (did,)
                )
                r = cur.fetchone()
                if not r:
                    return _resp(404, {'error': 'not_found'})
                deal = {
                    'id': r[0], 'deal_num': r[1], 'lead_id': r[2], 'client_name': r[3],
                    'client_phone': r[4], 'client_email': r[5], 'client_address': r[6],
                    'city': r[7], 'service_type': r[8], 'status': r[9],
                    'total_rub': float(r[10] or 0), 'prepay_rub': float(r[11] or 0),
                    'paid_rub': float(r[12] or 0), 'cost_rub': float(r[13] or 0),
                    'margin_rub': float(r[14] or 0), 'assigned_to': r[15],
                    'surveyor_id': r[16], 'installer_id': r[17],
                    'start_date': str(r[18]) if r[18] else None,
                    'install_date': str(r[19]) if r[19] else None,
                    'finish_date': str(r[20]) if r[20] else None,
                    'notes': r[21] or '', 'meta': r[22] or {},
                    'created_at': str(r[23]), 'updated_at': str(r[24]),
                }
                # сметы
                cur.execute(
                    "SELECT id, version, title, total_rub, cost_rub, is_active, created_at, "
                    "params, items, totals "
                    "FROM erp_estimates WHERE deal_id=%s ORDER BY version DESC", (did,)
                )
                estimates = [{
                    'id': e[0], 'version': e[1], 'title': e[2],
                    'total_rub': float(e[3] or 0), 'cost_rub': float(e[4] or 0),
                    'is_active': e[5], 'created_at': str(e[6]),
                    'params': e[7] or {}, 'items': e[8] or [], 'totals': e[9] or {},
                } for e in cur.fetchall()]
                # документы
                cur.execute(
                    "SELECT id, doc_type, doc_num, title, status, pdf_url, created_at "
                    "FROM erp_documents WHERE deal_id=%s ORDER BY created_at DESC", (did,)
                )
                docs = [{
                    'id': d[0], 'doc_type': d[1], 'doc_num': d[2], 'title': d[3],
                    'status': d[4], 'pdf_url': d[5] or '', 'created_at': str(d[6]),
                } for d in cur.fetchall()]
                # события
                cur.execute(
                    "SELECT id, event_type, payload, employee_id, created_at "
                    "FROM erp_deal_events WHERE deal_id=%s ORDER BY created_at DESC LIMIT 50", (did,)
                )
                events = [{
                    'id': ev[0], 'event_type': ev[1], 'payload': ev[2] or {},
                    'employee_id': ev[3], 'created_at': str(ev[4]),
                } for ev in cur.fetchall()]
            return _resp(200, {'deal': deal, 'estimates': estimates, 'documents': docs, 'events': events})

        if action == 'deal' and method == 'PATCH':
            did = int(qp.get('id', 0))
            if not did:
                return _resp(400, {'error': 'id required'})
            allowed = ('status', 'assigned_to', 'surveyor_id', 'installer_id',
                       'install_date', 'start_date', 'finish_date', 'notes',
                       'prepay_rub', 'paid_rub', 'total_rub', 'cost_rub',
                       'client_address', 'city')
            sets = []
            for k in allowed:
                if k in body:
                    v = body[k]
                    if v is None:
                        sets.append(f"{k}=NULL")
                    elif isinstance(v, (int, float)):
                        sets.append(f"{k}={v}")
                    else:
                        sets.append(f"{k}='{_safe(v, 1000)}'")
            if not sets:
                return _resp(400, {'error': 'no_fields'})
            sets.append("updated_at=NOW()")
            with conn.cursor() as cur:
                cur.execute(f"UPDATE erp_deals SET {', '.join(sets)} WHERE id={did}")
            _ev(conn, did, eid, 'deal_updated', {'fields': list(body.keys())})
            return _resp(200, {'ok': True})

        # ─────── ESTIMATES ───────
        if action == 'estimate' and method == 'POST':
            deal_id = int(body.get('deal_id', 0))
            if not deal_id:
                return _resp(400, {'error': 'deal_id required'})
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT COALESCE(MAX(version),0) FROM erp_estimates WHERE deal_id=%s",
                    (deal_id,)
                )
                next_version = (cur.fetchone()[0] or 0) + 1
                params = json.dumps(body.get('params') or {}, ensure_ascii=False)
                items = json.dumps(body.get('items') or [], ensure_ascii=False)
                totals = json.dumps(body.get('totals') or {}, ensure_ascii=False)
                total_rub = float(body.get('total_rub') or 0)
                cost_rub = float(body.get('cost_rub') or 0)
                margin_pct = float(body.get('margin_pct') or 25)
                title = _safe(body.get('title', f'Смета v{next_version}'), 255)
                service_type = _safe(body.get('service_type', ''), 64)
                # Деактивируем старые сметы
                cur.execute("UPDATE erp_estimates SET is_active=FALSE WHERE deal_id=%s", (deal_id,))
                cur.execute(
                    "INSERT INTO erp_estimates (deal_id, version, title, service_type, "
                    "params, items, totals, total_rub, cost_rub, margin_pct, created_by) "
                    "VALUES (%s,%s,%s,%s,%s::jsonb,%s::jsonb,%s::jsonb,%s,%s,%s,%s) RETURNING id",
                    (deal_id, next_version, title, service_type, params, items, totals,
                     total_rub, cost_rub, margin_pct, eid)
                )
                est_id = cur.fetchone()[0]
                # Обновляем сделку
                cur.execute(
                    "UPDATE erp_deals SET total_rub=%s, cost_rub=%s, "
                    "margin_rub=%s, updated_at=NOW() WHERE id=%s",
                    (total_rub, cost_rub, total_rub - cost_rub, deal_id)
                )
            _ev(conn, deal_id, eid, 'estimate_created', {'estimate_id': est_id, 'version': next_version, 'total': total_rub})
            return _resp(200, {'ok': True, 'id': est_id, 'version': next_version})

        # ─────── DOCUMENTS ───────
        if action == 'document' and method == 'POST':
            deal_id = int(body.get('deal_id', 0))
            doc_type = _safe(body.get('doc_type', ''), 40)
            if not deal_id or not doc_type:
                return _resp(400, {'error': 'deal_id and doc_type required'})
            estimate_id = body.get('estimate_id')
            # Получим сделку и активную смету
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT deal_num, client_name, client_phone, client_address, "
                    "service_type, total_rub, prepay_rub FROM erp_deals WHERE id=%s",
                    (deal_id,)
                )
                d = cur.fetchone()
                if not d:
                    return _resp(404, {'error': 'deal_not_found'})
                est_data = None
                if estimate_id:
                    cur.execute(
                        "SELECT items, totals, params, total_rub FROM erp_estimates WHERE id=%s",
                        (estimate_id,)
                    )
                    er = cur.fetchone()
                    if er:
                        est_data = {'items': er[0], 'totals': er[1], 'params': er[2], 'total': float(er[3] or 0)}

                doc_num = f"{doc_type.upper()}-{secrets.token_hex(3).upper()}"
                title = body.get('title') or _doc_title(doc_type)
                content = _build_doc_content(doc_type, d, est_data, body)
                cur.execute(
                    "INSERT INTO erp_documents (deal_id, estimate_id, doc_type, doc_num, "
                    "title, status, content, created_by) "
                    "VALUES (%s,%s,%s,%s,%s,'draft',%s::jsonb,%s) RETURNING id",
                    (deal_id, estimate_id, doc_type, doc_num, title,
                     json.dumps(content, ensure_ascii=False), eid)
                )
                doc_id = cur.fetchone()[0]
            _ev(conn, deal_id, eid, 'doc_created', {'doc_id': doc_id, 'doc_type': doc_type, 'doc_num': doc_num})
            return _resp(200, {'ok': True, 'id': doc_id, 'doc_num': doc_num, 'content': content})

        if action == 'documents' and method == 'GET':
            deal_id = int(qp.get('deal', 0))
            if not deal_id:
                return _resp(400, {'error': 'deal required'})
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, doc_type, doc_num, title, status, content, pdf_url, "
                    "signed_at, signed_by, created_at FROM erp_documents "
                    "WHERE deal_id=%s ORDER BY created_at DESC", (deal_id,)
                )
                items = [{
                    'id': r[0], 'doc_type': r[1], 'doc_num': r[2], 'title': r[3],
                    'status': r[4], 'content': r[5] or {}, 'pdf_url': r[6] or '',
                    'signed_at': str(r[7]) if r[7] else None,
                    'signed_by': r[8] or '', 'created_at': str(r[9]),
                } for r in cur.fetchall()]
            return _resp(200, {'items': items})

        if action == 'document' and method == 'PATCH':
            doc_id = int(qp.get('id', 0))
            if not doc_id:
                return _resp(400, {'error': 'id required'})
            status_v = _safe(body.get('status', ''), 40)
            sets = []
            if status_v:
                sets.append(f"status='{status_v}'")
                if status_v == 'signed':
                    sets.append("signed_at=NOW()")
                    sb = _safe(body.get('signed_by', ''), 255)
                    if sb:
                        sets.append(f"signed_by='{sb}'")
            if 'content' in body:
                sets.append(f"content='{_safe(json.dumps(body['content'], ensure_ascii=False), 60000)}'::jsonb")
            if 'pdf_url' in body:
                sets.append(f"pdf_url='{_safe(body['pdf_url'], 500)}'")
            if not sets:
                return _resp(400, {'error': 'no_fields'})
            sets.append("updated_at=NOW()")
            with conn.cursor() as cur:
                cur.execute(f"UPDATE erp_documents SET {', '.join(sets)} WHERE id={doc_id}")
            return _resp(200, {'ok': True})

        # ─────── MATERIALS ───────
        if action == 'materials' and method == 'GET':
            cat = _safe(qp.get('category', ''), 64)
            wsql = f"WHERE category='{cat}' AND is_active=TRUE" if cat else "WHERE is_active=TRUE"
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id, sku, name, category, unit, price_buy, price_sell, meta "
                    f"FROM erp_materials {wsql} ORDER BY category, name"
                )
                items = [{
                    'id': r[0], 'sku': r[1], 'name': r[2], 'category': r[3],
                    'unit': r[4], 'price_buy': float(r[5] or 0),
                    'price_sell': float(r[6] or 0), 'meta': r[7] or {},
                } for r in cur.fetchall()]
            return _resp(200, {'items': items})

        # ─────── STATS ───────
        if action == 'stats' and method == 'GET':
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT COUNT(*), COALESCE(SUM(total_rub),0), "
                    "COALESCE(SUM(CASE WHEN status='handover' THEN total_rub ELSE 0 END),0), "
                    "COUNT(CASE WHEN status NOT IN ('handover','cancelled') THEN 1 END), "
                    "COALESCE(SUM(CASE WHEN status NOT IN ('handover','cancelled') THEN total_rub ELSE 0 END),0) "
                    "FROM erp_deals"
                )
                row = cur.fetchone()
                cur.execute("SELECT COUNT(*), COALESCE(SUM(total_rub),0) FROM leads")
                lead_row = cur.fetchone()
            return _resp(200, {
                'deals_total': row[0],
                'revenue_total': float(row[1] or 0),
                'revenue_won': float(row[2] or 0),
                'deals_active': row[3],
                'pipeline_value': float(row[4] or 0),
                'leads_total': lead_row[0],
                'leads_value': float(lead_row[1] or 0),
            })

        return _resp(400, {'error': f'unknown action: {action}'})
    finally:
        conn.close()


def _doc_title(doc_type):
    return {
        'tz': 'Техническое задание',
        'contract': 'Договор',
        'invoice_prepay': 'Счёт на предоплату',
        'invoice_final': 'Счёт на остаток',
        'act_start': 'Акт начала работ',
        'act_handover': 'Акт приёма-передачи',
        'scheme': 'Схема монтажа',
        'order_production': 'Наряд на производство',
        'order_measure': 'Наряд на замер',
        'order_install': 'Наряд на монтаж',
        'estimate_pdf': 'Коммерческое предложение',
    }.get(doc_type, 'Документ')


def _build_doc_content(doc_type, deal_row, est_data, body):
    """Сборка содержимого документа для последующей печати/PDF."""
    deal_num, client_name, client_phone, client_address, service_type, total_rub, prepay_rub = deal_row
    base = {
        'company': {
            'name': 'ООО «СтальГрупп»',
            'inn': '5027262145',
            'kpp': '502701001',
            'address': 'г. Люберцы, ул. Котельническая, д. 18, оф. 14',
            'phone': '+7 (800) 123-45-67',
            'email': 'info@stalgrupp.ru',
            'bank': 'ПАО «Сбербанк России»',
            'rs': '40702810038000123456',
            'ks': '30101810400000000225',
            'bik': '044525225',
        },
        'deal_num': deal_num,
        'client': {
            'name': client_name,
            'phone': client_phone,
            'address': client_address,
        },
        'service_type': service_type,
        'total_rub': float(total_rub or 0),
        'prepay_rub': float(prepay_rub or 0),
        'remainder_rub': float(total_rub or 0) - float(prepay_rub or 0),
        'date': body.get('date'),
    }
    if est_data:
        base['items'] = est_data['items']
        base['totals'] = est_data['totals']
        base['params'] = est_data['params']
    # Доп. поля по типу документа
    if doc_type == 'invoice_prepay':
        amount = float(body.get('amount') or (float(total_rub or 0) * 0.5))
        base['amount'] = amount
        base['purpose'] = f'Предоплата 50% по договору №{deal_num}'
    if doc_type == 'invoice_final':
        amount = float(body.get('amount') or base['remainder_rub'])
        base['amount'] = amount
        base['purpose'] = f'Окончательный расчёт по договору №{deal_num}'
    if doc_type == 'contract':
        base['warranty_years'] = 3
        base['terms'] = body.get('terms') or 'Стандартные условия СтальГрупп'
    if doc_type == 'tz':
        base['tasks'] = body.get('tasks') or []
        base['measurements'] = body.get('measurements') or {}
    if doc_type == 'act_start':
        base['start_date'] = body.get('start_date')
        base['team'] = body.get('team') or []
    if doc_type == 'act_handover':
        base['handover_date'] = body.get('handover_date')
        base['warranty_years'] = 3
    if doc_type == 'scheme':
        base['scheme_url'] = body.get('scheme_url') or ''
        base['notes'] = body.get('notes') or ''
    if doc_type.startswith('order_'):
        base['team'] = body.get('team') or []
        base['scheduled_date'] = body.get('scheduled_date')
        base['instructions'] = body.get('instructions') or ''
    return base
