import { ensureCyrillicFonts } from "./pdfFonts";
import { COMPANY } from "./company";

export interface PriceLine {
  name: string;
  unit: string;
  price: string;
}

export interface PriceSection {
  title: string;
  lines: PriceLine[];
  note?: string;
}

/**
 * Базовый прайс-каталог СтальГрупп — типовые позиции «от...».
 * Используется на главной как универсальный PDF-каталог для скачивания.
 */
export const DEFAULT_CATALOG: PriceSection[] = [
  {
    title: "ОГРАЖДЕНИЯ",
    lines: [
      { name: "Забор из профнастила (С8, С10, С21)",         unit: "пог. м",   price: "от 2 100 ₽" },
      { name: "Забор из евроштакетника одно-/двусторонний",  unit: "пог. м",   price: "от 2 400 ₽" },
      { name: "Забор 3D-сетка (рулонная, секционная)",       unit: "пог. м",   price: "от 1 800 ₽" },
      { name: "Забор из сетки-рабицы",                       unit: "пог. м",   price: "от 950 ₽"   },
      { name: "Кованый забор с элементами художественной ковки", unit: "пог. м", price: "от 6 800 ₽" },
    ],
    note: "Цены включают столбы, лаги, крепёж, монтаж и доставку в радиусе 30 км от МКАД.",
  },
  {
    title: "ВОРОТА И КАЛИТКИ",
    lines: [
      { name: "Откатные ворота под ключ (h=2 м, до 5 м проём)", unit: "комплект", price: "от 67 000 ₽" },
      { name: "Распашные ворота двустворчатые",                 unit: "комплект", price: "от 38 000 ₽" },
      { name: "Калитка металлическая (h=2 м)",                  unit: "шт.",      price: "от 14 500 ₽" },
      { name: "Автоматика для откатных ворот (DoorHan, Came)",  unit: "комплект", price: "от 27 000 ₽" },
    ],
  },
  {
    title: "НАВЕСЫ И БЕСЕДКИ",
    lines: [
      { name: "Навес для авто (поликарбонат, 3×6 м)",        unit: "комплект", price: "от 89 000 ₽" },
      { name: "Навес примыкающий к дому",                    unit: "м²",       price: "от 4 600 ₽"  },
      { name: "Беседка металлическая открытая 3×3 м",        unit: "комплект", price: "от 78 000 ₽" },
      { name: "Беседка закрытая с остеклением 4×4 м",        unit: "комплект", price: "от 210 000 ₽"},
    ],
  },
  {
    title: "ФУНДАМЕНТЫ И ДОП. РАБОТЫ",
    lines: [
      { name: "Бетонирование столбов (Ø 200 мм, глубина 0,9 м)", unit: "шт.",  price: "от 950 ₽"   },
      { name: "Ленточный фундамент (h=0,5 м, b=0,2 м)",           unit: "пог. м", price: "от 2 800 ₽" },
      { name: "Демонтаж старого забора",                          unit: "пог. м", price: "от 350 ₽"   },
      { name: "Покраска полимерная (порошковая)",                 unit: "м²",     price: "от 480 ₽"   },
    ],
    note: "На все работы — гарантия 3 года. Замер и проект — бесплатно.",
  },
];

/**
 * Генерирует прайс-лист в PDF и сразу скачивает его в браузере.
 * Возвращает true при успехе.
 */
export async function generatePriceListPDF(catalog: PriceSection[] = DEFAULT_CATALOG): Promise<boolean> {
  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    let FONT = "helvetica";
    try {
      const fonts = await ensureCyrillicFonts();
      if (fonts) {
        doc.addFileToVFS("PTSans-Regular.ttf", fonts.regular);
        doc.addFileToVFS("PTSans-Bold.ttf",    fonts.bold);
        doc.addFont("PTSans-Regular.ttf", "PTSans", "normal");
        doc.addFont("PTSans-Bold.ttf",    "PTSans", "bold");
        FONT = "PTSans";
      }
    } catch { /* fallback на helvetica */ }

    const W = 210, M = 16, CW = W - M * 2;
    let y = M;

    // ── Шапка с реквизитами ──
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 0, W, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont(FONT, "bold");
    doc.setFontSize(20);
    doc.text("СтальГрупп", M, 14);
    doc.setFontSize(10);
    doc.setFont(FONT, "normal");
    doc.text("Производство и монтаж металлических ограждений с 2009 года", M, 21);
    doc.text(`Тел.: ${COMPANY.phone}`, W - M, 13, { align: "right" });
    doc.text(`Email: ${COMPANY.email}`, W - M, 19, { align: "right" });
    doc.text(`Сайт: ${COMPANY.site}`, W - M, 25, { align: "right" });

    y = 42;

    // Заголовок
    doc.setTextColor(30, 30, 30);
    doc.setFont(FONT, "bold");
    doc.setFontSize(17);
    doc.text("ПРАЙС-ЛИСТ", M, y);
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text(new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" }),
      W - M, y, { align: "right" });
    y += 8;

    // Оранжевая линия
    doc.setDrawColor(249, 115, 22);
    doc.setLineWidth(0.8);
    doc.line(M, y, M + CW, y);
    y += 8;

    // Описание
    doc.setFont(FONT, "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(80, 80, 80);
    doc.text("Актуальные цены на типовые работы. Точная стоимость рассчитывается", M, y);
    doc.text("после бесплатного выезда замерщика на объект.", M, y + 5);
    y += 13;

    // ── Секции ──
    for (const section of catalog) {
      // Перенос на новую страницу, если осталось мало места
      if (y > 250) { doc.addPage(); y = M; }

      // Заголовок секции
      doc.setFillColor(13, 16, 23);
      doc.rect(M, y, CW, 9, "F");
      doc.setFont(FONT, "bold");
      doc.setFontSize(11);
      doc.setTextColor(249, 115, 22);
      doc.text(section.title, M + 3, y + 6.2);
      y += 13;

      // Шапка таблицы
      doc.setFont(FONT, "bold");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text("НАИМЕНОВАНИЕ", M + 2, y);
      doc.text("ЕД.", M + CW - 50, y);
      doc.text("ЦЕНА", M + CW - 2, y, { align: "right" });
      y += 2;
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(M, y, M + CW, y);
      y += 5;

      // Строки
      doc.setFont(FONT, "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(40, 40, 40);
      for (const line of section.lines) {
        if (y > 275) { doc.addPage(); y = M; }
        doc.text(line.name, M + 2, y, { maxWidth: CW - 60 });
        doc.setTextColor(120, 120, 120);
        doc.text(line.unit, M + CW - 50, y);
        doc.setFont(FONT, "bold");
        doc.setTextColor(249, 115, 22);
        doc.text(line.price, M + CW - 2, y, { align: "right" });
        doc.setFont(FONT, "normal");
        doc.setTextColor(40, 40, 40);
        y += 7;
      }

      if (section.note) {
        y += 1;
        doc.setFont(FONT, "normal");
        doc.setFontSize(8);
        doc.setTextColor(110, 110, 110);
        const wrapped = doc.splitTextToSize(section.note, CW - 4);
        doc.text(wrapped, M + 2, y);
        y += wrapped.length * 4.2 + 2;
      }
      y += 4;
    }

    // ── Футер с CTA ──
    if (y > 240) { doc.addPage(); y = M; }
    y += 4;
    doc.setFillColor(249, 115, 22);
    doc.roundedRect(M, y, CW, 28, 3, 3, "F");
    doc.setFont(FONT, "bold");
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text("ХОТИТЕ ТОЧНЫЙ РАСЧЁТ ПОД ВАШ УЧАСТОК?", M + CW / 2, y + 10, { align: "center" });
    doc.setFont(FONT, "normal");
    doc.setFontSize(10);
    doc.text(`Звоните: ${COMPANY.phone}  ·  Сайт: ${COMPANY.site}`,
      M + CW / 2, y + 19, { align: "center" });
    doc.setFontSize(9);
    doc.text("Бесплатный замер в день обращения. Гарантия 3 года. Скидка 7% при заказе с сайта.",
      M + CW / 2, y + 25, { align: "center" });

    // Подвал страницы
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFont(FONT, "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(160, 160, 160);
      doc.text(`СтальГрупп · ${COMPANY.phone} · ${COMPANY.site}`, M, 292);
      doc.text(`Стр. ${i} из ${pages}`, W - M, 292, { align: "right" });
    }

    // Сохраняем
    const stamp = new Date().toISOString().slice(0, 10);
    doc.save(`Прайс-лист_СтальГрупп_${stamp}.pdf`);
    return true;
  } catch (e) {
    console.error("Не удалось сгенерировать прайс-лист", e);
    return false;
  }
}