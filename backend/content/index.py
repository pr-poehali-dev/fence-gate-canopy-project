"""CMS-функция: управление контентом сайта (тексты, картинки страниц).

GET  /?page=home              — публичный список блоков страницы (без авторизации)
GET  /?page=home&admin=1      — все блоки страницы (требует X-Auth-Token)
GET  /?pages=1                — список всех страниц с количеством блоков (admin)
PUT  /                        — обновить блоки (admin)
     body: {"blocks": [{"page_slug","block_key","block_type","value"}]}
POST /?action=upload          — загрузить изображение в S3, вернуть URL (admin)
     body: {"page_slug","block_key","filename","base64"}
DELETE /?id=N                 — удалить блок (admin)
"""
import base64
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


def _safe(s, maxlen=120):
    return (str(s or '').replace("'", "''"))[:maxlen]


def _upload_to_s3(b64data, filename):
    """Загружает картинку в S3 (bucket 'files') и возвращает CDN URL."""
    import boto3
    if ',' in b64data:
        _, b64data = b64data.split(',', 1)
    raw = base64.b64decode(b64data)
    safe_name = ''.join(ch for ch in (filename or 'img') if ch.isalnum() or ch in '-_.') or 'img.png'
    ext = (safe_name.rsplit('.', 1)[-1] if '.' in safe_name else 'png').lower()
    content_type = {
        'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
        'webp': 'image/webp', 'svg': 'image/svg+xml', 'gif': 'image/gif',
    }.get(ext, 'image/png')
    import time
    key = f"cms/{int(time.time())}_{safe_name}"
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=key, Body=raw, ContentType=content_type)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def handler(event: dict, context) -> dict:
    """CMS — редактор контента сайта (тексты и изображения страниц)."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400',
            },
            'body': ''
        }
    cors = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
    qp = event.get('queryStringParameters') or {}

    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    try:
        # ── СПИСОК ВСЕХ СТРАНИЦ (admin) ───────────────────────
        if method == 'GET' and qp.get('pages') == '1':
            if not _auth_ok(event.get('headers'), conn):
                return {'statusCode': 401, 'headers': cors,
                        'body': json.dumps({'error': 'unauthorized'})}
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT page_slug, COUNT(*) as cnt, MAX(updated_at) "
                    "FROM site_content GROUP BY page_slug ORDER BY page_slug"
                )
                rows = cur.fetchall()
                items = [{
                    'page_slug': r[0],
                    'blocks_count': r[1],
                    'updated_at': r[2].isoformat() if r[2] else None,
                } for r in rows]
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'items': items})}

        # ── ЧТЕНИЕ БЛОКОВ СТРАНИЦЫ ────────────────────────────
        if method == 'GET':
            page = (qp.get('page') or '').strip().lower()[:80]
            admin_mode = qp.get('admin') == '1'
            if admin_mode and not _auth_ok(event.get('headers'), conn):
                return {'statusCode': 401, 'headers': cors,
                        'body': json.dumps({'error': 'unauthorized'})}
            if not page:
                return {'statusCode': 400, 'headers': cors,
                        'body': json.dumps({'error': 'page_required'})}
            sp = _safe(page, 80)
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id, page_slug, block_key, block_type, value, updated_at "
                    f"FROM site_content WHERE page_slug='{sp}' ORDER BY block_key"
                )
                rows = cur.fetchall()
                if admin_mode:
                    items = [{
                        'id': r[0], 'page_slug': r[1], 'block_key': r[2],
                        'block_type': r[3], 'value': r[4],
                        'updated_at': r[5].isoformat() if r[5] else None,
                    } for r in rows]
                else:
                    # Публичный режим — отдаём dict {key: value} для удобства
                    items = {r[2]: r[4] for r in rows}
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'items': items})}

        # ── СОХРАНЕНИЕ БЛОКОВ ─────────────────────────────────
        if method == 'PUT':
            if not _auth_ok(event.get('headers'), conn):
                return {'statusCode': 401, 'headers': cors,
                        'body': json.dumps({'error': 'unauthorized'})}
            body = json.loads(event.get('body') or '{}')
            blocks = body.get('blocks') or []
            saved = 0
            with conn.cursor() as cur:
                for b in blocks:
                    page = _safe(b.get('page_slug'), 80).lower()
                    key  = _safe(b.get('block_key'), 120)
                    btype = _safe(b.get('block_type') or 'text', 20)
                    val  = (str(b.get('value') or '')).replace("'", "''")[:50000]
                    if not page or not key:
                        continue
                    cur.execute(
                        f"INSERT INTO site_content(page_slug,block_key,block_type,value,updated_at) "
                        f"VALUES('{page}','{key}','{btype}','{val}',NOW()) "
                        f"ON CONFLICT(page_slug,block_key) DO UPDATE "
                        f"SET block_type=EXCLUDED.block_type, value=EXCLUDED.value, updated_at=NOW()"
                    )
                    saved += 1
                conn.commit()
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'ok': True, 'saved': saved})}

        # ── УДАЛЕНИЕ БЛОКА ────────────────────────────────────
        if method == 'DELETE':
            if not _auth_ok(event.get('headers'), conn):
                return {'statusCode': 401, 'headers': cors,
                        'body': json.dumps({'error': 'unauthorized'})}
            try:
                rec_id = int(qp.get('id') or 0)
            except Exception:
                rec_id = 0
            if not rec_id:
                return {'statusCode': 400, 'headers': cors,
                        'body': json.dumps({'error': 'id_required'})}
            with conn.cursor() as cur:
                cur.execute(f"DELETE FROM site_content WHERE id={rec_id}")
                conn.commit()
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'ok': True})}

        # ── ЗАГРУЗКА ИЗОБРАЖЕНИЯ ──────────────────────────────
        if method == 'POST' and qp.get('action') == 'upload':
            if not _auth_ok(event.get('headers'), conn):
                return {'statusCode': 401, 'headers': cors,
                        'body': json.dumps({'error': 'unauthorized'})}
            body = json.loads(event.get('body') or '{}')
            b64 = body.get('base64') or ''
            filename = body.get('filename') or 'image.png'
            if not b64:
                return {'statusCode': 400, 'headers': cors,
                        'body': json.dumps({'error': 'base64_required'})}
            try:
                url = _upload_to_s3(b64, filename)
            except Exception as e:
                return {'statusCode': 500, 'headers': cors,
                        'body': json.dumps({'error': 's3_upload_failed', 'message': str(e)})}
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'ok': True, 'url': url})}

        return {'statusCode': 400, 'headers': cors,
                'body': json.dumps({'error': 'unknown_action_or_method'})}
    finally:
        conn.close()
