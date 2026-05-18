import json
import os
import base64
import uuid
import psycopg2
import boto3


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


def _upload_photo(b64data: str) -> str:
    """Принимает data:image/png;base64,... либо чистую base64 строку."""
    if ',' in b64data:
        header, b64data = b64data.split(',', 1)
        ext = 'jpg'
        if 'png' in header.lower():
            ext = 'png'
        elif 'webp' in header.lower():
            ext = 'webp'
    else:
        ext = 'jpg'
    raw = base64.b64decode(b64data)
    key = f"reviews/{uuid.uuid4().hex}.{ext}"
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )
    content_type = f"image/{'jpeg' if ext == 'jpg' else ext}"
    s3.put_object(Bucket='files', Key=key, Body=raw, ContentType=content_type)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def handler(event: dict, context) -> dict:
    """
    GET    /             — список одобренных отзывов (публично)
    GET    /?admin=1     — все отзывы (требует токен)
    POST   /             — добавить отзыв (публично, ставится is_approved=false)
    PUT    /             — одобрить/снять одобрение (только админ)
    DELETE /?id=N        — удалить (только админ)
    """
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    cors = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)

    try:
        qp = event.get('queryStringParameters') or {}

        if method == 'GET':
            admin_mode = qp.get('admin') == '1'
            if admin_mode and not _auth_ok(event.get('headers'), conn):
                return {'statusCode': 401, 'headers': cors,
                        'body': json.dumps({'error': 'unauthorized'})}
            with conn.cursor() as cur:
                if admin_mode:
                    cur.execute(
                        "SELECT id,name,city,rating,text,photo_url,service,is_approved,created_at "
                        "FROM reviews ORDER BY created_at DESC"
                    )
                else:
                    cur.execute(
                        "SELECT id,name,city,rating,text,photo_url,service,is_approved,created_at "
                        "FROM reviews WHERE is_approved=TRUE ORDER BY created_at DESC"
                    )
                rows = cur.fetchall()
                items = [{
                    'id': r[0], 'name': r[1], 'city': r[2], 'rating': r[3],
                    'text': r[4], 'photo_url': r[5], 'service': r[6],
                    'is_approved': r[7], 'created_at': r[8].isoformat() if r[8] else None
                } for r in rows]
                return {'statusCode': 200, 'headers': cors,
                        'body': json.dumps({'items': items})}

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            name = (body.get('name') or '').strip().replace("'", "''")[:128]
            city = (body.get('city') or '').strip().replace("'", "''")[:128]
            rating = int(body.get('rating') or 5)
            rating = max(1, min(5, rating))
            text = (body.get('text') or '').strip().replace("'", "''")[:2000]
            service = (body.get('service') or '').strip().replace("'", "''")[:64]
            photo_b64 = body.get('photo_base64')
            if not name or not text:
                return {'statusCode': 400, 'headers': cors,
                        'body': json.dumps({'error': 'name_and_text_required'})}
            photo_url = ''
            if photo_b64:
                try:
                    photo_url = _upload_photo(photo_b64).replace("'", "''")
                except Exception as e:
                    photo_url = ''
            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO reviews(name,city,rating,text,photo_url,service,is_approved) "
                    f"VALUES('{name}','{city}',{rating},'{text}','{photo_url}','{service}',FALSE) "
                    f"RETURNING id"
                )
                rid = cur.fetchone()[0]
                conn.commit()
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'ok': True, 'id': rid, 'moderation': True})}

        if not _auth_ok(event.get('headers'), conn):
            return {'statusCode': 401, 'headers': cors,
                    'body': json.dumps({'error': 'unauthorized'})}

        if method == 'PUT':
            body = json.loads(event.get('body') or '{}')
            rid = int(body.get('id') or 0)
            approved = bool(body.get('is_approved'))
            with conn.cursor() as cur:
                cur.execute(f"UPDATE reviews SET is_approved={approved} WHERE id={rid}")
                conn.commit()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        if method == 'DELETE':
            rid = int(qp.get('id') or 0)
            with conn.cursor() as cur:
                cur.execute(f"DELETE FROM reviews WHERE id={rid}")
                conn.commit()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        return {'statusCode': 405, 'headers': cors,
                'body': json.dumps({'error': 'method_not_allowed'})}
    finally:
        conn.close()
