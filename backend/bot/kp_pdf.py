"""Серверная генерация PDF коммерческого предложения (reportlab).

Используется ботом, когда клиент оформляет заявку прямо в чате MAX —
бот считает смету и сразу формирует КП в PDF без участия фронта.
"""
import io


def fmt_rub(n):
    return '{:,}'.format(int(round(n or 0))).replace(',', ' ') + ' р.'


def build_kp_pdf_bytes(order_num, est, lead, company):
    """Возвращает bytes PDF или b'' при ошибке."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
    except Exception:
        return b''

    # Кириллический шрифт
    font_name = 'Helvetica'
    for path in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                 '/usr/share/fonts/dejavu/DejaVuSans.ttf'):
        try:
            pdfmetrics.registerFont(TTFont('DejaVu', path))
            pdfmetrics.registerFont(TTFont('DejaVu-Bold',
                                           path.replace('DejaVuSans', 'DejaVuSans-Bold')))
            font_name = 'DejaVu'
            break
        except Exception:
            continue
    bold = 'DejaVu-Bold' if font_name == 'DejaVu' else 'Helvetica-Bold'

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    W, H = A4
    M = 18 * mm
    y = H - M

    # Шапка
    c.setFillColorRGB(0.976, 0.451, 0.086)
    c.rect(0, H - 32 * mm, W, 32 * mm, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont(bold, 20)
    c.drawString(M, H - 16 * mm, (company.get('brand') or 'СТАЛЬГРУПП').upper())
    c.setFont(font_name, 9)
    c.drawString(M, H - 23 * mm, company.get('legalName') or '')
    c.drawString(M, H - 28 * mm, f"ИНН {company.get('inn','')}  тел.: {company.get('phone','')}")

    y = H - 42 * mm
    c.setFillColorRGB(0.1, 0.1, 0.1)
    c.setFont(bold, 16)
    c.drawString(M, y, 'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ')
    y -= 8 * mm
    c.setFont(font_name, 10)
    c.setFillColorRGB(0.4, 0.4, 0.4)
    c.drawString(M, y, f'Заявка: {order_num}')
    if lead.get('name'):
        c.drawString(M + 70 * mm, y, f"Клиент: {lead.get('name')}")
    y -= 10 * mm

    # Параметры
    c.setFillColorRGB(0.1, 0.1, 0.1)
    c.setFont(bold, 11)
    c.drawString(M, y, 'ПАРАМЕТРЫ ОБЪЕКТА')
    y -= 7 * mm
    c.setFont(font_name, 10)
    params = [
        ('Тип', (est.get('type_label') or '').capitalize()),
        ('Длина', f"{est.get('length','')} м"),
        ('Высота', f"{est.get('height','')} м"),
        ('Площадь', f"{est.get('area','')} м2"),
        ('Город', lead.get('city') or '-'),
        ('Срок', f"≈ {est.get('days','')} дн."),
    ]
    for k, v in params:
        c.setFillColorRGB(0.5, 0.5, 0.5)
        c.drawString(M, y, f'{k}:')
        c.setFillColorRGB(0.1, 0.1, 0.1)
        c.drawString(M + 35 * mm, y, str(v))
        y -= 6 * mm
    y -= 4 * mm

    # Смета
    c.setFont(bold, 11)
    c.drawString(M, y, 'СМЕТА')
    y -= 7 * mm
    c.setFont(font_name, 10)
    rows = [
        ('Материалы и каркас', est.get('materials', 0)),
        ('Монтаж под ключ', est.get('install', 0)),
        ('Выезд + доставка', est.get('delivery', 0)),
        ('Скидка', -(est.get('discount', 0) or 0)),
    ]
    for label, val in rows:
        c.setFillColorRGB(0.2, 0.2, 0.2)
        c.drawString(M, y, label)
        c.drawRightString(W - M, y, fmt_rub(val))
        y -= 6 * mm

    y -= 3 * mm
    c.setFillColorRGB(0.976, 0.451, 0.086)
    c.rect(M, y - 4 * mm, W - 2 * M, 11 * mm, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont(bold, 13)
    c.drawString(M + 4 * mm, y, 'ИТОГО К ОПЛАТЕ')
    c.drawRightString(W - M - 4 * mm, y, fmt_rub(est.get('total', 0)))
    y -= 18 * mm

    c.setFillColorRGB(0.45, 0.45, 0.45)
    c.setFont(font_name, 8)
    c.drawString(M, y, 'Цена предварительная. Точная стоимость — после бесплатного замера. КП действительно 30 дней.')
    y -= 5 * mm
    c.drawString(M, y, f"{company.get('legalName','')}  •  ИНН {company.get('inn','')}  •  {company.get('phone','')}")

    c.showPage()
    c.save()
    return buf.getvalue()
