import { useState, useEffect, useRef } from "react";
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

const PRODUCTS = [
  { icon: "Fence", title: "Заборы из профнастила", desc: "Надёжная защита и современный вид. Срок службы от 25 лет.", price: "от 850 ₽/м²" },
  { icon: "Columns2", title: "Кованые заборы", desc: "Художественная ковка по индивидуальным эскизам. Классика на века.", price: "от 3 200 ₽/м²" },
  { icon: "PanelTop", title: "3D-заборы", desc: "Сварные секции из прутков 4–6 мм. Антивандальные и прочные.", price: "от 1 200 ₽/м²" },
  { icon: "DoorOpen", title: "Откатные ворота", desc: "Автоматические откатные ворота с электроприводом.", price: "от 28 000 ₽" },
  { icon: "Minus", title: "Распашные ворота", desc: "Классические распашные ворота с возможностью автоматизации.", price: "от 18 000 ₽" },
  { icon: "LayoutGrid", title: "Заборы из сетки-рабицы", desc: "Бюджетное решение для дачного участка.", price: "от 380 ₽/м²" },
];

const SERVICES = [
  { icon: "Ruler", title: "Замер и проектирование", desc: "Бесплатный выезд специалиста, составление точного проекта и сметы." },
  { icon: "Hammer", title: "Монтаж под ключ", desc: "Профессиональная установка с гарантией качества работ." },
  { icon: "Paintbrush", title: "Покраска и обработка", desc: "Порошковое покрытие и антикоррозийная обработка металла." },
  { icon: "Wrench", title: "Ремонт и обслуживание", desc: "Ремонт существующих конструкций любой сложности." },
  { icon: "Zap", title: "Автоматизация ворот", desc: "Установка электроприводов ведущих мировых брендов." },
  { icon: "Shield", title: "Гарантийное обслуживание", desc: "Бесплатное обслуживание в течение гарантийного срока." },
];

const PORTFOLIO_ITEMS = [
  { title: "Кованые ворота в Подмосковье", tag: "Ворота" },
  { title: "Забор из профнастила, 120 м", tag: "Забор" },
  { title: "3D-ограждение промзоны", tag: "Промышленный" },
  { title: "Откатные ворота с автоматикой", tag: "Автоматика" },
  { title: "Загородный участок, комплекс", tag: "Под ключ" },
  { title: "Секционные ворота гаража", tag: "Гараж" },
];

type FenceType = "profnastil" | "3d" | "kovka" | "setka";
type GateType = "otkатные" | "raspashnye" | "none";

interface CalcState {
  fenceType: FenceType;
  fenceLength: number;
  fenceHeight: number;
  gateType: GateType;
  gateWidth: number;
  installation: boolean;
  painting: boolean;
  automation: boolean;
}

const FENCE_PRICES: Record<FenceType, number> = {
  profnastil: 950,
  "3d": 1350,
  kovka: 3500,
  setka: 420,
};

const GATE_PRICES: Record<GateType, number> = {
  "otkатные": 35000,
  raspashnye: 22000,
  none: 0,
};

function Calculator() {
  const [calc, setCalc] = useState<CalcState>({
    fenceType: "profnastil",
    fenceLength: 30,
    fenceHeight: 2,
    gateType: "none",
    gateWidth: 4,
    installation: true,
    painting: false,
    automation: false,
  });

  const fenceArea = calc.fenceLength * calc.fenceHeight;
  const fenceCost = fenceArea * FENCE_PRICES[calc.fenceType];
  const gateCost = calc.gateType !== "none" ? GATE_PRICES[calc.gateType] + (calc.gateType === "otkатные" ? calc.gateWidth * 1800 : calc.gateWidth * 1200) : 0;
  const installationCost = calc.installation ? (fenceCost + gateCost) * 0.3 : 0;
  const paintingCost = calc.painting ? fenceArea * 180 : 0;
  const automationCost = calc.automation && calc.gateType !== "none" ? 18000 : 0;
  const total = fenceCost + gateCost + installationCost + paintingCost + automationCost;

  const fmt = (n: number) => n.toLocaleString("ru-RU") + " ₽";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Controls */}
      <div className="space-y-6">
        {/* Тип забора */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Тип забора</label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { v: "profnastil", label: "Профнастил" },
              { v: "3d", label: "3D-забор" },
              { v: "kovka", label: "Ковка" },
              { v: "setka", label: "Сетка-рабица" },
            ] as { v: FenceType; label: string }[]).map(({ v, label }) => (
              <button
                key={v}
                onClick={() => setCalc({ ...calc, fenceType: v })}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  calc.fenceType === v
                    ? "bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/30"
                    : "bg-[#1a1f2e] border border-[#1e2230] text-white/70 hover:border-orange-500/50 hover:text-white"
                }`}
                style={{ fontFamily: "'Golos Text', sans-serif" }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Длина забора */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-white/70">Длина забора</label>
            <span className="text-orange-400 font-bold font-oswald text-lg">{calc.fenceLength} м</span>
          </div>
          <input
            type="range" min={5} max={200} step={1}
            value={calc.fenceLength}
            onChange={e => setCalc({ ...calc, fenceLength: +e.target.value })}
          />
          <div className="flex justify-between text-xs text-white/30 mt-1">
            <span>5 м</span><span>200 м</span>
          </div>
        </div>

        {/* Высота */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-white/70">Высота забора</label>
            <span className="text-orange-400 font-bold font-oswald text-lg">{calc.fenceHeight.toFixed(1)} м</span>
          </div>
          <input
            type="range" min={1} max={3} step={0.5}
            value={calc.fenceHeight}
            onChange={e => setCalc({ ...calc, fenceHeight: +e.target.value })}
          />
          <div className="flex justify-between text-xs text-white/30 mt-1">
            <span>1 м</span><span>3 м</span>
          </div>
        </div>

        {/* Ворота */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Ворота</label>
          <select
            value={calc.gateType}
            onChange={e => setCalc({ ...calc, gateType: e.target.value as GateType })}
            className="select-field"
          >
            <option value="none">Без ворот</option>
            <option value="otkатные">Откатные ворота</option>
            <option value="raspashnye">Распашные ворота</option>
          </select>
        </div>

        {calc.gateType !== "none" && (
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-white/70">Ширина проёма</label>
              <span className="text-orange-400 font-bold font-oswald text-lg">{calc.gateWidth} м</span>
            </div>
            <input
              type="range" min={2} max={8} step={0.5}
              value={calc.gateWidth}
              onChange={e => setCalc({ ...calc, gateWidth: +e.target.value })}
            />
            <div className="flex justify-between text-xs text-white/30 mt-1">
              <span>2 м</span><span>8 м</span>
            </div>
          </div>
        )}

        {/* Опции */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-3">Дополнительно</label>
          <div className="space-y-3">
            {[
              { key: "installation", label: "Монтаж под ключ", desc: "+30% к стоимости материалов" },
              { key: "painting", label: "Порошковая покраска", desc: "180 ₽/м²" },
              { key: "automation", label: "Автоматизация ворот", desc: "+18 000 ₽ (при наличии ворот)" },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer group">
                <div
                  onClick={() => setCalc({ ...calc, [key]: !calc[key as keyof CalcState] })}
                  className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all ${
                    calc[key as keyof CalcState]
                      ? "bg-orange-500 border-orange-500"
                      : "border-[#2a3040] group-hover:border-orange-500/50"
                  }`}
                >
                  {calc[key as keyof CalcState] && <Icon name="Check" size={14} className="text-gray-900" />}
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

      {/* Right: Result */}
      <div className="flex flex-col">
        <div className="bg-[#0a0c10] border border-[#1e2230] rounded-2xl p-8 flex-1">
          <div className="section-tag mb-4">Расчёт стоимости</div>

          <div className="space-y-3 mb-6">
            {[
              { label: `Забор (${fenceArea} м²)`, value: fenceCost },
              ...(gateCost > 0 ? [{ label: "Ворота", value: gateCost }] : []),
              ...(installationCost > 0 ? [{ label: "Монтаж", value: installationCost }] : []),
              ...(paintingCost > 0 ? [{ label: "Покраска", value: paintingCost }] : []),
              ...(automationCost > 0 ? [{ label: "Автоматизация", value: automationCost }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-[#1a1f2e]">
                <span className="text-white/60 text-sm">{label}</span>
                <span className="text-white font-medium">{fmt(value)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-orange-500/30 pt-6">
            <div className="text-white/50 text-sm mb-1">Итоговая стоимость</div>
            <div className="stat-number mb-1">{fmt(Math.round(total / 100) * 100)}</div>
            <div className="text-white/30 text-xs">*Предварительный расчёт. Точная стоимость — после замера.</div>
          </div>

          <button className="btn-orange w-full py-4 rounded-xl mt-6 text-base">
            Заказать бесплатный замер
          </button>
          <button className="btn-outline-orange w-full py-3 rounded-xl mt-3 text-sm">
            Получить коммерческое предложение
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { icon: "Clock", text: "Замер за 1 день" },
            { icon: "Truck", text: "Доставка по РФ" },
            { icon: "ShieldCheck", text: "Гарантия 5 лет" },
          ].map(({ icon, text }) => (
            <div key={text} className="bg-[#141720] border border-[#1e2230] rounded-xl p-3 text-center">
              <Icon name={icon} size={20} className="text-orange-400 mx-auto mb-1" />
              <div className="text-xs text-white/60 leading-tight">{text}</div>
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
      { threshold: 0.12 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  useScrollReveal();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--dark-bg)" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e2230]" style={{ background: "rgba(13,15,20,0.92)", backdropFilter: "blur(16px)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Icon name="Fence" size={18} className="text-gray-900" />
              </div>
              <div>
                <div className="font-oswald font-bold text-white text-lg leading-none tracking-wider">СТАЛЬ<span className="text-orange-400">ГРУПП</span></div>
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
                <Icon name="Phone" size={16} />
                8 800 123-45-67
              </a>
              <button className="btn-orange px-5 py-2 rounded-lg text-sm" onClick={() => scrollTo("calculator")}>
                Рассчитать стоимость
              </button>
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-white/70 hover:text-white transition-colors">
              <Icon name={menuOpen ? "X" : "Menu"} size={24} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-[#1e2230] bg-[#0d0f14] px-4 py-4 space-y-1">
            {NAV_ITEMS.map(({ id, label }) => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left py-2 px-3 rounded text-white/70 hover:text-white hover:bg-[#141720] transition-all text-sm">
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
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMG})`, opacity: 0.2 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0f14] via-transparent to-[#0d0f14]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(249,115,22,0.12) 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-orange-400 text-sm font-medium">Производство с 2009 года • 15 лет опыта</span>
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
              { num: "15", label: "Лет на рынке" },
              { num: "5 лет", label: "Гарантия" },
              { num: "1 день", label: "Бесплатный замер" },
            ].map(({ num, label }) => (
              <div key={label} className="bg-[#141720]/80 border border-[#1e2230] rounded-xl p-4">
                <div className="font-oswald font-bold text-2xl text-orange-400 mb-0.5">{num}</div>
                <div className="text-white/50 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-bounce">
          <Icon name="ChevronDown" size={20} />
        </div>
      </section>

      {/* О ПРОИЗВОДСТВЕ */}
      <section id="about" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="anim-ready">
              <span className="section-tag">О производстве</span>
              <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-white mb-2 leading-tight">
                СОБСТВЕННЫЙ ЗАВОД<br /><span className="text-orange-400">В МОСКВЕ</span>
              </h2>
              <div className="orange-line mb-6" />
              <p className="text-white/60 leading-relaxed mb-6">
                Компания «СтальГрупп» — полный цикл производства металлических заборов, ворот и ограждений. Наш завод площадью 3 500 м² оснащён современным оборудованием: плазменная резка, гибка, сварочные линии и порошковая покраска.
              </p>
              <p className="text-white/60 leading-relaxed mb-8">
                Работаем напрямую без посредников — это позволяет держать цены ниже рыночных и контролировать каждый этап производства от заготовки до монтажа.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "Factory", title: "Собственный завод", desc: "3 500 м² производственных площадей" },
                  { icon: "Users", title: "80 сотрудников", desc: "Опытные технологи и монтажники" },
                  { icon: "Award", title: "Сертификаты ИСО", desc: "Международный стандарт качества" },
                  { icon: "MapPin", title: "Москва и МО", desc: "Выезд на замер в день обращения" },
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
            <p className="text-white/50 max-w-xl mx-auto">Производим весь спектр металлических ограждений и ворот по заказу и из стока</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCTS.map(({ icon, title, desc, price }, i) => (
              <div key={title} className="product-card rounded-2xl p-6 anim-ready" style={{ transitionDelay: `${i * 0.07}s` }}>
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
            <button className="btn-outline-orange px-6 py-3 rounded-xl text-sm anim-ready">
              Все проекты
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PORTFOLIO_ITEMS.map(({ title, tag }, i) => (
              <div
                key={title}
                className="portfolio-item anim-ready"
                style={{ height: i === 0 || i === 5 ? "320px" : "220px", transitionDelay: `${i * 0.07}s` }}
              >
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
              <div key={title} className="group bg-[#141720] border border-[#1e2230] hover:border-orange-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 anim-ready" style={{ transitionDelay: `${i * 0.07}s` }}>
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
            <p className="text-white/50 max-w-xl mx-auto">Интерактивный расчёт за 30 секунд. Двигайте ползунки — результат обновляется мгновенно</p>
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
                  { icon: "Truck", title: "Москва и МО", desc: "Доставка в день заказа, бесплатно от 50 000 ₽" },
                  { icon: "Globe", title: "По всей России", desc: "3–10 дней, ТК СДЭК / ПЭК / Деловые линии" },
                  { icon: "Package", title: "Упаковка и страховка", desc: "Металлические изделия надёжно упакованы" },
                  { icon: "PhoneCall", title: "Сопровождение", desc: "Менеджер уведомляет о статусе доставки" },
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
                    { region: "Москва в пределах МКАД", price: "Бесплатно", highlight: true },
                    { region: "Московская область", price: "от 2 500 ₽" },
                    { region: "ЦФО (до 500 км)", price: "от 5 000 ₽" },
                    { region: "По России (ТК)", price: "по тарифу ТК" },
                    { region: "Монтажная бригада", price: "от 1 200 ₽/день" },
                  ].map(({ region, price, highlight }) => (
                    <div key={region} className={`flex justify-between items-center py-3 px-4 rounded-xl ${highlight ? "bg-orange-500/10 border border-orange-500/30" : "border border-[#1e2230]"}`}>
                      <span className="text-sm text-white/70">{region}</span>
                      <span className={`font-oswald font-bold ${highlight ? "text-orange-400" : "text-white"}`}>{price}</span>
                    </div>
                  ))}
                </div>
                <button className="btn-orange w-full py-4 rounded-xl mt-6">
                  Рассчитать доставку
                </button>
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
              { years: "3", label: "года", title: "На покраску", desc: "Порошковое покрытие не отслоится, не потрескается, сохранит яркость цвета" },
              { years: "2", label: "года", title: "На монтаж", desc: "Если геометрия нарушится — исправим бесплатно в удобное для вас время" },
            ].map(({ years, label, title, desc }, i) => (
              <div key={title} className="anim-ready bg-[#141720] border border-[#1e2230] hover:border-orange-500/40 rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-2" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="font-oswald font-bold text-7xl text-orange-400 leading-none mb-1">{years}</div>
                <div className="font-oswald text-xl text-white/40 mb-4">{label}</div>
                <h3 className="font-oswald font-bold text-xl text-white mb-3">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-ready">
            {[
              { icon: "FileText", title: "Договор", desc: "Все условия гарантии прописаны в договоре" },
              { icon: "Phone", title: "Быстрый ответ", desc: "Реакция на гарантийное обращение за 24 часа" },
              { icon: "Wrench", title: "Свои мастера", desc: "Ремонт выполняют те же специалисты" },
              { icon: "Repeat", title: "Замена", desc: "При невозможности ремонта — полная замена" },
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
                  { icon: "Phone", title: "Телефон", value: "8 800 123-45-67", sub: "Бесплатно, пн–сб 8:00–20:00", href: "tel:+78001234567" },
                  { icon: "Mail", title: "Email", value: "info@stalgrupp.ru", sub: "Ответим в течение часа", href: "mailto:info@stalgrupp.ru" },
                  { icon: "MapPin", title: "Адрес", value: "Москва, ул. Промышленная, 12", sub: "Производство и шоурум" },
                  { icon: "Clock", title: "Режим работы", value: "Пн–Сб: 8:00 – 20:00", sub: "Воскресенье: по записи" },
                ].map(({ icon, title, value, sub, href }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon name={icon} size={18} className="text-orange-400" />
                    </div>
                    <div>
                      <div className="text-white/40 text-xs mb-0.5">{title}</div>
                      {href ? (
                        <a href={href} className="text-white font-medium hover:text-orange-400 transition-colors">{value}</a>
                      ) : (
                        <div className="text-white font-medium">{value}</div>
                      )}
                      <div className="text-white/30 text-xs">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                {[
                  { icon: "MessageCircle", label: "WhatsApp" },
                  { icon: "Send", label: "Telegram" },
                  { icon: "Phone", label: "Позвонить" },
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
                    <input
                      key={placeholder}
                      type={type}
                      placeholder={placeholder}
                      className="select-field"
                    />
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
            <div className="text-white/25 text-xs text-center">
              © 2009–2026 СтальГрупп. Производство металлических заборов и ворот.
            </div>
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
