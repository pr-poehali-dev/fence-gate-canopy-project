import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import Calculator from "@/components/Calculator";
import { COMPANY } from "@/lib/company";

// ── Изображения ─────────────────────────────────────────────────────────────
const IMGS = {
  hero:        "https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/files/196086a1-d5c9-4caa-a2f6-4d0f7532182f.jpg",
  portfolio:   "https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/files/d0c5373a-0046-48b2-aba5-5d4847056985.jpg",
  profnastil:  "https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/files/05b3de60-7f13-42d7-bc76-76327b8db6b9.jpg",
  kovka:       "https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/files/884f6229-a60c-45db-baf0-1c2a081a42de.jpg",
  mesh3d:      "https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/files/0f46f0bc-e0e1-4e23-aeb0-c70f71f3644b.jpg",
  gates:       "https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/files/ff877075-afb4-4e02-a676-3bece261bb22.jpg",
  canopy:      "https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/files/b271c1dc-936d-470d-b060-7293cd888f0f.jpg",
  euro:        "https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/files/81e66b5f-be0c-4f79-a8a9-63ff2cc60584.jpg",
  foundation:  "https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/files/a05b59ea-6634-4972-8292-732a7a06a1d3.jpg",
  gazebo:      "https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/files/5c71ebc7-9ec2-4322-957b-f72950d9e5af.jpg",
};

const NAV_ITEMS = [
  { id: "home",       label: "Главная" },
  { id: "advantages", label: "О нас" },
  { id: "products",   label: "Продукция" },
  { id: "steps",      label: "Как работаем" },
  { id: "calculator", label: "Калькулятор" },
  { id: "delivery",   label: "Доставка" },
  { id: "contacts",   label: "Контакты" },
];

// ── Продукция ────────────────────────────────────────────────────────────────
const PRODUCTS: { img: string; title: string; desc: string; price: string; badge: string | null; href?: string }[] = [
  { img: IMGS.profnastil, title: "Профнастил", desc: "Оцинкованный С8/С10/МП20, покрытие полиэстер или пурал. Срок службы 25+ лет.", price: "от 1 100 ₽/м²", badge: "Хит", href: "/services/profnastil" },
  { img: IMGS.euro,       title: "Евроштакетник", desc: "Двусторонний металлический штакетник. Пропускает свет, современный дизайн.", price: "от 2 100 ₽/м²", badge: null, href: "/services/shtaketnik" },
  { img: IMGS.gates,      title: "Откатные ворота", desc: "Консольные откатные ворота под автоматику. Любое наполнение, до 8 м проёма.", price: "от 42 000 ₽", badge: null, href: "/services/otkatnye-vorota" },
  { img: IMGS.canopy,     title: "Навесы и беседки", desc: "Арочные, двухскатные, односкатные. Поликарбонат и профнастил. Под ключ.", price: "от 3 200 ₽/м²", badge: null, href: "/services/navesy" },
  { img: IMGS.kovka,      title: "Ковка художественная", desc: "Горячая и холодная ковка по индивидуальным эскизам. Антикоррозийная обработка.", price: "от 4 500 ₽/м²", badge: "Премиум" },
  { img: IMGS.mesh3d,     title: "3D-сетка сварная", desc: "Прутки Ø4–6 мм, ячейка 50×200 мм. Антивандальные, для промышленных объектов.", price: "от 1 600 ₽/м²", badge: null },
  { img: IMGS.gazebo,     title: "Беседки и пергола", desc: "Металлические беседки, перголы, зоны отдыха. Под ключ с кровлей.", price: "от 35 000 ₽", badge: null },
  { img: IMGS.foundation, title: "Фундаменты", desc: "Ленточный, столбчатый, бутование, бетонирование. Основа долговечного забора.", price: "от 650 ₽/м.п.", badge: null },
  { img: IMGS.profnastil, title: "Сетка-рабица", desc: "Оцинкованная Ø2 мм или с ПВХ-покрытием. Быстрый монтаж, дачный вариант.", price: "от 550 ₽/м²", badge: "Эконом" },
];

const SERVICES = [
  { icon: "Ruler",      img: IMGS.hero,       title: "Бесплатный замер",    desc: "Выезд специалиста в день обращения. Замер, проект и смета — бесплатно." },
  { icon: "Hammer",     img: IMGS.foundation, title: "Монтаж под ключ",     desc: "Бурение, установка столбов, монтаж секций, ворот и калитки по акту." },
  { icon: "Paintbrush", img: IMGS.kovka,      title: "Порошковая покраска", desc: "Собственная камера. Толщина 60–80 мкм. RAL, 200+ цветов." },
  { icon: "Wrench",     img: IMGS.mesh3d,     title: "Ремонт ограждений",   desc: "Восстановление геометрии, замена секций, сварка, обновление покраски." },
  { icon: "Zap",        img: IMGS.gates,      title: "Автоматизация ворот", desc: "Приводы Nice, FAAC, DoorHan. GSM, пульты, видеодомофон. Гарантия 2 года." },
  { icon: "Shield",     img: IMGS.canopy,     title: "Навесы и беседки",    desc: "Проектирование и монтаж навесов для авто, беседок, пергол под ключ." },
];

const PORTFOLIO_ITEMS = [
  { title: "Кованые ворота, Люберцы",                  tag: "Ворота",       img: IMGS.kovka },
  { title: "Профнастил С10, 120 м, Чапаевка",          tag: "Забор",        img: IMGS.profnastil },
  { title: "3D-ограждение склада в Астрецово",         tag: "Промышленный", img: IMGS.mesh3d },
  { title: "Откатные ворота FAAC, КП «Назарьево»",     tag: "Автоматика",   img: IMGS.gates },
  { title: "Навес для авто 36 м², Реутов",             tag: "Навес",        img: IMGS.canopy },
  { title: "Евроштакетник + беседка, Балашиха",        tag: "Под ключ",     img: IMGS.gazebo },
];

/*REMOVE_START*/
type FenceType      = "profnastil" | "euro" | "3d" | "kovka" | "setka" | "canopy";
type GateType       = "none" | "otkatnye" | "raspashnye";
type WicketType     = "none" | "standard" | "kovka";
type FoundationType = "butovanie" | "betonirovanie" | "lentochnyi" | "prisypka";

interface CalcState {
  fenceType:    FenceType;
  fenceLength:  number;
  fenceHeight:  number;
  gateType:     GateType;
  gateWidth:    number;
  wicketType:   WicketType;
  foundation:   FoundationType;
  installation: boolean;
  painting:     boolean;
  automation:   boolean;
  canopyArea:   number;
}

const FENCE_MAT: Record<FenceType, { price: number; label: string; sub: string }> = {
  profnastil: { price: 1100, label: "Профнастил",    sub: "С8/С10 полиэстер" },
  euro:       { price: 2100, label: "Евроштакетник", sub: "2-сторонний металл" },
  "3d":       { price: 1600, label: "3D-сетка",      sub: "Прутки Ø5 мм" },
  kovka:      { price: 4500, label: "Ковка",         sub: "Горячая/холодная" },
  setka:      { price: 550,  label: "Сетка-рабица",  sub: "Оцинк. Ø2 мм" },
  canopy:     { price: 0,    label: "Навес/беседка", sub: "Расчёт по площади" },
};

const GATE_DATA: Record<GateType, { base: number; perM: number; label: string }> = {
  none:       { base: 0,     perM: 0,    label: "Без ворот" },
  otkatnye:   { base: 42000, perM: 3200, label: "Откатные" },
  raspashnye: { base: 26000, perM: 2400, label: "Распашные" },
};

const WICKET_DATA: Record<WicketType, { price: number; label: string }> = {
  none:     { price: 0,     label: "Без калитки" },
  standard: { price: 8500,  label: "Стандартная" },
  kovka:    { price: 18000, label: "Кованая" },
};

const FOUND_DATA: Record<FoundationType, { label: string; desc: string; perPost: number; perMeter: number; gift?: boolean }> = {
  butovanie:     { label: "Бутование",             desc: "Засыпка щебнем + трамбовка",       perPost: 800,  perMeter: 0 },
  betonirovanie: { label: "Бетонирование столбов", desc: "Цемент М300, глубина 1.2 м",       perPost: 1400, perMeter: 0 },
  lentochnyi:    { label: "Ленточный фундамент",   desc: "Монолит 300×400 мм, армирование",  perPost: 0,    perMeter: 3200 },
  prisypka:      { label: "Присыпка щебнем 🎁",   desc: "В подарок! Временный монтаж",       perPost: 0,    perMeter: 0, gift: true },
};

const INSTALL_RATE = 0.35;
const PAINT_PRICE  = 280;
const AUTO_PRICE   = 22000;
const POST_PRICE   = 1800;
const CANOPY_PRICE = 3200;

function _generateKP_old(calc: CalcState, lineItems: { label: string; value: number }[], total: number): string {
  const date = new Date().toLocaleDateString("ru-RU");
  const fLabel = FENCE_MAT[calc.fenceType].label;
  const lines = lineItems
    .map(l => `  • ${l.label}: ${l.value === 0 ? "Бесплатно 🎁" : Math.round(l.value).toLocaleString("ru-RU") + " ₽"}`)
    .join("\n");
  return `КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Компания: СтальГрупп
Дата составления: ${date}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

СОСТАВ РАБОТ И МАТЕРИАЛОВ:

${lines}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ИТОГО (предварительно): ${Math.round(total).toLocaleString("ru-RU")} ₽
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ПАРАМЕТРЫ ОБЪЕКТА:
  • Тип ограждения: ${fLabel}
${calc.fenceType !== "canopy" ? `  • Периметр: ${calc.fenceLength} м\n  • Высота: ${calc.fenceHeight} м\n` : `  • Площадь навеса: ${calc.canopyArea} м²\n`}${calc.gateType !== "none" ? `  • Ворота: ${GATE_DATA[calc.gateType].label}, ширина ${calc.gateWidth} м\n` : ""}${calc.wicketType !== "none" ? `  • Калитка: ${WICKET_DATA[calc.wicketType].label}\n` : ""}  • Фундамент: ${FOUND_DATA[calc.foundation].label}

УСЛОВИЯ И ГАРАНТИИ:
  • Гарантия на конструкции: 5 лет
  • Гарантия на покраску: 3 года
  • Гарантия на монтаж: 2 года
  • Бесплатный выезд замерщика
  • Срок изготовления: 7–14 рабочих дней
  • Доставка по Москве: от 3 500 ₽

⚠  Предварительный расчёт. Точная стоимость
    определяется после замера на объекте (±5–15%).
    Данное КП действительно 30 дней.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
СтальГрупп | 8 800 123-45-67
info@stalgrupp.ru | Москва, ул. Промышленная, 12
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ── Старый калькулятор (не используется, новый из @/components/Calculator) ──
function CalculatorLegacy() {
  const [calc, setCalc] = useState<CalcState>({
    fenceType:    "profnastil",
    fenceLength:  30,
    fenceHeight:  2,
    gateType:     "none",
    gateWidth:    4,
    wicketType:   "none",
    foundation:   "betonirovanie",
    installation: true,
    painting:     false,
    automation:   false,
    canopyArea:   20,
  });
  const [showKP, setShowKP] = useState(false);
  const kpRef = useRef<HTMLTextAreaElement>(null);

  const isCanopy    = calc.fenceType === "canopy";
  const fenceArea   = calc.fenceLength * calc.fenceHeight;
  const matCost     = isCanopy ? calc.canopyArea * CANOPY_PRICE : fenceArea * FENCE_MAT[calc.fenceType].price;
  const postCount   = isCanopy ? 0 : Math.ceil(calc.fenceLength / 2.5) + 1;
  const postCost    = isCanopy ? 0 : postCount * POST_PRICE;
  const fd          = FOUND_DATA[calc.foundation];
  const foundCost   = isCanopy ? 0 : fd.gift ? 0 : fd.perPost > 0 ? postCount * fd.perPost : calc.fenceLength * fd.perMeter;
  const gateCost    = calc.gateType !== "none" ? GATE_DATA[calc.gateType].base + calc.gateWidth * GATE_DATA[calc.gateType].perM : 0;
  const wicketCost  = WICKET_DATA[calc.wicketType].price;
  const materialsSum = matCost + postCost + gateCost + wicketCost;
  const installCost = calc.installation ? Math.round(materialsSum * INSTALL_RATE) : 0;
  const paintCost   = calc.painting && !isCanopy ? fenceArea * PAINT_PRICE : 0;
  const autoCost    = calc.automation && calc.gateType !== "none" ? AUTO_PRICE : 0;
  const total       = matCost + postCost + foundCost + gateCost + wicketCost + installCost + paintCost + autoCost;

  const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU") + " ₽";

  const lineItems = [
    { label: isCanopy ? `Навес/беседка (${calc.canopyArea} м²)` : `${FENCE_MAT[calc.fenceType].label} (${fenceArea} м²)`, value: matCost },
    ...(!isCanopy ? [{ label: `Опорные столбы — ${postCount} шт. × ${POST_PRICE.toLocaleString("ru-RU")} ₽`, value: postCost }] : []),
    ...(foundCost > 0 ? [{ label: `Фундамент: ${fd.label}`, value: foundCost }] : []),
    ...(fd.gift && !isCanopy ? [{ label: "Присыпка щебнем 🎁 — в подарок", value: 0 }] : []),
    ...(gateCost > 0 ? [{ label: `${GATE_DATA[calc.gateType].label} ворота (${calc.gateWidth} м)`, value: gateCost }] : []),
    ...(wicketCost > 0 ? [{ label: `Калитка: ${WICKET_DATA[calc.wicketType].label}`, value: wicketCost }] : []),
    ...(installCost > 0 ? [{ label: "Монтаж (35% от материалов)", value: installCost }] : []),
    ...(paintCost > 0 ? [{ label: `Покраска порошковая (${PAINT_PRICE} ₽/м²)`, value: paintCost }] : []),
    ...(autoCost > 0 ? [{ label: "Автоматика ворот DoorHan", value: autoCost }] : []),
  ];

  const kpText = generateKP(calc, lineItems, total);

  const set = (patch: Partial<CalcState>) => setCalc(c => ({ ...c, ...patch }));

  const copyKP = () => {
    if (!kpRef.current) return;
    kpRef.current.select();
    document.execCommand("copy");
    alert("КП скопировано в буфер обмена!");
  };

  const downloadKP = () => {
    const blob = new Blob([kpText], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `КП_СтальГрупп_${new Date().toLocaleDateString("ru-RU").replace(/\./g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Настройки ── */}
        <div className="space-y-7">

          {/* Тип */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">Тип ограждения / объекта</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.entries(FENCE_MAT) as [FenceType, typeof FENCE_MAT[FenceType]][]).map(([v, { label, sub, price }]) => (
                <button key={v} onClick={() => set({ fenceType: v })}
                  className={`px-3 py-3 rounded-xl text-left transition-all duration-200 ${
                    calc.fenceType === v
                      ? "bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25"
                      : "bg-[#1a1f2e] border border-[#1e2230] text-white/70 hover:border-orange-500/50 hover:text-white"
                  }`}>
                  <div className="text-xs font-semibold leading-tight">{label}</div>
                  <div className={`text-xs mt-0.5 ${calc.fenceType === v ? "text-gray-900/70" : "text-white/35"}`}>
                    {price > 0 ? `${price.toLocaleString("ru-RU")} ₽/м²` : sub}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Площадь навеса ИЛИ длина+высота */}
          {isCanopy ? (
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-white/70">Площадь навеса / беседки</label>
                <span className="text-orange-400 font-bold font-oswald text-lg">{calc.canopyArea} м²</span>
              </div>
              <input type="range" min={6} max={100} step={2}
                value={calc.canopyArea}
                onChange={e => set({ canopyArea: +e.target.value })}
              />
              <div className="flex justify-between text-xs text-white/30 mt-1"><span>6 м²</span><span>100 м²</span></div>
            </div>
          ) : (
            <>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-white/70">Длина периметра</label>
                  <span className="text-orange-400 font-bold font-oswald text-lg">{calc.fenceLength} м</span>
                </div>
                <input type="range" min={5} max={300} step={5}
                  value={calc.fenceLength}
                  onChange={e => set({ fenceLength: +e.target.value })}
                />
                <div className="flex justify-between text-xs text-white/30 mt-1"><span>5 м</span><span>300 м</span></div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-white/70">Высота забора</label>
                  <span className="text-orange-400 font-bold font-oswald text-lg">{calc.fenceHeight.toFixed(1)} м</span>
                </div>
                <input type="range" min={1} max={3} step={0.5}
                  value={calc.fenceHeight}
                  onChange={e => set({ fenceHeight: +e.target.value })}
                />
                <div className="flex justify-between text-xs text-white/30 mt-1"><span>1.0 м</span><span>3.0 м</span></div>
              </div>
            </>
          )}

          {/* Фундамент */}
          {!isCanopy && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">Тип фундамента / монтажа столбов</label>
              <div className="space-y-2">
                {(Object.entries(FOUND_DATA) as [FoundationType, typeof FOUND_DATA[FoundationType]][]).map(([v, d]) => (
                  <label key={v} className="flex items-start gap-3 cursor-pointer group">
                    <div onClick={() => set({ foundation: v })}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        calc.foundation === v ? "border-orange-500 bg-orange-500" : "border-[#2a3040] group-hover:border-orange-500/50"
                      }`}>
                      {calc.foundation === v && <div className="w-2 h-2 rounded-full bg-gray-900" />}
                    </div>
                    <div className="flex-1 flex items-start justify-between gap-2">
                      <div>
                        <div className={`text-sm font-medium ${d.gift ? "text-orange-400" : "text-white"}`}>{d.label}</div>
                        <div className="text-xs text-white/35">{d.desc}</div>
                      </div>
                      <div className="text-xs text-white/40 whitespace-nowrap mt-0.5">
                        {d.gift ? "Бесплатно" : d.perPost > 0 ? `${d.perPost.toLocaleString("ru-RU")} ₽/столб` : d.perMeter > 0 ? `${d.perMeter.toLocaleString("ru-RU")} ₽/м` : ""}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Ворота */}
          {!isCanopy && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Ворота</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {(Object.entries(GATE_DATA) as [GateType, typeof GATE_DATA[GateType]][]).map(([v, d]) => (
                  <button key={v} onClick={() => set({ gateType: v })}
                    className={`px-2 py-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                      calc.gateType === v
                        ? "bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25"
                        : "bg-[#1a1f2e] border border-[#1e2230] text-white/70 hover:border-orange-500/50 hover:text-white"
                    }`}>
                    <div className="font-semibold">{d.label}</div>
                    {d.base > 0 && <div className={`mt-0.5 ${calc.gateType === v ? "text-gray-900/70" : "text-white/35"}`}>от {(d.base / 1000).toFixed(0)}к ₽</div>}
                  </button>
                ))}
              </div>
              {calc.gateType !== "none" && (
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs text-white/60">Ширина проёма</label>
                    <span className="text-orange-400 font-bold font-oswald">{calc.gateWidth} м</span>
                  </div>
                  <input type="range" min={2.5} max={8} step={0.5}
                    value={calc.gateWidth}
                    onChange={e => set({ gateWidth: +e.target.value })}
                  />
                  <div className="flex justify-between text-xs text-white/30 mt-1"><span>2.5 м</span><span>8 м</span></div>
                </div>
              )}
            </div>
          )}

          {/* Калитка */}
          {!isCanopy && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Калитка</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(WICKET_DATA) as [WicketType, typeof WICKET_DATA[WicketType]][]).map(([v, d]) => (
                  <button key={v} onClick={() => set({ wicketType: v })}
                    className={`px-2 py-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                      calc.wicketType === v
                        ? "bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25"
                        : "bg-[#1a1f2e] border border-[#1e2230] text-white/70 hover:border-orange-500/50 hover:text-white"
                    }`}>
                    <div className="font-semibold">{d.label}</div>
                    {d.price > 0 && <div className={`mt-0.5 ${calc.wicketType === v ? "text-gray-900/70" : "text-white/35"}`}>{(d.price / 1000).toFixed(1)}к ₽</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Дополнительно */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">Дополнительные работы</label>
            <div className="space-y-3">
              {([
                { key: "installation" as const, label: "Монтаж под ключ",    desc: `35% от суммы материалов — ${fmt(materialsSum * INSTALL_RATE)}` },
                { key: "painting"     as const, label: "Порошковая покраска", desc: `${PAINT_PRICE} ₽/м², RAL любой цвет — ${fmt(fenceArea * PAINT_PRICE)}`, hidden: isCanopy },
                { key: "automation"   as const, label: "Автоматика ворот",   desc: calc.gateType !== "none" ? `Привод DoorHan/Nice — ${AUTO_PRICE.toLocaleString("ru-RU")} ₽` : "Сначала выберите ворота", disabled: calc.gateType === "none" || isCanopy },
              ]).filter(i => !i.hidden).map(({ key, label, desc, disabled }) => (
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

        {/* ── Результат ── */}
        <div className="flex flex-col">
          <div className="bg-[#0a0c10] border border-[#1e2230] rounded-2xl p-7 flex-1">
            <div className="section-tag mb-1">Предварительный расчёт</div>
            <div className="text-xs text-white/30 mb-5">Точная стоимость — после бесплатного замера (±5–15%)</div>

            <div className="space-y-0 mb-5">
              {lineItems.map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start py-2.5 border-b border-[#1a1f2e] gap-3">
                  <span className="text-white/55 text-sm leading-tight">{label}</span>
                  <span className={`text-sm whitespace-nowrap font-medium ${value === 0 ? "text-orange-400" : "text-white"}`}>
                    {value === 0 ? "Бесплатно 🎁" : fmt(value)}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-[#0d1017] border border-orange-500/20 rounded-xl p-5 mb-5">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <div className="text-white/50 text-xs mb-1">Итого ориентировочно</div>
                  <div className="stat-number">{fmt(total)}</div>
                </div>
                <div className="text-right text-xs text-white/40 space-y-1">
                  {!isCanopy && <div>Площадь: <span className="text-white font-bold">{fenceArea} м²</span></div>}
                  {!isCanopy && <div>Столбов: <span className="text-white font-bold">{postCount} шт.</span></div>}
                  {isCanopy && <div>Навес: <span className="text-white font-bold">{calc.canopyArea} м²</span></div>}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-orange-500/15 text-white/30 text-xs leading-relaxed">
                ⚠ Расчёт предварительный. Финальная цена после обмера участка и уточнения конфигурации.
              </div>
            </div>

            <button className="btn-orange w-full py-4 rounded-xl text-base mb-3">
              Заказать бесплатный замер
            </button>
            <button
              onClick={() => setShowKP(!showKP)}
              className="btn-outline-orange w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2">
              <Icon name={showKP ? "ChevronUp" : "FileText"} size={16} />
              {showKP ? "Скрыть КП" : "Сформировать КП"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { icon: "Clock",       text: "Замер бесплатно" },
              { icon: "Truck",       text: "Доставка по РФ" },
              { icon: "ShieldCheck", text: "Гарантия 5 лет" },
            ].map(({ icon, text }) => (
              <div key={text} className="bg-[#141720] border border-[#1e2230] rounded-xl p-3 text-center">
                <Icon name={icon} size={18} className="text-orange-400 mx-auto mb-1" />
                <div className="text-xs text-white/55 leading-tight">{text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* КП блок */}
      {showKP && (
        <div className="mt-8 bg-[#0a0c10] border border-orange-500/30 rounded-2xl p-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div>
              <div className="font-oswald font-bold text-lg text-white">Коммерческое предложение</div>
              <div className="text-xs text-white/40">Готово к печати или отправке клиенту</div>
            </div>
            <div className="flex gap-2">
              <button onClick={copyKP}
                className="flex items-center gap-2 bg-[#1a1f2e] border border-[#2a3040] hover:border-orange-500/50 text-white/70 hover:text-white px-4 py-2 rounded-lg text-sm transition-all">
                <Icon name="Copy" size={14} />
                Копировать
              </button>
              <button onClick={downloadKP}
                className="btn-orange px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <Icon name="Download" size={14} />
                Скачать .txt
              </button>
            </div>
          </div>
          <textarea
            ref={kpRef}
            readOnly
            value={kpText}
            className="w-full bg-[#141720] border border-[#1e2230] rounded-xl p-4 text-white/70 text-xs font-mono leading-relaxed resize-none focus:outline-none focus:border-orange-500/40"
            rows={28}
          />
        </div>
      )}
    </div>
  );
}
/*REMOVE_END*/

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".anim-ready");
    const io = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.08 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ── Главная страница ──────────────────────────────────────────────────────────
export default function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  useScrollReveal();

  // SEO: гео-зависимые мета-теги для Москвы и МО
  useEffect(() => {
    document.title = "СтальГрупп — заборы, ворота, навесы под ключ в Москве и МО | ИП Балтаг А. В.";
    const setMeta = (name: string, content: string) => {
      let m = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!m) { m = document.createElement("meta"); m.name = name; document.head.appendChild(m); }
      m.content = content;
    };
    setMeta("description", "Производство и монтаж заборов из профнастила и евроштакетника, откатных ворот, навесов в Москве и Подмосковье. Работаем в Люберцах, Чапаевке, Астрецово, Назарьево, Реутове, Балашихе. Гарантия 5 лет, бесплатный замер.");
    setMeta("keywords", "забор под ключ Москва, забор Люберцы, забор Чапаевка, забор Астрецово, забор Назарьево, откатные ворота Подмосковье, навес для авто МО, евроштакетник цена, профнастил забор");
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--dark-bg)" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e2230]"
        style={{ background: "rgba(13,15,20,0.93)", backdropFilter: "blur(16px)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Icon name="Fence" size={18} className="text-gray-900" />
              </div>
              <div>
                <div className="font-oswald font-bold text-white text-lg leading-none tracking-wider">
                  СТАЛЬ<span className="text-orange-400">ГРУПП</span>
                </div>
                <div className="text-[10px] text-white/30 leading-none tracking-widest">ПРОИЗВОДСТВО</div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-5">
              {NAV_ITEMS.map(({ id, label }) => (
                <button key={id} onClick={() => scrollTo(id)} className="nav-link text-sm">{label}</button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <div className="text-right leading-tight">
                <a href="tel:+78001234567" className="flex items-center gap-1.5 text-orange-400 font-oswald font-medium hover:text-orange-300 transition-colors text-sm justify-end">
                  <Icon name="Phone" size={14} />
                  8 800 123-45-67
                </a>
                <div className="text-[10px] text-white/35 mt-0.5 flex items-center justify-end gap-1">
                  <Icon name="Clock" size={10} /> Пн–Сб 8:00–20:00
                </div>
              </div>
              <button className="btn-outline-orange px-4 py-2 rounded-lg text-xs" onClick={() => scrollTo("lead")}>
                Заказать звонок
              </button>
              <button className="btn-orange px-5 py-2 rounded-lg text-sm" onClick={() => scrollTo("calculator")}>
                Рассчитать
              </button>
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-white/70 hover:text-white">
              <Icon name={menuOpen ? "X" : "Menu"} size={24} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-[#1e2230] bg-[#0d0f14] px-4 py-4 space-y-1">
            {NAV_ITEMS.map(({ id, label }) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="block w-full text-left py-2 px-3 rounded text-white/70 hover:text-white hover:bg-[#141720] transition-all text-sm">
                {label}
              </button>
            ))}
            <div className="pt-3 border-t border-[#1e2230]">
              <button className="btn-orange w-full py-3 rounded-lg text-sm" onClick={() => scrollTo("calculator")}>
                Рассчитать стоимость
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden grid-pattern">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${IMGS.hero})`, opacity: 0.18 }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0f14] via-transparent to-[#0d0f14]" />
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(249,115,22,0.12) 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-orange-400 text-sm font-medium">Производство с 2009 года · 15 лет опыта</span>
          </div>

          <h1 className="font-oswald font-bold text-5xl sm:text-6xl lg:text-8xl leading-none mb-6 tracking-tight">
            ЗАБОРЫ, ВОРОТА<br />
            <span className="text-orange-400">НАВЕСЫ И КОВКА</span>
          </h1>

          <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Производство и монтаж металлических ограждений, ворот, навесов и беседок любой сложности. Собственный завод, гарантия качества, доставка по всей России.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button className="btn-orange px-8 py-4 rounded-xl text-base w-full sm:w-auto" onClick={() => scrollTo("calculator")}>
              <span className="flex items-center gap-2 justify-center">
                <Icon name="Calculator" size={18} />
                Рассчитать + сформировать КП
              </span>
            </button>
            <button className="btn-outline-orange px-8 py-4 rounded-xl text-base w-full sm:w-auto" onClick={() => scrollTo("portfolio")}>
              Смотреть работы
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { num: "1 200+", label: "Объектов сдано" },
              { num: "15",     label: "Лет на рынке" },
              { num: "5 лет",  label: "Гарантия" },
              { num: "1 день", label: "Бесплатный замер" },
            ].map(({ num, label }) => (
              <div key={label} className="bg-[#141720]/80 border border-[#1e2230] rounded-xl p-4">
                <div className="font-oswald font-bold text-2xl text-orange-400 mb-0.5">{num}</div>
                <div className="text-white/50 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 animate-bounce">
          <Icon name="ChevronDown" size={20} />
        </div>
      </section>

      {/* ПОЧЕМУ ВЫБИРАЮТ НАС */}
      <section id="advantages" className="py-24 bg-[#0a0c10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 anim-ready">
            <span className="section-tag">Преимущества</span>
            <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-white mb-3">
              ПОЧЕМУ <span className="text-orange-400">ВЫБИРАЮТ НАС</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">Работаем напрямую с заводом — без посредников и скрытых наценок.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: "Factory",     title: "Собственное производство",  desc: "Свой цех 2 400 м² и парк оборудования. Контроль качества на каждом этапе." },
              { icon: "FileCheck",   title: "Гарантия по договору",      desc: "До 5 лет на конструкции. Договор, акт, чек — все официально." },
              { icon: "Zap",         title: "Монтаж за 1 день",          desc: "Бригада приезжает с готовой секцией. Забор до 50 м — в день монтажа." },
              { icon: "Ruler",       title: "Бесплатный замер",          desc: "Выезд инженера + проект и смета — 0 ₽. Без обязательств заказа." },
              { icon: "BadgePercent", title: "Цена от производителя",     desc: "Прямые цены завода. Скидка 5% при заказе до конца месяца." },
              { icon: "Truck",       title: "Доставка по всей РФ",       desc: "Свой автопарк по Москве и МО. По регионам — ТК с страхованием." },
              { icon: "Award",       title: "1 200+ объектов",           desc: "С 2009 года. Частные дома, дачи, склады, школы, промзоны." },
              { icon: "Headphones",  title: "Менеджер на связи",         desc: "Один человек ведёт ваш проект от замера до сдачи. Без перебросов." },
            ].map(({ icon, title, desc }, i) => (
              <div key={title}
                className="group bg-[#141720] border border-[#1e2230] hover:border-orange-500/40 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 anim-ready"
                style={{ transitionDelay: `${i * 0.05}s` }}>
                <div className="w-12 h-12 bg-orange-500/10 group-hover:bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 transition-all">
                  <Icon name={icon} size={22} className="text-orange-400" />
                </div>
                <h3 className="font-oswald font-semibold text-base text-white mb-1.5 leading-tight">{title}</h3>
                <p className="text-white/45 text-xs sm:text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* СХЕМА РАБОТЫ */}
      <section id="steps" className="py-24 relative grid-pattern">
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(249,115,22,0.05) 0%, transparent 70%)" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-14 anim-ready">
            <span className="section-tag">Схема работы</span>
            <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-white mb-3">
              5 ШАГОВ ОТ ЗАЯВКИ <span className="text-orange-400">ДО ГОТОВОГО ЗАБОРА</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">Прозрачный процесс. Никаких сюрпризов и скрытых платежей.</p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-orange-500/0 via-orange-500/40 to-orange-500/0" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {[
                { num: "01", icon: "PhoneCall", title: "Заявка",         desc: "Звонок или форма на сайте. Уточняем задачу за 5 минут." },
                { num: "02", icon: "Ruler",     title: "Замер",          desc: "Бесплатный выезд инженера в день обращения. Проект и смета." },
                { num: "03", icon: "FileSignature", title: "Договор",   desc: "Фиксируем цену, сроки, материалы. Аванс 30%." },
                { num: "04", icon: "Factory",   title: "Производство",   desc: "Изготовление секций на нашем заводе. 7–14 рабочих дней." },
                { num: "05", icon: "CheckCheck", title: "Монтаж + акт",  desc: "Установка под ключ, уборка, акт сдачи-приёмки. Гарантия 5 лет." },
              ].map(({ num, icon, title, desc }, i) => (
                <div key={num}
                  className="relative anim-ready bg-[#141720] border border-[#1e2230] hover:border-orange-500/40 rounded-2xl p-5 text-center transition-all duration-300 hover:-translate-y-2"
                  style={{ transitionDelay: `${i * 0.1}s` }}>
                  <div className="w-16 h-16 mx-auto mb-3 relative">
                    <div className="absolute inset-0 bg-orange-500/10 rounded-full" />
                    <div className="absolute inset-2 bg-[#0a0c10] border border-orange-500/30 rounded-full flex items-center justify-center">
                      <Icon name={icon} size={20} className="text-orange-400" />
                    </div>
                  </div>
                  <div className="font-oswald font-bold text-2xl text-orange-400 mb-1">{num}</div>
                  <h3 className="font-oswald font-semibold text-base text-white mb-1.5">{title}</h3>
                  <p className="text-white/45 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-10 anim-ready">
            <button className="btn-orange px-8 py-4 rounded-xl text-base" onClick={() => scrollTo("lead")}>
              <span className="flex items-center gap-2 justify-center">
                <Icon name="ArrowRight" size={18} />
                Начать с бесплатного замера
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ПРОДУКЦИЯ */}
      <section id="products" className="py-24 bg-[#0a0c10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 anim-ready">
            <span className="section-tag">Продукция</span>
            <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-white mb-3">
              ВСЁ ДЛЯ ВАШЕГО <span className="text-orange-400">УЧАСТКА</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">Полный спектр металлических конструкций. Цены актуальны на 2026 год.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCTS.map(({ img, title, desc, price, badge, href }, i) => (
              <div key={title} className="product-card rounded-2xl overflow-hidden anim-ready relative"
                style={{ transitionDelay: `${i * 0.06}s` }}>
                {badge && (
                  <div className="absolute top-3 right-3 z-10 bg-orange-500 text-gray-900 text-xs font-bold font-oswald px-2 py-1 rounded tracking-wider uppercase">
                    {badge}
                  </div>
                )}
                <div className="h-44 overflow-hidden">
                  <img src={img} alt={title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                </div>
                <div className="p-5">
                  <h3 className="font-oswald font-semibold text-lg text-white mb-1.5">{title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-4">{desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-orange-400 font-oswald font-bold text-lg">{price}</span>
                    {href ? (
                      <Link to={href}
                        className="text-white/60 hover:text-orange-400 transition-all text-sm flex items-center gap-1 group/btn font-medium">
                        Подробнее <Icon name="ArrowRight" size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    ) : (
                      <button onClick={() => scrollTo("lead")}
                        className="text-white/50 hover:text-orange-400 transition-all text-sm flex items-center gap-1 group/btn">
                        Подробнее <Icon name="ArrowRight" size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ПОРТФОЛИО */}
      <section id="portfolio" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-14 gap-4">
            <div className="anim-ready">
              <span className="section-tag">Портфолио</span>
              <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-white">
                НАШИ <span className="text-orange-400">РАБОТЫ</span>
              </h2>
            </div>
            <button className="btn-outline-orange px-6 py-3 rounded-xl text-sm anim-ready">Все проекты</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PORTFOLIO_ITEMS.map(({ title, tag, img }, i) => (
              <div key={title} className="portfolio-item anim-ready"
                style={{ height: i === 0 || i === 5 ? "320px" : "230px", transitionDelay: `${i * 0.07}s` }}>
                <img src={img} alt={title} />
                <div className="portfolio-overlay">
                  <div>
                    <div className="inline-block bg-orange-500 text-gray-900 text-xs font-bold font-oswald px-2 py-1 rounded mb-2 uppercase tracking-wider">
                      {tag}
                    </div>
                    <div className="text-white font-semibold">{title}</div>
                  </div>
                </div>
                <div className="absolute top-3 left-3 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs px-2 py-1 rounded-full font-oswald tracking-wider uppercase">
                  {tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* УСЛУГИ */}
      <section id="services" className="py-24 bg-[#0a0c10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 anim-ready">
            <span className="section-tag">Услуги</span>
            <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-white mb-3">
              ПОЛНЫЙ <span className="text-orange-400">КОМПЛЕКС</span> РАБОТ
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(({ icon, img, title, desc }, i) => (
              <div key={title}
                className="group bg-[#141720] border border-[#1e2230] hover:border-orange-500/40 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 anim-ready"
                style={{ transitionDelay: `${i * 0.07}s` }}>
                <div className="h-36 overflow-hidden relative">
                  <img src={img} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141720] via-transparent to-transparent" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name={icon} size={18} className="text-orange-400" />
                    <h3 className="font-oswald font-semibold text-base text-white">{title}</h3>
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEAD-ФОРМА: бесплатный расчёт */}
      <section id="lead" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${IMGS.profnastil})`, opacity: 0.12 }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0f14] via-[#0d0f14]/95 to-[#0d0f14]/70" />
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(circle at 80% 50%, rgba(249,115,22,0.15) 0%, transparent 60%)" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">

            <div className="lg:col-span-3 anim-ready">
              <span className="section-tag">Бесплатно</span>
              <h2 className="font-oswald font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4 leading-tight">
                ОСТАВЬТЕ ЗАЯВКУ — И ПОЛУЧИТЕ<br />
                <span className="text-orange-400">БЕСПЛАТНЫЙ РАСЧЁТ СМЕТЫ</span>
              </h2>
              <p className="text-white/60 text-lg mb-6 max-w-xl">
                Перезвоним за 15 минут, бесплатно выедем на замер, привезём образцы материалов и составим точную смету. Без обязательств.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8 max-w-xl">
                {[
                  { icon: "Clock",       text: "Звонок за 15 мин." },
                  { icon: "Ruler",       text: "Замер бесплатно" },
                  { icon: "FileText",    text: "Смета на email" },
                  { icon: "ShieldCheck", text: "Гарантия 5 лет" },
                  { icon: "BadgePercent", text: "Скидка 5%" },
                  { icon: "Gift",        text: "Присыпка щебнем 🎁" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-white/70">
                    <Icon name={icon} size={15} className="text-orange-400 flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 anim-ready" style={{ transitionDelay: "0.15s" }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  alert(`Спасибо, ${fd.get("name") || "клиент"}! Перезвоним в течение 15 минут на ${fd.get("phone")}.`);
                  (e.currentTarget as HTMLFormElement).reset();
                }}
                className="bg-[#141720]/95 backdrop-blur border-2 border-orange-500/30 rounded-3xl p-7 shadow-2xl shadow-orange-500/10">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                  <span className="text-orange-400 text-xs font-medium uppercase tracking-wider">Свободных слотов на замер: 3</span>
                </div>
                <div className="font-oswald font-bold text-2xl text-white mb-1">Получить расчёт</div>
                <p className="text-white/40 text-xs mb-5">Заполните 2 поля — менеджер свяжется в течение 15 минут</p>

                <div className="space-y-3">
                  <div className="relative">
                    <Icon name="User" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    <input
                      name="name"
                      type="text"
                      required
                      placeholder="Ваше имя"
                      className="select-field !pl-11"
                    />
                  </div>
                  <div className="relative">
                    <Icon name="Phone" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    <input
                      name="phone"
                      type="tel"
                      required
                      placeholder="+7 (___) ___-__-__"
                      className="select-field !pl-11"
                    />
                  </div>
                  <button type="submit" className="btn-orange w-full py-4 rounded-xl text-base group">
                    <span className="flex items-center gap-2 justify-center">
                      Отправить заявку
                      <Icon name="ArrowRight" size={18} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                  <p className="text-white/30 text-[11px] text-center leading-relaxed">
                    Нажимая кнопку, вы соглашаетесь<br />
                    с <button type="button" className="text-orange-400/70 hover:text-orange-400 underline">политикой конфиденциальности</button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* КАЛЬКУЛЯТОР */}
      <section id="calculator" className="py-24 grid-pattern relative">
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(249,115,22,0.06) 0%, transparent 70%)" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 anim-ready">
            <span className="section-tag">Калькулятор + КП</span>
            <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-white mb-3">
              РАССЧИТАЙТЕ <span className="text-orange-400">И СКАЧАЙТЕ КП</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Актуальные цены 2026. Заборы, ворота, навесы, все типы фундаментов.<br />
              Готовое коммерческое предложение — за 1 клик.
            </p>
          </div>
          <div className="bg-[#141720] border border-[#1e2230] rounded-3xl p-6 sm:p-8 anim-ready">
            <Calculator />
          </div>
        </div>
      </section>

      {/* ДОСТАВКА */}
      <section id="delivery" className="py-24 bg-[#0a0c10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 anim-ready">
            <span className="section-tag">Доставка</span>
            <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-white mb-3">
              ДОСТАВИМ <span className="text-orange-400">ТОЧНО В СРОК</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="anim-ready">
              <div className="bg-[#141720] border border-[#1e2230] rounded-3xl p-8">
                <div className="font-oswald font-bold text-xl text-white mb-6 flex items-center gap-2">
                  <Icon name="Truck" size={20} className="text-orange-400" />
                  Тарифы по Москве и МО
                </div>
                <div className="space-y-3 mb-6">
                  {[
                    { zone: "Москва (в пределах МКАД)",   price: "Бесплатно",   sub: "при заказе от 60 000 ₽", highlight: true },
                    { zone: "До 20 км от МКАД",           price: "3 500 ₽",     sub: "фиксированный тариф за рейс" },
                    { zone: "20–50 км от МКАД",           price: "4 500 ₽",     sub: "фиксированный тариф за рейс" },
                    { zone: "Более 50 км от МКАД",        price: "70 ₽/км",     sub: "от МКАД + базовый тариф" },
                    { zone: "Негабаритный груз",           price: "Индивидуально", sub: "длина >6 м, масса >5 т — позвоните" },
                    { zone: "По России (СДЭК / ПЭК)",     price: "По тарифу ТК", sub: "3–10 рабочих дней" },
                  ].map(({ zone, price, sub, highlight }) => (
                    <div key={zone}
                      className={`flex items-center justify-between py-3 px-4 rounded-xl gap-3 ${
                        highlight ? "bg-orange-500/10 border border-orange-500/30" : "border border-[#1e2230]"
                      }`}>
                      <div>
                        <div className={`text-sm font-medium ${highlight ? "text-orange-300" : "text-white"}`}>{zone}</div>
                        <div className="text-xs text-white/35">{sub}</div>
                      </div>
                      <div className={`font-oswald font-bold whitespace-nowrap ${highlight ? "text-orange-400" : "text-white"}`}>{price}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-[#0a0c10] border border-[#1e2230] rounded-xl p-4 text-xs text-white/40 leading-relaxed">
                  <span className="text-orange-400 font-medium">Негабаритные грузы</span> — длина конструкции &gt;6 м, ширина &gt;2.5 м или масса &gt;5 т. Рассчитывается индивидуально, позвоните менеджеру.
                </div>
              </div>
            </div>

            <div className="anim-ready space-y-4" style={{ transitionDelay: "0.1s" }}>
              {[
                { icon: "Truck",      title: "Собственный автопарк",   desc: "12 грузовых авто. Доставка по Москве — в день отгрузки с завода." },
                { icon: "Package",    title: "Упаковка и страхование",  desc: "Конструкции упакованы на заводе, груз застрахован на всём пути." },
                { icon: "Clock",      title: "Чёткие сроки",           desc: "Подтверждаем дату доставки за сутки. Задержки — под договорную ответственность." },
                { icon: "PhoneCall", title: "Сопровождение груза",    desc: "SMS и звонок при отгрузке, уведомление за 1 час до прибытия." },
                { icon: "Wrench",     title: "Выезд монтажной бригады", desc: "От 1 500 ₽/день. Бригада 2–4 чел. с инструментом. Сдача по акту." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 bg-[#141720] border border-[#1e2230] rounded-xl p-4 hover:border-orange-500/30 transition-colors">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name={icon} size={18} className="text-orange-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-sm">{title}</div>
                    <div className="text-white/40 text-xs mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
              <button className="btn-orange w-full py-4 rounded-xl mt-2">Рассчитать доставку</button>
            </div>
          </div>
        </div>
      </section>

      {/* ГАРАНТИЯ */}
      <section id="warranty" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 anim-ready">
            <span className="section-tag">Гарантия</span>
            <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-white mb-3">
              МЫ УВЕРЕНЫ <span className="text-orange-400">В КАЧЕСТВЕ</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {[
              { years: "5", label: "лет", title: "На конструкции", desc: "Полная замена при производственном браке или преждевременной коррозии" },
              { years: "3", label: "года", title: "На покраску",   desc: "Порошковое покрытие не отслоится, не потрескается, сохранит яркость цвета" },
              { years: "2", label: "года", title: "На монтаж",     desc: "Если геометрия нарушится — исправим бесплатно в удобное время" },
            ].map(({ years, label, title, desc }, i) => (
              <div key={title}
                className="anim-ready bg-[#141720] border border-[#1e2230] hover:border-orange-500/40 rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-2"
                style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="font-oswald font-bold text-7xl text-orange-400 leading-none mb-1">{years}</div>
                <div className="font-oswald text-xl text-white/40 mb-4">{label}</div>
                <h3 className="font-oswald font-bold text-xl text-white mb-3">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-ready">
            {[
              { icon: "FileText", title: "Договор",       desc: "Все условия гарантии прописаны в договоре" },
              { icon: "Phone",    title: "Быстрый ответ", desc: "Реакция на гарантийное обращение за 24 часа" },
              { icon: "Wrench",   title: "Свои мастера",  desc: "Ремонт выполняют те же специалисты" },
              { icon: "Repeat",   title: "Замена",        desc: "При невозможности ремонта — полная замена" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 bg-[#141720] border border-[#1e2230] rounded-xl p-4">
                <Icon name={icon} size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-white">{title}</div>
                  <div className="text-xs text-white/40 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* КОНТАКТЫ */}
      <section id="contacts" className="py-24 bg-[#0a0c10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="anim-ready">
              <span className="section-tag">Контакты</span>
              <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-white mb-2">
                СВЯЖИТЕСЬ <span className="text-orange-400">С НАМИ</span>
              </h2>
              <div className="orange-line mb-8" />

              <div className="space-y-5 mb-10">
                {[
                  { icon: "Phone",  title: "Телефон",      value: "8 800 123-45-67",         sub: "Бесплатно, пн–сб 8:00–20:00", href: "tel:+78001234567" },
                  { icon: "Mail",   title: "Email",        value: "info@stalgrupp.ru",        sub: "Ответим в течение часа",       href: "mailto:info@stalgrupp.ru" },
                  { icon: "MapPin", title: "Адрес",        value: "Москва, ул. Промышленная, 12", sub: "Производство и шоурум" },
                  { icon: "Clock",  title: "Режим работы", value: "Пн–Сб: 8:00 – 20:00",    sub: "Воскресенье: по записи" },
                ].map(({ icon, title, value, sub, href }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon name={icon} size={18} className="text-orange-400" />
                    </div>
                    <div>
                      <div className="text-white/40 text-xs mb-0.5">{title}</div>
                      {href
                        ? <a href={href} className="text-white font-medium hover:text-orange-400 transition-colors">{value}</a>
                        : <div className="text-white font-medium">{value}</div>}
                      <div className="text-white/30 text-xs">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                {[
                  { icon: "MessageCircle", label: "WhatsApp" },
                  { icon: "Send",          label: "Telegram" },
                  { icon: "Phone",         label: "Позвонить" },
                ].map(({ icon, label }) => (
                  <button key={label} className="flex-1 btn-outline-orange py-3 rounded-xl text-xs flex items-center justify-center gap-2">
                    <Icon name={icon} size={14} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="anim-ready" style={{ transitionDelay: "0.1s" }}>
              <div className="bg-[#141720] border border-[#1e2230] rounded-3xl p-8">
                <div className="font-oswald font-bold text-xl text-white mb-6">Оставить заявку</div>
                <div className="space-y-4">
                  {[
                    { placeholder: "Ваше имя",  type: "text" },
                    { placeholder: "Телефон",   type: "tel" },
                    { placeholder: "Email",     type: "email" },
                  ].map(({ placeholder, type }) => (
                    <input key={placeholder} type={type} placeholder={placeholder} className="select-field" />
                  ))}
                  <textarea
                    placeholder="Опишите задачу: тип ограждения, размеры, пожелания"
                    rows={4}
                    className="select-field resize-none"
                  />
                  <button className="btn-orange w-full py-4 rounded-xl text-base">
                    Отправить заявку
                  </button>
                  <p className="text-white/25 text-xs text-center">
                    Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1e2230] bg-[#0a0c10] pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">

            {/* Лого + о компании */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Icon name="Fence" size={18} className="text-gray-900" />
                </div>
                <div>
                  <div className="font-oswald font-bold text-white text-lg tracking-wider">СТАЛЬ<span className="text-orange-400">ГРУПП</span></div>
                  <div className="text-[10px] text-white/30 tracking-widest">ПРОИЗВОДСТВО С 2009</div>
                </div>
              </div>
              <p className="text-white/40 text-sm leading-relaxed mb-4">
                Производим и устанавливаем заборы, ворота, навесы и беседки под ключ. 1 200+ сданных объектов по всей России.
              </p>
              <div className="flex gap-2">
                {[
                  { icon: "MessageCircle", label: "WhatsApp", href: "https://wa.me/78001234567" },
                  { icon: "Send",          label: "Telegram", href: "https://t.me/stalgrupp" },
                  { icon: "Instagram",     label: "Instagram", href: "#" },
                ].map(({ icon, label, href }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 bg-[#141720] border border-[#1e2230] hover:border-orange-500/50 hover:bg-orange-500/10 rounded-lg flex items-center justify-center transition-all group"
                    aria-label={label}>
                    <Icon name={icon} size={15} className="text-white/50 group-hover:text-orange-400 transition-colors" />
                  </a>
                ))}
              </div>
            </div>

            {/* Навигация */}
            <div>
              <div className="font-oswald font-semibold text-white text-sm uppercase tracking-wider mb-4">Разделы</div>
              <ul className="space-y-2">
                {NAV_ITEMS.map(({ id, label }) => (
                  <li key={id}>
                    <button onClick={() => scrollTo(id)}
                      className="text-white/40 hover:text-orange-400 text-sm transition-colors">
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Контакты + производство */}
            <div>
              <div className="font-oswald font-semibold text-white text-sm uppercase tracking-wider mb-4">Контакты</div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5 text-sm">
                  <Icon name="Phone" size={15} className="text-orange-400 flex-shrink-0 mt-0.5" />
                  <a href="tel:+78001234567" className="text-white/70 hover:text-orange-400 transition-colors">8 800 123-45-67</a>
                </li>
                <li className="flex items-start gap-2.5 text-sm">
                  <Icon name="Mail" size={15} className="text-orange-400 flex-shrink-0 mt-0.5" />
                  <a href="mailto:info@stalgrupp.ru" className="text-white/70 hover:text-orange-400 transition-colors">info@stalgrupp.ru</a>
                </li>
                <li className="flex items-start gap-2.5 text-sm">
                  <Icon name="MapPin" size={15} className="text-orange-400 flex-shrink-0 mt-0.5" />
                  <div className="text-white/70">
                    Производство:<br />
                    <span className="text-white/40 text-xs">{COMPANY.factoryAddress}</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 text-sm">
                  <Icon name="Clock" size={15} className="text-orange-400 flex-shrink-0 mt-0.5" />
                  <div className="text-white/70">
                    Пн–Сб: 8:00 – 20:00<br />
                    <span className="text-white/40 text-xs">Вс — по предварительной записи</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* CTA блок */}
            <div>
              <div className="font-oswald font-semibold text-white text-sm uppercase tracking-wider mb-4">Нужна помощь?</div>
              <div className="bg-[#141720] border border-orange-500/20 rounded-2xl p-5">
                <div className="text-white text-sm font-medium mb-1">Не нашли нужное?</div>
                <div className="text-white/40 text-xs mb-4">Перезвоним за 15 минут, ответим на любые вопросы и бесплатно посчитаем смету.</div>
                <button onClick={() => scrollTo("lead")}
                  className="btn-orange w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                  <Icon name="PhoneCall" size={15} />
                  Заказать звонок
                </button>
              </div>
            </div>
          </div>

          {/* Гео-строка для SEO */}
          <div className="border-t border-[#1e2230] pt-5 mb-5">
            <div className="text-[11px] text-white/30 leading-relaxed">
              <span className="text-orange-400/70 font-medium uppercase tracking-wider mr-2">География работ:</span>
              Работаем по Москве и Московской области — {COMPANY.geo.join(" · ")} и другие населённые пункты МО. Выезд замерщика бесплатный в день обращения.
            </div>
          </div>

          {/* Реквизиты ИП Балтаг */}
          <div className="border-t border-[#1e2230] pt-5 mb-5 bg-[#0d1017] rounded-xl p-4 -mx-1">
            <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-3">Реквизиты</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-[11px] text-white/55">
              <div>
                <div className="text-white/30">Наименование</div>
                <div className="text-white/80">{COMPANY.legalName}</div>
              </div>
              <div>
                <div className="text-white/30">ИНН</div>
                <div className="text-white/80 font-mono">{COMPANY.inn}</div>
              </div>
              <div>
                <div className="text-white/30">ОГРНИП</div>
                <div className="text-white/80 font-mono">{COMPANY.ogrnip}</div>
              </div>
              <div>
                <div className="text-white/30">Банк</div>
                <div className="text-white/80">{COMPANY.bankName}, БИК {COMPANY.bik}</div>
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <div className="text-white/30">Юр. адрес</div>
                <div className="text-white/80">{COMPANY.legalAddress}</div>
              </div>
            </div>
          </div>

          {/* Нижняя полоса */}
          <div className="border-t border-[#1e2230] pt-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="text-white/30 text-xs">
              © 2009–2026 {COMPANY.shortName}. Все права защищены.
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {[
                "Политика конфиденциальности",
                "Договор-оферта",
                "Реквизиты",
                "Карта сайта",
              ].map(item => (
                <button key={item} className="text-white/35 hover:text-orange-400 text-xs transition-colors">{item}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Мобильная плавающая кнопка звонка */}
      <a href="tel:+78001234567"
        className="lg:hidden fixed bottom-5 right-5 z-40 w-14 h-14 bg-orange-500 hover:bg-orange-400 rounded-full shadow-2xl shadow-orange-500/40 flex items-center justify-center animate-pulse"
        aria-label="Позвонить">
        <Icon name="Phone" size={22} className="text-gray-900" />
      </a>
    </div>
  );
}