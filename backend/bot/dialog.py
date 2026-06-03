"""Диалоговое ядро MAX-бота СтальГрупп.

Сценарий:
1) Знакомство (если новый): имя → телефон → город.
2) Главное меню с кнопками.
3) Расчёт сметы в чате (тип → длина → высота), показ КП.
4) Оформление заявки → PDF-КП в чат + заявка в группу менеджеров.
5) Статус заявки по номеру, FAQ, прайс.
6) Кнопки навигации (🏠 меню, ◀️ назад).

Состояние хранится в bot_dialogs: stage, draft_json, known_name,
client_phone, client_city, dialog_code.
"""
import json
import math
import re
import random


# ── Прайс (синхронизирован с фронтовым calcCatalog) ──────────────
FENCE_TYPES = {
    'профнастил': {'label': 'забор из профнастила', 'm2': 850, 'norm': 75},
    'штакетник':  {'label': 'евроштакетник',        'm2': 1100, 'norm': 50},
    'рабица':     {'label': 'сетка-рабица',          'm2': 550, 'norm': 100},
    '3d':         {'label': '3D-сетка',              'm2': 1600, 'norm': 80},
    'ковка':      {'label': 'кованый забор',         'm2': 4500, 'norm': 40},
}
POST_PER_M = 600
INSTALL_SHARE = 0.35
MIN_INSTALL = 27000
DELIVERY_PER_KM = 70
DELIVERY_MIN = 6000
AUTO_DISCOUNT = 8


def detect_fence_type(text):
    t = (text or '').lower()
    if 'профнаст' in t or 'профлист' in t: return 'профнастил'
    if 'штакет' in t or 'евроштакет' in t: return 'штакетник'
    if 'рабиц' in t or ('сетк' in t and '3d' not in t and '3д' not in t): return 'рабица'
    if '3d' in t or '3д' in t: return '3d'
    if 'ков' in t: return 'ковка'
    return ''


def parse_number(text):
    m = re.search(r'(\d+[.,]?\d*)', (text or '').replace(',', '.'))
    return float(m.group(1)) if m else None


def calc_estimate(ftype, length, height, distance_km=0):
    cfg = FENCE_TYPES.get(ftype, FENCE_TYPES['профнастил'])
    area = length * height
    materials = round(area * cfg['m2'] + length * POST_PER_M)
    install = max(round(materials * INSTALL_SHARE), 0)
    work = install
    min_topup = 0
    if 0 < work < MIN_INSTALL:
        min_topup = MIN_INSTALL - work
        install += min_topup
    delivery = max(DELIVERY_MIN, distance_km * DELIVERY_PER_KM) if distance_km else DELIVERY_MIN
    subtotal = materials + install + delivery
    discount = round(materials * AUTO_DISCOUNT / 100)
    total = subtotal - discount
    days = max(1, math.ceil(length / cfg['norm']))
    return {
        'type_label': cfg['label'], 'length': length, 'height': height, 'area': round(area, 1),
        'materials': materials, 'install': install, 'delivery': delivery,
        'discount': discount, 'total': total, 'days': days, 'min_topup': min_topup,
    }


def fmt_rub(n):
    return '{:,}'.format(int(round(n))).replace(',', ' ') + ' ₽'


def estimate_text(e, name=''):
    hello = f'{name}, в' if name else 'В'
    return (
        f'{hello}от предварительный расчёт 📐\n'
        f'━━━━━━━━━━━━━━━\n'
        f'🔧 {e["type_label"].capitalize()}\n'
        f'📏 Длина: {e["length"]} м · высота: {e["height"]} м\n'
        f'📐 Площадь: {e["area"]} м²\n'
        f'━━━━━━━━━━━━━━━\n'
        f'• Материалы и каркас: {fmt_rub(e["materials"])}\n'
        f'• Монтаж под ключ: {fmt_rub(e["install"])}\n'
        f'• Выезд + доставка: {fmt_rub(e["delivery"])}\n'
        f'• Скидка {AUTO_DISCOUNT}%: −{fmt_rub(e["discount"])}\n'
        f'━━━━━━━━━━━━━━━\n'
        f'💰 ИТОГО: {fmt_rub(e["total"])}\n'
        f'⏱ Срок: ≈ {e["days"]} дн.\n\n'
        f'Это предварительно. Точную цену менеджер уточнит после замера (бесплатно).'
    )


# ── Кнопки ───────────────────────────────────────────────────────
def nav_buttons(extra=None):
    """Добавляет кнопки навигации к списку extra."""
    rows = list(extra or [])
    rows.append([
        {'type': 'callback', 'text': '🏠 В меню', 'payload': 'menu'},
        {'type': 'callback', 'text': '◀️ Назад', 'payload': 'back'},
    ])
    return rows


MENU_BUTTONS = [
    [{'type': 'callback', 'text': '📐 Рассчитать забор', 'payload': 'calc'}],
    [{'type': 'callback', 'text': '📝 Оформить заявку', 'payload': 'order_now'}],
    [{'type': 'callback', 'text': '📋 Статус моей заявки', 'payload': 'status'}],
    [{'type': 'callback', 'text': '💰 Цены и прайс', 'payload': 'prices'}],
    [{'type': 'callback', 'text': '👤 Позвать менеджера', 'payload': 'manager'}],
]

CALC_TYPE_BUTTONS = nav_buttons([
    [{'type': 'callback', 'text': 'Профнастил', 'payload': 'ft_профнастил'}],
    [{'type': 'callback', 'text': 'Евроштакетник', 'payload': 'ft_штакетник'}],
    [{'type': 'callback', 'text': '3D-сетка', 'payload': 'ft_3d'}],
    [{'type': 'callback', 'text': 'Рабица', 'payload': 'ft_рабица'}],
])

PRICES_TEXT = (
    '💰 Ориентировочные цены «под ключ» (с монтажом):\n'
    '━━━━━━━━━━━━━━━\n'
    '• Профнастил — от 1 800 ₽/п.м\n'
    '• Евроштакетник — от 2 200 ₽/п.м\n'
    '• 3D-сетка — от 1 600 ₽/п.м\n'
    '• Сетка-рабица — от 850 ₽/п.м\n'
    '• Кованый — от 6 500 ₽/п.м\n'
    '• Навесы — от 3 200 ₽/м²\n'
    '━━━━━━━━━━━━━━━\n'
    'Хотите точный расчёт под ваш участок? Нажмите «Рассчитать забор».'
)

FAQ = [
    (('гарант',), 'Гарантия на работы — 5 лет, на материалы — до 25 лет (зависит от покрытия).'),
    (('срок', 'когда', 'быстро'), 'Срок изготовления 7–14 дней, монтаж — 1–3 дня. Замер — в день обращения.'),
    (('замер', 'выезд'), 'Замер бесплатный, выезжаем в день обращения по Москве и МО.'),
    (('оплат', 'рассроч', 'кредит'), 'Оплата: 50% предоплата, 50% после монтажа. Для юр.лиц и безнала — 100% предоплата. Есть рассрочка.'),
    (('фундамент', 'бетон'), 'Фундамент: присыпка щебнем (в подарок), бутование, бетонирование или ленточный — подбираем по грунту.'),
]


def match_faq(text):
    t = (text or '').lower()
    for keys, answer in FAQ:
        if any(k in t for k in keys):
            return answer
    return ''


def looks_like_name(text):
    t = (text or '').strip()
    if not t or any(ch.isdigit() for ch in t):
        return False
    words = t.split()
    if len(words) > 3:
        return False
    return all(w[0].isalpha() for w in words if w)


def normalize_phone(text):
    digits = ''.join(ch for ch in (text or '') if ch.isdigit())
    if len(digits) < 10:
        return ''
    return '+7' + digits[-10:]


def order_status_label(status):
    labels = {
        'new': '🆕 Новая — менеджер скоро свяжется',
        'measure': '📐 Назначен замер',
        'contract': '📝 Договор согласован',
        'production': '🏭 В производстве',
        'montage': '🔧 Передан в монтаж',
        'done': '✅ Выполнен',
        'archive': '📦 В архиве',
        'cancelled': '❌ Отменён',
    }
    return labels.get(status, status or 'в обработке')


def gen_code():
    """Короткий код диалога для ответа менеджера: #A1B2."""
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return ''.join(random.choice(chars) for _ in range(4))


def menu_reply(out, known_name):
    greet = f'{known_name}, ч' if known_name else 'Ч'
    out['reply'] = (f'{greet}ем помочь? Рассчитаю забор, оформлю заявку, '
                    'покажу статус или позову менеджера 👇')
    out['buttons'] = MENU_BUTTONS
    out['set_stage'] = ' '
    return out


def build_response(conn, chat_id, text, payload, uname, settings):
    """Главная логика диалога. Возвращает dict с reply/buttons/действиями."""
    out = {'reply': '', 'buttons': [], 'pdf_url': '', 'call_manager': False,
           'save_name': '', 'set_stage': '', 'set_draft': None,
           'save_phone': '', 'save_city': '', 'create_lead': None}

    with conn.cursor() as cur:
        cur.execute(
            "SELECT stage, draft_json, known_name, client_phone, client_city "
            "FROM bot_dialogs WHERE chat_id=%s", (str(chat_id),)
        )
        row = cur.fetchone()
    stage = (row[0] if row else '') or ''
    draft = (row[1] if row and row[1] else {}) or {}
    known_name = (row[2] if row else '') or ''
    known_phone = (row[3] if row else '') or ''
    known_city = (row[4] if row else '') or ''

    cmd = (payload or text or '').strip()
    low = cmd.lower()

    # ── Навигация: в меню / назад ─────────────────────────
    if low == 'menu' or low in ('меню', 'главное меню'):
        return menu_reply(out, known_name)
    if low == 'back' or low == 'назад':
        # назад = в меню (упрощённо)
        return menu_reply(out, known_name)

    # ── ЗНАКОМСТВО (для новых клиентов) ──────────────────
    is_new = not known_name or not known_phone
    is_greet = low.startswith('/start') or low in ('привет', 'здравствуйте', 'начать', 'старт')

    # Старт/новый клиент без имени → начинаем знакомство
    if (is_greet and is_new) or stage == 'greet_name':
        if stage != 'greet_name':
            out['set_stage'] = 'greet_name'
            out['reply'] = ('Здравствуйте! 👋 Я бот компании СтальГрупп — заборы и навесы под ключ.\n\n'
                            'Давайте познакомимся. Как вас зовут?')
            return out
        # ждём имя
        if looks_like_name(text):
            nm = text.strip().split()[0].capitalize()
            out['save_name'] = nm
            out['set_stage'] = 'greet_phone'
            out['reply'] = f'Очень приятно, {nm}! 🤝 Оставьте номер телефона для связи 📞'
        else:
            out['reply'] = 'Напишите, пожалуйста, ваше имя 🙂'
        return out

    if stage == 'greet_phone':
        ph = normalize_phone(text)
        if not ph:
            out['reply'] = 'Похоже, номер неполный. Например: +7 999 123-45-67'
            return out
        out['save_phone'] = ph
        out['set_stage'] = 'greet_city'
        out['reply'] = 'Спасибо! В каком городе или районе планируете установку? 📍'
        return out

    if stage == 'greet_city':
        city = text.strip()[:120]
        out['save_city'] = city or 'не указан'
        out['set_stage'] = ' '
        out['reply'] = (f'Отлично, записал! 🏙 {city}\n\n'
                        'Теперь могу рассчитать стоимость или передать вас менеджеру. '
                        'Что выберете?')
        out['buttons'] = MENU_BUTTONS
        return out

    # ── Команды меню ─────────────────────────────────────
    if low in ('calc', 'рассчитать', 'расчет', 'расчёт'):
        out['set_stage'] = 'calc_type'
        out['reply'] = 'Какой забор посчитать? Выберите или напишите тип:'
        out['buttons'] = CALC_TYPE_BUTTONS
        return out

    if low in ('prices', 'цены', 'прайс'):
        out['reply'] = PRICES_TEXT
        out['buttons'] = nav_buttons([[{'type': 'callback', 'text': '📐 Рассчитать точно', 'payload': 'calc'}]])
        return out

    if low in ('manager', 'менеджер', 'оператор', 'человек'):
        out['call_manager'] = True
        out['set_stage'] = ' '
        out['reply'] = 'Передаю диалог менеджеру 👤 — он скоро ответит здесь.'
        out['buttons'] = nav_buttons()
        return out

    if low in ('status', 'статус', 'order', 'заявка', 'заявки'):
        out['set_stage'] = 'ask_order'
        out['reply'] = 'Напишите номер вашей заявки (например, СГ-2026-1700) — покажу статус.'
        out['buttons'] = nav_buttons()
        return out

    if low in ('order_now', 'оформить', 'оформить заявку', 'заказать'):
        out['set_stage'] = 'ask_order_phone'
        if known_phone:
            out['create_lead'] = {
                'name': known_name or uname or 'Клиент из MAX',
                'phone': known_phone, 'city': known_city,
                'estimate': draft.get('estimate') or {},
            }
            out['set_stage'] = ' '
            nm = known_name or ''
            out['reply'] = (f'{nm + ", з" if nm else "З"}аявка принята! ✅\n'
                            'Менеджер свяжется в течение 15 минут. Высылаю ваше КП 📄')
            out['buttons'] = nav_buttons()
        else:
            out['reply'] = 'Оставьте номер телефона — оформлю заявку 📞'
        return out

    if stage == 'ask_order_phone':
        ph = normalize_phone(text)
        if not ph:
            out['reply'] = 'Напишите телефон, например: +7 999 123-45-67'
            return out
        out['save_phone'] = ph
        out['create_lead'] = {
            'name': known_name or uname or 'Клиент из MAX',
            'phone': ph, 'city': known_city,
            'estimate': draft.get('estimate') or {},
        }
        out['set_stage'] = ' '
        nm = known_name or ''
        out['reply'] = (f'{nm + ", з" if nm else "З"}аявка принята! ✅\n'
                        'Менеджер свяжется в течение 15 минут. Высылаю ваше КП 📄')
        out['buttons'] = nav_buttons()
        return out

    # ── Расчёт ───────────────────────────────────────────
    if stage == 'calc_type':
        ft = low[3:] if low.startswith('ft_') else detect_fence_type(text)
        if not ft:
            out['reply'] = 'Не понял тип. Напишите: профнастил, штакетник, 3d или рабица.'
            out['buttons'] = CALC_TYPE_BUTTONS
            return out
        draft['ftype'] = ft
        out['set_draft'] = draft
        out['set_stage'] = 'calc_length'
        out['reply'] = f'Отлично — {FENCE_TYPES[ft]["label"]}. Какая длина забора в метрах?'
        out['buttons'] = nav_buttons()
        return out

    if stage == 'calc_length':
        ln = parse_number(text)
        if not ln or ln <= 0:
            out['reply'] = 'Укажите длину в метрах, например: 40'
            return out
        draft['length'] = ln
        out['set_draft'] = draft
        out['set_stage'] = 'calc_height'
        out['reply'] = 'Какая высота забора в метрах? (обычно 1.8 или 2.0)'
        out['buttons'] = nav_buttons()
        return out

    if stage == 'calc_height':
        h = parse_number(text)
        if not h or h <= 0:
            out['reply'] = 'Укажите высоту в метрах, например: 2'
            return out
        e = calc_estimate(draft.get('ftype', 'профнастил'), draft.get('length', 0), h)
        draft['estimate'] = e
        out['set_draft'] = draft
        out['set_stage'] = ' '
        out['reply'] = estimate_text(e, known_name)
        out['buttons'] = nav_buttons([
            [{'type': 'callback', 'text': '📝 Оформить заявку', 'payload': 'order_now'}],
            [{'type': 'callback', 'text': '👤 Вызвать замерщика', 'payload': 'manager'}],
        ])
        return out

    # ── Статус заявки ────────────────────────────────────
    if stage == 'ask_order':
        m = re.search(r'([A-Za-zА-Яа-я]{0,4}[-\s]?\d{4}[-\s]?\d+|\d{3,})', cmd)
        ordq = m.group(1).replace(' ', '') if m else cmd
        with conn.cursor() as cur:
            cur.execute(
                "SELECT order_num, object_type, total_rub FROM leads "
                "WHERE order_num ILIKE %s ORDER BY created_at DESC LIMIT 1", (f'%{ordq}%',)
            )
            lead = cur.fetchone()
            status = ''
            if lead:
                cur.execute("SELECT status FROM orders WHERE order_num ILIKE %s "
                            "ORDER BY created_at DESC LIMIT 1", (f'%{lead[0]}%',))
                st = cur.fetchone()
                status = st[0] if st else 'new'
        out['set_stage'] = ' '
        if lead:
            out['reply'] = (f'📋 Заявка {lead[0]}\n━━━━━━━━━━━━━━━\n'
                            f'🔧 {lead[1] or "—"}\n💰 Сумма: {fmt_rub(lead[2] or 0)}\n'
                            f'📌 Статус: {order_status_label(status)}')
        else:
            out['reply'] = 'Не нашёл заявку с таким номером 🤔 Проверьте номер или позовите менеджера.'
        out['buttons'] = nav_buttons([[{'type': 'callback', 'text': '👤 Менеджер', 'payload': 'manager'}]])
        return out

    # ── /start для знакомого клиента или КП ──────────────
    if low.startswith('/start') or 'кп' in low:
        m = re.search(r'(КП|order)[-_ ]?([A-Za-zА-Яа-я0-9\-]+)', cmd, re.IGNORECASE)
        ordnum = m.group(2) if m else ''
        pdf_url = ''
        with conn.cursor() as cur:
            if ordnum:
                cur.execute("SELECT payload_json FROM leads WHERE order_num ILIKE %s "
                            "ORDER BY created_at DESC LIMIT 1", (f'%{ordnum}%',))
            else:
                cur.execute("SELECT payload_json FROM leads ORDER BY created_at DESC LIMIT 1")
            r = cur.fetchone()
            if r and isinstance(r[0], dict):
                pdf_url = r[0].get('pdf_url') or ''
        if pdf_url and 'кп' in low:
            out['reply'] = f'{known_name + ", в" if known_name else "В"}аше КП готово 📄'
            out['pdf_url'] = pdf_url
            out['buttons'] = nav_buttons()
        else:
            return menu_reply(out, known_name)
        return out

    # ── FAQ ──────────────────────────────────────────────
    faq = match_faq(text)
    if faq:
        out['reply'] = faq
        out['buttons'] = nav_buttons([[{'type': 'callback', 'text': '📐 Рассчитать', 'payload': 'calc'}]])
        return out

    # ── Свободный ввод (тип + размеры) ───────────────────
    ft = detect_fence_type(text)
    nums = re.findall(r'(\d+[.,]?\d*)', (text or '').replace(',', '.'))
    if ft and len(nums) >= 2:
        e = calc_estimate(ft, float(nums[0]), float(nums[1]))
        draft['estimate'] = e
        out['set_draft'] = draft
        out['reply'] = estimate_text(e, known_name)
        out['buttons'] = nav_buttons([[{'type': 'callback', 'text': '📝 Оформить заявку', 'payload': 'order_now'}]])
        return out

    # ── По умолчанию — меню ──────────────────────────────
    return menu_reply(out, known_name)


def update_dialog_state(conn, chat_id, save_name='', set_stage='', set_draft=None,
                        save_phone='', save_city=''):
    """Сохраняет состояние диалога."""
    sets, vals = [], []
    if save_name:
        sets += ["known_name=%s", "client_name=%s"]; vals += [save_name, save_name]
    if save_phone:
        sets.append("client_phone=%s"); vals.append(save_phone)
    if save_city:
        sets.append("client_city=%s"); vals.append(save_city)
    if set_stage:
        sets.append("stage=%s"); vals.append(set_stage.strip())
    if set_draft is not None:
        sets.append("draft_json=%s"); vals.append(json.dumps(set_draft, ensure_ascii=False))
    if not sets:
        return
    vals.append(str(chat_id))
    with conn.cursor() as cur:
        cur.execute(f"UPDATE bot_dialogs SET {', '.join(sets)} WHERE chat_id=%s", vals)
        conn.commit()


def ensure_dialog_code(conn, chat_id):
    """Возвращает код диалога, создавая его при необходимости."""
    with conn.cursor() as cur:
        cur.execute("SELECT dialog_code FROM bot_dialogs WHERE chat_id=%s", (str(chat_id),))
        row = cur.fetchone()
        code = (row[0] if row else '') or ''
        if not code:
            code = gen_code()
            cur.execute("UPDATE bot_dialogs SET dialog_code=%s WHERE chat_id=%s",
                        (code, str(chat_id)))
            conn.commit()
        return code


def find_chat_by_code(conn, code):
    """Ищет chat_id по коду диалога (для ответа менеджера из группы)."""
    with conn.cursor() as cur:
        cur.execute("SELECT chat_id FROM bot_dialogs WHERE UPPER(dialog_code)=%s LIMIT 1",
                    (code.upper(),))
        row = cur.fetchone()
        return str(row[0]) if row else ''
