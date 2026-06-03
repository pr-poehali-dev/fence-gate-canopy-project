"""Медиа-библиотека: единый менеджер фото для админа.

Эндпоинты:
  GET    /?action=list                       — все фото с тегами
  GET    /?action=list&service=profnastil    — фото конкретной услуги
  GET    /?action=sync                       — синхронизация: подтянуть из S3 файлы, которых нет в БД
  POST   /  body: { action:"upload", filename, content_base64 } — загрузка нового фото
  POST   /  body: { action:"tag", id, service, position }       — привязка к услуге
  POST   /  body: { action:"untag", id }                        — отвязать
  POST   /  body: { action:"reorder", items:[{id,position}] }   — сменить порядок
  POST   /  body: { action:"hide"|"show", id }                  — скрыть/показать
  DELETE /?id=N                                                 — удалить из БД (файл в S3 остаётся)
"""
import base64
import io
import json
import os
import secrets as _secrets

import boto3
import psycopg2
from PIL import Image

try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except Exception:
    pass


MAX_SIDE = 1920
JPEG_QUALITY = 85


def _cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Id',
        'Access-Control-Max-Age': '86400',
    }


def _resp(status, data):
    return {
        'statusCode': status,
        'headers': {**_cors(), 'Content-Type': 'application/json'},
        'body': json.dumps(data, ensure_ascii=False, default=str),
    }


def _db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def _cdn_url(key):
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def _process_upload(raw, mime):
    try:
        img = Image.open(io.BytesIO(raw))
        if img.mode in ('RGBA', 'P', 'LA'):
            bg = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            mask = img.split()[-1] if img.mode in ('RGBA', 'LA') else None
            bg.paste(img, mask=mask)
            img = bg
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        w, h = img.size
        if max(w, h) > MAX_SIDE:
            r = MAX_SIDE / max(w, h)
            img = img.resize((int(w * r), int(h * r)), Image.LANCZOS)
        out = io.BytesIO()
        img.save(out, format='JPEG', quality=JPEG_QUALITY, optimize=True, progressive=True)
        return out.getvalue(), img.size
    except Exception:
        return raw, (0, 0)


def _list_media(cur, service=None):
    if service:
        cur.execute(
            "SELECT id, url, s3_key, service, position, caption, alt_text, "
            "width, height, size_bytes, is_hidden, is_hero, project, created_at "
            "FROM media_library WHERE service = %s "
            "ORDER BY is_hero DESC, project, position, id",
            (service,)
        )
    else:
        cur.execute(
            "SELECT id, url, s3_key, service, position, caption, alt_text, "
            "width, height, size_bytes, is_hidden, is_hero, project, created_at "
            "FROM media_library ORDER BY service NULLS LAST, is_hero DESC, project, position, id"
        )
    cols = ['id', 'url', 's3_key', 'service', 'position', 'caption', 'alt_text',
            'width', 'height', 'size_bytes', 'is_hidden', 'is_hero', 'project', 'created_at']
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def _sync_from_s3(cur):
    """Подтягивает в БД все объекты из S3 префикса yadisk/ (если их там ещё нет)."""
    s3 = _s3()
    paginator = s3.get_paginator('list_objects_v2')
    added = 0
    for page in paginator.paginate(Bucket='files', Prefix='yadisk/'):
        for obj in page.get('Contents') or []:
            key = obj['Key']
            url = _cdn_url(key)
            cur.execute('SELECT 1 FROM media_library WHERE url = %s', (url,))
            if cur.fetchone():
                continue
            cur.execute(
                'INSERT INTO media_library (url, s3_key, size_bytes) VALUES (%s, %s, %s)',
                (url, key, obj.get('Size', 0))
            )
            added += 1
    return added


def handler(event, context):
    """Управление медиа-библиотекой проекта."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': _cors(), 'body': ''}

    qs = event.get('queryStringParameters') or {}

    try:
        conn = _db()
        cur = conn.cursor()

        if method == 'GET':
            action = qs.get('action', 'list')
            if action == 'list':
                service = qs.get('service')
                items = _list_media(cur, service)
                cur.execute(
                    "SELECT service, COUNT(*) FROM media_library "
                    "WHERE service IS NOT NULL GROUP BY service"
                )
                stats = {row[0]: row[1] for row in cur.fetchall()}
                cur.execute("SELECT COUNT(*) FROM media_library WHERE service IS NULL")
                stats['_unassigned'] = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM media_library")
                stats['_total'] = cur.fetchone()[0]
                return _resp(200, {'items': items, 'stats': stats})

            if action == 'sync':
                added = _sync_from_s3(cur)
                conn.commit()
                return _resp(200, {'added': added})

            return _resp(400, {'error': 'unknown_action'})

        if method == 'POST':
            try:
                body = json.loads(event.get('body') or '{}')
            except Exception:
                body = {}
            action = body.get('action', '')

            if action == 'upload':
                filename = (body.get('filename') or 'photo.jpg').strip()
                content_b64 = body.get('content_base64', '')
                if not content_b64:
                    return _resp(400, {'error': 'content_base64 required'})
                try:
                    if ',' in content_b64 and content_b64.startswith('data:'):
                        content_b64 = content_b64.split(',', 1)[1]
                    raw = base64.b64decode(content_b64)
                except Exception as e:
                    return _resp(400, {'error': f'bad_base64: {e}'})

                processed, (w, h) = _process_upload(raw, '')
                short = _secrets.token_hex(6)
                key = f"yadisk/uploaded/{short}.jpg"

                _s3().put_object(
                    Bucket='files', Key=key, Body=processed,
                    ContentType='image/jpeg', ACL='public-read'
                )
                url = _cdn_url(key)
                service = body.get('service') or None
                project = (body.get('project') or '').strip()
                cur.execute(
                    "INSERT INTO media_library (url, s3_key, size_bytes, width, height, service, project) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
                    (url, key, len(processed), w, h, service, project)
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                return _resp(200, {'id': new_id, 'url': url, 'size': len(processed)})

            if action == 'tag':
                mid = int(body.get('id') or 0)
                service = (body.get('service') or '').strip() or None
                position = int(body.get('position') or 0)
                if not mid:
                    return _resp(400, {'error': 'id required'})
                cur.execute(
                    "UPDATE media_library SET service = %s, position = %s, updated_at = NOW() "
                    "WHERE id = %s",
                    (service, position, mid)
                )
                conn.commit()
                return _resp(200, {'ok': True})

            if action == 'untag':
                mid = int(body.get('id') or 0)
                cur.execute(
                    "UPDATE media_library SET service = NULL, position = 0, is_hero = FALSE, "
                    "updated_at = NOW() WHERE id = %s",
                    (mid,)
                )
                conn.commit()
                return _resp(200, {'ok': True})

            if action == 'set_hero':
                mid = int(body.get('id') or 0)
                if not mid:
                    return _resp(400, {'error': 'id required'})
                cur.execute("SELECT service FROM media_library WHERE id = %s", (mid,))
                row = cur.fetchone()
                if not row:
                    return _resp(404, {'error': 'not_found'})
                service = row[0]
                if not service:
                    return _resp(400, {'error': 'photo must be tagged first'})
                # сбрасываем флаг у других фото этой услуги
                cur.execute(
                    "UPDATE media_library SET is_hero = FALSE, updated_at = NOW() "
                    "WHERE service = %s AND id != %s",
                    (service, mid)
                )
                cur.execute(
                    "UPDATE media_library SET is_hero = TRUE, position = 0, updated_at = NOW() "
                    "WHERE id = %s",
                    (mid,)
                )
                conn.commit()
                return _resp(200, {'ok': True})

            if action == 'reorder':
                items = body.get('items') or []
                for it in items:
                    cur.execute(
                        "UPDATE media_library SET position = %s, updated_at = NOW() WHERE id = %s",
                        (int(it.get('position', 0)), int(it.get('id', 0)))
                    )
                conn.commit()
                return _resp(200, {'ok': True, 'updated': len(items)})

            if action in ('hide', 'show'):
                mid = int(body.get('id') or 0)
                cur.execute(
                    "UPDATE media_library SET is_hidden = %s, updated_at = NOW() WHERE id = %s",
                    (action == 'hide', mid)
                )
                conn.commit()
                return _resp(200, {'ok': True})

            if action == 'caption':
                mid = int(body.get('id') or 0)
                caption = body.get('caption') or ''
                alt = body.get('alt_text') or ''
                project = body.get('project')
                if project is not None:
                    cur.execute(
                        "UPDATE media_library SET caption = %s, alt_text = %s, "
                        "project = %s, updated_at = NOW() WHERE id = %s",
                        (caption, alt, project.strip(), mid)
                    )
                else:
                    cur.execute(
                        "UPDATE media_library SET caption = %s, alt_text = %s, updated_at = NOW() "
                        "WHERE id = %s",
                        (caption, alt, mid)
                    )
                conn.commit()
                return _resp(200, {'ok': True})

            # Назначить проект сразу нескольким фото (объединить в объект)
            if action == 'set_project':
                ids = body.get('ids') or []
                project = (body.get('project') or '').strip()
                if not ids:
                    return _resp(400, {'error': 'ids required'})
                ids = [int(x) for x in ids]
                placeholders = ','.join(['%s'] * len(ids))
                cur.execute(
                    f"UPDATE media_library SET project = %s, updated_at = NOW() "
                    f"WHERE id IN ({placeholders})",
                    (project, *ids)
                )
                conn.commit()
                return _resp(200, {'ok': True, 'updated': len(ids)})

            return _resp(400, {'error': 'unknown_action'})

        if method == 'DELETE':
            mid = int(qs.get('id') or 0)
            if not mid:
                return _resp(400, {'error': 'id required'})
            cur.execute('DELETE FROM media_library WHERE id = %s', (mid,))
            conn.commit()
            return _resp(200, {'ok': True})

        return _resp(405, {'error': 'method_not_allowed'})

    except Exception as e:
        return _resp(500, {'error': str(e)})
    finally:
        try:
            cur.close()
            conn.close()
        except Exception:
            pass