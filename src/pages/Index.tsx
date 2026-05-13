import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const HERO_IMG = "https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/files/196086a1-d5c9-4caa-a2f6-4d0f7532182f.jpg";
const PORTFOLIO_IMG = "https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/files/d0c5373a-0046-48b2-aba5-5d4847056985.jpg";

const NAV_ITEMS = [
  { id: "home", label: "Главная" },
  { id: "about", label: "О производстве" },
  { id: "products", label: "Продукция" },
  { id: "portfolio", label: "Портфолио" },
  { id: "services", label: "Услуги" },
  { id: "calculator", label: "Калькулятор" },
  { id: "delivery", label: "Доставка" },
  { id: "warranty", label: "Гарантия" },
  { id: "contacts", label: "Контакты" },
];

// ── Актуальные рыночные цены 2026 ──────────────────────────────────────────
const PRODUCTS = [
  {
    icon: "Fence",
    title: "Заборы из профнастила",
    desc: "Самый популярный тип. Оцинкованный профнастил С8, С10, МП20. Покрытие — полиэстер или пурал. Срок службы 25+ лет.",
    price: "от 1 100 ₽/м²",
    badge: "Хит продаж",
  },
  {
    icon: "Columns2",
    title: "Кованые заборы",
    desc: "Художественная ковка по индивидуальным эскизам. Горячая и холодная ковка. Антикоррозийная обработка + покраска.",
    price: "от 4 500 ₽/м²",
    badge: "Премиум",
  },
  {
    icon: "PanelTop",
    title: "3D-заборы (сварная сетка)",
    desc: "Секционные ограждения из прутков Ø4–6 мм, ячейка 50×200 мм. Антивандальные, подходят для промышленных объектов.",
    price: "от 1 600 ₽/м²",
    badge: null,
  },
  {
    icon: "DoorOpen",
    title: "Откатные ворота",
    desc: "Консольные откатные ворота шириной 3–6 м. Наполнение: профнастил, 3D-сетка, ковка. Подготовка под автоматику.",
    price: "от 42 000 ₽",
    badge: null,
  },
  {
    icon: "Minus",
    title: "Распашные ворота",
    desc: "Одно- и двустворчатые. Любое наполнение, ширина до 5 м. Петли усиленные, рама из профтрубы 60×60 мм.",
    price: "от 26 000 ₽",
    badge: null,
  },
  {
    icon: "LayoutGrid",
    title: "Заборы из сетки-рабицы",
    desc: "Оцинкованная или ПВХ-покрытая сетка. Быстрый монтаж. Идеальный выбор для дачи и временного ограждения.",
    price: "от 550 ₽/м²",
    badge: "Эконом",
  },
];

const SERVICES = [
  { icon: "Ruler", title: "Бесплатный замер", desc: "Выезд специалиста в день обращения. Замер, составление проекта и точной сметы — бесплатно." },
  { icon: "Hammer", title: "Монтаж под ключ", desc: "Бурение, установка столбов, монтаж секций, ворот и калитки. Сдача объекта по акту." },
  { icon: "Paintbrush", title: "Порошковая покраска", desc: "Собственная камера полимеризации. Покрытие толщиной 60–80 мкм. Палитра RAL, 200+ цветов." },
  { icon: "Wrench", title: "Ремонт ограждений", desc: "Восстановление геометрии, замена секций, сварочные работы, обновление покраски." },
  { icon: "Zap", title: "Автоматизация ворот", desc: "Приводы Nice, FAAC, DoorHan. Пульты, GSM-управление, видеодомофон. Гарантия на привод 2 года." },
  { icon: "Shield", title: "Гарантийное обслуживание", desc: "Бесплатный выезд и устранение в гарантийный период. Без бюрократии и лишних звонков." },
];

const PORTFOLIO_ITEMS = [
  { title: "Кованые ворота в Подмосковье", tag: "Ворота" },
  { title: "Профнастил С10, 120 м, Красногорск", tag: "Забор" },
  { title: "3D-ограждение складского комплекса", tag: "Промышленный" },
  { title: "Откатные ворота с приводом FAAC", tag: "Автоматика" },
  { title: "Загородный участок под ключ, Истра", tag: "Под ключ" },
  { title: "Секционные ворота гаража + калитка", tag: "Гараж" },
];

// ── Типы калькулятора ───────────────────────────────────────────────────────
type FenceType = "profnastil" | "3d" | "kovka" | "setka" | "euro";
type GateType = "none" | "otkаtnye" | "raspashnye";
type WicketType = "none" | "standard" | "kovka";
type FoundationType = "none" | "stolbchatyi" | "lentochnyi";

interface CalcState {
  fenceType: FenceType;
  fenceLength: number;
  fenceHeight: number;
  gateType: GateType;
  gateWidth: number;
  wicketType: WicketType;
  foundation: FoundationType;
  installation: boolean;
  painting: boolean;
  automation: boolean;
}

// Цены на материалы (₽/м²) — рыночные данные 2026
const FENCE_MAT: Record<FenceType, { price: number; label: string; desc: string }> = {
  profnastil: { price: 1100, label: "Профнастил", desc: "С8/С10, полиэстер" },
  "3d":        { price: 1600, label: "3D-сетка",   desc: "Прутки Ø5 мм, ячейка 50×200" },
  kovka:       { price: 4500, label: "Ковка",       desc: "Горячая/холодная ковка" },
  setka:       { price: 550,  label: "Сетка-рабица", desc: "Оцинкованная Ø2 мм" },
  euro:        { price: 2100, label: "Евроштакетник", desc: "Металлический, двусторонний" },
};

// Базовая стоимость ворот (₽) + цена за метр ширины
const GATE_BASE: Record<GateType, { base: number; perMeter: number; label: string }> = {
  none:       { base: 0,     perMeter: 0,    label: "Без ворот" },
  otkаtnye:  { base: 42000, perMeter: 3200, label: "Откатные" },
  raspashnye: { base: 26000, perMeter: 2400, label: "Распашные" },
};

const WICKET_PRICES: Record<WicketType, { price: number; label: string }> = {
  none:     { price: 0,     label: "Без калитки" },
  standard: { price: 8500,  label: "Стандартная" },
  kovka:    { price: 18000, label: "Кованая" },
};

const FOUNDATION_PRICES: Record<FoundationType, { price: number; label: string; desc: string }> = {
  none:        { price: 0,    label: "Без фундамента", desc: "Только вкопанные столбы" },
  stolbchatyi: { price: 650,  label: "Столбчатый",    desc: "Бетонирование столбов Ø200 мм" },
  lentochnyi:  { price: 2800, label: "Ленточный",     desc: "Монолитная лента 300×400 мм" },
};

// Монтаж: % от стоимости материалов
const INSTALL_RATE = 0.35;
// Покраска: ₽/м²
const PAINT_PRICE = 280;
// Автоматика Nice / DoorHan
const AUTO_PRICE = 22000;
// Столбы: ₽/шт (шаг 2.5 м)
const POST_PRICE = 1800;

function Calculator() {
  const [calc, setCalc] = useState<CalcState>({
    fenceType: "profnastil",
    fenceLength: 30,
    fenceHeight: 2,
    gateType: "none",
    gateWidth: 4,
    wicketType: "none",
    foundation: "stolbchatyi",
    installation: true,
    painting: false,
    automation: false,
  });

  const fenceArea = calc.fenceLength * calc.fenceHeight;
  const matCost = fenceArea * FENCE_MAT[calc.fenceType].price;

  // Столбы (каждые 2.5 м + 1)
  const postCount = Math.ceil(calc.fenceLength / 2.5) + 1;
  const postCost = postCount * POST_PRICE;

  // Фундамент
  const foundationCost = calc.foundation === "none"
    ? 0
    : calc.foundation === "stolbchatyi"
      ? postCount * FOUNDATION_PRICES.stolbchatyi.price
      : calc.fenceLength * FOUNDATION_PRICES.lentochnyi.price;

  // Ворота
  const gateCost = calc.gateType !== "none"
    ? GATE_BASE[calc.gateType].base + calc.gateWidth * GATE_BASE[calc.gateType].perMeter
    : 0;

  // Калитка
  const wicketCost = WICKET_PRICES[calc.wicketType].price;

  // Монтаж
  const materialsTotal = matCost + postCost + gateCost + wicketCost;
  const installCost = calc.installation ? Math.round(materialsTotal * INSTALL_RATE) : 0;

  // Покраска (только забор)
  const paintCost = calc.painting ? fenceArea * PAINT_PRICE : 0;

  // Автоматика
  const autoCost = calc.automation && calc.gateType !== "none" ? AUTO_PRICE : 0;

  const total = matCost + postCost + foundationCost + gateCost + wicketCost + installCost + paintCost + autoCost;

  const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU") + " ₽";

  const lineItems = [
    { label: `Материал забора (${fenceArea} м²)`, value: matCost },
    { label: `Опорные столбы (${postCount} шт.)`, value: postCost },
    ...(foundationCost > 0 ? [{ label: `Фундамент — ${FOUNDATION_PRICES[calc.foundation].label}`, value: foundationCost }] : []),
    ...(gateCost > 0 ? [{ label: `${GATE_BASE[calc.gateType].label} ворота ${calc.gateWidth} м`, value: gateCost }] : []),
    ...(wicketCost > 0 ? [{ label: `Калитка — ${WICKET_PRICES[calc.wicketType].label}`, value: wicketCost }] : []),
    ...(installCost > 0 ? [{ label: "Монтаж (35% от материалов)", value: installCost }] : []),
    ...(paintCost > 0 ? [{ label: `Порошковая покраска (${PAINT_PRICE} ₽/м²)`, value: paintCost }] : []),
    ...(autoCost > 0 ? [{ label: "Автоматика для ворот (DoorHan)", value: autoCost }] : []),
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* ── Левая колонка: настройки ── */}
      <div className="space-y-7">

        {/* Тип забора */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-3">Тип забора</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.entries(FENCE_MAT) as [FenceType, typeof FENCE_MAT[FenceType]][]).map(([v, { label, price }]) => (
              <button
                key={v}
                onClick={() => setCalc({ ...calc, fenceType: v })}
                className={`px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                  calc.fenceType === v
                    ? "bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25"
                    : "bg-[#1a1f2e] border border-[#1e2230] text-white/70 hover:border-orange-500/50 hover:text-white"
                }`}
              >
                <div className="font-semibold leading-tight">{label}</div>
                <div className={`text-xs mt-0.5 ${calc.fenceType === v ? "text-gray-900/70" : "text-white/35"}`}>
                  {price.toLocaleString("ru-RU")} ₽/м²
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Длина */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-white/70">Длина периметра</label>
            <span className="text-orange-400 font-bold font-oswald text-lg">{calc.fenceLength} м</span>
          </div>
          <input type="range" min={5} max={300} step={5}
            value={calc.fenceLength}
            onChange={e => setCalc({ ...calc, fenceLength: +e.target.value })}
          />
          <div className="flex justify-between text-xs text-white/30 mt-1"><span>5 м</span><span>300 м</span></div>
        </div>

        {/* Высота */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-white/70">Высота забора</label>
            <span className="text-orange-400 font-bold font-oswald text-lg">{calc.fenceHeight.toFixed(1)} м</span>
          </div>
          <input type="range" min={1} max={3} step={0.5}
            value={calc.fenceHeight}
            onChange={e => setCalc({ ...calc, fenceHeight: +e.target.value })}
          />
          <div className="flex justify-between text-xs text-white/30 mt-1"><span>1.0 м</span><span>3.0 м</span></div>
        </div>

        {/* Фундамент */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Фундамент / столбы</label>
          <div className="space-y-2">
            {(Object.entries(FOUNDATION_PRICES) as [FoundationType, typeof FOUNDATION_PRICES[FoundationType]][]).map(([v, { label, desc, price }]) => (
              <label key={v} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => setCalc({ ...calc, foundation: v })}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    calc.foundation === v ? "border-orange-500 bg-orange-500" : "border-[#2a3040] group-hover:border-orange-500/50"
                  }`}
                >
                  {calc.foundation === v && <div className="w-2 h-2 rounded-full bg-gray-900" />}
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">{label}</div>
                    <div className="text-xs text-white/35">{desc}</div>
                  </div>
                  {price > 0 && (
                    <div className="text-xs text-white/40 text-right">
                      {v === "stolbchatyi" ? `${price.toLocaleString("ru-RU")} ₽/столб` : `${price.toLocaleString("ru-RU")} ₽/м`}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Ворота */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Ворота</label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {(Object.entries(GATE_BASE) as [GateType, typeof GATE_BASE[GateType]][]).map(([v, { label, base }]) => (
              <button
                key={v}
                onClick={() => setCalc({ ...calc, gateType: v })}
                className={`px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  calc.gateType === v
                    ? "bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25"
                    : "bg-[#1a1f2e] border border-[#1e2230] text-white/70 hover:border-orange-500/50 hover:text-white"
                }`}
              >
                <div className="font-semibold text-xs leading-tight">{label}</div>
                {base > 0 && <div className={`text-xs mt-0.5 ${calc.gateType === v ? "text-gray-900/70" : "text-white/35"}`}>от {(base / 1000).toFixed(0)}к ₽</div>}
              </button>
            ))}
          </div>

          {calc.gateType !== "none" && (
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-white/60">Ширина проёма</label>
                <span className="text-orange-400 font-bold font-oswald">{calc.gateWidth} м</span>
              </div>
              <input type="range" min={2.5} max={8} step={0.5}
                value={calc.gateWidth}
                onChange={e => setCalc({ ...calc, gateWidth: +e.target.value })}
              />
              <div className="flex justify-between text-xs text-white/30 mt-1"><span>2.5 м</span><span>8 м</span></div>
            </div>
          )}
        </div>

        {/* Калитка */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Калитка</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(WICKET_PRICES) as [WicketType, typeof WICKET_PRICES[WicketType]][]).map(([v, { label, price }]) => (
              <button
                key={v}
                onClick={() => setCalc({ ...calc, wicketType: v })}
                className={`px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  calc.wicketType === v
                    ? "bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25"
                    : "bg-[#1a1f2e] border border-[#1e2230] text-white/70 hover:border-orange-500/50 hover:text-white"
                }`}
              >
                <div className="font-semibold text-xs leading-tight">{label}</div>
                {price > 0 && <div className={`text-xs mt-0.5 ${calc.wicketType === v ? "text-gray-900/70" : "text-white/35"}`}>{(price / 1000).toFixed(1)}к ₽</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Доп опции */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-3">Дополнительные работы</label>
          <div className="space-y-3">
            {([
              { key: "installation", label: "Монтаж под ключ", desc: `+35% от стоимости материалов (~${fmt(materialsTotal * INSTALL_RATE)})` },
              { key: "painting",     label: "Порошковая покраска", desc: `${PAINT_PRICE} ₽/м² · RAL любой цвет (~${fmt(fenceArea * PAINT_PRICE)})` },
              { key: "automation",   label: "Автоматика ворот",
                desc: calc.gateType !== "none" ? `Привод DoorHan / Nice — ${AUTO_PRICE.toLocaleString("ru-RU")} ₽` : "Сначала выберите ворота" },
            ] as { key: keyof CalcState; label: string; desc: string }[]).map(({ key, label, desc }) => {
              const disabled = key === "automation" && calc.gateType === "none";
              return (
                <label key={key} className={`flex items-start gap-3 cursor-pointer group ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
                  <div
                    onClick={() => !disabled && setCalc({ ...calc, [key]: !calc[key] })}
                    className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all ${
                      calc[key]
                        ? "bg-orange-500 border-orange-500"
                        : "border-[#2a3040] group-hover:border-orange-500/50"
                    }`}
                  >
                    {calc[key] && <Icon name="Check" size={14} className="text-gray-900" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{label}</div>
                    <div className="text-xs text-white/40">{desc}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Правая колонка: результат ── */}
      <div className="flex flex-col">
        <div className="bg-[#0a0c10] border border-[#1e2230] rounded-2xl p-7 flex-1">
          <div className="section-tag mb-1">Предварительный расчёт</div>
          <div className="text-xs text-white/30 mb-5">Точная стоимость — после бесплатного замера на объекте</div>

          {/* Детализация */}
          <div className="space-y-0 mb-5">
            {lineItems.map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start py-2.5 border-b border-[#1a1f2e] gap-4">
                <span className="text-white/55 text-sm leading-tight">{label}</span>
                <span className="text-white font-medium text-sm whitespace-nowrap">{fmt(value)}</span>
              </div>
            ))}
          </div>

          {/* Итог */}
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-5 mb-5">
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="text-white/50 text-xs mb-1">Итого (ориентировочно)</div>
                <div className="stat-number">{fmt(total)}</div>
              </div>
              <div className="text-right">
                <div className="text-white/30 text-xs">Площадь забора</div>
                <div className="text-white font-oswald font-bold text-xl">{fenceArea} м²</div>
                <div className="text-white/30 text-xs mt-1">Столбов: {postCount} шт.</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-orange-500/15 text-white/30 text-xs">
              ⚠ Расчёт предварительный. Финальная цена может отличаться на 5–15% после обмера участка и уточнения конфигурации.
            </div>
          </div>

          <button className="btn-orange w-full py-4 rounded-xl text-base mb-3">
            Заказать бесплатный замер
          </button>
          <button className="btn-outline-orange w-full py-3 rounded-xl text-sm">
            Получить КП на email
          </button>
        </div>

        {/* Бонусы */}
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
  );
}

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".anim-ready");
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  useScrollReveal();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--dark-bg)" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e2230]"
        style={{ background: "rgba(13,15,20,0.92)", backdropFilter: "blur(16px)" }}>
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

            <div className="hidden lg:flex items-center gap-6">
              {NAV_ITEMS.map(({ id, label }) => (
                <button key={id} onClick={() => scrollTo(id)} className="nav-link text-sm">{label}</button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <a href="tel:+78001234567" className="flex items-center gap-2 text-orange-400 font-oswald font-medium hover:text-orange-300 transition-colors">
                <Icon name="Phone" size={15} />
                8 800 123-45-67
              </a>
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
          style={{ backgroundImage: `url(${HERO_IMG})`, opacity: 0.18 }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0f14] via-transparent to-[#0d0f14]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(249,115,22,0.13) 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-orange-400 text-sm font-medium">Производство с 2009 года · 15 лет опыта</span>
          </div>

          <h1 className="font-oswald font-bold text-5xl sm:text-6xl lg:text-8xl leading-none mb-6 tracking-tight">
            ЗАБОРЫ И ВОРОТА<br />
            <span className="text-orange-400">ИЗ МЕТАЛЛА</span>
          </h1>

          <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Производство и монтаж металлических ограждений любой сложности. Собственный завод, гарантия качества, доставка по всей России.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button className="btn-orange px-8 py-4 rounded-xl text-base w-full sm:w-auto" onClick={() => scrollTo("calculator")}>
              <span className="flex items-center gap-2 justify-center">
                <Icon name="Calculator" size={18} />
                Рассчитать стоимость
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

      {/* О ПРОИЗВОДСТВЕ */}
      <section id="about" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="anim-ready">
              <span className="section-tag">О производстве</span>
              <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-white mb-2 leading-tight">
                СОБСТВЕННЫЙ ЗАВОД<br /><span className="text-orange-400">В МОСКВЕ</span>
              </h2>
              <div className="orange-line mb-6" />
              <p className="text-white/60 leading-relaxed mb-5">
                Компания «СтальГрупп» — полный цикл производства металлических заборов, ворот и ограждений. Наш завод площадью 3 500 м² оснащён современным оборудованием: плазменная резка, гибка, сварочные линии и собственная камера порошковой покраски (палитра RAL, 200+ цветов).
              </p>
              <p className="text-white/60 leading-relaxed mb-8">
                Работаем напрямую без посредников — это позволяет держать цены ниже рыночных и контролировать каждый этап производства от заготовки до монтажа на объекте.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "Factory",  title: "Собственный завод",  desc: "3 500 м² производственных площадей" },
                  { icon: "Users",    title: "80 сотрудников",     desc: "Опытные технологи и монтажники" },
                  { icon: "Award",    title: "Сертификаты ИСО",   desc: "Международный стандарт качества" },
                  { icon: "MapPin",   title: "Москва и МО",        desc: "Выезд на замер в день обращения" },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="bg-[#141720] border border-[#1e2230] rounded-xl p-4 hover:border-orange-500/30 transition-colors">
                    <Icon name={icon} size={22} className="text-orange-400 mb-2" />
                    <div className="font-medium text-white text-sm mb-0.5">{title}</div>
                    <div className="text-white/40 text-xs">{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="anim-ready relative" style={{ transitionDelay: "0.15s" }}>
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                <img src={HERO_IMG} alt="Производство" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#0d0f14]/60 to-transparent" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-orange-500 text-gray-900 rounded-xl p-4 font-oswald font-bold shadow-xl shadow-orange-500/30">
                <div className="text-3xl">1 200+</div>
                <div className="text-sm font-normal opacity-80">объектов сдано</div>
              </div>
              <div className="absolute -top-4 -right-4 bg-[#141720] border border-[#1e2230] rounded-xl p-3 text-center shadow-xl">
                <div className="font-oswald font-bold text-2xl text-white">5 лет</div>
                <div className="text-xs text-white/50">гарантия</div>
              </div>
            </div>
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
            <p className="text-white/50 max-w-xl mx-auto">Производим весь спектр металлических ограждений и ворот. Цены актуальны на 2026 год.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCTS.map(({ icon, title, desc, price, badge }, i) => (
              <div key={title} className="product-card rounded-2xl p-6 anim-ready relative" style={{ transitionDelay: `${i * 0.07}s` }}>
                {badge && (
                  <div className="absolute top-4 right-4 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold font-oswald px-2 py-1 rounded tracking-wider uppercase">
                    {badge}
                  </div>
                )}
                <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Icon name={icon} size={22} className="text-orange-400" />
                </div>
                <h3 className="font-oswald font-semibold text-xl text-white mb-2">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-4">{desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-orange-400 font-oswald font-bold text-lg">{price}</span>
                  <button className="text-white/40 hover:text-orange-400 transition-colors text-sm flex items-center gap-1">
                    Подробнее <Icon name="ArrowRight" size={14} />
                  </button>
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
            {PORTFOLIO_ITEMS.map(({ title, tag }, i) => (
              <div key={title} className="portfolio-item anim-ready"
                style={{ height: i === 0 || i === 5 ? "320px" : "220px", transitionDelay: `${i * 0.07}s` }}>
                <img src={PORTFOLIO_IMG} alt={title} />
                <div className="portfolio-overlay">
                  <div>
                    <div className="inline-block bg-orange-500 text-gray-900 text-xs font-bold font-oswald px-2 py-1 rounded mb-2 uppercase tracking-wider">
                      {tag}
                    </div>
                    <div className="text-white font-semibold text-base">{title}</div>
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
            {SERVICES.map(({ icon, title, desc }, i) => (
              <div key={title}
                className="group bg-[#141720] border border-[#1e2230] hover:border-orange-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 anim-ready"
                style={{ transitionDelay: `${i * 0.07}s` }}>
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                  <Icon name={icon} size={20} className="text-orange-400" />
                </div>
                <h3 className="font-oswald font-semibold text-lg text-white mb-2">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* КАЛЬКУЛЯТОР */}
      <section id="calculator" className="py-24 grid-pattern relative">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(249,115,22,0.06) 0%, transparent 70%)" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-14 anim-ready">
            <span className="section-tag">Калькулятор</span>
            <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-white mb-3">
              РАССЧИТАЙТЕ <span className="text-orange-400">СТОИМОСТЬ</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Интерактивный расчёт с актуальными ценами 2026 года — материалы, столбы, фундамент, ворота, калитка, монтаж
            </p>
          </div>
          <div className="bg-[#141720] border border-[#1e2230] rounded-3xl p-8 anim-ready">
            <Calculator />
          </div>
        </div>
      </section>

      {/* ДОСТАВКА */}
      <section id="delivery" className="py-24 bg-[#0a0c10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="anim-ready">
              <span className="section-tag">Доставка</span>
              <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-white mb-2">
                ДОСТАВИМ <span className="text-orange-400">ПО ВСЕЙ</span><br />РОССИИ
              </h2>
              <div className="orange-line mb-6" />
              <p className="text-white/60 leading-relaxed mb-8">
                Собственный автопарк из 12 грузовых автомобилей обеспечивает доставку по Москве и МО в день заказа. По всей России — транспортными компаниями с упаковкой и страхованием груза.
              </p>
              <div className="space-y-4">
                {[
                  { icon: "Truck",      title: "Москва и МО",        desc: "Доставка в день заказа. Бесплатно при заказе от 60 000 ₽" },
                  { icon: "Globe",      title: "По всей России",      desc: "3–10 дней. СДЭК, ПЭК, Деловые Линии — по тарифу ТК" },
                  { icon: "Package",    title: "Упаковка и страховка", desc: "Металлические конструкции надёжно упакованы, груз застрахован" },
                  { icon: "PhoneCall", title: "Сопровождение",       desc: "Менеджер уведомляет об отгрузке и статусе в режиме реального времени" },
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
              </div>
            </div>
            <div className="anim-ready" style={{ transitionDelay: "0.1s" }}>
              <div className="bg-[#141720] border border-[#1e2230] rounded-3xl p-8">
                <div className="font-oswald font-bold text-2xl text-white mb-6">Стоимость доставки</div>
                <div className="space-y-3">
                  {[
                    { region: "Москва в пределах МКАД",     price: "Бесплатно", highlight: true },
                    { region: "Московская область (до 50 км)", price: "от 3 500 ₽" },
                    { region: "МО (50–100 км от МКАД)",      price: "от 6 000 ₽" },
                    { region: "ЦФО и соседние регионы",      price: "от 8 000 ₽" },
                    { region: "По России (ТК)",              price: "по тарифу ТК" },
                    { region: "Выезд монтажной бригады",     price: "от 1 500 ₽/день" },
                  ].map(({ region, price, highlight }) => (
                    <div key={region}
                      className={`flex justify-between items-center py-3 px-4 rounded-xl ${highlight ? "bg-orange-500/10 border border-orange-500/30" : "border border-[#1e2230]"}`}>
                      <span className="text-sm text-white/70">{region}</span>
                      <span className={`font-oswald font-bold ${highlight ? "text-orange-400" : "text-white"}`}>{price}</span>
                    </div>
                  ))}
                </div>
                <button className="btn-orange w-full py-4 rounded-xl mt-6">Рассчитать доставку</button>
              </div>
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
              { years: "3", label: "года", title: "На покраску",    desc: "Порошковое покрытие не отслоится, не потрескается, сохранит яркость цвета" },
              { years: "2", label: "года", title: "На монтаж",      desc: "Если геометрия нарушится — исправим бесплатно в удобное для вас время" },
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
                  { icon: "Phone",  title: "Телефон",       value: "8 800 123-45-67",         sub: "Бесплатно, пн–сб 8:00–20:00", href: "tel:+78001234567" },
                  { icon: "Mail",   title: "Email",         value: "info@stalgrupp.ru",        sub: "Ответим в течение часа",       href: "mailto:info@stalgrupp.ru" },
                  { icon: "MapPin", title: "Адрес",         value: "Москва, ул. Промышленная, 12", sub: "Производство и шоурум" },
                  { icon: "Clock",  title: "Режим работы",  value: "Пн–Сб: 8:00 – 20:00",    sub: "Воскресенье: по записи" },
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
                    <Icon name={icon} size={15} />
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
                    { placeholder: "Ваше имя", type: "text" },
                    { placeholder: "Телефон", type: "tel" },
                    { placeholder: "Email", type: "email" },
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
      <footer className="border-t border-[#1e2230] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
                <Icon name="Fence" size={15} className="text-gray-900" />
              </div>
              <div className="font-oswald font-bold text-white">СТАЛЬ<span className="text-orange-400">ГРУПП</span></div>
            </div>
            <div className="text-white/25 text-xs text-center">© 2009–2026 СтальГрупп. Производство металлических заборов и ворот.</div>
            <div className="flex gap-4">
              {["Политика", "Реквизиты"].map(item => (
                <button key={item} className="text-white/30 hover:text-white/60 text-xs transition-colors">{item}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
