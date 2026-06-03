"""Диалоговое ядро MAX-бота СтальГрупп.

Бот умеет:
- знакомиться (запросить и запомнить имя клиента);
- посчитать смету прямо в чате (пошаговый сбор: тип → длина → высота);
- сформировать КП и отправить ссылкой;
- показать статус заявки по номеру;
- ответить на частые вопросы (цены, прайс, сроки, гарантия).

Состояние диалога хранится в bot_dialogs.stage / draft_json / known_name.
"""
import json
import math
import re


# ── Прайс (синхронизирован с фронтовым calcCatalog) ──────────────
FENCE_TYPES = {
    'профнастил': {'label': 'забор из профнастила', 'm2': 850, 'norm': 75},
    'штакетник':  {'label': 'евроштакетник',        'm2': 1100, 'norm': 50},
    'рабица':     {'label': 'сетка-рабица',          'm2': 550, 'norm': 100},
    '3d':         {'label': '3D-сетка',              'm2': 1600, 'norm': 80},
    'ковка':      {'label': 'кованый забор',         'm2': 4500, 'norm': 40},
}
POST_PER_M = 600          # столб + лаги + крепёж на 1 п.м, ₽
INSTALL_SHARE = 0.35      # монтаж = 35% от материалов
MIN_INSTALL = 27000       # минималка бригады
DELIVERY_PER_KM = 70
DELIVERY_MIN = 6000
AUTO_DISCOUNT = 8         # %


def detect_fence_type(text):
    t = (text or '').lower()
    if 'профнаст' in t or 'профлист' in t: return 'профнастил'
    if 'штакет' in t or 'евроштакет' in t: return 'штакетник'
    if 'рабиц' in t or 'сетк' in t and '3d' not in t: return 'рабица'
    if '3d' in t or '3д' in t: return '3d'
    if 'ков' in t: return 'ковка'
    return ''


def parse_number(text):
    """Достаёт первое число из текста (длина/высота)."""
    m = re.search(r'(\d+[.,]?\d*)', (text or '').replace(',', '.'))
    return float(m.group(1)) if m else None


def calc_estimate(ftype, length, height, distance_km=0):
    """Считает смету. Возвращает dict с позициями и итогом."""
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


MENU_BUTTONS = [
    [{'type': 'callback', 'text': '📐 Рассчитать забор', 'payload': 'calc'}],
    [{'type': 'callback', 'text': '📋 Статус моей заявки', 'payload': 'status'}],
    [{'type': 'callback', 'text': '💰 Цены и прайс', 'payload': 'prices'}],
    [{'type': 'callback', 'text': '👤 Позвать менеджера', 'payload': 'manager'}],
]

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
    (('срок', 'когда', 'быстро'), 'Срок изготовления 7–14 дней, монтаж — 1–3 дня. Выезд замерщика — в день обращения.'),
    (('замер', 'выезд'), 'Замер бесплатный, выезжаем в день обращения по Москве и МО. Оставьте номер — менеджер согласует время.'),
    (('оплат', 'рассроч', 'кредит'), 'Оплата: 50% предоплата, 50% после монтажа. Для юр.лиц и безнала — 100% предоплата. Есть рассрочка.'),
    (('фундамент', 'бетон'), 'Фундамент: присыпка щебнем (в подарок), бутование, бетонирование или ленточный — подбираем по грунту.'),
    (('гаранти',), 'Гарантия 5 лет на монтаж.'),
]


def match_faq(text):
    t = (text or '').lower()
    for keys, answer in FAQ:
        if any(k in t for k in keys):
            return answer
    return ''


def looks_like_name(text):
    """Похоже ли на имя (1-3 слова, буквы, без цифр)."""
    t = (text or '').strip()
    if not t or any(ch.isdigit() for ch in t):
        return False
    words = t.split()
    if len(words) > 3:
        return False
    return all(w[0].isalpha() for w in words if w)


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


def build_response(conn, chat_id, text, payload, uname, settings):
    """Главная логика диалога.

    Возвращает dict:
      reply: str — текст ответа бота
      buttons: list — кнопки (или [])
      pdf_url: str — если надо приложить КП
      call_manager: bool — позвать менеджера
      save_name: str — если нужно запомнить имя
      set_stage: str — новое состояние диалога
      set_draft: dict — обновить черновик
    """
    out = {'reply': '', 'buttons': [], 'pdf_url': '', 'call_manager': False,
           'save_name': '', 'set_stage': '', 'set_draft': None,
           'save_phone': '', 'create_lead': None}

    # читаем состояние диалога
    with conn.cursor() as cur:
        cur.execute(
            "SELECT stage, draft_json, known_name FROM bot_dialogs WHERE chat_id=%s",
            (str(chat_id),)
        )
        row = cur.fetchone()
    stage = (row[0] if row else '') or ''
    draft = (row[1] if row and row[1] else {}) or {}
    known_name = (row[2] if row else '') or ''

    cmd = (payload or text or '').strip()
    low = cmd.lower()

    # ── Кнопки/команды меню ──────────────────────────────
    if low in ('calc', 'рассчитать', 'расчет', 'расчёт') or low.startswith('calc'):
        out['set_stage'] = 'calc_type'
        out['reply'] = 'Какой забор посчитать? Напишите тип или выберите:'
        out['buttons'] = [
            [{'type': 'callback', 'text': 'Профнастил', 'payload': 'ft_профнастил'}],
            [{'type': 'callback', 'text': 'Евроштакетник', 'payload': 'ft_штакетник'}],
            [{'type': 'callback', 'text': '3D-сетка', 'payload': 'ft_3d'}],
            [{'type': 'callback', 'text': 'Рабица', 'payload': 'ft_рабица'}],
        ]
        return out

    if low in ('prices', 'цены', 'прайс'):
        out['reply'] = PRICES_TEXT
        out['buttons'] = [[{'type': 'callback', 'text': '📐 Рассчитать точно', 'payload': 'calc'}]]
        return out

    if low in ('manager', 'менеджер', 'оператор', 'человек'):
        out['call_manager'] = True
        out['set_stage'] = ' '  # сброс
        out['reply'] = 'Передаю диалог менеджеру 👤 — он ответит здесь в ближайшее время.'
        return out

    if low in ('status', 'статус', 'order', 'заявка', 'заявки'):
        out['set_stage'] = 'ask_order'
        out['reply'] = 'Напишите номер вашей заявки (например, СГ-2026-1700) — покажу статус.'
        return out

    # ── Сценарий: ожидаем тип забора ─────────────────────
    if stage == 'calc_type':
        ft = ''
        if low.startswith('ft_'):
            ft = low[3:]
        else:
            ft = detect_fence_type(text)
        if not ft:
            out['reply'] = 'Не понял тип. Напишите: профнастил, штакетник, 3d или рабица.'
            return out
        draft['ftype'] = ft
        out['set_draft'] = draft
        out['set_stage'] = 'calc_length'
        out['reply'] = f'Отлично — {FENCE_TYPES[ft]["label"]}. Какая длина забора в метрах?'
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
        return out

    if stage == 'calc_height':
        h = parse_number(text)
        if not h or h <= 0:
            out['reply'] = 'Укажите высоту в метрах, например: 2'
            return out
        e = calc_estimate(draft.get('ftype', 'профнастил'), draft.get('length', 0), h)
        out['reply'] = estimate_text(e, known_name)
        # Сохраняем расчёт в черновик — пригодится при оформлении заявки
        draft['estimate'] = e
        out['set_draft'] = draft
        out['set_stage'] = 'after_calc'
        if not known_name:
            out['set_stage'] = 'ask_name'
            out['reply'] += '\n\nКак вас зовут? Запишу, чтобы менеджер обращался по имени.'
        else:
            out['buttons'] = [
                [{'type': 'callback', 'text': '📝 Оформить заявку', 'payload': 'order_now'}],
                [{'type': 'callback', 'text': '👤 Вызвать замерщика', 'payload': 'manager'}],
                [{'type': 'callback', 'text': '📐 Новый расчёт', 'payload': 'calc'}],
            ]
        return out

    # ── Оформление заявки прямо в чате ───────────────────
    if low in ('order_now', 'оформить', 'оформить заявку', 'заказать'):
        out['set_stage'] = 'ask_phone'
        out['reply'] = ('Отлично! Оставьте номер телефона для связи 📞\n'
                        'Менеджер свяжется в течение 15 минут и пришлёт точное КП.')
        return out

    if stage == 'ask_phone':
        digits = ''.join(ch for ch in (text or '') if ch.isdigit())
        if len(digits) < 10:
            out['reply'] = 'Похоже, номер неполный. Напишите телефон, например: +7 999 123-45-67'
            return out
        phone = '+7' + digits[-10:]
        out['save_phone'] = phone
        out['create_lead'] = {
            'name': known_name or uname or 'Клиент из MAX',
            'phone': phone,
            'estimate': draft.get('estimate') or {},
        }
        out['set_stage'] = ' '
        out['set_draft'] = {}
        nm = known_name or ''
        out['reply'] = (f'{nm + ", з" if nm else "З"}аявка принята! ✅\n'
                        'Менеджер свяжется в течение 15 минут. Спасибо за доверие 🤝')
        out['buttons'] = [[{'type': 'callback', 'text': '💰 Цены', 'payload': 'prices'}]]
        return out

    # ── Знакомство: запоминаем имя ───────────────────────
    if stage == 'ask_name':
        if looks_like_name(text):
            nm = text.strip().split()[0].capitalize()
            out['save_name'] = nm
            out['set_stage'] = ' '
            out['reply'] = (f'Приятно познакомиться, {nm}! 🤝\n'
                            'Оформить заявку или задать вопрос?')
            out['buttons'] = [
                [{'type': 'callback', 'text': '📝 Оформить заявку', 'payload': 'order_now'}],
                [{'type': 'callback', 'text': '👤 Вызвать замерщика', 'payload': 'manager'}],
                [{'type': 'callback', 'text': '💰 Цены', 'payload': 'prices'}],
            ]
        else:
            out['reply'] = 'Напишите, пожалуйста, ваше имя 🙂'
        return out

    # ── Статус заявки по номеру ──────────────────────────
    if stage == 'ask_order':
        m = re.search(r'([A-Za-zА-Яа-я]{0,4}[-\s]?\d{4}[-\s]?\d+|\d{3,})', cmd)
        ordq = m.group(1).replace(' ', '') if m else cmd
        with conn.cursor() as cur:
            cur.execute(
                "SELECT order_num, object_type, total_rub, created_at FROM leads "
                "WHERE order_num ILIKE %s ORDER BY created_at DESC LIMIT 1",
                (f'%{ordq}%',)
            )
            lead = cur.fetchone()
            status = ''
            if lead:
                cur.execute(
                    "SELECT status FROM orders WHERE order_num ILIKE %s "
                    "ORDER BY created_at DESC LIMIT 1", (f'%{lead[0]}%',)
                )
                st = cur.fetchone()
                status = st[0] if st else 'new'
        out['set_stage'] = ' '
        if lead:
            out['reply'] = (
                f'📋 Заявка {lead[0]}\n'
                f'━━━━━━━━━━━━━━━\n'
                f'🔧 {lead[1] or "—"}\n'
                f'💰 Сумма: {fmt_rub(lead[2] or 0)}\n'
                f'📌 Статус: {order_status_label(status)}'
            )
        else:
            out['reply'] = ('Не нашёл заявку с таким номером 🤔 Проверьте номер '
                            'или напишите телефон — менеджер найдёт вас.')
        out['buttons'] = [[{'type': 'callback', 'text': '👤 Менеджер', 'payload': 'manager'}]]
        return out

    # ── /start и КП ──────────────────────────────────────
    if low.startswith('/start') or 'кп' in low:
        # /start КП-XXXX — отправляем КП
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
        greet = f'Здравствуйте{", " + known_name if known_name else ""}! 👋 Это бот СтальГрупп.\n'
        if pdf_url and ('кп' in low):
            out['reply'] = greet + 'Ваше коммерческое предложение готово 📄'
            out['pdf_url'] = pdf_url
        else:
            out['reply'] = (greet + 'Помогу рассчитать забор, узнать статус заявки или отвечу на вопросы. '
                            'Выберите действие:')
            out['buttons'] = MENU_BUTTONS
        return out

    # ── FAQ ──────────────────────────────────────────────
    faq = match_faq(text)
    if faq:
        out['reply'] = faq
        out['buttons'] = [[{'type': 'callback', 'text': '📐 Рассчитать', 'payload': 'calc'}],
                          [{'type': 'callback', 'text': '👤 Менеджер', 'payload': 'manager'}]]
        return out

    # ── Свободный ввод параметров (тип + размеры в одном) ─
    ft = detect_fence_type(text)
    nums = re.findall(r'(\d+[.,]?\d*)', (text or '').replace(',', '.'))
    if ft and len(nums) >= 2:
        e = calc_estimate(ft, float(nums[0]), float(nums[1]))
        out['reply'] = estimate_text(e, known_name)
        if not known_name:
            out['set_stage'] = 'ask_name'
            out['reply'] += '\n\nКак вас зовут?'
        else:
            out['buttons'] = [[{'type': 'callback', 'text': '✅ Вызвать замерщика', 'payload': 'manager'}]]
        return out

    # ── По умолчанию — приветствие + меню ────────────────
    greet = f'{known_name}, ч' if known_name else 'Ч'
    out['reply'] = (f'{greet}ем могу помочь? Я рассчитаю забор, покажу статус заявки '
                    'или позову менеджера 👇')
    out['buttons'] = MENU_BUTTONS
    return out


def update_dialog_state(conn, chat_id, save_name='', set_stage='', set_draft=None, save_phone=''):
    """Сохраняет состояние диалога."""
    sets, vals = [], []
    if save_name:
        sets.append("known_name=%s")
        vals.append(save_name)
        sets.append("client_name=%s")
        vals.append(save_name)
    if save_phone:
        sets.append("client_phone=%s")
        vals.append(save_phone)
    if set_stage:
        sets.append("stage=%s")
        vals.append(set_stage.strip())
    if set_draft is not None:
        sets.append("draft_json=%s")
        vals.append(json.dumps(set_draft, ensure_ascii=False))
    if not sets:
        return
    vals.append(str(chat_id))
    with conn.cursor() as cur:
        cur.execute(f"UPDATE bot_dialogs SET {', '.join(sets)} WHERE chat_id=%s", vals)
        conn.commit()