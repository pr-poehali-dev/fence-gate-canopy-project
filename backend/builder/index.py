"""Builder API: drag-and-drop strannic constructor.

GET    /?slug=akciya          - public page (no auth)
GET    /?list=1               - all pages (admin)
GET    /?id=N                 - single page with blocks (admin)
POST   /?action=upsert_page   - create or update page (admin)
POST   /?action=save_blocks   - bulk save blocks (admin)
DELETE /?id=N                 - delete page (admin)
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
        cur.execute("SELECT 1 FROM admin_sessions WHERE token=%s AND expires_at>NOW()", (token,))
        return cur.fetchone() is not None


def _safe_slug(s):
    s = (s or '').lower().strip()
    out = ''.join(c if (c.isalnum() or c in '-_') else '-' for c in s)
    while '--' in out:
        out = out.replace('--', '-')
    return out.strip('-')[:120]


def _safe(s, maxlen=255):
    return (str(s or '').replace("'", "''"))[:maxlen]


def _serialize_page(row):
    return {
        'id': row[0], 'slug': row[1], 'title': row[2],
        'seo_description': row[3], 'is_published': row[4],
        'created_at': row[5].isoformat() if row[5] else None,
        'updated_at': row[6].isoformat() if row[6] else None,
    }


def _fetch_blocks(cur, page_id):
    cur.execute(
        "SELECT id, block_type, position, data FROM page_blocks "
        "WHERE page_id=%s ORDER BY position, id", (page_id,)
    )
    return [
        {'id': r[0], 'block_type': r[1], 'position': r[2], 'data': r[3]}
        for r in cur.fetchall()
    ]


def handler(event: dict, context) -> dict:
    """API для визуального конструктора страниц."""
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
                if qs.get('list') in ('1', 'true'):
                    if not _auth_ok(headers, conn):
                        return _resp(401, {'error': 'unauthorized'})
                    cur.execute(
                        "SELECT id, slug, title, seo_description, is_published, "
                        "created_at, updated_at FROM user_pages ORDER BY updated_at DESC"
                    )
                    return _resp(200, {'pages': [_serialize_page(r) for r in cur.fetchall()]})

                slug = (qs.get('slug') or '').strip()
                pid = qs.get('id')

                if pid:
                    if not _auth_ok(headers, conn):
                        return _resp(401, {'error': 'unauthorized'})
                    cur.execute(
                        "SELECT id, slug, title, seo_description, is_published, "
                        "created_at, updated_at FROM user_pages WHERE id=%s", (int(pid),)
                    )
                    row = cur.fetchone()
                    if not row:
                        return _resp(404, {'error': 'not_found'})
                    page = _serialize_page(row)
                    page['blocks'] = _fetch_blocks(cur, page['id'])
                    return _resp(200, page)

                if slug:
                    cur.execute(
                        "SELECT id, slug, title, seo_description, is_published, "
                        "created_at, updated_at FROM user_pages WHERE slug=%s",
                        (_safe_slug(slug),)
                    )
                    row = cur.fetchone()
                    if not row:
                        return _resp(404, {'error': 'not_found'})
                    if not row[4] and not _auth_ok(headers, conn):
                        return _resp(404, {'error': 'not_published'})
                    page = _serialize_page(row)
                    page['blocks'] = _fetch_blocks(cur, page['id'])
                    return _resp(200, page)

                return _resp(400, {'error': 'slug_or_id_required'})

            if method == 'POST':
                if not _auth_ok(headers, conn):
                    return _resp(401, {'error': 'unauthorized'})

                action = qs.get('action') or body.get('action') or ''

                if action == 'upsert_page':
                    pid = body.get('id')
                    slug = _safe_slug(body.get('slug') or '')
                    title = _safe(body.get('title'), 255)
                    seo = _safe(body.get('seo_description'), 1000)
                    pub = bool(body.get('is_published'))
                    if not slug:
                        return _resp(400, {'error': 'slug_required'})

                    if pid:
                        cur.execute(
                            "UPDATE user_pages SET slug=%s, title=%s, seo_description=%s, "
                            "is_published=%s, updated_at=NOW() WHERE id=%s",
                            (slug, title, seo, pub, int(pid))
                        )
                        conn.commit()
                        return _resp(200, {'ok': True, 'id': int(pid)})

                    cur.execute(
                        "INSERT INTO user_pages (slug, title, seo_description, is_published) "
                        "VALUES (%s,%s,%s,%s) RETURNING id",
                        (slug, title, seo, pub)
                    )
                    new_id = cur.fetchone()[0]
                    conn.commit()
                    return _resp(200, {'ok': True, 'id': new_id})

                if action == 'save_blocks':
                    pid = int(body.get('page_id') or 0)
                    blocks = body.get('blocks') or []
                    if not pid:
                        return _resp(400, {'error': 'page_id_required'})

                    cur.execute("DELETE FROM page_blocks WHERE page_id=%s", (pid,))
                    for idx, b in enumerate(blocks):
                        cur.execute(
                            "INSERT INTO page_blocks (page_id, block_type, position, data) "
                            "VALUES (%s,%s,%s,%s)",
                            (pid, _safe(b.get('block_type'), 40), idx,
                             json.dumps(b.get('data') or {}, ensure_ascii=False))
                        )
                    cur.execute("UPDATE user_pages SET updated_at=NOW() WHERE id=%s", (pid,))
                    conn.commit()
                    return _resp(200, {'ok': True, 'saved': len(blocks)})

                return _resp(400, {'error': 'unknown_action'})

            if method == 'DELETE':
                if not _auth_ok(headers, conn):
                    return _resp(401, {'error': 'unauthorized'})
                pid = int(qs.get('id') or 0)
                if not pid:
                    return _resp(400, {'error': 'id_required'})
                cur.execute("DELETE FROM page_blocks WHERE page_id=%s", (pid,))
                cur.execute("DELETE FROM user_pages WHERE id=%s", (pid,))
                conn.commit()
                return _resp(200, {'ok': True})

            return _resp(405, {'error': 'method_not_allowed'})
