"""Генерация подписи и alt-текста для фото через GigaChat (Сбер).

POST / body: { "input": "забор 100 м, высота 2, Красногорск", "service": "Профнастил" }
Возвращает: { "caption": "...", "alt": "..." }

Авторизация GigaChat: по Authorization key (Base64) получаем OAuth access_token,
затем дёргаем chat/completions. Токен живёт ~30 мин, кэшируем в памяти.
"""
import json
import logging
import os
import time
import uuid

import requests

logger = logging.getLogger()
logger.setLevel(logging.INFO)

OAUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
CHAT_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
SCOPE = "GIGACHAT_API_PERS"

_token_cache = {"token": "", "exp": 0.0}


def _cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
    }


def _resp(status, data):
    return {
        "statusCode": status,
        "headers": {**_cors(), "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False),
    }


def _get_token():
    """Возвращает кэшированный access_token или запрашивает новый."""
    now = time.time()
    if _token_cache["token"] and _token_cache["exp"] > now + 60:
        return _token_cache["token"]

    auth_key = (os.environ.get("GIGACHAT_AUTH_KEY", "") or "").strip()
    if not auth_key:
        raise ValueError("GIGACHAT_AUTH_KEY not configured")

    logger.info("Requesting GigaChat OAuth token, scope=%s, key_len=%d", SCOPE, len(auth_key))
    r = requests.post(
        OAUTH_URL,
        headers={
            "Authorization": f"Basic {auth_key}",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "RqUID": str(uuid.uuid4()),
        },
        data={"scope": SCOPE},
        timeout=12,
        verify=False,
    )
    logger.info("OAuth status=%s body=%s", r.status_code, r.text[:300])
    if r.status_code != 200:
        raise ValueError(f"oauth_failed_{r.status_code}: {r.text[:200]}")
    d = r.json()
    token = d.get("access_token", "")
    expires_at = d.get("expires_at", 0)
    _token_cache["token"] = token
    # expires_at приходит в мс; если нет — считаем 25 мин
    _token_cache["exp"] = (expires_at / 1000) if expires_at else (now + 1500)
    return token


def handler(event, context):
    """Генерация подписи и alt-текста под фото на основе черновых данных."""
    method = event.get("httpMethod", "POST")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": _cors(), "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        body = {}

    raw_input = (body.get("input") or "").strip()
    service = (body.get("service") or "").strip()
    if not raw_input:
        return _resp(400, {"error": "input required"})

    system = (
        "Ты копирайтер строительной компании по заборам в Москве и МО. "
        "По черновым данным от менеджера составь короткую подпись для портфолио и alt-текст для SEO. "
        "Подпись (caption): живая, до 60 символов, формат «Город, объект N м». "
        "Alt-текст (alt): описательный, до 90 символов, с типом конструкции, материалом и городом. "
        "Отвечай СТРОГО в формате JSON без markdown: {\"caption\":\"...\",\"alt\":\"...\"}."
    )
    user = (f"Услуга: {service}. " if service else "") + f"Данные: {raw_input}"

    payload = {
        "model": "GigaChat",
        "temperature": 0.6,
        "max_tokens": 120,
        "stream": False,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }

    def _call_chat(token, read_timeout):
        return requests.post(
            CHAT_URL,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json=payload,
            # (connect, read) — быстро ловим проблему соединения
            timeout=(8, read_timeout),
            verify=False,
        )

    try:
        token = _get_token()
        # До 2 попыток: первое соединение к хосту Сбера бывает «холодным»
        last_err = None
        r = None
        for attempt in range(2):
            try:
                r = _call_chat(token, read_timeout=18)
                break
            except requests.exceptions.Timeout as te:
                last_err = te
                logger.warning("Chat attempt %d timeout, retrying", attempt + 1)
                continue
        if r is None:
            raise last_err or requests.exceptions.Timeout()
        logger.info("Chat status=%s", r.status_code)
        if r.status_code != 200:
            logger.error("Chat failed body=%s", r.text[:300])
            return _resp(502, {"error": f"chat_failed_{r.status_code}: {r.text[:200]}"})
        data = r.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1:
            return _resp(502, {"error": "bad_ai_response", "raw": text[:300]})
        parsed = json.loads(text[start:end + 1])
        return _resp(200, {
            "caption": str(parsed.get("caption", "")).strip(),
            "alt": str(parsed.get("alt", "")).strip(),
        })
    except requests.exceptions.Timeout:
        logger.error("GigaChat timeout")
        return _resp(504, {"error": "gigachat_timeout"})
    except ValueError as e:
        logger.error("ValueError: %s", e)
        return _resp(400, {"error": str(e)})
    except Exception as e:
        logger.exception("Unexpected error")
        return _resp(500, {"error": f"{type(e).__name__}: {e}"})