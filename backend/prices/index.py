import json
import os
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


def handler(event: dict, context) -> dict:
    """
    CRUD цен.
    GET  /        — список цен (публично)
    PUT  /        — обновить цены (только админ)
    POST /        — добавить цену (только админ)
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
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)

    try:
        if method == 'GET':
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, slug, title, price, unit, category, updated_at "
                    "FROM prices ORDER BY category, title"
                )
                rows = cur.fetchall()
                items = [{
                    'id': r[0], 'slug': r[1], 'title': r[2],
                    'price': float(r[3]), 'unit': r[4], 'category': r[5],
                    'updated_at': r[6].isoformat() if r[6] else None
                } for r in rows]
                return {'statusCode': 200, 'headers': cors,
                        'body': json.dumps({'items': items})}

        if not _auth_ok(event.get('headers'), conn):
            return {'statusCode': 401, 'headers': cors,
                    'body': json.dumps({'error': 'unauthorized'})}

        body = json.loads(event.get('body') or '{}')

        if method == 'PUT':
            items = body.get('items') or []
            with conn.cursor() as cur:
                for it in items:
                    slug = (it.get('slug') or '').replace("'", "''")
                    price = float(it.get('price') or 0)
                    title = (it.get('title') or '').replace("'", "''")
                    cur.execute(
                        f"UPDATE prices SET price={price}, title='{title}', "
                        f"updated_at=NOW() WHERE slug='{slug}'"
                    )
                conn.commit()
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'ok': True, 'updated': len(items)})}

        if method == 'POST':
            slug = (body.get('slug') or '').replace("'", "''")
            title = (body.get('title') or '').replace("'", "''")
            price = float(body.get('price') or 0)
            unit = (body.get('unit') or 'руб').replace("'", "''")
            category = (body.get('category') or 'fence').replace("'", "''")
            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO prices(slug,title,price,unit,category) "
                    f"VALUES('{slug}','{title}',{price},'{unit}','{category}') "
                    f"ON CONFLICT(slug) DO UPDATE SET price=EXCLUDED.price, title=EXCLUDED.title"
                )
                conn.commit()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        return {'statusCode': 405, 'headers': cors,
                'body': json.dumps({'error': 'method_not_allowed'})}
    finally:
        conn.close()
