"""Импорт фото из публичной папки Яндекс.Диска в S3-хранилище проекта.

Алгоритм:
  1. GET https://cloud-api.yandex.net/v1/disk/public/resources?public_key=...
  2. Для каждого файла: получить временную download-ссылку, скачать, перезалить в S3
  3. Вернуть массив постоянных CDN-ссылок

Эндпоинты:
  POST /  body: { "public_url": "https://disk.yandex.ru/d/XXXX", "folder": "zabory", "limit": 200 }
        → { items: [{ name, url, size, mime }] }
"""
import io
import json
import os
import urllib.request
import urllib.parse
import secrets

import boto3
from PIL import Image

try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
    HEIF_OK = True
except Exception:
    HEIF_OK = False


MAX_SIDE = 1920
JPEG_QUALITY = 85


def _process_image(raw, mime):
    """Конвертация HEIC->JPEG + ресайз до 1920px."""
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
        return out.getvalue(), 'image/jpeg', 'jpg'
    except Exception:
        ext = (mime or 'image/jpeg').split('/')[-1].split(';')[0]
        return raw, (mime or 'image/jpeg'), ext


def _resp(status, data):
    return {
        'statusCode': status,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        },
        'body': json.dumps(data, ensure_ascii=False, default=str),
    }


def _http_get_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'StalGruppImporter/1.0'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode('utf-8'))


def _http_get_bytes(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'StalGruppImporter/1.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def handler(event: dict, context) -> dict:
    """Импорт фото с публичной папки Яндекс.Диска в S3 проекта."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    if method == 'GET':
        # Информационный пинг — список без копирования
        qp = event.get('queryStringParameters') or {}
        public_url = qp.get('public_url', '')
        if not public_url:
            return _resp(400, {'error': 'public_url required'})
        try:
            api = (
                'https://cloud-api.yandex.net/v1/disk/public/resources'
                f'?public_key={urllib.parse.quote(public_url, safe="")}'
                f'&limit=200'
            )
            data = _http_get_json(api)
            items = (data.get('_embedded') or {}).get('items') or []
            files = [{
                'name': i.get('name'),
                'size': i.get('size'),
                'mime': i.get('mime_type'),
                'preview': i.get('preview'),
            } for i in items if i.get('type') == 'file']
            return _resp(200, {
                'folder': data.get('name'),
                'total': len(files),
                'files': files,
            })
        except Exception as e:
            return _resp(500, {'error': str(e)})

    if method != 'POST':
        return _resp(405, {'error': 'method_not_allowed'})

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        body = {}

    public_url = body.get('public_url', '')
    folder = (body.get('folder') or 'imported').strip().replace('/', '_')
    limit = int(body.get('limit') or 50)
    skip = int(body.get('skip') or 0)

    if not public_url:
        return _resp(400, {'error': 'public_url required'})

    aws_key = os.environ.get('AWS_ACCESS_KEY_ID', '')
    aws_secret = os.environ.get('AWS_SECRET_ACCESS_KEY', '')
    if not aws_key or not aws_secret:
        return _resp(500, {'error': 'no aws credentials'})

    # 1) Получаем список файлов
    encoded = urllib.parse.quote(public_url, safe='')
    api = (
        'https://cloud-api.yandex.net/v1/disk/public/resources'
        f'?public_key={encoded}&limit=200'
    )
    try:
        data = _http_get_json(api)
    except Exception as e:
        return _resp(500, {'error': f'list_failed: {e}'})

    items = (data.get('_embedded') or {}).get('items') or []
    images = [
        i for i in items
        if i.get('type') == 'file' and (i.get('mime_type') or '').startswith('image/')
    ]
    if skip:
        images = images[skip:]
    if limit:
        images = images[:limit]

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=aws_key,
        aws_secret_access_key=aws_secret,
    )

    out = []
    errors = []

    for it in images:
        name = it.get('name') or 'file.jpg'
        path = it.get('path') or ('/' + name)
        try:
            # 2) Получаем временную download-ссылку
            dl_api = (
                'https://cloud-api.yandex.net/v1/disk/public/resources/download'
                f'?public_key={encoded}&path={urllib.parse.quote(path)}'
            )
            dl = _http_get_json(dl_api)
            href = dl.get('href')
            if not href:
                errors.append({'name': name, 'error': 'no_href'})
                continue

            # 3) Скачиваем файл
            raw = _http_get_bytes(href)
            orig_size = len(raw)
            orig_mime = it.get('mime_type') or 'image/jpeg'

            # 4) Обрабатываем (HEIC->JPEG + ресайз)
            processed, content_type, ext = _process_image(raw, orig_mime)

            # 5) Загружаем в S3
            short_id = secrets.token_hex(6)
            key = f"yadisk/{folder}/{short_id}.{ext}"
            s3.put_object(
                Bucket='files',
                Key=key,
                Body=processed,
                ContentType=content_type,
                ACL='public-read',
            )

            cdn = f"https://cdn.poehali.dev/projects/{aws_key}/bucket/{key}"
            out.append({
                'orig_name': name,
                'cdn_url': cdn,
                'orig_size': orig_size,
                'new_size': len(processed),
                'mime': content_type,
                'converted': orig_mime != content_type,
            })
        except Exception as e:
            errors.append({'name': name, 'error': str(e)})

    return _resp(200, {
        'folder': folder,
        'imported': len(out),
        'failed': len(errors),
        'items': out,
        'errors': errors,
    })