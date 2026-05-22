"""Управление меню сайта (категории и пункты).

GET  /                   — публичное дерево меню для шапки (без авторизации)
GET  /?flat=1            — плоский список всех элементов (для админки)
POST /?action=upsert     — создать/обновить пункт (admin)
POST /?action=reorder    — массовое изменение position (admin)
DELETE /?id=N            — скрыть/восстановить пункт (admin)
"""
import json
import os
import psycopg2


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Id',
    'Access-Control-Max-Age': '86400',
}


def _resp(code, body):
    return {
        'statusCode': code,
        'headers': {**CORS, 'Content-Type': 'application/json; charset=utf-8'},
        'isBase64Encoded': False,
        'body': json.dumps(body, ensure_ascii=False),
    }


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


def _safe(s, maxlen=255):
    return (str(s or '').replace("'", "''"))[:maxlen]


def _fetch_tree(cur):
    """Возвращает дерево: список категорий с items внутри."""
    cur.execute(
        "SELECT id, parent_id, label, href, icon, badge, description, position, is_hidden "
        "FROM site_menu ORDER BY parent_id NULLS FIRST, position, id"
    )
    rows = cur.fetchall()
    by_id = {}
    cats = []
    for r in rows:
        node = {
            'id': r[0],
            'parent_id': r[1],
            'label': r[2],
            'href': r[3] or '',
            'icon': r[4] or '',
            'badge': r[5] or '',
            'description': r[6] or '',
            'position': r[7],
            'is_hidden': r[8],
            'items': [],
        }
        by_id[node['id']] = node
        if node['parent_id'] is None:
            cats.append(node)
        else:
            parent = by_id.get(node['parent_id'])
            if parent is not None:
                parent['items'].append(node)
    # Скрытые в публичном виде убираем
    return cats


def _fetch_flat(cur):
    cur.execute(
        "SELECT id, parent_id, label, href, icon, badge, description, position, is_hidden "
        "FROM site_menu ORDER BY parent_id NULLS FIRST, position, id"
    )
    return [
        {
            'id': r[0],
            'parent_id': r[1],
            'label': r[2],
            'href': r[3] or '',
            'icon': r[4] or '',
            'badge': r[5] or '',
            'description': r[6] or '',
            'position': r[7],
            'is_hidden': r[8],
        }
        for r in cur.fetchall()
    ]


def handler(event: dict, context) -> dict:
    """Управление структурой меню сайта (категории и пункты)."""
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
            # ─── GET: публичное дерево / плоский админский список ─────────
            if method == 'GET':
                if qs.get('flat') in ('1', 'true', 'yes'):
                    if not _auth_ok(headers, conn):
                        return _resp(401, {'error': 'unauthorized'})
                    return _resp(200, {'items': _fetch_flat(cur)})
                tree = _fetch_tree(cur)
                # На публичной выдаче — без is_hidden
                visible = [
                    {**c, 'items': [it for it in c['items'] if not it['is_hidden']]}
                    for c in tree if not c['is_hidden']
                ]
                return _resp(200, {'menu': visible})

            # ─── POST: upsert/reorder ─────────────────────────────────────
            if method == 'POST':
                if not _auth_ok(headers, conn):
                    return _resp(401, {'error': 'unauthorized'})

                action = qs.get('action') or body.get('action') or 'upsert'

                if action == 'upsert':
                    mid = int(body.get('id') or 0)
                    parent_id = body.get('parent_id')
                    parent_id = int(parent_id) if parent_id else None
                    label = _safe(body.get('label'), 128)
                    href = _safe(body.get('href'), 255)
                    icon = _safe(body.get('icon'), 64)
                    badge = _safe(body.get('badge'), 32)
                    desc = _safe(body.get('description'), 255)
                    position = int(body.get('position') or 0)
                    is_hidden = bool(body.get('is_hidden'))

                    if not label:
                        return _resp(400, {'error': 'label_required'})

                    if mid:
                        cur.execute(
                            "UPDATE site_menu SET parent_id=%s, label=%s, href=%s, icon=%s, "
                            "badge=%s, description=%s, position=%s, is_hidden=%s, updated_at=NOW() "
                            "WHERE id=%s",
                            (parent_id, label, href, icon, badge, desc, position, is_hidden, mid)
                        )
                        conn.commit()
                        return _resp(200, {'ok': True, 'id': mid})
                    else:
                        cur.execute(
                            "INSERT INTO site_menu (parent_id, label, href, icon, badge, description, "
                            "position, is_hidden) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                            (parent_id, label, href, icon, badge, desc, position, is_hidden)
                        )
                        new_id = cur.fetchone()[0]
                        conn.commit()
                        return _resp(200, {'ok': True, 'id': new_id})

                if action == 'reorder':
                    items = body.get('items') or []
                    for it in items:
                        cur.execute(
                            "UPDATE site_menu SET position=%s, parent_id=%s, updated_at=NOW() WHERE id=%s",
                            (
                                int(it.get('position', 0)),
                                int(it['parent_id']) if it.get('parent_id') else None,
                                int(it.get('id', 0))
                            )
                        )
                    conn.commit()
                    return _resp(200, {'ok': True, 'updated': len(items)})

                if action in ('hide', 'show'):
                    mid = int(body.get('id') or 0)
                    cur.execute(
                        "UPDATE site_menu SET is_hidden=%s, updated_at=NOW() WHERE id=%s",
                        (action == 'hide', mid)
                    )
                    conn.commit()
                    return _resp(200, {'ok': True})

                return _resp(400, {'error': 'unknown_action'})

            # ─── DELETE: реальное удаление (admin) ────────────────────────
            if method == 'DELETE':
                if not _auth_ok(headers, conn):
                    return _resp(401, {'error': 'unauthorized'})
                mid = int(qs.get('id') or 0)
                if not mid:
                    return _resp(400, {'error': 'id_required'})
                # удаляем сначала детей, потом сам узел
                cur.execute("DELETE FROM site_menu WHERE parent_id=%s", (mid,))
                cur.execute("DELETE FROM site_menu WHERE id=%s", (mid,))
                conn.commit()
                return _resp(200, {'ok': True})

            return _resp(405, {'error': 'method_not_allowed'})
