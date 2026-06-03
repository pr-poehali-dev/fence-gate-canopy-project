// ────────────────────────────────────────────────────────────────────
//  Справочники цен и материалов для калькулятора (рынок РФ 2026)
//  Используются и старым Calculator.tsx, и новым CalculatorWizard.tsx
//
//  ⚙️ ДИНАМИЧЕСКИЕ ЦЕНЫ:
//  Массивы ниже объявлены через `let` и являются МУТАБЕЛЬНЫМИ.
//  Значения по умолчанию хранятся в DEFAULT_* константах.
//  Функция applyCalcPricing() перезаписывает их данными из БД (CMS).
//  Благодаря live-bindings ES-модулей потребители (CalculatorWizard и др.)
//  автоматически видят обновлённые значения после applyCalcPricing().
// ────────────────────────────────────────────────────────────────────

import type { CalcPriceItem } from "@/lib/api";

// Типы Id — строковые (динамический справочник из БД может содержать
// произвольные item_key, поэтому узкий union-тип здесь неуместен).
export type PostId = string;
export type LagId = string;
export type ProflistId = string;
export type ShtakId = string;
export type CoatingId = string;
export type CanopyTypeId = string;
export type CanopyCoverId = string;
export type FoundId = string;
export type GateId = string;
export type WicketId = string;

// Структуры элементов справочников
export interface PostOption     { id: string; label: string; pricePerPost: number; weightPerM: number; desc: string }
export interface LagOption      { id: string; label: string; pricePerM: number; desc: string }
export interface ProflistOption { id: string; label: string; height_mm: number; priceM2: number; desc: string }
export interface ShtakOption    { id: string; label: string; pricePerM: number; desc: string }
export interface CoatingOption  { id: string; label: string; surcharge: number; desc: string }
export interface CanopyType     { id: string; label: string; priceM2: number; desc: string }
export interface CanopyCover    { id: string; label: string; priceM2: number }
export interface FoundOption    { id: string; label: string; desc: string; perPost: number; perM: number; gift: boolean }
export interface GateOption     { id: string; label: string; base: number; perM: number; desc: string }
export interface WicketOption   { id: string; label: string; price: number; desc: string }

// ── DEFAULT-значения (фолбэк, если в БД нет позиции) ──────────────

// Столбы (профтруба, цена за шт. с заглушкой)
const DEFAULT_POST_OPTIONS: PostOption[] = [
  { id: "60x60x2",   label: "60×60×2 мм",   pricePerPost: 520,  weightPerM: 3.56, desc: "Стандарт, до 2 м высоты" },
  { id: "60x60x3",   label: "60×60×3 мм",   pricePerPost: 720,  weightPerM: 5.19, desc: "Усиленный, тяжёлые секции" },
  { id: "80x80x2",   label: "80×80×2 мм",   pricePerPost: 780,  weightPerM: 4.83, desc: "Ворота, угловые стойки" },
  { id: "100x100x3", label: "100×100×3 мм", pricePerPost: 1200, weightPerM: 9.03, desc: "Промышленные объекты" },
  { id: "round_57",  label: "⌀57×3 мм",     pricePerPost: 480,  weightPerM: 3.91, desc: "Круглая труба, дача" },
];

// Лаги (поперечины, цена за п.м.)
const DEFAULT_LAG_OPTIONS: LagOption[] = [
  { id: "40x20x1.5", label: "40×20×1.5 мм", pricePerM: 95,  desc: "Лёгкие заборы до 1.5 м" },
  { id: "40x25x2",   label: "40×25×2 мм",   pricePerM: 130, desc: "Стандарт, профнастил/штакетник" },
  { id: "60x30x2",   label: "60×30×2 мм",   pricePerM: 175, desc: "Усиленный, ковка, тяжёлые" },
  { id: "40x40x2",   label: "40×40×2 мм",   pricePerM: 155, desc: "Квадратная, для 3D-сетки" },
];

// Профлист (цена за м²)
const DEFAULT_PROFLIST_OPTIONS: ProflistOption[] = [
  { id: "C8",   label: "С8",   height_mm: 8,  priceM2: 720,  desc: "Лёгкий, горизонт. и вертик." },
  { id: "C10",  label: "С10",  height_mm: 10, priceM2: 850,  desc: "Самый популярный для забора" },
  { id: "C20",  label: "С20",  height_mm: 20, priceM2: 980,  desc: "Жёсткий, промышленный" },
  { id: "MP20", label: "МП20", height_mm: 20, priceM2: 1050, desc: "С-образный, повышенная жёсткость" },
  { id: "HC35", label: "НС35", height_mm: 35, priceM2: 1240, desc: "Несущий, ворота, промзона" },
];

// Штакетник (цена за п.м.)
const DEFAULT_SHTAK_OPTIONS: ShtakOption[] = [
  { id: "sh_flat",  label: "Плоский 100 мм",     pricePerM: 85,  desc: "Классический" },
  { id: "sh_m",     label: "М-образный 110 мм",  pricePerM: 95,  desc: "Более жёсткий" },
  { id: "sh_p",     label: "П-образный 120 мм",  pricePerM: 105, desc: "Закрытый торец" },
  { id: "sh_round", label: "Скруглённый",         pricePerM: 110, desc: "Мягкий силуэт" },
  { id: "sh_decor", label: "Декоративный",        pricePerM: 145, desc: "Фигурный верх" },
];

// Тип покрытия (наценка к базовой цене)
const DEFAULT_COATING_OPTIONS: CoatingOption[] = [
  { id: "polyester", label: "Полиэстер",    surcharge: 0,    desc: "Стандарт, 15–20 лет" },
  { id: "pural",     label: "Пурал",        surcharge: 0.2,  desc: "+20%, 25–30 лет" },
  { id: "pvdf",      label: "PVDF (Матт)",  surcharge: 0.35, desc: "+35%, 30+ лет" },
  { id: "print",     label: "PrintPattern", surcharge: 0.5,  desc: "+50%, принт под дерево/камень" },
];

// Навес — форма кровли
const DEFAULT_CANOPY_TYPES: CanopyType[] = [
  { id: "односкат", label: "Односкат", priceM2: 3200, desc: "Уклон в одну сторону, к стене" },
  { id: "двухскат", label: "Двухскат", priceM2: 3800, desc: "Классический домик" },
  { id: "арочный",  label: "Арочный",  priceM2: 4500, desc: "Дуга, поликарбонат" },
  { id: "полукруг", label: "Полукруг", priceM2: 4800, desc: "Веерный свод" },
];

// Покрытие навеса
const DEFAULT_CANOPY_COVER: CanopyCover[] = [
  { id: "profnastil",       label: "Профнастил С8",        priceM2: 320 },
  { id: "polycarb_4",       label: "Поликарбонат 4 мм",     priceM2: 480 },
  { id: "polycarb_8",       label: "Поликарбонат 8 мм",     priceM2: 720 },
  { id: "profnastil_color", label: "Профнастил цветной",    priceM2: 420 },
];

// Фундамент
const DEFAULT_FOUND_OPTIONS: FoundOption[] = [
  { id: "prisypka",     label: "Присыпка щебнем 🎁",  desc: "В подарок! Временный монтаж", perPost: 0,    perM: 0,    gift: true  },
  { id: "butovanie",    label: "Бутование",            desc: "Щебень + трамбовка, 0.8 м",   perPost: 800,  perM: 0,    gift: false },
  { id: "betonirovanie",label: "Бетонирование",        desc: "Цемент М300, 1.2 м",          perPost: 1400, perM: 0,    gift: false },
  { id: "lentochny",    label: "Ленточный",            desc: "Монолит 300×400, армирование", perPost: 0,   perM: 3200, gift: false },
];

// Ворота
const DEFAULT_GATE_OPTIONS: GateOption[] = [
  { id: "none",        label: "Без ворот",  base: 0,     perM: 0,    desc: "" },
  { id: "otkatnye",    label: "Откатные",   base: 75000, perM: 5500, desc: "Консоль, до 8 м" },
  { id: "raspashnye",  label: "Распашные",  base: 42000, perM: 3800, desc: "1 или 2 створки" },
  { id: "sektcionnye", label: "Секционные", base: 88000, perM: 6500, desc: "Подъёмные, гараж" },
];

// Калитка
const DEFAULT_WICKET_OPTIONS: WicketOption[] = [
  { id: "none",     label: "Нет",        price: 0,     desc: "" },
  { id: "standard", label: "Стандарт",   price: 9500,  desc: "Простая, ригельный замок" },
  { id: "kovka",    label: "Кованая",    price: 19500, desc: "Художественная ковка" },
  { id: "auto",     label: "Авто-замок", price: 14500, desc: "Электромеханический замок" },
];

// ── ЭКСПОРТИРУЕМЫЕ (мутабельные) справочники ─────────────────────
// Инициализируются дефолтами; перезаписываются в applyCalcPricing().
// Объявлены через `let` → ES-модуль раздаёт live-binding потребителям.
export let POST_OPTIONS:     PostOption[]     = DEFAULT_POST_OPTIONS.map(o => ({ ...o }));
export let LAG_OPTIONS:      LagOption[]      = DEFAULT_LAG_OPTIONS.map(o => ({ ...o }));
export let PROFLIST_OPTIONS: ProflistOption[] = DEFAULT_PROFLIST_OPTIONS.map(o => ({ ...o }));
export let SHTAK_OPTIONS:    ShtakOption[]    = DEFAULT_SHTAK_OPTIONS.map(o => ({ ...o }));
export let COATING_OPTIONS:  CoatingOption[]  = DEFAULT_COATING_OPTIONS.map(o => ({ ...o }));
export let CANOPY_TYPES:     CanopyType[]     = DEFAULT_CANOPY_TYPES.map(o => ({ ...o }));
export let CANOPY_COVER:     CanopyCover[]    = DEFAULT_CANOPY_COVER.map(o => ({ ...o }));
export let FOUND_OPTIONS:    FoundOption[]    = DEFAULT_FOUND_OPTIONS.map(o => ({ ...o }));
export let GATE_OPTIONS:     GateOption[]     = DEFAULT_GATE_OPTIONS.map(o => ({ ...o }));
export let WICKET_OPTIONS:   WicketOption[]   = DEFAULT_WICKET_OPTIONS.map(o => ({ ...o }));

// Главный тип объекта
export type ObjectType = "profnastil" | "shtak" | "3d" | "kovka" | "setka" | "canopy";

export const OBJECT_LABELS: Record<ObjectType, string> = {
  profnastil: "Забор из профнастила",
  shtak:      "Евроштакетник",
  "3d":       "3D-сетка сварная",
  kovka:      "Кованый забор",
  setka:      "Сетка-рабица",
  canopy:     "Навес / беседка",
};

// Иконки lucide
export const OBJECT_ICONS: Record<ObjectType, string> = {
  profnastil: "Fence",
  shtak:      "Columns3",
  "3d":       "Grid3x3",
  kovka:      "Flower2",
  setka:      "Network",
  canopy:     "Home",
};

// Утилита форматирования рубля
export function fmtRub(n: number): string {
  return Math.round(n).toLocaleString("ru-RU") + " ₽";
}

// ────────────────────────────────────────────────────────────────────
//  Чистая функция расчёта стоимости (без UI)
// ────────────────────────────────────────────────────────────────────

export interface CalcInput {
  objectType:    ObjectType;
  fenceLength:   number;       // периметр, м
  fenceHeight:   number;       // высота, м
  postId:        PostId;
  lagId:         LagId;
  lagRows:       number;       // 2/3/4 ряда
  proflistId:    ProflistId;
  shtakId:       ShtakId;
  shtakGap:      number;       // зазор между планками, мм
  nashivka:      "one" | "double";   // нашивка листа/штакетника: одно-/двухсторонняя
  paintBoth:     boolean;      // двусторонний окрас металла (прокрас с двух сторон)
  direction:     "vert" | "horiz";   // направление монтажа (на цену не влияет)
  coatingId:     CoatingId;
  foundId:       FoundId;
  gateId:        GateId;
  gateCount:     number;
  gateWidth:     number;
  wicketId:      WicketId;
  wicketCount:   number;
  wicketWidth:   number;
  automation:    boolean;
  painting:      boolean;
  installation:  boolean;
  canopyType:    CanopyTypeId;
  canopyLength:  number;       // длина навеса, м
  canopyWidth:   number;       // ширина навеса, м
  canopyCoverId: CanopyCoverId;
  // ── Логистика и финансы (опционально) ──
  distanceKm?:   number;       // расстояние доставки, км
  oversize?:     boolean;      // негабарит (+20% к доставке)
  discountPct?:  number;       // скидка клиенту, % (только на материалы)
}

// ── Константы экономики (по логике АРМ 1С) ───────────────────────
// Все настраиваемые параметры собраны в объекте PRICING_PARAMS.
// Категория 'param' из БД перезаписывает соответствующие значения.
// Дополнительно стоимости наполнения (3D/ковка/сетка) — категория 'fill'.
export interface PricingParams {
  // Логистика / финансы
  minInstall:    number;   // минимальный выезд бригады, ₽   (param: min_install)
  deliveryPerKm: number;   // тариф доставки/выезда, ₽/км     (param: delivery_per_km)
  deliveryMin:   number;   // минимальная доставка+выезд, ₽   (param: delivery_min)
  oversize:      number;   // негабарит — фикс, 1 раз, ₽      (param: oversize)
  installShare:  number;   // доля монтажа от материалов, %   (param: install_share)
  paintM2:       number;   // покраска, ₽/м²                  (param: paint_m2)
  autoGate:      number;   // автоматика ворот, ₽             (param: auto_gate)
  autoDiscount:  number;   // авто-скидка клиенту, %          (param: auto_discount)
  // Наполнение (₽/м²)                                        (категория fill)
  fill3d:        number;   // 3D-сетка сварная   (fill: 3d)
  fillKovka:     number;   // ковка              (fill: kovka)
  fillSetka:     number;   // сетка-рабица       (fill: setka)
  // Зарезервировано под будущие опции (нашивка/окрас) — пока не используются
  nashivkaDouble: number;  // %  (param: nashivka_double)
  paintDouble:    number;  // %  (param: paint_double)
}

// Дефолтные значения параметров
const DEFAULT_PRICING_PARAMS: PricingParams = {
  minInstall:    27000,
  deliveryPerKm: 70,
  deliveryMin:   6000,
  oversize:      7000,
  installShare:  35,
  paintM2:       280,
  autoGate:      22000,
  autoDiscount:  8,
  fill3d:        1600,
  fillKovka:     4500,
  fillSetka:     550,
  nashivkaDouble: 0,
  paintDouble:    0,
};

// Текущие (мутабельные) параметры — перезаписываются applyCalcPricing()
export let PRICING_PARAMS: PricingParams = { ...DEFAULT_PRICING_PARAMS };

// ── Обратная совместимость: старые экспортируемые имена ──────────
// Объявлены через `let` и синхронизируются из PRICING_PARAMS, чтобы
// существующий код (CalculatorWizard и др.) продолжал работать через
// live-binding импортов. Значения обновляются в syncLegacyExports().
export let MIN_INSTALL_COST  = PRICING_PARAMS.minInstall;
export let DELIVERY_PER_KM   = PRICING_PARAMS.deliveryPerKm;
export let DELIVERY_MIN      = PRICING_PARAMS.deliveryMin;
export let OVERSIZE_COST     = PRICING_PARAMS.oversize;
export let AUTO_DISCOUNT_PCT = PRICING_PARAMS.autoDiscount;

// Фиксированные (не настраиваемые из БД) нормативы
export const FOT_SHARE        = 0.5;     // ФОТ бригады = 50% от работ
export const MARKUP_PCT       = 20;      // наценка на материалы, %
export const NORM_KM_PER_DAY  = 80;      // норма пробега в день, км
export const NORM_PROF_PER_DAY = 75;     // норма монтажа профлиста, п.м/день
export const NORM_SHTAK_PER_DAY = 50;    // норма монтажа штакетника, п.м/день

// Синхронизация старых экспортов из PRICING_PARAMS
function syncLegacyExports(): void {
  MIN_INSTALL_COST  = PRICING_PARAMS.minInstall;
  DELIVERY_PER_KM   = PRICING_PARAMS.deliveryPerKm;
  DELIVERY_MIN      = PRICING_PARAMS.deliveryMin;
  OVERSIZE_COST     = PRICING_PARAMS.oversize;
  AUTO_DISCOUNT_PCT = PRICING_PARAMS.autoDiscount;
}

export interface CalcLine {
  label: string;
  qty?: string;
  unitPrice?: number;
  value: number;
  isGift?: boolean;
}

export interface CalcResult {
  isCanopy:     boolean;
  fenceArea:    number;        // площадь "глухой" части забора
  netFenceLen:  number;        // чистая длина забора (без проёмов)
  postCount:    number;
  canopyArea:   number;
  lineItems:    CalcLine[];
  matSum:       number;
  foundCost:    number;
  installCost:  number;
  paintCost:    number;
  autoCost:     number;
  deliveryCost: number;        // стоимость доставки/выезда
  oversizeFee:  number;        // надбавка за негабарит (1 раз)
  discount:     number;        // сумма скидки (только на материалы)
  workDays:     number;        // расчётный срок работ, дней
  total:        number;
  kpParams:     Record<string, string>;
  // ── Внутренняя экономика (видит только менеджер) ──
  econ: {
    materialsCost: number;     // себестоимость материалов (без наценки)
    fot:           number;     // ФОТ бригады = 50% от работ
    workTotal:     number;     // итоговая стоимость работ (с минималкой)
    profit:        number;     // выгода производства
    marginPct:     number;     // процент маржи
    minTopUp:      number;     // доплата до минималки монтажа (если была)
  };
}

/** Расчёт сметы. Чистая функция — без побочных эффектов. */
export function calculate(c: CalcInput): CalcResult {
  const isCanopy = c.objectType === "canopy";
  const isProf   = c.objectType === "profnastil";
  const isShtak  = c.objectType === "shtak";

  // ── Проёмы и геометрия забора ─────────────────────────
  const gatesW   = c.gateId   !== "none" ? c.gateCount   * c.gateWidth   : 0;
  const wicketsW = c.wicketId !== "none" ? c.wicketCount * c.wicketWidth : 0;
  const openings = gatesW + wicketsW;
  const netFenceLen = Math.max(0, c.fenceLength - openings);
  const fenceArea   = isCanopy ? 0 : netFenceLen * c.fenceHeight;

  // ── Столбы ──────────────────────────────────────────
  const postObj = POST_OPTIONS.find(p => p.id === c.postId)!;
  const spans = netFenceLen > 0 ? Math.ceil(netFenceLen / 2.5) : 0;
  const openingPosts = (c.gateId !== "none" ? c.gateCount * 2 : 0)
                     + (c.wicketId !== "none" ? c.wicketCount * 2 : 0);
  const postCount = isCanopy ? 0 : spans + 1 + openingPosts;
  const postHeight = c.fenceHeight + 1.2;
  const postCost = postCount * postObj.pricePerPost * Math.ceil(postHeight / 3);

  // ── Лаги ────────────────────────────────────────────
  const lagObj = LAG_OPTIONS.find(l => l.id === c.lagId)!;
  const lagTotalM = isCanopy ? 0 : netFenceLen * c.lagRows;
  const lagCost = lagTotalM * lagObj.pricePerM;

  // ── Наполнение ──────────────────────────────────────
  let fillingCost = 0;
  let fillingLabel = "";
  let fillingQty = "";
  let fillingUnit = 0;
  let sheetsCount = 0;     // листов профнастила, шт
  let planksCount = 0;     // штакетин, шт
  let screwsCount = 0;     // саморезов, шт
  if (isProf) {
    const pl = PROFLIST_OPTIONS.find(p => p.id === c.proflistId)!;
    const coat = COATING_OPTIONS.find(co => co.id === c.coatingId)!;
    const pricePerM2 = pl.priceM2 * (1 + coat.surcharge);
    fillingCost = fenceArea * pricePerM2;
    // Полезная ширина листа = 1.15 м − 0.05 м нахлёст = 1.1 м (по логике 1С)
    const usefulW = 1.1;
    sheetsCount = netFenceLen > 0 ? Math.ceil(netFenceLen / usefulW) : 0;
    screwsCount = sheetsCount * 8;  // 8 саморезов на лист
    fillingLabel = `Профлист ${pl.label} (${coat.label})`;
    fillingQty = `${sheetsCount} лист. · ${fenceArea.toFixed(1)} м²`;
    fillingUnit = Math.round(pricePerM2);
  } else if (isShtak) {
    const sh = SHTAK_OPTIONS.find(s => s.id === c.shtakId)!;
    const coat = COATING_OPTIONS.find(co => co.id === c.coatingId)!;
    const plankW = 0.1; // 100 мм
    const planksPerM = Math.max(1, Math.floor(1 / (plankW + c.shtakGap / 100)));
    const totalPlanks = Math.ceil(netFenceLen * planksPerM);
    const pricePerPlank = sh.pricePerM * c.fenceHeight * (1 + coat.surcharge);
    fillingCost = totalPlanks * pricePerPlank;
    planksCount = totalPlanks;
    screwsCount = totalPlanks * 2 * c.lagRows;  // 2 самореза × ряды лаг
    fillingLabel = `Штакетник ${sh.label} (${coat.label})`;
    fillingQty = `${totalPlanks} шт.`;
    fillingUnit = Math.round(pricePerPlank);
  } else if (c.objectType === "3d") {
    fillingCost = fenceArea * PRICING_PARAMS.fill3d;
    fillingLabel = "3D-сетка сварная";
    fillingQty = `${fenceArea.toFixed(1)} м²`;
    fillingUnit = PRICING_PARAMS.fill3d;
  } else if (c.objectType === "kovka") {
    fillingCost = fenceArea * PRICING_PARAMS.fillKovka;
    fillingLabel = "Ковка художественная";
    fillingQty = `${fenceArea.toFixed(1)} м²`;
    fillingUnit = PRICING_PARAMS.fillKovka;
  } else if (c.objectType === "setka") {
    fillingCost = fenceArea * PRICING_PARAMS.fillSetka;
    fillingLabel = "Сетка-рабица оцинкованная";
    fillingQty = `${fenceArea.toFixed(1)} м²`;
    fillingUnit = PRICING_PARAMS.fillSetka;
  }

  // ── Наценки на наполнение (только профнастил / штакетник) ──
  // Применяются ПОСЛЕ вычисления fillingCost и ДО включения в matSum.
  if (isProf || isShtak) {
    // Двухсторонняя нашивка (зашивка с двух сторон)
    if (c.nashivka === "double" && PRICING_PARAMS.nashivkaDouble > 0) {
      const k = 1 + PRICING_PARAMS.nashivkaDouble / 100;
      fillingCost *= k;
      fillingUnit = Math.round(fillingUnit * k);
      fillingLabel += " · двухсторонняя";
    }
    // Двусторонний окрас металла (отдельный множитель от нашивки)
    if (c.paintBoth && PRICING_PARAMS.paintDouble > 0) {
      const k = 1 + PRICING_PARAMS.paintDouble / 100;
      fillingCost *= k;
      fillingUnit = Math.round(fillingUnit * k);
      fillingLabel += " · окрас 2-стор";
    }
  }

  // ── Навес ───────────────────────────────────────────
  const canopyArea = isCanopy ? c.canopyLength * c.canopyWidth : 0;
  let canopyCost = 0;
  if (isCanopy) {
    const ct = CANOPY_TYPES.find(x => x.id === c.canopyType)!;
    const cc = CANOPY_COVER.find(x => x.id === c.canopyCoverId)!;
    canopyCost = canopyArea * (ct.priceM2 + cc.priceM2);
  }

  // ── Фундамент ───────────────────────────────────────
  const fnd = FOUND_OPTIONS.find(f => f.id === c.foundId)!;
  const foundCost = isCanopy
    ? 0
    : fnd.gift
      ? 0
      : fnd.perPost > 0
        ? postCount * fnd.perPost
        : c.fenceLength * fnd.perM;

  // ── Ворота / Калитка ───────────────────────────────
  const gateObj = GATE_OPTIONS.find(g => g.id === c.gateId)!;
  const oneGateCost = c.gateId !== "none" ? gateObj.base + c.gateWidth * gateObj.perM : 0;
  const gateCost = oneGateCost * (c.gateId !== "none" ? c.gateCount : 0);

  const wicketObj = WICKET_OPTIONS.find(w => w.id === c.wicketId)!;
  const wicketCost = wicketObj.price * (c.wicketId !== "none" ? c.wicketCount : 0);

  // ── Допработы ───────────────────────────────────────
  const matSum = (isCanopy ? canopyCost : postCost + lagCost + fillingCost) + gateCost + wicketCost;
  let installCost = c.installation ? Math.round(matSum * (PRICING_PARAMS.installShare / 100)) : 0;
  const paintCost = c.painting && !isCanopy ? fenceArea * PRICING_PARAMS.paintM2 : 0;
  const autoCost = c.automation && c.gateId !== "none" ? PRICING_PARAMS.autoGate : 0;

  // ── Защита минимального выезда бригады (27 000 ₽) ──
  // Все монтажные работы: монтаж + фундамент + покраска + автоматика.
  let workTotal = installCost + foundCost + paintCost + autoCost;
  let minTopUp = 0;
  if (workTotal > 0 && workTotal < MIN_INSTALL_COST) {
    minTopUp = MIN_INSTALL_COST - workTotal;
    workTotal = MIN_INSTALL_COST;
    installCost += minTopUp; // доплату относим к монтажу
  }

  // ── Логистика: выезд + доставка (≥ 6000 ₽) ──────────
  const distanceKm = Math.max(0, c.distanceKm || 0);
  const deliveryCost = Math.max(DELIVERY_MIN, distanceKm * DELIVERY_PER_KM);

  // Негабарит: авто-включение при навесе или откатных воротах,
  // считается ОДИН раз фиксированной суммой (менеджер может изменить).
  const oversizeAuto = isCanopy || c.gateId === "otkatnye";
  const oversizeOn = c.oversize !== undefined ? !!c.oversize : oversizeAuto;
  const oversizeFee = oversizeOn ? OVERSIZE_COST : 0;

  // ── Скидка: авто до 8% (если менеджер не задал своё значение) ──
  const discountPct = c.discountPct !== undefined
    ? Math.min(50, Math.max(0, c.discountPct))
    : AUTO_DISCOUNT_PCT;
  const discount = Math.round(matSum * discountPct / 100);

  // ── Норматив времени бригады (дней) ─────────────────
  const kmDays = distanceKm > 0 ? distanceKm / NORM_KM_PER_DAY : 0;
  const montageNorm = isProf ? NORM_PROF_PER_DAY : isShtak ? NORM_SHTAK_PER_DAY : NORM_PROF_PER_DAY;
  const montageDays = !isCanopy && netFenceLen > 0 ? netFenceLen / montageNorm : 0;
  const workDays = Math.max(1, Math.ceil(montageDays + kmDays));

  const total = matSum - discount + foundCost + installCost + paintCost
              + autoCost + deliveryCost + oversizeFee;

  // ── Позиции сметы ──────────────────────────────────
  const lineItems: CalcLine[] = isCanopy
    ? [
        {
          label: `Навес «${CANOPY_TYPES.find(x=>x.id===c.canopyType)!.label}» ${c.canopyLength}×${c.canopyWidth} м`,
          value: canopyCost,
          qty: `${canopyArea.toFixed(1)} м²`,
          unitPrice: Math.round((CANOPY_TYPES.find(x=>x.id===c.canopyType)!.priceM2 + CANOPY_COVER.find(x=>x.id===c.canopyCoverId)!.priceM2)),
        },
      ]
    : [
        { label: `Столбы ${postObj.label} (заглубление ${(c.fenceHeight * 0.6 + 0.6).toFixed(1)} м)`, value: postCost, qty: `${postCount} шт.`, unitPrice: postObj.pricePerPost * Math.ceil(postHeight/3) },
        { label: `Лаги ${lagObj.label}, ${c.lagRows} ряда, сварка MIG/MAG`,                          value: lagCost,  qty: `${lagTotalM.toFixed(1)} м.п.`, unitPrice: lagObj.pricePerM },
        { label: fillingLabel,                                                                       value: fillingCost, qty: fillingQty, unitPrice: fillingUnit },
      ];

  // Детализация комплектующих (входят в стоимость узлов выше — цена 0)
  if (!isCanopy && postCount > 0) {
    lineItems.push({ label: "↳ Заглушки пластиковые на столбы", value: 0, qty: `${postCount} шт.` });
  }
  if (screwsCount > 0) {
    lineItems.push({ label: "↳ Саморезы кровельные с EPDM (в цвет)", value: 0, qty: `${screwsCount} шт.` });
  }
  if (sheetsCount > 0) {
    lineItems.push({ label: "↳ Раскрой листов профнастила", value: 0, qty: `${sheetsCount} лист.` });
  }
  if (planksCount > 0) {
    lineItems.push({ label: "↳ Планки П-образные (верх/низ)", value: 0, qty: `${Math.ceil(netFenceLen / 2)} шт.` });
  }

  if (foundCost > 0) {
    lineItems.push({
      label: `Фундамент: ${fnd.label}`,
      value: foundCost,
      qty: fnd.perPost > 0 ? `${postCount} столб.` : `${netFenceLen.toFixed(1)} м`,
      unitPrice: fnd.perPost > 0 ? fnd.perPost : fnd.perM,
    });
  }
  if (fnd.gift && !isCanopy) {
    lineItems.push({ label: "Присыпка щебнем 🎁 — В ПОДАРОК", value: 0, isGift: true });
  }
  if (gateCost > 0) {
    lineItems.push({ label: `${gateObj.label} ворота, ${c.gateWidth} м × ${c.gateCount} шт.`, value: gateCost, qty: `${c.gateCount} шт.`, unitPrice: oneGateCost });
  }
  if (wicketCost > 0) {
    lineItems.push({ label: `Калитка: ${wicketObj.label} × ${c.wicketCount} шт.`, value: wicketCost, qty: `${c.wicketCount} шт.`, unitPrice: wicketObj.price });
  }
  if (installCost > 0) {
    lineItems.push({ label: `Монтаж под ключ (${PRICING_PARAMS.installShare}%)`, value: installCost });
  }
  if (paintCost > 0) {
    lineItems.push({ label: `Порошковая покраска ${PRICING_PARAMS.paintM2} ₽/м²`, value: paintCost, qty: `${fenceArea.toFixed(1)} м²`, unitPrice: PRICING_PARAMS.paintM2 });
  }
  if (autoCost > 0) {
    lineItems.push({ label: "Автоматика ворот DoorHan", value: autoCost, qty: "1 компл.", unitPrice: autoCost });
  }
  if (minTopUp > 0) {
    lineItems.push({ label: "Корректировка до минимальной стоимости монтажа", value: minTopUp });
  }
  if (deliveryCost > 0) {
    lineItems.push({
      label: `Выезд бригады и доставка${distanceKm > 0 ? `, ${distanceKm} км от МКАД` : ""}`,
      value: deliveryCost,
      qty: distanceKm > 0 ? `${distanceKm} км` : "минимум",
      unitPrice: DELIVERY_PER_KM,
    });
  }
  if (oversizeFee > 0) {
    lineItems.push({ label: "Негабаритный груз (разовая надбавка)", value: oversizeFee, qty: "1 раз" });
  }
  if (discount > 0) {
    lineItems.push({ label: `Скидка ${discountPct}% на материалы`, value: -discount });
  }

  // ── Параметры для КП ───────────────────────────────
  const kpParams: Record<string, string> = isCanopy
    ? {
        "Тип объекта":  "Навес / беседка",
        "Форма кровли": CANOPY_TYPES.find(x=>x.id===c.canopyType)!.label,
        "Длина × Ширина": `${c.canopyLength} × ${c.canopyWidth} м`,
        "Площадь":      `${canopyArea.toFixed(1)} м²`,
        "Покрытие":     CANOPY_COVER.find(x=>x.id===c.canopyCoverId)!.label,
      }
    : {
        "Тип ограждения": OBJECT_LABELS[c.objectType],
        "Периметр":       `${c.fenceLength} м`,
        "Чистая длина":   `${netFenceLen.toFixed(1)} м`,
        "Высота":         `${c.fenceHeight} м`,
        "Площадь обшивки": `${fenceArea.toFixed(1)} м²`,
        "Столбы":         `${postObj.label} — ${postCount} шт.`,
        "Лаги":           `${lagObj.label}, ${c.lagRows} ряда — ${lagTotalM.toFixed(1)} м.п.`,
        "Направление":    c.direction === "horiz" ? "Горизонтальное" : "Вертикальное",
        ...(sheetsCount > 0   ? { "Листов профнастила": `${sheetsCount} шт.` } : {}),
        ...(planksCount > 0   ? { "Штакетин":           `${planksCount} шт.` } : {}),
        ...(screwsCount > 0   ? { "Саморезы":           `${screwsCount} шт.` } : {}),
        "Фундамент":      fnd.label,
        ...(c.gateId !== "none"   ? { "Ворота":  `${gateObj.label}, ${c.gateWidth} м × ${c.gateCount} шт.` } : {}),
        ...(c.wicketId !== "none" ? { "Калитка": `${wicketObj.label} × ${c.wicketCount} шт.` } : {}),
      };

  // ── Внутренняя экономика (для менеджера) ───────────
  // Себестоимость материалов = продажная сумма / коэффициент наценки.
  const materialsCost = Math.round((matSum - discount) / (1 + MARKUP_PCT / 100));
  // ФОТ бригады = 50% от итоговой стоимости работ (с учётом минималки).
  const fot = Math.round(workTotal * FOT_SHARE);
  // Выгода производства = Итого − себестоимость − ФОТ − доставка − негабарит.
  const profit = Math.round(total - materialsCost - fot - deliveryCost - oversizeFee);
  const marginPct = total > 0
    ? Math.round(((total - (materialsCost + fot)) / total) * 100)
    : 0;

  // Срок выполнения добавим в параметры КП
  if (!isCanopy && workDays > 0) {
    kpParams["Срок работ"] = `≈ ${workDays} ${workDays === 1 ? "день" : workDays < 5 ? "дня" : "дней"}`;
  }

  return {
    isCanopy,
    fenceArea,
    netFenceLen,
    postCount,
    canopyArea,
    lineItems,
    matSum,
    foundCost,
    installCost,
    paintCost,
    autoCost,
    deliveryCost,
    oversizeFee,
    discount,
    workDays,
    total,
    kpParams,
    econ: {
      materialsCost,
      fot,
      workTotal,
      profit,
      marginPct,
      minTopUp,
    },
  };
}

export const DEFAULT_CALC: CalcInput = {
  objectType:    "profnastil",
  fenceLength:   30,
  fenceHeight:   2,
  postId:        "60x60x2",
  lagId:         "40x25x2",
  lagRows:       2,
  proflistId:    "C10",
  shtakId:       "sh_m",
  shtakGap:      5,
  nashivka:      "one",
  paintBoth:     false,
  direction:     "vert",
  coatingId:     "polyester",
  foundId:       "betonirovanie",
  gateId:        "none",
  gateCount:     1,
  gateWidth:     4,
  wicketId:      "none",
  wicketCount:   1,
  wicketWidth:   1,
  automation:    false,
  painting:      false,
  installation:  true,
  canopyType:    "односкат",
  canopyLength:  5,
  canopyWidth:   4,
  canopyCoverId: "polycarb_4",
};

// ────────────────────────────────────────────────────────────────────
//  Подключение цен из БД (CMS)
// ────────────────────────────────────────────────────────────────────

/**
 * Обновляет справочник `target` значениями из БД для заданной категории.
 * Сопоставление идёт по item_key ↔ option.id. Если позиции в БД нет —
 * остаётся дефолтное значение. `apply` мутирует поля цены у найденного
 * элемента из переданных данных БД.
 *
 * Возвращает НОВЫЙ массив (чтобы переназначить экспортируемую let-переменную
 * и обновить ссылку для потребителей).
 */
function mergeCategory<T extends { id: string; label: string }>(
  defaults: T[],
  byKey: Map<string, CalcPriceItem>,
  apply: (opt: T, row: CalcPriceItem) => void,
): T[] {
  return defaults.map(def => {
    const row = byKey.get(def.id);
    const opt = { ...def };
    if (row) {
      // Подхватываем label из БД, если он задан (не ломаем дефолт пустым)
      if (row.label && row.label.trim()) opt.label = row.label;
      apply(opt, row);
    }
    return opt;
  });
}

/**
 * Перезаписывает все справочники цен и параметры экономики данными из БД.
 * Если каких-то позиций/категорий нет — сохраняются дефолты.
 *
 * Безопасно вызывать многократно: каждый вызов строится от DEFAULT_*,
 * поэтому удаление позиции из БД корректно возвращает её к дефолту.
 */
export function applyCalcPricing(items: CalcPriceItem[]): void {
  const active = (items || []).filter(i => i && i.is_active !== false);

  // Группировка строк БД по категории → Map<item_key, row>
  const cats: Record<string, Map<string, CalcPriceItem>> = {};
  for (const row of active) {
    const cat = row.category;
    if (!cats[cat]) cats[cat] = new Map();
    cats[cat].set(row.item_key, row);
  }
  const cat = (name: string) => cats[name] || new Map<string, CalcPriceItem>();

  // ── Справочники материалов ──────────────────────────
  POST_OPTIONS = mergeCategory(DEFAULT_POST_OPTIONS, cat("post"),
    (o, r) => { o.pricePerPost = num(r.price, o.pricePerPost); });

  LAG_OPTIONS = mergeCategory(DEFAULT_LAG_OPTIONS, cat("lag"),
    (o, r) => { o.pricePerM = num(r.price, o.pricePerM); });

  PROFLIST_OPTIONS = mergeCategory(DEFAULT_PROFLIST_OPTIONS, cat("proflist"),
    (o, r) => { o.priceM2 = num(r.price, o.priceM2); });

  SHTAK_OPTIONS = mergeCategory(DEFAULT_SHTAK_OPTIONS, cat("shtak"),
    (o, r) => { o.pricePerM = num(r.price, o.pricePerM); });

  COATING_OPTIONS = mergeCategory(DEFAULT_COATING_OPTIONS, cat("coating"),
    (o, r) => { o.surcharge = num(r.coef, o.surcharge); });

  CANOPY_TYPES = mergeCategory(DEFAULT_CANOPY_TYPES, cat("canopy_type"),
    (o, r) => { o.priceM2 = num(r.price, o.priceM2); });

  CANOPY_COVER = mergeCategory(DEFAULT_CANOPY_COVER, cat("canopy_cover"),
    (o, r) => { o.priceM2 = num(r.price, o.priceM2); });

  FOUND_OPTIONS = mergeCategory(DEFAULT_FOUND_OPTIONS, cat("found"),
    (o, r) => {
      o.perPost = num(r.price, o.perPost);
      o.perM    = num(r.price2, o.perM);
      o.gift    = r.item_key === "prisypka";
    });

  GATE_OPTIONS = mergeCategory(DEFAULT_GATE_OPTIONS, cat("gate"),
    (o, r) => {
      o.base = num(r.price, o.base);
      o.perM = num(r.price2, o.perM);
    });

  WICKET_OPTIONS = mergeCategory(DEFAULT_WICKET_OPTIONS, cat("wicket"),
    (o, r) => { o.price = num(r.price, o.price); });

  // ── Наполнение (3d / kovka / setka), ₽/м² ───────────
  const fill = cat("fill");
  const params: PricingParams = { ...DEFAULT_PRICING_PARAMS };
  params.fill3d    = num(fill.get("3d")?.price,    params.fill3d);
  params.fillKovka = num(fill.get("kovka")?.price, params.fillKovka);
  params.fillSetka = num(fill.get("setka")?.price, params.fillSetka);

  // ── Параметры экономики (категория param) ───────────
  const p = cat("param");
  params.minInstall     = num(p.get("min_install")?.price,     params.minInstall);
  params.deliveryPerKm  = num(p.get("delivery_per_km")?.price, params.deliveryPerKm);
  params.deliveryMin    = num(p.get("delivery_min")?.price,    params.deliveryMin);
  params.oversize       = num(p.get("oversize")?.price,        params.oversize);
  params.installShare   = num(p.get("install_share")?.price,   params.installShare);
  params.paintM2        = num(p.get("paint_m2")?.price,        params.paintM2);
  params.autoGate       = num(p.get("auto_gate")?.price,       params.autoGate);
  params.autoDiscount   = num(p.get("auto_discount")?.price,   params.autoDiscount);
  params.nashivkaDouble = num(p.get("nashivka_double")?.price, params.nashivkaDouble);
  params.paintDouble    = num(p.get("paint_double")?.price,    params.paintDouble);

  PRICING_PARAMS = params;
  syncLegacyExports();
}

/** Возвращает число, если оно валидно (не null/NaN), иначе fallback. */
function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}