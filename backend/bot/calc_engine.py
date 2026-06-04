"""Точный порт расчёта сайта (src/lib/calcCatalog.ts) на Python.

Бот считает смету ИДЕНТИЧНО калькулятору на сайте — те же справочники,
формулы, минималка, логистика, скидка. Это гарантирует, что КП из чата
совпадает с КП с сайта до рубля.
"""
import math

# ── Константы экономики (= calcCatalog.ts) ───────────────
MIN_INSTALL_COST = 27000
DELIVERY_PER_KM = 70
DELIVERY_MIN = 6000
OVERSIZE_COST = 7000
MARKUP_PCT = 20
AUTO_DISCOUNT_PCT = 8
NORM_KM_PER_DAY = 80
NORM_PROF_PER_DAY = 75
NORM_SHTAK_PER_DAY = 50

POST_OPTIONS = {
    '60x60x2':   {'label': '60×60×2 мм',   'pricePerPost': 520},
    '60x60x3':   {'label': '60×60×3 мм',   'pricePerPost': 720},
    '80x80x2':   {'label': '80×80×2 мм',   'pricePerPost': 780},
    '100x100x3': {'label': '100×100×3 мм', 'pricePerPost': 1200},
    'round_57':  {'label': '⌀57×3 мм',     'pricePerPost': 480},
}
LAG_OPTIONS = {
    '40x20x1.5': {'label': '40×20×1.5 мм', 'pricePerM': 95},
    '40x25x2':   {'label': '40×25×2 мм',   'pricePerM': 130},
    '60x30x2':   {'label': '60×30×2 мм',   'pricePerM': 175},
    '40x40x2':   {'label': '40×40×2 мм',   'pricePerM': 155},
}
PROFLIST_OPTIONS = {
    'C8':  {'label': 'С8',  'priceM2': 780},
    'C20': {'label': 'С20', 'priceM2': 1020},
    'C21': {'label': 'С21', 'priceM2': 1080},
}
SHTAK_OPTIONS = {
    'sh_flat':  {'label': 'Плоский 100 мм',    'pricePerM': 85},
    'sh_m':     {'label': 'М-образный 110 мм', 'pricePerM': 95},
    'sh_p':     {'label': 'П-образный 120 мм', 'pricePerM': 105},
    'sh_round': {'label': 'Скруглённый',        'pricePerM': 110},
    'sh_decor': {'label': 'Декоративный',       'pricePerM': 145},
}
COATING_OPTIONS = {
    'polyester': {'label': 'Полиэстер',    'surcharge': 0.0},
    'pural':     {'label': 'Пурал',        'surcharge': 0.2},
    'pvdf':      {'label': 'PVDF (Матт)',  'surcharge': 0.35},
    'print':     {'label': 'PrintPattern', 'surcharge': 0.5},
}
CANOPY_TYPES = {
    'односкат': {'label': 'Односкат', 'priceM2': 3200},
    'двухскат': {'label': 'Двухскат', 'priceM2': 3800},
    'арочный':  {'label': 'Арочный',  'priceM2': 4500},
    'полукруг': {'label': 'Полукруг', 'priceM2': 4800},
}
CANOPY_COVER = {
    'polycarb':         {'label': 'Поликарбонат 8 мм', 'priceM2': 720},
    'profnastil_c21':   {'label': 'Профлист С21',       'priceM2': 540},
    'metallocherepica': {'label': 'Металлочерепица',    'priceM2': 690},
}
FOUND_OPTIONS = {
    'prisypka':      {'label': 'Присыпка щебнем', 'perPost': 0,    'perM': 0,    'gift': True},
    'butovanie':     {'label': 'Бутование',        'perPost': 800,  'perM': 0,    'gift': False},
    'betonirovanie': {'label': 'Бетонирование',    'perPost': 1400, 'perM': 0,    'gift': False},
    'lentochny':     {'label': 'Ленточный',        'perPost': 0,    'perM': 3200, 'gift': False},
}
GATE_OPTIONS = {
    'none':        {'label': 'Без ворот',  'base': 0,     'perM': 0},
    'otkatnye':    {'label': 'Откатные',   'base': 75000, 'perM': 5500},
    'raspashnye':  {'label': 'Распашные',  'base': 42000, 'perM': 3800},
    'sektcionnye': {'label': 'Секционные', 'base': 88000, 'perM': 6500},
}
WICKET_OPTIONS = {
    'none':     {'label': 'Нет',        'price': 0},
    'standard': {'label': 'Стандарт',   'price': 9500},
    'kovka':    {'label': 'Кованая',    'price': 19500},
    'auto':     {'label': 'Авто-замок', 'price': 14500},
}
OBJECT_LABELS = {
    'profnastil': 'Забор из профнастила',
    'shtak':      'Евроштакетник',
    '3d':         '3D-сетка сварная',
    'kovka':      'Кованый забор',
    'setka':      'Сетка-рабица',
    'canopy':     'Навес / беседка',
}

DEFAULTS = {
    'objectType': 'profnastil', 'fenceLength': 30, 'fenceHeight': 2,
    'postId': '60x60x2', 'lagId': '40x25x2', 'lagRows': 2,
    'proflistId': 'C8', 'shtakId': 'sh_flat', 'shtakGap': 20,
    'coatingId': 'polyester', 'foundId': 'prisypka',
    'gateId': 'none', 'gateCount': 1, 'gateWidth': 4,
    'wicketId': 'none', 'wicketCount': 1, 'wicketWidth': 1,
    'automation': False, 'painting': False, 'installation': True,
    'canopyType': 'двухскат', 'canopyLength': 6, 'canopyWidth': 4,
    'canopyHeight': 2.2,
    'canopyCoverId': 'polycarb', 'distanceKm': 0,
    'chess': False, 'complexHard': False, 'canopySnow': 'light',
}


def fmt_rub(n):
    return '{:,}'.format(int(round(n or 0))).replace(',', ' ') + ' ₽'


# Параметры расчёта (мутируются из БД)
PARAMS = {
    'install_share': 35, 'paint_m2': 280, 'auto_gate': 22000,
    'nashivka_double': 60, 'paint_double': 25,
    'height_surcharge': 15, 'complexity_hard': 20, 'shtak_chess': 80,
    'canopy_frame_m2': 1450, 'canopy_snow_heavy': 18, 'canopy_post_price': 1800,
}
# Наполнение без покрытия, ₽/м² (мутируется из БД, категория fill)
FILL_PRICES = {'3d': 1600, 'kovka': 4500, 'setka': 550}


def load_pricing_from_db(conn):
    """Загружает единый прайс из calc_pricing и обновляет справочники/параметры.

    Гарантирует, что бот считает по тем же ценам, что и сайт. Если таблицы
    нет или БД недоступна — остаются дефолтные значения (без падения).
    """
    global MIN_INSTALL_COST, DELIVERY_PER_KM, DELIVERY_MIN, OVERSIZE_COST, AUTO_DISCOUNT_PCT
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT category,item_key,price,price2,coef FROM calc_pricing WHERE is_active=TRUE"
            )
            rows = cur.fetchall()
    except Exception:
        return  # тихо: используем дефолты
    for cat, key, price, price2, coef in rows:
        price = float(price or 0)
        price2 = float(price2 or 0)
        coef = float(coef or 0)
        if cat == 'post' and key in POST_OPTIONS:
            POST_OPTIONS[key]['pricePerPost'] = price
        elif cat == 'lag' and key in LAG_OPTIONS:
            LAG_OPTIONS[key]['pricePerM'] = price
        elif cat == 'proflist' and key in PROFLIST_OPTIONS:
            PROFLIST_OPTIONS[key]['priceM2'] = price
        elif cat == 'shtak' and key in SHTAK_OPTIONS:
            SHTAK_OPTIONS[key]['pricePerM'] = price
        elif cat == 'coating' and key in COATING_OPTIONS:
            COATING_OPTIONS[key]['surcharge'] = coef
        elif cat == 'found' and key in FOUND_OPTIONS:
            FOUND_OPTIONS[key]['perPost'] = price
            FOUND_OPTIONS[key]['perM'] = price2
        elif cat == 'gate' and key in GATE_OPTIONS:
            GATE_OPTIONS[key]['base'] = price
            GATE_OPTIONS[key]['perM'] = price2
        elif cat == 'wicket' and key in WICKET_OPTIONS:
            WICKET_OPTIONS[key]['price'] = price
        elif cat == 'canopy_type' and key in CANOPY_TYPES:
            CANOPY_TYPES[key]['priceM2'] = price
        elif cat == 'canopy_cover' and key in CANOPY_COVER:
            CANOPY_COVER[key]['priceM2'] = price
        elif cat == 'fill':
            FILL_PRICES[key] = price
        elif cat == 'param':
            if key == 'min_install':
                MIN_INSTALL_COST = price
            elif key == 'delivery_per_km':
                DELIVERY_PER_KM = price
            elif key == 'delivery_min':
                DELIVERY_MIN = price
            elif key == 'oversize':
                OVERSIZE_COST = price
            elif key == 'auto_discount':
                AUTO_DISCOUNT_PCT = price
            else:
                PARAMS[key] = price


def calculate(inp):
    """Точная копия calculate() из calcCatalog.ts. inp — dict частичных параметров."""
    c = dict(DEFAULTS)
    c.update({k: v for k, v in (inp or {}).items() if v is not None})

    is_canopy = c['objectType'] == 'canopy'
    is_prof = c['objectType'] == 'profnastil'
    is_shtak = c['objectType'] == 'shtak'

    gates_w = c['gateCount'] * c['gateWidth'] if c['gateId'] != 'none' else 0
    wickets_w = c['wicketCount'] * c['wicketWidth'] if c['wicketId'] != 'none' else 0
    openings = gates_w + wickets_w
    net_len = max(0, c['fenceLength'] - openings)
    fence_area = 0 if is_canopy else net_len * c['fenceHeight']

    post = POST_OPTIONS.get(c['postId'], POST_OPTIONS['60x60x2'])
    spans = math.ceil(net_len / 2.5) if net_len > 0 else 0
    opening_posts = (c['gateCount'] * 2 if c['gateId'] != 'none' else 0) \
                  + (c['wicketCount'] * 2 if c['wicketId'] != 'none' else 0)
    post_count = 0 if is_canopy else spans + 1 + opening_posts
    post_height = c['fenceHeight'] + 1.2
    post_cost = post_count * post['pricePerPost'] * math.ceil(post_height / 3)

    lag = LAG_OPTIONS.get(c['lagId'], LAG_OPTIONS['40x25x2'])
    lag_total_m = 0 if is_canopy else net_len * c['lagRows']
    lag_cost = lag_total_m * lag['pricePerM']

    filling_cost = 0.0
    filling_label = ''
    if is_prof:
        pl = PROFLIST_OPTIONS.get(c['proflistId'], PROFLIST_OPTIONS['C10'])
        coat = COATING_OPTIONS.get(c['coatingId'], COATING_OPTIONS['polyester'])
        price_m2 = pl['priceM2'] * (1 + coat['surcharge'])
        filling_cost = fence_area * price_m2
        filling_label = f"Профлист {pl['label']} ({coat['label']})"
    elif is_shtak:
        sh = SHTAK_OPTIONS.get(c['shtakId'], SHTAK_OPTIONS['sh_flat'])
        coat = COATING_OPTIONS.get(c['coatingId'], COATING_OPTIONS['polyester'])
        plank_w = 0.1
        planks_per_m = max(1, math.floor(1 / (plank_w + c['shtakGap'] / 100)))
        total_planks = math.ceil(net_len * planks_per_m)
        price_per_plank = sh['pricePerM'] * c['fenceHeight'] * (1 + coat['surcharge'])
        filling_cost = total_planks * price_per_plank
        filling_label = f"Штакетник {sh['label']} ({coat['label']})"
    elif c['objectType'] == '3d':
        filling_cost = fence_area * FILL_PRICES.get('3d', 1600)
        filling_label = '3D-сетка сварная'
    elif c['objectType'] == 'kovka':
        filling_cost = fence_area * FILL_PRICES.get('kovka', 4500)
        filling_label = 'Ковка художественная'
    elif c['objectType'] == 'setka':
        filling_cost = fence_area * FILL_PRICES.get('setka', 550)
        filling_label = 'Сетка-рабица оцинкованная'

    # Нашивка двухсторонняя / двусторонний окрас (только проф/штакетник)
    if (is_prof or is_shtak) and filling_cost > 0:
        if c.get('nashivka') == 'double' and PARAMS.get('nashivka_double'):
            filling_cost *= (1 + PARAMS['nashivka_double'] / 100)
            filling_label += ' · двухсторонняя'
        if c.get('paintBoth') and PARAMS.get('paint_double'):
            filling_cost *= (1 + PARAMS['paint_double'] / 100)
            filling_label += ' · окрас 2-стор'
        if is_shtak and c.get('chess') and PARAMS.get('shtak_chess'):
            filling_cost *= (1 + PARAMS['shtak_chess'] / 100)
            filling_label += ' · шахматка'

    canopy_area = c['canopyLength'] * c['canopyWidth'] if is_canopy else 0
    canopy_cost = 0.0
    if is_canopy:
        ct = CANOPY_TYPES.get(c['canopyType'], CANOPY_TYPES['двухскат'])
        cc = CANOPY_COVER.get(c['canopyCoverId'], CANOPY_COVER['polycarb_4'])
        # Детальный расчёт: каркас + кровля + опорные столбы + снеговая надбавка
        frame_unit = PARAMS.get('canopy_frame_m2', 1450) + ct['priceM2']
        frame_cost = canopy_area * frame_unit
        cover_cost = canopy_area * cc['priceM2']
        posts_n = max(4, math.ceil(canopy_area / 6))
        posts_cost = posts_n * PARAMS.get('canopy_post_price', 1800)
        snow_add = 0.0
        if c.get('canopySnow') == 'heavy' and PARAMS.get('canopy_snow_heavy'):
            snow_add = round(frame_cost * PARAMS['canopy_snow_heavy'] / 100)
        canopy_cost = frame_cost + cover_cost + posts_cost + snow_add

    fnd = FOUND_OPTIONS.get(c['foundId'], FOUND_OPTIONS['prisypka'])
    if is_canopy or fnd['gift']:
        found_cost = 0
    elif fnd['perPost'] > 0:
        found_cost = post_count * fnd['perPost']
    else:
        found_cost = c['fenceLength'] * fnd['perM']

    gate = GATE_OPTIONS.get(c['gateId'], GATE_OPTIONS['none'])
    one_gate = (gate['base'] + c['gateWidth'] * gate['perM']) if c['gateId'] != 'none' else 0
    gate_cost = one_gate * (c['gateCount'] if c['gateId'] != 'none' else 0)

    wicket = WICKET_OPTIONS.get(c['wicketId'], WICKET_OPTIONS['none'])
    wicket_cost = wicket['price'] * (c['wicketCount'] if c['wicketId'] != 'none' else 0)

    mat_sum = (canopy_cost if is_canopy else post_cost + lag_cost + filling_cost) \
            + gate_cost + wicket_cost
    install_cost = round(mat_sum * (PARAMS.get('install_share', 35) / 100)) if c['installation'] else 0
    # Факторы работ: высота >2 м и сложный участок
    work_factor = 1.0
    if not is_canopy and c['fenceHeight'] > 2 and PARAMS.get('height_surcharge'):
        steps = math.ceil((c['fenceHeight'] - 2) / 0.5)
        work_factor *= (1 + steps * PARAMS['height_surcharge'] / 100)
    if c.get('complexHard') and PARAMS.get('complexity_hard'):
        work_factor *= (1 + PARAMS['complexity_hard'] / 100)
    if work_factor != 1.0:
        install_cost = round(install_cost * work_factor)
    paint_cost = fence_area * PARAMS.get('paint_m2', 280) if (c['painting'] and not is_canopy) else 0
    auto_cost = PARAMS.get('auto_gate', 22000) if (c['automation'] and c['gateId'] != 'none') else 0

    work_total = install_cost + found_cost + paint_cost + auto_cost
    min_topup = 0
    if 0 < work_total < MIN_INSTALL_COST:
        min_topup = MIN_INSTALL_COST - work_total
        work_total = MIN_INSTALL_COST
        install_cost += min_topup

    distance_km = max(0, c['distanceKm'])
    delivery_cost = max(DELIVERY_MIN, distance_km * DELIVERY_PER_KM)

    oversize_auto = is_canopy or c['gateId'] == 'otkatnye'
    oversize_on = bool(c['oversize']) if c.get('oversize') is not None else oversize_auto
    oversize_fee = OVERSIZE_COST if oversize_on else 0

    discount_pct = min(50, max(0, c['discountPct'])) if c.get('discountPct') is not None else AUTO_DISCOUNT_PCT
    discount = round(mat_sum * discount_pct / 100)

    km_days = distance_km / NORM_KM_PER_DAY if distance_km > 0 else 0
    norm = NORM_PROF_PER_DAY if is_prof else NORM_SHTAK_PER_DAY if is_shtak else NORM_PROF_PER_DAY
    montage_days = (net_len / norm) if (not is_canopy and net_len > 0) else 0
    work_days = max(1, math.ceil(montage_days + km_days))

    total = mat_sum - discount + found_cost + install_cost + paint_cost \
          + auto_cost + delivery_cost + oversize_fee

    return {
        'objectType': c['objectType'],
        'type_label': OBJECT_LABELS.get(c['objectType'], 'Забор'),
        'length': c['fenceLength'], 'height': c['fenceHeight'],
        'area': round((canopy_area if is_canopy else fence_area), 1),
        'filling_label': filling_label,
        'materials': round(mat_sum),
        'post_cost': round(post_cost), 'lag_cost': round(lag_cost),
        'filling_cost': round(filling_cost), 'canopy_cost': round(canopy_cost),
        'gate_cost': round(gate_cost) if c['gateId'] != 'none' else 0,
        'wicket_cost': round(wicket_cost) if c['wicketId'] != 'none' else 0,
        'found_cost': round(found_cost), 'found_label': fnd['label'],
        'install': round(install_cost), 'paint': round(paint_cost),
        'auto': round(auto_cost), 'delivery': round(delivery_cost),
        'oversize': oversize_fee, 'discount': round(discount),
        'discount_pct': discount_pct, 'days': work_days,
        'post_count': post_count, 'min_topup': min_topup,
        'total': round(total),
    }