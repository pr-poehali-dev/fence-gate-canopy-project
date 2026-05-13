import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";

// ─────────────────────────────────────────────────────────────────
// СПРАВОЧНИКИ КОМПЛЕКТУЮЩИХ (рыночные цены РФ 2026)
// ─────────────────────────────────────────────────────────────────

// Столбы (профтруба, цена за шт. включая заглушку)
const POST_OPTIONS = [
  { id: "60x60x2",   label: "60×60×2 мм",   pricePerPost: 520,  weightPerM: 3.56, desc: "Стандарт, до 2 м высоты" },
  { id: "60x60x3",   label: "60×60×3 мм",   pricePerPost: 720,  weightPerM: 5.19, desc: "Усиленный, тяжёлые секции" },
  { id: "80x80x2",   label: "80×80×2 мм",   pricePerPost: 780,  weightPerM: 4.83, desc: "Ворота, угловые стойки" },
  { id: "100x100x3", label: "100×100×3 мм", pricePerPost: 1200, weightPerM: 9.03, desc: "Промышленные объекты" },
  { id: "round_57",  label: "⌀57×3 мм",     pricePerPost: 480,  weightPerM: 3.91, desc: "Круглая труба, дача" },
] as const;
type PostId = typeof POST_OPTIONS[number]["id"];

// Лаги (поперечины, цена за п.м.)
const LAG_OPTIONS = [
  { id: "40x20x1.5", label: "40×20×1.5 мм", pricePerM: 95,  desc: "Лёгкие заборы до 1.5 м" },
  { id: "40x25x2",   label: "40×25×2 мм",   pricePerM: 130, desc: "Стандарт, профнастил/штакетник" },
  { id: "60x30x2",   label: "60×30×2 мм",   pricePerM: 175, desc: "Усиленный, ковка, тяжёлые" },
  { id: "40x40x2",   label: "40×40×2 мм",   pricePerM: 155, desc: "Квадратная, для 3D-сетки" },
] as const;
type LagId = typeof LAG_OPTIONS[number]["id"];

// Профлист (цена за м²)
const PROFLIST_OPTIONS = [
  { id: "C8",   label: "С8",   height_mm: 8,  priceM2: 320, desc: "Лёгкий, горизонт. и вертик." },
  { id: "C10",  label: "С10",  height_mm: 10, priceM2: 360, desc: "Самый популярный для забора" },
  { id: "C20",  label: "С20",  height_mm: 20, priceM2: 420, desc: "Жёсткий, промышленный" },
  { id: "MP20", label: "МП20", height_mm: 20, priceM2: 450, desc: "С-образный, повышенная жёсткость" },
  { id: "HC35", label: "НС35", height_mm: 35, priceM2: 520, desc: "Несущий, ворота, промзона" },
] as const;
type ProflistId = typeof PROFLIST_OPTIONS[number]["id"];

// Штакетник (цена за п.м.)
const SHTAK_OPTIONS = [
  { id: "sh_flat",     label: "Плоский 100 мм",   pricePerM: 85,  desc: "Классический" },
  { id: "sh_m",        label: "М-образный 110 мм", pricePerM: 95,  desc: "Более жёсткий" },
  { id: "sh_p",        label: "П-образный 120 мм", pricePerM: 105, desc: "Закрытый торец" },
  { id: "sh_round",    label: "Скруглённый",        pricePerM: 110, desc: "Мягкий силуэт" },
  { id: "sh_decor",    label: "Декоративный",       pricePerM: 145, desc: "Фигурный верх" },
] as const;
type ShtakId = typeof SHTAK_OPTIONS[number]["id"];

// Тип покрытия (наценка к базе)
const COATING_OPTIONS = [
  { id: "polyester",  label: "Полиэстер",      surcharge: 0,   desc: "Стандарт, 15–20 лет" },
  { id: "pural",      label: "Пурал",          surcharge: 0.2, desc: "+20%, 25–30 лет" },
  { id: "pvdf",       label: "PVDF (Матт)",    surcharge: 0.35, desc: "+35%, 30+ лет" },
  { id: "print",      label: "PrintPattern",   surcharge: 0.5, desc: "+50%, принт под дерево/камень" },
] as const;
type CoatingId = typeof COATING_OPTIONS[number]["id"];

// Навес — форма кровли
const CANOPY_TYPES = [
  { id: "односкат",   label: "Односкат",    img: "https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/files/403ab89e-476e-4b55-bdcb-bed17a93cedb.jpg", priceM2: 3200, desc: "Уклон в одну сторону, к стене" },
  { id: "двухскат",   label: "Двухскат",    img: "https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/files/d64b0cdf-11a9-4786-91c1-b6d471fc6382.jpg", priceM2: 3800, desc: "Классический домик" },
  { id: "арочный",    label: "Арочный",     img: "https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/files/ece778d8-73e4-4bbe-9f26-232c2b9b69c2.jpg", priceM2: 4500, desc: "Дуга, поликарбонат" },
  { id: "полукруг",   label: "Полукруг",    img: "https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/files/ece778d8-73e4-4bbe-9f26-232c2b9b69c2.jpg", priceM2: 4800, desc: "Веерный свод" },
] as const;
type CanopyTypeId = typeof CANOPY_TYPES[number]["id"];

// Покрытие навеса
const CANOPY_COVER = [
  { id: "profnastil", label: "Профнастил С8", priceM2: 320 },
  { id: "polycarb_4", label: "Поликарбонат 4 мм", priceM2: 480 },
  { id: "polycarb_8", label: "Поликарбонат 8 мм", priceM2: 720 },
  { id: "profnastil_color", label: "Профнастил цветной", priceM2: 420 },
] as const;
type CanopyCoverId = typeof CANOPY_COVER[number]["id"];

// Фундамент
const FOUND_OPTIONS = [
  { id: "prisypka",       label: "Присыпка щебнем 🎁",    desc: "В подарок! Временный монтаж",         perPost: 0,    perM: 0,    gift: true },
  { id: "butovanie",      label: "Бутование",              desc: "Щебень + трамбовка, глубина 0.8 м",   perPost: 800,  perM: 0,    gift: false },
  { id: "betonirovanie",  label: "Бетонирование",          desc: "Цемент М300, глубина 1.2 м",          perPost: 1400, perM: 0,    gift: false },
  { id: "lentochny",      label: "Ленточный",              desc: "Монолит 300×400, армирование, опалубка", perPost: 0, perM: 3200, gift: false },
] as const;
type FoundId = typeof FOUND_OPTIONS[number]["id"];

// Ворота
const GATE_OPTIONS = [
  { id: "none",        label: "Без ворот",   base: 0,     perM: 0,    desc: "" },
  { id: "otkatnye",    label: "Откатные",    base: 42000, perM: 3200, desc: "Консоль, до 8 м" },
  { id: "raspashnye",  label: "Распашные",   base: 26000, perM: 2400, desc: "1 или 2 створки" },
  { id: "sektcionnye", label: "Секционные",  base: 55000, perM: 4500, desc: "Подъёмные, гараж" },
] as const;
type GateId = typeof GATE_OPTIONS[number]["id"];

const WICKET_OPTIONS = [
  { id: "none",     label: "Нет",        price: 0 },
  { id: "standard", label: "Стандарт",   price: 8500 },
  { id: "kovka",    label: "Кованая",    price: 18000 },
  { id: "auto",     label: "Авто-замок", price: 12000 },
] as const;
type WicketId = typeof WICKET_OPTIONS[number]["id"];

// Основной тип
type ObjectType = "profnastil" | "shtak" | "3d" | "kovka" | "setka" | "canopy";

const OBJECT_LABELS: Record<ObjectType, string> = {
  profnastil: "Профнастил",
  shtak:      "Евроштакетник",
  "3d":       "3D-сетка",
  kovka:      "Ковка",
  setka:      "Сетка-рабица",
  canopy:     "Навес / беседка",
};

// ─────────────────────────────────────────────────────────────────
// Утилиты
// ─────────────────────────────────────────────────────────────────
let _orderSeq = parseInt(localStorage.getItem("sg_order_seq") || "1000");
function nextOrderNumber() {
  _orderSeq += 1;
  localStorage.setItem("sg_order_seq", String(_orderSeq));
  return `СГ-${new Date().getFullYear()}-${String(_orderSeq).padStart(4, "0")}`;
}

function fmt(n: number) {
  return Math.round(n).toLocaleString("ru-RU") + " ₽";
}

// ─────────────────────────────────────────────────────────────────
// PDF генерация через jsPDF
// ─────────────────────────────────────────────────────────────────
async function generatePDF(
  orderNum: string,
  objectType: ObjectType,
  items: LineItem[],
  total: number,
  params: Record<string, string>
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210, M = 16, CW = W - M * 2;
  let y = M;

  // eslint-disable-next-line no-control-regex
  const safeText = (t: string) => t.replace(/[^\x00-\x7F]/g, (c) => {
    const map: Record<string, string> = {
      "А":"A","Б":"B","В":"V","Г":"G","Д":"D","Е":"E","Ё":"YO","Ж":"ZH","З":"Z","И":"I","Й":"J",
      "К":"K","Л":"L","М":"M","Н":"N","О":"O","П":"P","Р":"R","С":"S","Т":"T","У":"U","Ф":"F",
      "Х":"KH","Ц":"TS","Ч":"CH","Ш":"SH","Щ":"SCH","Ъ":"","Ы":"Y","Ь":"","Э":"E","Ю":"YU","Я":"YA",
      "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh","з":"z","и":"i","й":"j",
      "к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f",
      "х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"sch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya",
      "₽":"rub","×":"x","–":"-","—":"-","°":"","©":"(c)","«":'"',"»":'"',
    };
    return map[c] !== undefined ? map[c] : "?";
  });

  const tr = (t: string) => safeText(t);

  // Шапка
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("STAL'GRUPP", M, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Proizvodstvo metallicheskikh ograzhdeniy", M, 20);
  doc.text("+7 800 123-45-67  |  info@stalgrupp.ru", W - M, 13, { align: "right" });
  doc.text("Moskva, ul. Promyshlennaya, 12", W - M, 20, { align: "right" });

  y = 36;
  // Заголовок КП
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("KOMMERCHESKOE PREDLOZHENIE", M, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`Nomer: ${orderNum}`, M, y);
  doc.text(`Data: ${new Date().toLocaleDateString("ru-RU")}`, W - M, y, { align: "right" });
  y += 4;
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(0.8);
  doc.line(M, y, W - M, y);
  y += 6;

  // Параметры объекта
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(tr("PARAMETRY OB'EKTA"), M, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  for (const [k, v] of Object.entries(params)) {
    doc.text(tr(`${k}: ${v}`), M + 3, y);
    y += 5;
  }
  y += 3;

  // Таблица позиций
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);

  // Заголовок таблицы
  doc.setFillColor(240, 240, 240);
  doc.rect(M, y, CW, 8, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("Nr", M + 2, y + 5.5);
  doc.text(tr("Nazvanie pozitsii"), M + 10, y + 5.5);
  doc.text(tr("Kol-vo"), M + 110, y + 5.5);
  doc.text(tr("Tsena ed."), M + 130, y + 5.5);
  doc.text(tr("Summa"), W - M - 3, y + 5.5, { align: "right" });
  y += 8;

  let rowNum = 1;
  for (const item of items) {
    if (y > 265) { doc.addPage(); y = 20; }
    const bg = rowNum % 2 === 0;
    if (bg) {
      doc.setFillColor(250, 248, 245);
      doc.rect(M, y, CW, 8, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    doc.text(String(rowNum), M + 2, y + 5.5);
    const nameLines = doc.splitTextToSize(tr(item.label), 90);
    doc.text(nameLines, M + 10, y + 5.5);
    doc.text(tr(item.qty || ""), M + 110, y + 5.5);
    doc.text(item.unitPrice ? tr(fmt(item.unitPrice)) : "", M + 130, y + 5.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(item.value === 0 ? 249 : 40, item.value === 0 ? 115 : 40, item.value === 0 ? 22 : 40);
    doc.text(item.value === 0 ? "BESPLATNO" : tr(fmt(item.value)), W - M - 3, y + 5.5, { align: "right" });
    doc.setLineWidth(0.2);
    doc.setDrawColor(220, 220, 220);
    doc.line(M, y + 8, W - M, y + 8);
    y += 8;
    rowNum++;
  }

  y += 4;
  // Итог
  doc.setFillColor(249, 115, 22);
  doc.rect(M, y, CW, 12, "F");
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(tr("ITOGO (predvaritelno):"), M + 4, y + 8.5);
  doc.text(tr(fmt(total)), W - M - 4, y + 8.5, { align: "right" });
  y += 18;

  // Условия
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const conditions = [
    "* Predvaritelnyy raschet. Tochnaya stoimost opredelyaetsya posle zamera (+/- 5-15%).",
    "* Garantiya na konstruktsii: 5 let. Na pokrasku: 3 goda. Na montazh: 2 goda.",
    "* Srok izgotovleniya: 7-14 rabochikh dney. KP deystivtelno 30 dney.",
    "* Besplatnyy vyezd zamershchika v den obrashcheniya.",
  ];
  for (const line of conditions) {
    if (y > 275) break;
    doc.text(line, M, y);
    y += 5;
  }

  // Нижний колонтитул
  doc.setFillColor(30, 30, 35);
  doc.rect(0, 285, W, 12, "F");
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text("STAL'GRUPP | 8 800 123-45-67 | info@stalgrupp.ru | Moskva", W / 2, 292, { align: "center" });

  doc.save(`KP_StalGrupp_${orderNum}.pdf`);
}

// ─────────────────────────────────────────────────────────────────
// Типы
// ─────────────────────────────────────────────────────────────────
interface LineItem {
  label: string;
  value: number;
  qty?: string;
  unitPrice?: number;
}

interface CalcState {
  objectType:    ObjectType;
  fenceLength:   number;
  fenceHeight:   number;
  postId:        PostId;
  lagId:         LagId;
  lagRows:       number;
  proflistId:    ProflistId;
  shtakId:       ShtakId;
  shtakGap:      number;
  coatingId:     CoatingId;
  foundId:       FoundId;
  gateId:        GateId;
  gateWidth:     number;
  wicketId:      WicketId;
  automation:    boolean;
  painting:      boolean;
  installation:  boolean;
  canopyType:    CanopyTypeId;
  canopyArea:    number;
  canopyCoverId: CanopyCoverId;
}

// ─────────────────────────────────────────────────────────────────
// Компонент
// ─────────────────────────────────────────────────────────────────
export default function Calculator() {
  const [calc, setCalc] = useState<CalcState>({
    objectType:    "profnastil",
    fenceLength:   30,
    fenceHeight:   2,
    postId:        "60x60x2",
    lagId:         "40x25x2",
    lagRows:       2,
    proflistId:    "C10",
    shtakId:       "sh_m",
    shtakGap:      5,
    coatingId:     "polyester",
    foundId:       "betonirovanie",
    gateId:        "none",
    gateWidth:     4,
    wicketId:      "none",
    automation:    false,
    painting:      false,
    installation:  true,
    canopyType:    "односкат",
    canopyArea:    20,
    canopyCoverId: "polycarb_4",
  });

  const [showKP, setShowKP] = useState(false);
  const [orderNum] = useState(() => nextOrderNumber());
  const [pdfLoading, setPdfLoading] = useState(false);
  const kpRef = useRef<HTMLDivElement>(null);

  const set = (p: Partial<CalcState>) => setCalc(c => ({ ...c, ...p }));
  const isCanopy = calc.objectType === "canopy";
  const isShtak  = calc.objectType === "shtak";
  const isProf   = calc.objectType === "profnastil";
  const hasFence = !isCanopy;

  // ── Расчёт ──────────────────────────────────────────────────────
  const fenceArea    = calc.fenceLength * calc.fenceHeight;
  const postCount    = hasFence ? Math.ceil(calc.fenceLength / 2.5) + 1 : 0;
  const postHeight   = calc.fenceHeight + 1.2; // вкопанная часть
  const postObj      = POST_OPTIONS.find(p => p.id === calc.postId)!;
  const postCost     = postCount * postObj.pricePerPost * Math.ceil(postHeight / 3) * 1; // 1 пост = 1 труба 3м

  const lagObj       = LAG_OPTIONS.find(l => l.id === calc.lagId)!;
  const lagTotalM    = hasFence ? calc.fenceLength * calc.lagRows : 0;
  const lagCost      = lagTotalM * lagObj.pricePerM;

  // Наполнение
  let fillingCost = 0;
  let fillingLabel = "";
  if (isProf) {
    const pl     = PROFLIST_OPTIONS.find(p => p.id === calc.proflistId)!;
    const coat   = COATING_OPTIONS.find(c => c.id === calc.coatingId)!;
    const priceM2 = pl.priceM2 * (1 + coat.surcharge);
    fillingCost  = fenceArea * priceM2;
    fillingLabel = `Профлист ${pl.label} (${coat.label})`;
  } else if (isShtak) {
    const sh     = SHTAK_OPTIONS.find(s => s.id === calc.shtakId)!;
    const coat   = COATING_OPTIONS.find(c => c.id === calc.coatingId)!;
    // штакетник: кол-во планок на м ширины с учётом зазора
    const plankW = 0.1; // ~100мм
    const planksPerM = Math.floor(1 / (plankW + calc.shtakGap / 100));
    const totalPlanks = Math.ceil(calc.fenceLength * planksPerM);
    const pricePerPlank = sh.pricePerM * calc.fenceHeight * (1 + coat.surcharge);
    fillingCost  = totalPlanks * pricePerPlank;
    fillingLabel = `Штакетник ${sh.label} ${totalPlanks} шт.`;
  } else if (calc.objectType === "3d") {
    fillingCost  = fenceArea * 1600;
    fillingLabel = "3D-сетка сварная";
  } else if (calc.objectType === "kovka") {
    fillingCost  = fenceArea * 4500;
    fillingLabel = "Ковка художественная";
  } else if (calc.objectType === "setka") {
    fillingCost  = fenceArea * 550;
    fillingLabel = "Сетка-рабица оцинкованная";
  }

  // Навес
  let canopyCost = 0;
  if (isCanopy) {
    const ct   = CANOPY_TYPES.find(c => c.id === calc.canopyType)!;
    const cc   = CANOPY_COVER.find(c => c.id === calc.canopyCoverId)!;
    canopyCost = calc.canopyArea * (ct.priceM2 + cc.priceM2);
  }

  // Фундамент
  const fnd     = FOUND_OPTIONS.find(f => f.id === calc.foundId)!;
  const foundCost = isCanopy ? 0 : fnd.gift ? 0 : fnd.perPost > 0 ? postCount * fnd.perPost : calc.fenceLength * fnd.perM;

  // Ворота
  const gateObj  = GATE_OPTIONS.find(g => g.id === calc.gateId)!;
  const gateCost = gateObj.base + (calc.gateId !== "none" ? calc.gateWidth * gateObj.perM : 0);

  // Калитка
  const wicketObj  = WICKET_OPTIONS.find(w => w.id === calc.wicketId)!;
  const wicketCost = wicketObj.price;

  // Монтаж, покраска, автоматика
  const matSum      = (hasFence ? postCost + lagCost + fillingCost : canopyCost) + gateCost + wicketCost;
  const installCost = calc.installation ? Math.round(matSum * 0.35) : 0;
  const paintCost   = calc.painting && !isCanopy ? fenceArea * 280 : 0;
  const autoCost    = calc.automation && calc.gateId !== "none" ? 22000 : 0;

  const total = matSum + foundCost + installCost + paintCost + autoCost;

  // ── Позиции ─────────────────────────────────────────────────────
  const lineItems: LineItem[] = isCanopy ? [
    { label: `Навес ${CANOPY_TYPES.find(c=>c.id===calc.canopyType)!.label} (${calc.canopyArea} м²)`, value: canopyCost, qty: `${calc.canopyArea} м²`, unitPrice: CANOPY_TYPES.find(c=>c.id===calc.canopyType)!.priceM2 },
  ] : [
    { label: `Столбы ${postObj.label} — ${postCount} шт. × ${Math.ceil(postHeight/3)} шт.`, value: postCost, qty: `${postCount} шт.`, unitPrice: postObj.pricePerPost },
    { label: `Лаги ${lagObj.label} — ${lagTotalM} м.п. (${calc.lagRows} ряда)`, value: lagCost, qty: `${lagTotalM} м`, unitPrice: lagObj.pricePerM },
    { label: fillingLabel + ` (${fenceArea} м²)`, value: fillingCost, qty: `${fenceArea} м²`, unitPrice: Math.round(fillingCost / fenceArea) },
  ];
  if (foundCost > 0) lineItems.push({ label: `Фундамент: ${fnd.label}`, value: foundCost, qty: fnd.perPost > 0 ? `${postCount} столб.` : `${calc.fenceLength} м`, unitPrice: fnd.perPost > 0 ? fnd.perPost : fnd.perM });
  if (fnd.gift && !isCanopy) lineItems.push({ label: "Присыпка щебнем 🎁 — В ПОДАРОК", value: 0 });
  if (gateCost > 0) lineItems.push({ label: `${gateObj.label} ворота (${calc.gateWidth} м)`, value: gateCost, qty: `${calc.gateWidth} м`, unitPrice: gateObj.base });
  if (wicketCost > 0) lineItems.push({ label: `Калитка: ${wicketObj.label}`, value: wicketCost, qty: "1 шт.", unitPrice: wicketCost });
  if (installCost > 0) lineItems.push({ label: "Монтаж под ключ (35%)", value: installCost });
  if (paintCost > 0) lineItems.push({ label: `Порошковая покраска 280 ₽/м²`, value: paintCost, qty: `${fenceArea} м²`, unitPrice: 280 });
  if (autoCost > 0) lineItems.push({ label: "Автоматика ворот DoorHan", value: autoCost, qty: "1 компл.", unitPrice: autoCost });

  // Параметры объекта для КП
  const kpParams: Record<string, string> = isCanopy
    ? { "Tip ob'ekta": "Naves/Besedka", "Forma krovli": calc.canopyType, "Ploshchad": `${calc.canopyArea} m2`, "Pokrytie": CANOPY_COVER.find(c=>c.id===calc.canopyCoverId)!.label }
    : {
        "Tip obedinenyya": OBJECT_LABELS[calc.objectType],
        "Perimetr":  `${calc.fenceLength} m`,
        "Vysota":    `${calc.fenceHeight} m`,
        "Stolby":    postObj.label,
        "Lagi":      `${lagObj.label}, ${calc.lagRows} ryada`,
        "Fundament": fnd.label,
        ...(calc.gateId !== "none" ? { "Vorota": `${gateObj.label}, ${calc.gateWidth} m` } : {}),
        ...(calc.wicketId !== "none" ? { "Kalitka": wicketObj.label } : {}),
      };

  const handlePDF = async () => {
    setPdfLoading(true);
    try { await generatePDF(orderNum, calc.objectType, lineItems, total, kpParams); }
    finally { setPdfLoading(false); }
  };

  // ── JSX ─────────────────────────────────────────────────────────
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ── Настройки (3 col) ── */}
        <div className="lg:col-span-3 space-y-7">

          {/* Тип объекта */}
          <div>
            <label className="block text-xs font-semibold text-orange-400 uppercase tracking-widest mb-3">Тип ограждения / объекта</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(OBJECT_LABELS) as [ObjectType, string][]).map(([v, label]) => (
                <button key={v} onClick={() => set({ objectType: v })}
                  className={`px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    calc.objectType === v
                      ? "bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25"
                      : "bg-[#1a1f2e] border border-[#1e2230] text-white/70 hover:border-orange-500/50 hover:text-white"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* НАВЕС */}
          {isCanopy && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-orange-400 uppercase tracking-widest mb-3">Форма кровли</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CANOPY_TYPES.map(ct => (
                    <button key={ct.id} onClick={() => set({ canopyType: ct.id })}
                      className={`rounded-xl overflow-hidden border-2 transition-all ${
                        calc.canopyType === ct.id ? "border-orange-500" : "border-[#1e2230] hover:border-orange-500/40"
                      }`}>
                      <img src={ct.img} alt={ct.label} className="w-full h-20 object-cover" />
                      <div className={`py-2 text-xs font-semibold text-center ${calc.canopyType === ct.id ? "bg-orange-500 text-gray-900" : "bg-[#1a1f2e] text-white/70"}`}>
                        {ct.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-white/70">Площадь навеса</label>
                  <span className="text-orange-400 font-bold font-oswald text-lg">{calc.canopyArea} м²</span>
                </div>
                <input type="range" min={6} max={120} step={2} value={calc.canopyArea} onChange={e => set({ canopyArea: +e.target.value })} />
                <div className="flex justify-between text-xs text-white/30 mt-1"><span>6 м²</span><span>120 м²</span></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">Покрытие кровли</label>
                <div className="grid grid-cols-2 gap-2">
                  {CANOPY_COVER.map(cc => (
                    <button key={cc.id} onClick={() => set({ canopyCoverId: cc.id })}
                      className={`px-3 py-3 rounded-xl text-left text-xs transition-all ${
                        calc.canopyCoverId === cc.id
                          ? "bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25"
                          : "bg-[#1a1f2e] border border-[#1e2230] text-white/70 hover:border-orange-500/40"
                      }`}>
                      <div className="font-semibold">{cc.label}</div>
                      <div className={`mt-0.5 ${calc.canopyCoverId === cc.id ? "text-gray-900/70" : "text-white/35"}`}>{cc.priceM2.toLocaleString("ru-RU")} ₽/м²</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ЗАБОР: размеры */}
          {hasFence && (
            <div className="grid grid-cols-2 gap-5">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-white/70">Длина периметра</label>
                  <span className="text-orange-400 font-bold font-oswald">{calc.fenceLength} м</span>
                </div>
                <input type="range" min={5} max={300} step={5} value={calc.fenceLength} onChange={e => set({ fenceLength: +e.target.value })} />
                <div className="flex justify-between text-xs text-white/30 mt-1"><span>5</span><span>300 м</span></div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-white/70">Высота</label>
                  <span className="text-orange-400 font-bold font-oswald">{calc.fenceHeight.toFixed(1)} м</span>
                </div>
                <input type="range" min={1} max={3} step={0.5} value={calc.fenceHeight} onChange={e => set({ fenceHeight: +e.target.value })} />
                <div className="flex justify-between text-xs text-white/30 mt-1"><span>1</span><span>3 м</span></div>
              </div>
            </div>
          )}

          {/* Столбы */}
          {hasFence && (
            <div>
              <label className="block text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">
                Столбы — профтруба <span className="text-white/40 normal-case font-normal">шаг 2.5 м, {postCount} шт., глубина {(calc.fenceHeight * 0.6).toFixed(1)} м</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {POST_OPTIONS.map(p => (
                  <button key={p.id} onClick={() => set({ postId: p.id })}
                    className={`px-3 py-3 rounded-xl text-left text-xs transition-all ${
                      calc.postId === p.id
                        ? "bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25"
                        : "bg-[#1a1f2e] border border-[#1e2230] text-white/70 hover:border-orange-500/40"
                    }`}>
                    <div className="font-semibold">{p.label}</div>
                    <div className={`mt-0.5 ${calc.postId === p.id ? "text-gray-900/70" : "text-white/35"}`}>{p.pricePerPost.toLocaleString("ru-RU")} ₽/шт · {p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Лаги */}
          {hasFence && (
            <div>
              <label className="block text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">
                Лаги (прожилины) <span className="text-white/40 normal-case font-normal">профтруба</span>
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {LAG_OPTIONS.map(l => (
                  <button key={l.id} onClick={() => set({ lagId: l.id })}
                    className={`px-3 py-3 rounded-xl text-left text-xs transition-all ${
                      calc.lagId === l.id
                        ? "bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25"
                        : "bg-[#1a1f2e] border border-[#1e2230] text-white/70 hover:border-orange-500/40"
                    }`}>
                    <div className="font-semibold">{l.label}</div>
                    <div className={`mt-0.5 ${calc.lagId === l.id ? "text-gray-900/70" : "text-white/35"}`}>{l.pricePerM} ₽/м · {l.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm text-white/60">Количество рядов лаг:</label>
                <div className="flex gap-2">
                  {[2, 3, 4].map(n => (
                    <button key={n} onClick={() => set({ lagRows: n })}
                      className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                        calc.lagRows === n
                          ? "bg-orange-500 text-gray-900"
                          : "bg-[#1a1f2e] border border-[#1e2230] text-white/60 hover:border-orange-500/40"
                      }`}>{n}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Наполнение профлист */}
          {isProf && (
            <div>
              <label className="block text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">Марка профлиста</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                {PROFLIST_OPTIONS.map(p => (
                  <button key={p.id} onClick={() => set({ proflistId: p.id })}
                    className={`px-2 py-3 rounded-xl text-left text-xs transition-all ${
                      calc.proflistId === p.id
                        ? "bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25"
                        : "bg-[#1a1f2e] border border-[#1e2230] text-white/70 hover:border-orange-500/40"
                    }`}>
                    <div className="font-bold text-sm">{p.label}</div>
                    <div className={`mt-0.5 ${calc.proflistId === p.id ? "text-gray-900/70" : "text-white/35"}`}>В={p.height_mm} мм</div>
                    <div className={`${calc.proflistId === p.id ? "text-gray-900/70" : "text-white/35"}`}>{p.priceM2} ₽/м²</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Наполнение штакетник */}
          {isShtak && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">Тип штакетника</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SHTAK_OPTIONS.map(s => (
                    <button key={s.id} onClick={() => set({ shtakId: s.id })}
                      className={`px-3 py-3 rounded-xl text-left text-xs transition-all ${
                        calc.shtakId === s.id
                          ? "bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25"
                          : "bg-[#1a1f2e] border border-[#1e2230] text-white/70 hover:border-orange-500/40"
                      }`}>
                      <div className="font-semibold">{s.label}</div>
                      <div className={`mt-0.5 ${calc.shtakId === s.id ? "text-gray-900/70" : "text-white/35"}`}>{s.pricePerM} ₽/м · {s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-white/60">Зазор между планками</label>
                  <span className="text-orange-400 font-bold font-oswald">{calc.shtakGap} мм</span>
                </div>
                <input type="range" min={0} max={100} step={5} value={calc.shtakGap} onChange={e => set({ shtakGap: +e.target.value })} />
                <div className="flex justify-between text-xs text-white/30 mt-1"><span>Без зазора</span><span>100 мм</span></div>
              </div>
            </div>
          )}

          {/* Покрытие (для проф и штакетника) */}
          {(isProf || isShtak) && (
            <div>
              <label className="block text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">Тип покрытия</label>
              <div className="grid grid-cols-2 gap-2">
                {COATING_OPTIONS.map(c => (
                  <button key={c.id} onClick={() => set({ coatingId: c.id })}
                    className={`px-3 py-3 rounded-xl text-left text-xs transition-all ${
                      calc.coatingId === c.id
                        ? "bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25"
                        : "bg-[#1a1f2e] border border-[#1e2230] text-white/70 hover:border-orange-500/40"
                    }`}>
                    <div className="font-semibold">{c.label}</div>
                    <div className={`mt-0.5 ${calc.coatingId === c.id ? "text-gray-900/70" : "text-white/35"}`}>{c.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Фундамент */}
          {hasFence && (
            <div>
              <label className="block text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">Тип фундамента / монтажа столбов</label>
              <div className="space-y-2">
                {FOUND_OPTIONS.map(f => (
                  <label key={f.id} className="flex items-start gap-3 cursor-pointer group">
                    <div onClick={() => set({ foundId: f.id })}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        calc.foundId === f.id ? "border-orange-500 bg-orange-500" : "border-[#2a3040] group-hover:border-orange-500/50"
                      }`}>
                      {calc.foundId === f.id && <div className="w-2 h-2 rounded-full bg-gray-900" />}
                    </div>
                    <div className="flex-1 flex items-start justify-between gap-2">
                      <div>
                        <div className={`text-sm font-medium ${f.gift ? "text-orange-400" : "text-white"}`}>{f.label}</div>
                        <div className="text-xs text-white/35">{f.desc}</div>
                      </div>
                      <div className="text-xs text-white/40 whitespace-nowrap mt-0.5">
                        {f.gift ? "Бесплатно" : f.perPost > 0 ? `${f.perPost.toLocaleString("ru-RU")} ₽/столб` : f.perM > 0 ? `${f.perM.toLocaleString("ru-RU")} ₽/м` : ""}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Ворота */}
          <div>
            <label className="block text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">Ворота</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {GATE_OPTIONS.map(g => (
                <button key={g.id} onClick={() => set({ gateId: g.id })}
                  className={`px-2 py-3 rounded-xl text-xs font-medium transition-all ${
                    calc.gateId === g.id
                      ? "bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25"
                      : "bg-[#1a1f2e] border border-[#1e2230] text-white/70 hover:border-orange-500/40"
                  }`}>
                  <div className="font-semibold">{g.label}</div>
                  {g.base > 0 && <div className={`mt-0.5 ${calc.gateId === g.id ? "text-gray-900/70" : "text-white/35"}`}>от {(g.base/1000).toFixed(0)}к ₽</div>}
                </button>
              ))}
            </div>
            {calc.gateId !== "none" && (
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs text-white/60">Ширина проёма</label>
                  <span className="text-orange-400 font-bold font-oswald">{calc.gateWidth} м</span>
                </div>
                <input type="range" min={2.5} max={8} step={0.5} value={calc.gateWidth} onChange={e => set({ gateWidth: +e.target.value })} />
                <div className="flex justify-between text-xs text-white/30 mt-1"><span>2.5 м</span><span>8 м</span></div>
              </div>
            )}
          </div>

          {/* Калитка */}
          <div>
            <label className="block text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">Калитка</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {WICKET_OPTIONS.map(w => (
                <button key={w.id} onClick={() => set({ wicketId: w.id })}
                  className={`px-2 py-3 rounded-xl text-xs font-medium transition-all ${
                    calc.wicketId === w.id
                      ? "bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25"
                      : "bg-[#1a1f2e] border border-[#1e2230] text-white/70 hover:border-orange-500/40"
                  }`}>
                  <div className="font-semibold">{w.label}</div>
                  {w.price > 0 && <div className={`mt-0.5 ${calc.wicketId === w.id ? "text-gray-900/70" : "text-white/35"}`}>{(w.price/1000).toFixed(1)}к ₽</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Допработы */}
          <div>
            <label className="block text-xs font-semibold text-orange-400 uppercase tracking-widest mb-3">Дополнительные работы</label>
            <div className="space-y-3">
              {([
                { key: "installation" as const, label: "Монтаж под ключ",    desc: `35% от суммы материалов — ${fmt(matSum * 0.35)}` },
                { key: "painting"     as const, label: "Порошковая покраска", desc: `280 ₽/м², RAL любой цвет — ${fmt(fenceArea * 280)}`, hide: isCanopy },
                { key: "automation"   as const, label: "Автоматика ворот",   desc: calc.gateId !== "none" ? "Привод DoorHan/Nice — 22 000 ₽" : "Сначала выберите ворота", disabled: calc.gateId === "none" },
              ]).filter(i => !i.hide).map(({ key, label, desc, disabled }) => (
                <label key={key} className={`flex items-start gap-3 cursor-pointer group ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
                  <div onClick={() => !disabled && set({ [key]: !calc[key] })}
                    className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all ${
                      calc[key] ? "bg-orange-500 border-orange-500" : "border-[#2a3040] group-hover:border-orange-500/50"
                    }`}>
                    {calc[key] && <Icon name="Check" size={14} className="text-gray-900" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{label}</div>
                    <div className="text-xs text-white/40">{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── Результат (2 col) ── */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-[#0a0c10] border border-[#1e2230] rounded-2xl p-6 flex-1">
            {/* Номер заказа */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="section-tag mb-0">Предварительный расчёт</div>
                <div className="text-xs text-white/30">Точная цена после замера ±5–15%</div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2 text-right">
                <div className="text-[10px] text-white/40">Номер КП</div>
                <div className="text-orange-400 font-oswald font-bold text-sm">{orderNum}</div>
              </div>
            </div>

            {/* Позиции */}
            <div className="space-y-0 mb-4">
              {lineItems.map((item, i) => (
                <div key={i} className="flex justify-between items-start py-2 border-b border-[#1a1f2e] gap-2">
                  <div className="flex-1">
                    <div className="text-white/60 text-xs leading-tight">{item.label}</div>
                    {item.qty && <div className="text-white/30 text-[11px]">{item.qty}{item.unitPrice ? ` × ${fmt(item.unitPrice)}` : ""}</div>}
                  </div>
                  <span className={`text-xs font-bold whitespace-nowrap ${item.value === 0 ? "text-orange-400" : "text-white"}`}>
                    {item.value === 0 ? "🎁 Бесплатно" : fmt(item.value)}
                  </span>
                </div>
              ))}
            </div>

            {/* Итог */}
            <div className="bg-[#0d1017] border border-orange-500/20 rounded-xl p-4 mb-5">
              <div className="text-white/40 text-xs mb-1">Итого ориентировочно</div>
              <div className="stat-number text-4xl mb-1">{fmt(total)}</div>
              {hasFence && (
                <div className="flex gap-4 text-xs text-white/40 mt-2">
                  <span>Площадь: <b className="text-white">{fenceArea} м²</b></span>
                  <span>Столбов: <b className="text-white">{postCount} шт.</b></span>
                  <span>Лаг: <b className="text-white">{lagTotalM} м</b></span>
                </div>
              )}
            </div>

            <button className="btn-orange w-full py-3.5 rounded-xl text-sm mb-3">
              <span className="flex items-center gap-2 justify-center">
                <Icon name="Phone" size={16} />
                Заказать бесплатный замер
              </span>
            </button>

            <button onClick={() => setShowKP(!showKP)}
              className="btn-outline-orange w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2 mb-3">
              <Icon name={showKP ? "ChevronUp" : "Eye"} size={15} />
              {showKP ? "Скрыть КП" : "Предварительный просмотр КП"}
            </button>

            <button
              onClick={handlePDF}
              disabled={pdfLoading}
              className="w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-oswald font-bold uppercase tracking-wide transition-all disabled:opacity-60">
              <Icon name={pdfLoading ? "Loader" : "FileDown"} size={16} className={pdfLoading ? "animate-spin" : ""} />
              {pdfLoading ? "Генерация PDF..." : "Скачать КП в PDF"}
            </button>
          </div>

          {/* Бонусы */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { icon: "Clock",       text: "Замер бесплатно" },
              { icon: "Truck",       text: "Доставка по РФ" },
              { icon: "ShieldCheck", text: "Гарантия 5 лет" },
            ].map(({ icon, text }) => (
              <div key={text} className="bg-[#141720] border border-[#1e2230] rounded-xl p-3 text-center">
                <Icon name={icon} size={16} className="text-orange-400 mx-auto mb-1" />
                <div className="text-[11px] text-white/55 leading-tight">{text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Превью КП ── */}
      {showKP && (
        <div ref={kpRef} className="mt-8 bg-white rounded-2xl overflow-hidden shadow-2xl">
          {/* Шапка */}
          <div className="bg-orange-500 px-8 py-5 flex items-center justify-between">
            <div>
              <div className="font-oswald font-bold text-3xl text-white tracking-wider">СТАЛЬГРУПП</div>
              <div className="text-white/80 text-sm">Производство металлических ограждений</div>
            </div>
            <div className="text-right text-white/90 text-sm">
              <div>8 800 123-45-67</div>
              <div>info@stalgrupp.ru</div>
            </div>
          </div>

          <div className="p-8">
            {/* Заголовок */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 font-oswald">КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h2>
                <div className="text-gray-500 text-sm mt-1">Предварительный расчёт • действительно 30 дней</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-right">
                <div className="text-orange-400 font-oswald font-bold text-xl">{orderNum}</div>
                <div className="text-gray-400 text-xs">{new Date().toLocaleDateString("ru-RU")}</div>
              </div>
            </div>

            {/* Параметры */}
            <div className="bg-gray-50 rounded-xl p-5 mb-6">
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-3">Параметры объекта</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(kpParams).map(([k, v]) => (
                  <div key={k} className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="text-gray-400 text-xs">{k.replace(/_/g, " ")}</div>
                    <div className="text-gray-800 font-semibold text-sm">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Таблица */}
            <table className="w-full mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider rounded-l-lg">№</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Наименование</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Кол-во</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider rounded-r-lg">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="py-3 px-4 text-gray-400 text-sm">{i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="text-gray-800 text-sm font-medium">{item.label}</div>
                      {item.unitPrice && <div className="text-gray-400 text-xs">{fmt(item.unitPrice)} за ед.</div>}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-sm">{item.qty || "—"}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-bold text-sm ${item.value === 0 ? "text-orange-500" : "text-gray-800"}`}>
                        {item.value === 0 ? "БЕСПЛАТНО 🎁" : fmt(item.value)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Итог */}
            <div className="bg-orange-500 rounded-xl p-5 flex items-center justify-between mb-6">
              <div className="text-white font-oswald font-bold text-xl">ИТОГО (предварительно):</div>
              <div className="text-white font-oswald font-bold text-3xl">{fmt(total)}</div>
            </div>

            {/* Условия */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                { icon: "ShieldCheck", text: "Гарантия на конструкции: 5 лет" },
                { icon: "Paintbrush",  text: "Гарантия на покраску: 3 года" },
                { icon: "Hammer",      text: "Гарантия на монтаж: 2 года" },
                { icon: "Clock",       text: "Срок изготовления: 7–14 раб. дней" },
                { icon: "Ruler",       text: "Бесплатный замер в день обращения" },
                { icon: "FileCheck",   text: "Договор + акт сдачи-приёмки" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-gray-600">
                  <Icon name={icon} size={16} className="text-orange-400 flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700">
              ⚠ Предварительный расчёт. Точная стоимость определяется после выезда замерщика на объект (отклонение ±5–15%). КП действительно 30 дней.
            </div>
          </div>

          {/* Подвал */}
          <div className="bg-gray-800 px-8 py-4 text-center text-gray-400 text-xs">
            СтальГрупп · Москва, ул. Промышленная, 12 · 8 800 123-45-67 · info@stalgrupp.ru
          </div>
        </div>
      )}
    </div>
  );
}