// ────────────────────────────────────────────────────────────────────
//  Справочники цен и материалов для калькулятора (рынок РФ 2026)
//  Используются и старым Calculator.tsx, и новым CalculatorWizard.tsx
// ────────────────────────────────────────────────────────────────────

// Столбы (профтруба, цена за шт. с заглушкой)
export const POST_OPTIONS = [
  { id: "60x60x2",   label: "60×60×2 мм",   pricePerPost: 520,  weightPerM: 3.56, desc: "Стандарт, до 2 м высоты" },
  { id: "60x60x3",   label: "60×60×3 мм",   pricePerPost: 720,  weightPerM: 5.19, desc: "Усиленный, тяжёлые секции" },
  { id: "80x80x2",   label: "80×80×2 мм",   pricePerPost: 780,  weightPerM: 4.83, desc: "Ворота, угловые стойки" },
  { id: "100x100x3", label: "100×100×3 мм", pricePerPost: 1200, weightPerM: 9.03, desc: "Промышленные объекты" },
  { id: "round_57",  label: "⌀57×3 мм",     pricePerPost: 480,  weightPerM: 3.91, desc: "Круглая труба, дача" },
] as const;
export type PostId = typeof POST_OPTIONS[number]["id"];

// Лаги (поперечины, цена за п.м.)
export const LAG_OPTIONS = [
  { id: "40x20x1.5", label: "40×20×1.5 мм", pricePerM: 95,  desc: "Лёгкие заборы до 1.5 м" },
  { id: "40x25x2",   label: "40×25×2 мм",   pricePerM: 130, desc: "Стандарт, профнастил/штакетник" },
  { id: "60x30x2",   label: "60×30×2 мм",   pricePerM: 175, desc: "Усиленный, ковка, тяжёлые" },
  { id: "40x40x2",   label: "40×40×2 мм",   pricePerM: 155, desc: "Квадратная, для 3D-сетки" },
] as const;
export type LagId = typeof LAG_OPTIONS[number]["id"];

// Профлист (цена за м²)
export const PROFLIST_OPTIONS = [
  { id: "C8",   label: "С8",   height_mm: 8,  priceM2: 720,  desc: "Лёгкий, горизонт. и вертик." },
  { id: "C10",  label: "С10",  height_mm: 10, priceM2: 850,  desc: "Самый популярный для забора" },
  { id: "C20",  label: "С20",  height_mm: 20, priceM2: 980,  desc: "Жёсткий, промышленный" },
  { id: "MP20", label: "МП20", height_mm: 20, priceM2: 1050, desc: "С-образный, повышенная жёсткость" },
  { id: "HC35", label: "НС35", height_mm: 35, priceM2: 1240, desc: "Несущий, ворота, промзона" },
] as const;
export type ProflistId = typeof PROFLIST_OPTIONS[number]["id"];

// Штакетник (цена за п.м.)
export const SHTAK_OPTIONS = [
  { id: "sh_flat",  label: "Плоский 100 мм",     pricePerM: 85,  desc: "Классический" },
  { id: "sh_m",     label: "М-образный 110 мм",  pricePerM: 95,  desc: "Более жёсткий" },
  { id: "sh_p",     label: "П-образный 120 мм",  pricePerM: 105, desc: "Закрытый торец" },
  { id: "sh_round", label: "Скруглённый",         pricePerM: 110, desc: "Мягкий силуэт" },
  { id: "sh_decor", label: "Декоративный",        pricePerM: 145, desc: "Фигурный верх" },
] as const;
export type ShtakId = typeof SHTAK_OPTIONS[number]["id"];

// Тип покрытия (наценка к базовой цене)
export const COATING_OPTIONS = [
  { id: "polyester", label: "Полиэстер",    surcharge: 0,    desc: "Стандарт, 15–20 лет" },
  { id: "pural",     label: "Пурал",        surcharge: 0.2,  desc: "+20%, 25–30 лет" },
  { id: "pvdf",      label: "PVDF (Матт)",  surcharge: 0.35, desc: "+35%, 30+ лет" },
  { id: "print",     label: "PrintPattern", surcharge: 0.5,  desc: "+50%, принт под дерево/камень" },
] as const;
export type CoatingId = typeof COATING_OPTIONS[number]["id"];

// Навес — форма кровли
export const CANOPY_TYPES = [
  { id: "односкат", label: "Односкат", priceM2: 3200, desc: "Уклон в одну сторону, к стене" },
  { id: "двухскат", label: "Двухскат", priceM2: 3800, desc: "Классический домик" },
  { id: "арочный",  label: "Арочный",  priceM2: 4500, desc: "Дуга, поликарбонат" },
  { id: "полукруг", label: "Полукруг", priceM2: 4800, desc: "Веерный свод" },
] as const;
export type CanopyTypeId = typeof CANOPY_TYPES[number]["id"];

// Покрытие навеса
export const CANOPY_COVER = [
  { id: "profnastil",       label: "Профнастил С8",        priceM2: 320 },
  { id: "polycarb_4",       label: "Поликарбонат 4 мм",     priceM2: 480 },
  { id: "polycarb_8",       label: "Поликарбонат 8 мм",     priceM2: 720 },
  { id: "profnastil_color", label: "Профнастил цветной",    priceM2: 420 },
] as const;
export type CanopyCoverId = typeof CANOPY_COVER[number]["id"];

// Фундамент
export const FOUND_OPTIONS = [
  { id: "prisypka",     label: "Присыпка щебнем 🎁",  desc: "В подарок! Временный монтаж", perPost: 0,    perM: 0,    gift: true  },
  { id: "butovanie",    label: "Бутование",            desc: "Щебень + трамбовка, 0.8 м",   perPost: 800,  perM: 0,    gift: false },
  { id: "betonirovanie",label: "Бетонирование",        desc: "Цемент М300, 1.2 м",          perPost: 1400, perM: 0,    gift: false },
  { id: "lentochny",    label: "Ленточный",            desc: "Монолит 300×400, армирование", perPost: 0,   perM: 3200, gift: false },
] as const;
export type FoundId = typeof FOUND_OPTIONS[number]["id"];

// Ворота
export const GATE_OPTIONS = [
  { id: "none",        label: "Без ворот",  base: 0,     perM: 0,    desc: "" },
  { id: "otkatnye",    label: "Откатные",   base: 75000, perM: 5500, desc: "Консоль, до 8 м" },
  { id: "raspashnye",  label: "Распашные",  base: 42000, perM: 3800, desc: "1 или 2 створки" },
  { id: "sektcionnye", label: "Секционные", base: 88000, perM: 6500, desc: "Подъёмные, гараж" },
] as const;
export type GateId = typeof GATE_OPTIONS[number]["id"];

// Калитка
export const WICKET_OPTIONS = [
  { id: "none",     label: "Нет",        price: 0,     desc: "" },
  { id: "standard", label: "Стандарт",   price: 9500,  desc: "Простая, ригельный замок" },
  { id: "kovka",    label: "Кованая",    price: 19500, desc: "Художественная ковка" },
  { id: "auto",     label: "Авто-замок", price: 14500, desc: "Электромеханический замок" },
] as const;
export type WicketId = typeof WICKET_OPTIONS[number]["id"];

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

// Константы экономики (по логике АРМ 1С)
export const MIN_INSTALL_COST = 27000;   // минимальный выезд бригады, ₽
export const DELIVERY_PER_KM  = 70;      // тариф доставки/выезда, ₽/км от МКАД
export const DELIVERY_MIN     = 6000;    // минимальная стоимость выезда+доставки, ₽
export const OVERSIZE_COST    = 7000;    // негабарит — фикс, считается 1 раз
export const FOT_SHARE        = 0.5;     // ФОТ бригады = 50% от работ
export const MARKUP_PCT       = 20;      // наценка на материалы, %
export const AUTO_DISCOUNT_PCT = 8;      // авто-скидка клиенту, %
export const NORM_KM_PER_DAY  = 80;      // норма пробега в день, км
export const NORM_PROF_PER_DAY = 75;     // норма монтажа профлиста, п.м/день
export const NORM_SHTAK_PER_DAY = 50;    // норма монтажа штакетника, п.м/день

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
    fillingCost = fenceArea * 1600;
    fillingLabel = "3D-сетка сварная";
    fillingQty = `${fenceArea.toFixed(1)} м²`;
    fillingUnit = 1600;
  } else if (c.objectType === "kovka") {
    fillingCost = fenceArea * 4500;
    fillingLabel = "Ковка художественная";
    fillingQty = `${fenceArea.toFixed(1)} м²`;
    fillingUnit = 4500;
  } else if (c.objectType === "setka") {
    fillingCost = fenceArea * 550;
    fillingLabel = "Сетка-рабица оцинкованная";
    fillingQty = `${fenceArea.toFixed(1)} м²`;
    fillingUnit = 550;
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
  let installCost = c.installation ? Math.round(matSum * 0.35) : 0;
  const paintCost = c.painting && !isCanopy ? fenceArea * 280 : 0;
  const autoCost = c.automation && c.gateId !== "none" ? 22000 : 0;

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
    lineItems.push({ label: "Монтаж под ключ (35%)", value: installCost });
  }
  if (paintCost > 0) {
    lineItems.push({ label: "Порошковая покраска 280 ₽/м²", value: paintCost, qty: `${fenceArea.toFixed(1)} м²`, unitPrice: 280 });
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