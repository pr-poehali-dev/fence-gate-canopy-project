// ────────────────────────────────────────────────────────────────────
//  Генерация PDF коммерческого предложения через jsPDF.
//  Используется и калькулятором, и формами лидов на сайте.
// ────────────────────────────────────────────────────────────────────
import { COMPANY } from "@/lib/company";

export interface KpLineItem {
  label: string;
  value: number;
  qty?: string;
  unitPrice?: number;
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString("ru-RU") + " ₽";
}

// Кэшируем base64-шрифт в памяти
let _ptSansRegularB64: string | null = null;
let _ptSansBoldB64: string | null = null;

async function _loadFont(url: string, timeoutMs = 4500): Promise<string> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { signal: ctrl.signal, mode: "cors" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const buf = await resp.arrayBuffer();
    let bin = "";
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, i + chunk)) as unknown as number[]
      );
    }
    return btoa(bin);
  } finally {
    clearTimeout(tid);
  }
}

const FONT_SOURCES: Array<{ reg: string; bold: string }> = [
  {
    reg:  "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/ptsans/PT_Sans-Web-Regular.ttf",
    bold: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/ptsans/PT_Sans-Web-Bold.ttf",
  },
  {
    reg:  "https://raw.githubusercontent.com/google/fonts/main/ofl/ptsans/PT_Sans-Web-Regular.ttf",
    bold: "https://raw.githubusercontent.com/google/fonts/main/ofl/ptsans/PT_Sans-Web-Bold.ttf",
  },
];

async function _ensureFonts(): Promise<boolean> {
  if (_ptSansRegularB64 && _ptSansBoldB64) return true;
  for (const src of FONT_SOURCES) {
    try {
      const [r, b] = await Promise.all([_loadFont(src.reg), _loadFont(src.bold)]);
      _ptSansRegularB64 = r;
      _ptSansBoldB64 = b;
      return true;
    } catch (e) {
      console.warn("PDF: источник шрифта не доступен, пробуем следующий:", e);
    }
  }
  return false;
}

export async function generateKpPDF(
  orderNum: string,
  items: KpLineItem[],
  total: number,
  params: Record<string, string>,
  opts: { returnBase64?: boolean; company?: Partial<typeof COMPANY> } = {}
): Promise<string | void> {
  // Реквизиты: из админки (opts.company) поверх дефолтных
  const co = { ...COMPANY, ...(opts.company || {}) };
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  try {
    await _ensureFonts();
    if (_ptSansRegularB64 && _ptSansBoldB64) {
      doc.addFileToVFS("PTSans-Regular.ttf", _ptSansRegularB64);
      doc.addFileToVFS("PTSans-Bold.ttf", _ptSansBoldB64);
      doc.addFont("PTSans-Regular.ttf", "PTSans", "normal");
      doc.addFont("PTSans-Bold.ttf", "PTSans", "bold");
      doc.setFont("PTSans", "normal");
    }
  } catch (e) {
    console.warn("PDF: не удалось загрузить кириллический шрифт", e);
  }

  const FONT = (_ptSansRegularB64 && _ptSansBoldB64) ? "PTSans" : "helvetica";
  const W = 210, M = 16, CW = W - M * 2;
  let y = M;

  // ── Шапка с реквизитами ──
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 0, W, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont(FONT, "bold");
  doc.setFontSize(20);
  doc.text((co.brand || "СТАЛЬГРУПП").toUpperCase(), M, 12);
  doc.setFont(FONT, "normal");
  doc.setFontSize(9);
  doc.text(co.legalName || co.shortName || "", M, 18);
  doc.setFontSize(8);
  doc.text(`ИНН ${co.inn}  •  ОГРНИП ${co.ogrnip}`, M, 24);
  doc.text(`Тел.: ${co.phone}`, W - M, 12, { align: "right" });
  doc.text(`Email: ${co.email}`, W - M, 18, { align: "right" });
  doc.text(`Сайт: ${co.site}`, W - M, 24, { align: "right" });

  y = 40;
  doc.setTextColor(30, 30, 30);
  doc.setFont(FONT, "bold");
  doc.setFontSize(16);
  doc.text("КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ", M, y);
  y += 5.5;
  doc.setFont(FONT, "normal");
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("Предварительный расчёт. Точная стоимость — после бесплатного замера.", M, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Номер: ${orderNum}`, M, y);
  doc.text(`Дата: ${new Date().toLocaleDateString("ru-RU")}`, W - M, y, { align: "right" });
  y += 4;
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(0.8);
  doc.line(M, y, W - M, y);
  y += 6;

  doc.setTextColor(30, 30, 30);
  doc.setFont(FONT, "bold");
  doc.setFontSize(11);
  doc.text("ПАРАМЕТРЫ ОБЪЕКТА", M, y);
  y += 6;
  doc.setFont(FONT, "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  for (const [k, v] of Object.entries(params)) {
    doc.text(`${k}: ${v}`, M + 3, y);
    y += 5;
  }
  y += 3;

  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.setFillColor(240, 240, 240);
  doc.rect(M, y, CW, 8, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text("№", M + 2, y + 5.5);
  doc.text("Наименование позиции", M + 10, y + 5.5);
  doc.text("Кол-во", M + 110, y + 5.5);
  doc.text("Цена ед.", M + 130, y + 5.5);
  doc.text("Сумма", W - M - 3, y + 5.5, { align: "right" });
  y += 8;

  let rowNum = 1;
  for (const item of items) {
    if (y > 255) { doc.addPage(); y = 20; }
    if (rowNum % 2 === 0) {
      doc.setFillColor(250, 248, 245);
      doc.rect(M, y, CW, 8, "F");
    }
    doc.setFont(FONT, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    doc.text(String(rowNum), M + 2, y + 5.5);

    const nameLines = doc.splitTextToSize(item.label, 90);
    const firstLine = Array.isArray(nameLines) ? nameLines[0] : nameLines;
    doc.text(firstLine, M + 10, y + 5.5);

    doc.text(item.qty || "—", M + 110, y + 5.5);
    doc.text(item.unitPrice ? fmt(item.unitPrice) : "—", M + 130, y + 5.5);

    doc.setFont(FONT, "bold");
    if (item.value === 0) {
      doc.setTextColor(249, 115, 22);
      doc.text("БЕСПЛАТНО", W - M - 3, y + 5.5, { align: "right" });
    } else {
      doc.setTextColor(40, 40, 40);
      doc.text(fmt(item.value), W - M - 3, y + 5.5, { align: "right" });
    }
    doc.setLineWidth(0.2);
    doc.setDrawColor(220, 220, 220);
    doc.line(M, y + 8, W - M, y + 8);
    y += 8;
    rowNum++;
  }

  y += 4;
  doc.setFillColor(249, 115, 22);
  doc.rect(M, y, CW, 12, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("ИТОГО (предварительно):", M + 4, y + 8.5);
  doc.text(fmt(total), W - M - 4, y + 8.5, { align: "right" });
  y += 18;

  doc.setFont(FONT, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  const conditions = [
    "• Это предварительный расчёт. Точная стоимость определяется после бесплатного замера.",
    "• Гарантия на конструкции: 3 года. На покраску: 3 года. На монтаж: 3 года.",
    "• Срок изготовления: 7–14 рабочих дней. КП действительно 30 дней.",
    "• Бесплатный выезд замерщика в день обращения по Москве и МО.",
    "• География: Люберцы, Чапаевка, Астрецово, Назарьево, Реутов, Балашиха, Мытищи и др.",
  ];
  for (const line of conditions) {
    if (y > 248) break;
    doc.text(line, M, y);
    y += 5;
  }

  y += 3;
  if (y < 240) {
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.rect(M, y, CW, 30);
    doc.setFont(FONT, "bold");
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text("РЕКВИЗИТЫ ИСПОЛНИТЕЛЯ", M + 3, y + 5);
    doc.setFont(FONT, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(co.legalName, M + 3, y + 10);
    doc.text(`ИНН: ${co.inn}    •    ОГРНИП: ${co.ogrnip}    •    ОКПО: ${co.okpo}`, M + 3, y + 14);
    doc.text(`Юр. адрес: ${co.legalAddress}`, M + 3, y + 18);
    doc.text(`Банк: ${co.bankName}    •    БИК: ${co.bik}`, M + 3, y + 22);
    doc.text(`Р/счёт: ${co.bankAccount}    •    К/счёт: ${co.corrAccount}`, M + 3, y + 26);
    y += 34;
  }

  if (y < 268) {
    doc.setFont(FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(`Исполнитель: ${co.shortName} _______________________`, M, y + 4);
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text("М. П.", W - M - 25, y + 4);
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(30, 30, 35);
    doc.rect(0, 285, W, 12, "F");
    doc.setFont(FONT, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(200, 200, 200);
    doc.text(
      `${co.shortName}  •  ИНН ${co.inn}  •  ${co.phone}  •  ${co.email}`,
      W / 2, 290, { align: "center" }
    );
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(`Стр. ${i} / ${pageCount}`, W - M, 294, { align: "right" });
    doc.text(COMPANY.legalAddress, M, 294);
  }

  if (opts.returnBase64) {
    const dataUri = doc.output("datauristring");
    return dataUri;
  }
  doc.save(`КП_СтальГрупп_${orderNum}.pdf`);
}