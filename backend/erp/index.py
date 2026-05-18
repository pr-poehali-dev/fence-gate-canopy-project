"""ERP — управление сотрудниками, ролями, заявками, воронкой продаж.

Эндпоинты:
  POST   /?action=login           — вход сотрудника (login/password) → token
  GET    /?action=me              — текущий пользователь (по X-Erp-Token)
  POST   /?action=logout
  GET    /?action=employees       — список сотрудников (только для ceo)
  POST   /?action=employees       — создать сотрудника (только для ceo)
  PUT    /?action=employees&id=N  — обновить
  POST   /?action=employees&id=N&pwd=1 — сбросить пароль (вернёт новый)
  GET    /?action=roles           — список ролей
  GET    /?action=funnel&slug=sales — воронка + этапы
  GET    /?action=board&funnel=sales  — Kanban: заявки по этапам (с фильтром по сотруднику)
  PATCH  /?action=lead&id=N       — обновить заявку (стадия, ассайн, заметки)
  POST   /?action=lead_note&id=N  — добавить комментарий
  GET    /?action=lead_events&id=N — история заявки
"""
import hashlib
import json
import os
import secrets
import psycopg2


def _h(p):
    """Хэш пароля sha256(password + salt)."""
    return hashlib.sha256((str(p) + 'stalgrupp_salt').encode()).hexdigest()


def _safe(s, n=200):
    return (str(s or '').replace("'", "''"))[:n]


def _session(headers, conn):
    """Возвращает (employee_id, role_slug, is_owner) или (None, None, False)."""
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


def _require_owner(headers, conn):
    eid, role, owner = _session(headers, conn)
    if not eid:
        return None, ('unauthorized', 401)
    if not owner:
        return None, ('forbidden', 403)
    return eid, None


def handler(event: dict, context) -> dict:
    """ERP — управление сотрудниками, заявками, воронками продаж."""
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
    cors = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
    qp = event.get('queryStringParameters') or {}
    action = qp.get('action', '')
    headers = event.get('headers') or {}
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)

    try:
        # ── LOGIN ─────────────────────────────────────────
        if action == 'login' and method == 'POST':
            body = json.loads(event.get('body') or '{}')
            login = (body.get('login') or '').strip()[:60]
            password = (body.get('password') or '').strip()[:200]
            if not login or not password:
                return {'statusCode': 400, 'headers': cors,
                        'body': json.dumps({'error': 'login_and_password_required'})}
            with conn.cursor() as cur:
                # ищем по логину
                sl = login.replace("'", "''")
                cur.execute(
                    f"SELECT e.id, e.password_hash, e.full_name, e.is_active, r.slug, r.is_owner "
                    f"FROM erp_employees e LEFT JOIN erp_roles r ON r.id=e.role_id "
                    f"WHERE LOWER(e.login)=LOWER('{sl}') LIMIT 1"
                )
                row = cur.fetchone()
                if not row or not row[3]:
                    return {'statusCode': 401, 'headers': cors,
                            'body': json.dumps({'error': 'bad_credentials'})}
                emp_id, stored_hash, full_name, _, role_slug, is_owner = row
                # Поддержка плейсхолдера plain:XXX из миграции
                if stored_hash.startswith('plain:'):
                    if stored_hash[6:] != password:
                        return {'statusCode': 401, 'headers': cors,
                                'body': json.dumps({'error': 'bad_credentials'})}
                    # перехэшируем
                    new_hash = _h(password)
                    cur.execute(
                        f"UPDATE erp_employees SET password_hash='{new_hash}' WHERE id={emp_id}"
                    )
                else:
                    if stored_hash != _h(password):
                        return {'statusCode': 401, 'headers': cors,
                                'body': json.dumps({'error': 'bad_credentials'})}
                # создаём токен сессии (на 30 дней)
                token = secrets.token_hex(32)
                cur.execute(
                    f"INSERT INTO erp_sessions(token, employee_id, expires_at) "
                    f"VALUES('{token}', {emp_id}, NOW() + INTERVAL '30 days')"
                )
                conn.commit()
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({
                        'ok': True, 'token': token,
                        'employee': {
                            'id': emp_id, 'full_name': full_name,
                            'role': role_slug, 'is_owner': bool(is_owner),
                        }
                    })}

        # ── ME ────────────────────────────────────────────
        if action == 'me' and method == 'GET':
            eid, role, owner = _session(headers, conn)
            if not eid:
                return {'statusCode': 401, 'headers': cors,
                        'body': json.dumps({'error': 'unauthorized'})}
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT e.id, e.login, e.full_name, e.email, e.phone, e.avatar_url, "
                    f"r.slug, r.title, r.is_owner, r.permissions "
                    f"FROM erp_employees e LEFT JOIN erp_roles r ON r.id=e.role_id WHERE e.id={eid}"
                )
                r = cur.fetchone()
            if not r:
                return {'statusCode': 401, 'headers': cors,
                        'body': json.dumps({'error': 'unauthorized'})}
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({
                        'id': r[0], 'login': r[1], 'full_name': r[2],
                        'email': r[3], 'phone': r[4], 'avatar_url': r[5],
                        'role': {'slug': r[6], 'title': r[7], 'is_owner': bool(r[8]),
                                  'permissions': r[9]},
                    })}

        # ── LOGOUT ────────────────────────────────────────
        if action == 'logout' and method == 'POST':
            token = headers.get('X-Erp-Token') or headers.get('x-erp-token')
            if token:
                with conn.cursor() as cur:
                    cur.execute(
                        f"UPDATE erp_sessions SET expires_at=NOW() WHERE token='{_safe(token, 64)}'"
                    )
                    conn.commit()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        # ── ROLES (список) ────────────────────────────────
        if action == 'roles' and method == 'GET':
            eid, _, _ = _session(headers, conn)
            if not eid:
                return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'unauthorized'})}
            with conn.cursor() as cur:
                cur.execute("SELECT id, slug, title, is_owner FROM erp_roles ORDER BY id")
                rows = cur.fetchall()
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'items': [
                        {'id': r[0], 'slug': r[1], 'title': r[2], 'is_owner': bool(r[3])}
                        for r in rows
                    ]})}

        # ── EMPLOYEES ─────────────────────────────────────
        if action == 'employees':
            if method == 'GET':
                eid, _, _ = _session(headers, conn)
                if not eid:
                    return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'unauthorized'})}
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT e.id, e.login, e.full_name, e.email, e.phone, e.avatar_url, "
                        "e.is_active, e.notes, e.created_at, r.slug, r.title "
                        "FROM erp_employees e LEFT JOIN erp_roles r ON r.id=e.role_id "
                        "ORDER BY e.id"
                    )
                    rows = cur.fetchall()
                return {'statusCode': 200, 'headers': cors,
                        'body': json.dumps({'items': [{
                            'id': r[0], 'login': r[1], 'full_name': r[2], 'email': r[3],
                            'phone': r[4], 'avatar_url': r[5], 'is_active': r[6],
                            'notes': r[7], 'created_at': r[8].isoformat() if r[8] else None,
                            'role_slug': r[9], 'role_title': r[10],
                        } for r in rows]}, default=str)}

            if method == 'POST' and qp.get('id') and qp.get('pwd') == '1':
                # сброс пароля
                me, err = _require_owner(headers, conn)
                if err: return {'statusCode': err[1], 'headers': cors, 'body': json.dumps({'error': err[0]})}
                emp_id = int(qp['id'])
                new_pwd = secrets.token_hex(4)  # 8 hex symbols
                with conn.cursor() as cur:
                    cur.execute(
                        f"UPDATE erp_employees SET password_hash='{_h(new_pwd)}' WHERE id={emp_id}"
                    )
                    conn.commit()
                return {'statusCode': 200, 'headers': cors,
                        'body': json.dumps({'ok': True, 'new_password': new_pwd})}

            if method == 'POST':
                me, err = _require_owner(headers, conn)
                if err: return {'statusCode': err[1], 'headers': cors, 'body': json.dumps({'error': err[0]})}
                body = json.loads(event.get('body') or '{}')
                login = _safe(body.get('login'), 60).lower()
                full_name = _safe(body.get('full_name'), 200)
                email = _safe(body.get('email'), 200)
                phone = _safe(body.get('phone'), 30)
                role_id = body.get('role_id')
                notes = _safe(body.get('notes'), 1000)
                avatar = _safe(body.get('avatar_url'), 500)
                # генерируем пароль
                gen_password = body.get('password') or secrets.token_hex(4)
                pwd_hash = _h(gen_password)
                if not login or not full_name or not role_id:
                    return {'statusCode': 400, 'headers': cors,
                            'body': json.dumps({'error': 'login_name_role_required'})}
                with conn.cursor() as cur:
                    try:
                        cur.execute(
                            f"INSERT INTO erp_employees(login,password_hash,full_name,role_id,"
                            f"email,phone,avatar_url,notes,created_by) "
                            f"VALUES('{login}','{pwd_hash}','{full_name}',{int(role_id)},"
                            f"'{email}','{phone}','{avatar}','{notes}',{me}) "
                            f"RETURNING id"
                        )
                        new_id = cur.fetchone()[0]
                        conn.commit()
                    except Exception as e:
                        conn.rollback()
                        return {'statusCode': 400, 'headers': cors,
                                'body': json.dumps({'error': 'duplicate_or_invalid', 'detail': str(e)[:200]})}
                return {'statusCode': 200, 'headers': cors,
                        'body': json.dumps({
                            'ok': True, 'id': new_id,
                            'login': login, 'password': gen_password,
                        })}

            if method == 'PUT' and qp.get('id'):
                me, err = _require_owner(headers, conn)
                if err: return {'statusCode': err[1], 'headers': cors, 'body': json.dumps({'error': err[0]})}
                emp_id = int(qp['id'])
                body = json.loads(event.get('body') or '{}')
                updates = []
                for k, col in [
                    ('full_name','full_name'), ('email','email'), ('phone','phone'),
                    ('avatar_url','avatar_url'), ('notes','notes'),
                ]:
                    if k in body:
                        updates.append(f"{col}='{_safe(body[k], 1000)}'")
                if 'role_id' in body:
                    updates.append(f"role_id={int(body['role_id'])}")
                if 'is_active' in body:
                    updates.append(f"is_active={'TRUE' if body['is_active'] else 'FALSE'}")
                if not updates:
                    return {'statusCode': 400, 'headers': cors,
                            'body': json.dumps({'error': 'nothing_to_update'})}
                with conn.cursor() as cur:
                    cur.execute(f"UPDATE erp_employees SET {','.join(updates)} WHERE id={emp_id}")
                    conn.commit()
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        # ── ВОРОНКА ──────────────────────────────────────
        if action == 'funnel' and method == 'GET':
            eid, _, _ = _session(headers, conn)
            if not eid:
                return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'unauthorized'})}
            slug = _safe(qp.get('slug') or 'sales', 40)
            with conn.cursor() as cur:
                cur.execute(f"SELECT id, slug, title FROM erp_funnels WHERE slug='{slug}'")
                f = cur.fetchone()
                if not f:
                    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'funnel_not_found'})}
                cur.execute(
                    f"SELECT id, slug, title, color, position, is_won, is_lost "
                    f"FROM erp_stages WHERE funnel_id={f[0]} ORDER BY position"
                )
                stages = cur.fetchall()
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({
                        'funnel': {'id': f[0], 'slug': f[1], 'title': f[2]},
                        'stages': [{
                            'id': s[0], 'slug': s[1], 'title': s[2], 'color': s[3],
                            'position': s[4], 'is_won': s[5], 'is_lost': s[6],
                        } for s in stages]
                    })}

        # ── KANBAN BOARD ──────────────────────────────────
        if action == 'board' and method == 'GET':
            eid, role, owner = _session(headers, conn)
            if not eid:
                return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'unauthorized'})}
            slug = _safe(qp.get('funnel') or 'sales', 40)
            only_mine = qp.get('mine') == '1'
            with conn.cursor() as cur:
                cur.execute(f"SELECT id FROM erp_funnels WHERE slug='{slug}'")
                f = cur.fetchone()
                if not f:
                    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'funnel_not_found'})}
                fid = f[0]
                where = [f"funnel_id={fid}"]
                if only_mine or (role not in ('ceo','production','manager') and not owner):
                    where.append(f"assigned_to={eid}")
                cur.execute(
                    "SELECT l.id, l.order_num, l.name, l.phone, l.city, l.address, "
                    "l.object_type, l.total_rub, l.assigned_to, l.stage_id, "
                    "l.created_at, l.updated_at, l.erp_notes, "
                    "e.full_name, e.avatar_url "
                    "FROM leads l LEFT JOIN erp_employees e ON e.id=l.assigned_to "
                    f"WHERE {' AND '.join(where)} ORDER BY l.created_at DESC LIMIT 500"
                )
                items = [{
                    'id': r[0], 'order_num': r[1], 'name': r[2], 'phone': r[3],
                    'city': r[4], 'address': r[5], 'object_type': r[6],
                    'total_rub': float(r[7] or 0), 'assigned_to': r[8],
                    'stage_id': r[9],
                    'created_at': r[10].isoformat() if r[10] else None,
                    'updated_at': r[11].isoformat() if r[11] else None,
                    'erp_notes': r[12],
                    'assigned_name':   r[13],
                    'assigned_avatar': r[14],
                } for r in cur.fetchall()]
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'items': items}, default=str)}

        # ── ОБНОВИТЬ ЗАЯВКУ (стадия / ассайн / заметка) ──
        if action == 'lead' and method == 'PATCH' and qp.get('id'):
            eid, role, owner = _session(headers, conn)
            if not eid:
                return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'unauthorized'})}
            lead_id = int(qp['id'])
            body = json.loads(event.get('body') or '{}')
            updates = []
            events = []
            if 'stage_id' in body and body['stage_id']:
                sid = int(body['stage_id'])
                updates.append(f"stage_id={sid}")
                events.append(('stage_changed', {'stage_id': sid}))
            if 'assigned_to' in body:
                a = body['assigned_to']
                updates.append(f"assigned_to={int(a) if a else 'NULL'}")
                events.append(('assigned', {'employee_id': a}))
            if 'erp_notes' in body:
                updates.append(f"erp_notes='{_safe(body['erp_notes'], 5000)}'")
            if not updates:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'nothing_to_update'})}
            updates.append("updated_at=NOW()")
            with conn.cursor() as cur:
                cur.execute(f"UPDATE leads SET {','.join(updates)} WHERE id={lead_id}")
                for ev_type, ev_payload in events:
                    pj = json.dumps(ev_payload, ensure_ascii=False).replace("'", "''")
                    cur.execute(
                        f"INSERT INTO erp_lead_events(lead_id, employee_id, event_type, payload) "
                        f"VALUES({lead_id}, {eid}, '{ev_type}', '{pj}'::jsonb)"
                    )
                conn.commit()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        # ── КОММЕНТАРИЙ К ЗАЯВКЕ ─────────────────────────
        if action == 'lead_note' and method == 'POST' and qp.get('id'):
            eid, _, _ = _session(headers, conn)
            if not eid:
                return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'unauthorized'})}
            lead_id = int(qp['id'])
            body = json.loads(event.get('body') or '{}')
            text = _safe(body.get('text'), 5000)
            if not text:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'text_required'})}
            pj = json.dumps({'text': text}, ensure_ascii=False).replace("'", "''")
            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO erp_lead_events(lead_id, employee_id, event_type, payload) "
                    f"VALUES({lead_id}, {eid}, 'note', '{pj}'::jsonb)"
                )
                conn.commit()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        # ── ИСТОРИЯ ЗАЯВКИ ───────────────────────────────
        if action == 'lead_events' and method == 'GET' and qp.get('id'):
            eid, _, _ = _session(headers, conn)
            if not eid:
                return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'unauthorized'})}
            lead_id = int(qp['id'])
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT ev.id, ev.event_type, ev.payload, ev.created_at, e.full_name "
                    "FROM erp_lead_events ev LEFT JOIN erp_employees e ON e.id=ev.employee_id "
                    f"WHERE ev.lead_id={lead_id} ORDER BY ev.created_at DESC LIMIT 200"
                )
                rows = cur.fetchall()
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'items': [{
                        'id': r[0], 'type': r[1], 'payload': r[2],
                        'created_at': r[3].isoformat() if r[3] else None,
                        'author': r[4],
                    } for r in rows]}, default=str)}

        return {'statusCode': 400, 'headers': cors,
                'body': json.dumps({'error': 'unknown_action_or_method'})}
    finally:
        conn.close()
