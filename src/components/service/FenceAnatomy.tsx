import Icon from "@/components/ui/icon";

interface FenceAnatomyProps {
  variant?: "profnastil" | "shtaketnik" | "mesh3d" | "rabitsa" | "kovka";
}

export default function FenceAnatomy({ variant = "profnastil" }: FenceAnatomyProps) {
  const cfg = CONFIGS[variant];

  return (
    <section className="py-20" id="fence-anatomy">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="section-tag">Конструкция</span>
          <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-white mb-3">
            АНАТОМИЯ <span className="text-orange-400">СЕКЦИИ</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-sm">
            Каждый элемент рассчитан по СП 20.13330.2016 «Нагрузки и
            воздействия» — ветровая нагрузка для I района Московской области
            23 кгс/м². Никакой «бытовщины» — только заводские профили.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* SVG */}
          <div className="lg:col-span-3 bg-[#141720] border border-[#1e2230] rounded-3xl p-6">
            <FenceSVG variant={variant} />
          </div>

          {/* Список элементов */}
          <div className="lg:col-span-2 space-y-3">
            {cfg.parts.map((part, i) => (
              <div
                key={i}
                className="bg-[#141720] border border-[#1e2230] rounded-2xl p-4 hover:border-orange-500/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-500 text-gray-900 rounded-lg font-oswald font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <div className="font-oswald font-semibold text-white text-base">
                        {part.name}
                      </div>
                      <div className="text-orange-400 text-[11px] font-oswald whitespace-nowrap">
                        {part.spec}
                      </div>
                    </div>
                    <div className="text-white/55 text-xs leading-relaxed">
                      {part.desc}
                    </div>
                    {part.gost && (
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-white/35">
                        <Icon name="FileCheck" size={11} className="text-orange-400/60" />
                        {part.gost}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Шаг столбов */}
        <div className="mt-8 bg-[#0a0c10] border border-[#1e2230] rounded-3xl p-6">
          <div className="flex items-start gap-3 mb-5">
            <Icon name="Wind" size={22} className="text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-oswald font-bold text-white text-xl mb-1">
                Шаг столбов под ветровую нагрузку
              </h3>
              <p className="text-white/50 text-xs">
                Расчёт по СП 20.13330.2016 для I ветрового района МО (W₀ = 23 кгс/м²).
                Превышать шаг нельзя — забор «парусит» и расшатывается.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-[#1e2230]">
                  <th className="text-left py-3 px-3 text-white/45 font-medium text-xs uppercase tracking-wider">
                    Высота забора
                  </th>
                  <th className="text-center py-3 px-3 text-white/45 font-medium text-xs uppercase tracking-wider">
                    Столб
                  </th>
                  <th className="text-center py-3 px-3 text-white/45 font-medium text-xs uppercase tracking-wider">
                    Лаги
                  </th>
                  <th className="text-center py-3 px-3 text-orange-400 font-medium text-xs uppercase tracking-wider">
                    Шаг
                  </th>
                  <th className="text-center py-3 px-3 text-white/45 font-medium text-xs uppercase tracking-wider">
                    Заглубление
                  </th>
                </tr>
              </thead>
              <tbody>
                {cfg.windTable.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#1a1f2e] hover:bg-[#141720]/40 transition-colors"
                  >
                    <td className="py-3 px-3 text-white font-medium">{r.height}</td>
                    <td className="py-3 px-3 text-center text-white/70 font-oswald text-xs">
                      {r.post}
                    </td>
                    <td className="py-3 px-3 text-center text-white/70 font-oswald text-xs">
                      {r.lag}
                    </td>
                    <td className="py-3 px-3 text-center text-orange-400 font-oswald font-bold">
                      {r.step}
                    </td>
                    <td className="py-3 px-3 text-center text-white/70 font-oswald text-xs">
                      {r.depth}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Fact icon="Gauge" label="Ветровое давление" value="23 кгс/м² (МО, I район)" />
            <Fact icon="ThermometerSnowflake" label="Промерзание грунта" value="1.4 м (МО)" />
            <Fact icon="FileCheck" label="Норматив" value="СП 20.13330.2016" />
          </div>
        </div>

        {/* Расходники */}
        <div className="mt-6 bg-[#141720] border border-[#1e2230] rounded-3xl p-6">
          <h3 className="font-oswald font-bold text-white text-xl mb-4 flex items-center gap-2">
            <Icon name="Package" size={20} className="text-orange-400" />
            Что входит в погонный метр
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cfg.consumables.map((c) => (
              <div
                key={c.name}
                className="bg-[#0a0c10] border border-[#1e2230] rounded-xl p-3"
              >
                <div className="text-orange-400 font-oswald font-bold text-lg">
                  {c.qty}
                </div>
                <div className="text-white text-xs font-medium mt-0.5">
                  {c.name}
                </div>
                <div className="text-white/40 text-[10px] mt-0.5 leading-tight">
                  {c.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Fact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-[#141720] border border-[#1e2230] rounded-xl px-4 py-3 flex items-center gap-3">
      <Icon name={icon} size={18} className="text-orange-400 flex-shrink-0" />
      <div>
        <div className="text-white/40 text-[10px] uppercase tracking-wider">
          {label}
        </div>
        <div className="text-white text-xs font-medium leading-tight mt-0.5">
          {value}
        </div>
      </div>
    </div>
  );
}

// ───────────────── КОНФИГУРАЦИИ ПО ТИПУ ЗАБОРА ─────────────────
type Cfg = {
  parts: { name: string; spec: string; desc: string; gost?: string }[];
  windTable: { height: string; post: string; lag: string; step: string; depth: string }[];
  consumables: { name: string; qty: string; detail: string }[];
};

const CONFIGS: Record<string, Cfg> = {
  profnastil: {
    parts: [
      { name: "Профлист", spec: "С8 / С20 0.5 мм", desc: "Оцинкованный, полимерное покрытие RAL. Толщина металла 0.45–0.5 мм, полимер 25 мкм.", gost: "ГОСТ Р 52146-2003" },
      { name: "Лага", spec: "40×20×2 мм", desc: "Профильная труба, оцинкованная. На высоту до 2 м — 2 лаги, выше — 3.", gost: "ГОСТ 30245-2003" },
      { name: "Столб", spec: "60×60×2 мм", desc: "Профильная труба с заглушкой сверху. Антикор-грунт + полимерная окраска.", gost: "ГОСТ 30245-2003" },
      { name: "Кронштейн", spec: "X-образный", desc: "Сварной крепёж лаги к столбу. Прорезь для регулировки по высоте 20 мм." },
      { name: "Крепёж", spec: "Саморез 4.8×35 кровельный", desc: "С EPDM-прокладкой в цвет RAL. 8 шт. на 1 м² профлиста." },
      { name: "Заглушка", spec: "Пластиковая ПВХ", desc: "Чёрная, в цвет или нержавейка. Защита от попадания воды в столб." },
    ],
    windTable: [
      { height: "1.5 м", post: "60×60×2", lag: "40×20×2 ×2", step: "2.5 м", depth: "1.2 м (бутование)" },
      { height: "1.8 м", post: "60×60×2", lag: "40×20×2 ×2", step: "2.5 м", depth: "1.4 м (бетон)" },
      { height: "2.0 м", post: "60×60×3", lag: "40×20×2 ×3", step: "2.5 м", depth: "1.4 м (бетон)" },
      { height: "2.5 м", post: "80×80×3", lag: "40×40×2 ×3", step: "2.0 м", depth: "1.5 м (бетон)" },
    ],
    consumables: [
      { name: "Профлист", qty: "1.0 м²", detail: "С8/С20, оцинковка + полимер" },
      { name: "Столб 60×60", qty: "0.4 шт", detail: "Шаг 2.5 м" },
      { name: "Лага 40×20", qty: "2 м", detail: "2 ряда" },
      { name: "Саморезы", qty: "8 шт", detail: "4.8×35 с EPDM" },
      { name: "Бетон М300", qty: "0.016 м³", detail: "На бетонирование" },
      { name: "Грунт + краска", qty: "0.1 кг", detail: "Антикор 2 слоя" },
      { name: "Кронштейн", qty: "0.8 шт", detail: "X-образный сварной" },
      { name: "Заглушка", qty: "0.4 шт", detail: "ПВХ или нерж." },
    ],
  },
  shtaketnik: {
    parts: [
      { name: "Штакетина", spec: "М/П/ПД 0.5 мм", desc: "Двусторонняя порошковая окраска. Высота 1.5–2.5 м, ширина 80–128 мм.", gost: "ГОСТ Р 52146-2003" },
      { name: "Лага", spec: "40×20×2 мм", desc: "Профтруба. Шахматка — 2 ряда, однорядная — 2 ряда.", gost: "ГОСТ 30245-2003" },
      { name: "Столб", spec: "60×60×2 мм", desc: "Профтруба с заглушкой. Антикор + порошок RAL." },
      { name: "Заклёпка / саморез", spec: "4.8×19 в цвет RAL", desc: "Заклёпочная сборка эстетичнее, саморез — быстрее. 2 точки на штакетину." },
      { name: "Планка завершения", spec: "П-образная", desc: "Закрывает торцы штакетин сверху. В цвет забора." },
      { name: "Заглушка столба", spec: "Полимер RAL", desc: "Защита трубы от осадков. Не выгорает." },
    ],
    windTable: [
      { height: "1.5 м", post: "60×60×2", lag: "40×20×2 ×2", step: "2.5 м", depth: "1.2 м (бутование)" },
      { height: "1.8 м", post: "60×60×2", lag: "40×20×2 ×2", step: "2.5 м", depth: "1.4 м (бетон)" },
      { height: "2.0 м", post: "60×60×3", lag: "40×20×2 ×3", step: "2.5 м", depth: "1.4 м (бетон)" },
      { height: "2.5 м", post: "80×80×3", lag: "40×40×2 ×3", step: "2.5 м", depth: "1.5 м (бетон)" },
    ],
    consumables: [
      { name: "Штакетина", qty: "16–22 шт", detail: "Зависит от просвета" },
      { name: "Столб 60×60", qty: "0.4 шт", detail: "Шаг 2.5 м" },
      { name: "Лага 40×20", qty: "2 м", detail: "2 ряда" },
      { name: "Заклёпка/саморез", qty: "32–44 шт", detail: "В цвет RAL" },
      { name: "Планка завершения", qty: "1 м", detail: "Защита торцов" },
      { name: "Бетон М300", qty: "0.016 м³", detail: "На столб" },
      { name: "Кронштейн", qty: "0.8 шт", detail: "X-образный" },
      { name: "Заглушка", qty: "0.4 шт", detail: "Полимер" },
    ],
  },
  mesh3d: {
    parts: [
      { name: "3D-секция", spec: "2.5×1.7 м", desc: "Прутки Ø5 мм, V-образные изгибы для жёсткости. Цинк + полимер.", gost: "ГОСТ 23279-2012" },
      { name: "Столб", spec: "60×40×2 мм", desc: "Профтруба с приваренными пластинами под крепёж секции." },
      { name: "Скоба-крепёж", spec: "Антивандальная", desc: "Болт с одной стороны, гайка под спецключ — не открутить." },
      { name: "Заглушка", spec: "Полимер RAL", desc: "Защита от воды." },
    ],
    windTable: [
      { height: "1.7 м", post: "60×40×2", lag: "—", step: "2.5 м", depth: "1.2 м" },
      { height: "2.0 м", post: "60×40×2", lag: "—", step: "2.5 м", depth: "1.4 м" },
      { height: "2.5 м", post: "60×60×2", lag: "—", step: "2.5 м", depth: "1.4 м" },
    ],
    consumables: [
      { name: "Секция 3D", qty: "0.4 шт", detail: "2.5×1.7 м" },
      { name: "Столб", qty: "0.4 шт", detail: "60×40×2" },
      { name: "Скоба", qty: "1.6 шт", detail: "Антивандал" },
      { name: "Бетон", qty: "0.012 м³", detail: "М300" },
      { name: "Грунт", qty: "0.05 кг", detail: "Антикор" },
      { name: "Заглушка", qty: "0.4 шт", detail: "ПВХ" },
      { name: "Болт нерж.", qty: "1.6 шт", detail: "М8" },
      { name: "Гайка спец.", qty: "1.6 шт", detail: "Антикража" },
    ],
  },
  rabitsa: {
    parts: [
      { name: "Сетка-рабица", spec: "Ø 2.0 мм, 50×50", desc: "Оцинкованная плетёная или с ПВХ-покрытием.", gost: "ГОСТ 5336-80" },
      { name: "Столб", spec: "60×40×2 мм", desc: "Профтруба или круглая Ø57×2.5 мм." },
      { name: "Натяжной трос", spec: "Ø 3 мм", desc: "Оцинкованный, по верху и низу — держит ровную линию." },
      { name: "Хомут / крюк", spec: "Сталь Ø 4 мм", desc: "Крепление сетки к тросу через каждые 30 см." },
    ],
    windTable: [
      { height: "1.5 м", post: "60×40×2", lag: "трос ×2", step: "3.0 м", depth: "0.8 м (бутование)" },
      { height: "1.8 м", post: "60×40×2", lag: "трос ×2", step: "3.0 м", depth: "1.0 м" },
      { height: "2.0 м", post: "60×40×2", lag: "трос ×2", step: "2.5 м", depth: "1.2 м" },
    ],
    consumables: [
      { name: "Рабица", qty: "1 м.п.", detail: "Оцинк/ПВХ" },
      { name: "Столб", qty: "0.33 шт", detail: "Шаг 3 м" },
      { name: "Трос Ø3", qty: "2 м", detail: "Верх+низ" },
      { name: "Хомут", qty: "3.3 шт", detail: "Шаг 30 см" },
      { name: "Бетон/щебень", qty: "0.008 м³", detail: "Бутование" },
      { name: "Грунт", qty: "0.04 кг", detail: "Антикор" },
      { name: "Натяжитель", qty: "0.1 шт", detail: "Талреп" },
      { name: "Заглушка", qty: "0.33 шт", detail: "ПВХ" },
    ],
  },
  kovka: {
    parts: [
      { name: "Прут кованый", spec: "12×12 / 14×14", desc: "Горячая ковка, ручная гибка. Завитки, пики, корзинки — по эскизу.", gost: "ГОСТ 535-2005" },
      { name: "Рама секции", spec: "Уголок 40×40×4", desc: "Сварная, под обвязку кованых элементов." },
      { name: "Столб", spec: "80×80×3 мм", desc: "Усиленный — несёт вес кованой секции (40–80 кг)." },
      { name: "Декор-элемент", spec: "Литой / кованый", desc: "Навершия столбов, шарообразные капители, львы." },
      { name: "Покрытие", spec: "2K грунт + патина", desc: "Двухкомпонентный антикор + декоративная патина (медь/золото/серебро)." },
    ],
    windTable: [
      { height: "1.8 м", post: "80×80×3", lag: "уголок 40×40", step: "2.5 м", depth: "1.4 м" },
      { height: "2.0 м", post: "80×80×3", lag: "уголок 40×40", step: "2.5 м", depth: "1.5 м (бетон)" },
      { height: "2.5 м", post: "100×100×4", lag: "уголок 50×50", step: "2.5 м", depth: "1.5 м (бетон)" },
    ],
    consumables: [
      { name: "Прут кованый", qty: "12–20 шт", detail: "На секцию 2.5 м" },
      { name: "Столб", qty: "0.4 шт", detail: "80×80×3" },
      { name: "Рама-уголок", qty: "5 м", detail: "Обвязка" },
      { name: "Декор-литьё", qty: "0.4 шт", detail: "Навершие" },
      { name: "Грунт 2K", qty: "0.15 кг", detail: "Антикор" },
      { name: "Патина", qty: "0.08 кг", detail: "Декор-краска" },
      { name: "Бетон М300", qty: "0.02 м³", detail: "Усиленный" },
      { name: "Сварной шов", qty: "8 м.п.", detail: "Ручная сварка" },
    ],
  },
};

// ───────────────── SVG-АНАТОМИЯ ─────────────────
function FenceSVG({ variant }: { variant: string }) {
  if (variant === "rabitsa") return <SvgRabitsa />;
  if (variant === "mesh3d") return <SvgMesh3D />;
  if (variant === "shtaketnik") return <SvgShtaketnik />;
  if (variant === "kovka") return <SvgKovka />;
  return <SvgProfnastil />;
}

const NUM_BADGE = (n: number, x: number, y: number) => (
  <g>
    <circle cx={x} cy={y} r="9" fill="#f97316" />
    <text
      x={x}
      y={y + 3.5}
      textAnchor="middle"
      fontSize="10"
      fontWeight="bold"
      fill="#0a0c10"
      fontFamily="sans-serif"
    >
      {n}
    </text>
  </g>
);

function SvgFrame({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 400 300"
      className="w-full h-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Земля */}
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0a0c10" />
          <stop offset="100%" stopColor="#141720" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="230" fill="url(#sky)" />
      <rect x="0" y="230" width="400" height="70" fill="#2a1f12" />
      <line
        x1="0"
        y1="230"
        x2="400"
        y2="230"
        stroke="#f97316"
        strokeWidth="0.6"
        strokeDasharray="3,2"
      />
      {children}
    </svg>
  );
}

function SvgProfnastil() {
  return (
    <SvgFrame>
      {/* Столбы */}
      <rect x="60" y="60" width="9" height="200" fill="#475569" />
      <rect x="58" y="56" width="13" height="5" fill="#94a3b8" />
      <rect x="330" y="60" width="9" height="200" fill="#475569" />
      <rect x="328" y="56" width="13" height="5" fill="#94a3b8" />
      {/* Лаги */}
      <rect x="69" y="100" width="261" height="5" fill="#64748b" />
      <rect x="69" y="200" width="261" height="5" fill="#64748b" />
      {/* Профлист */}
      {[...Array(11)].map((_, i) => {
        const x = 75 + i * 24;
        return (
          <g key={i}>
            <rect x={x} y="70" width="22" height="160" fill="#10b981" opacity="0.85" />
            <rect x={x + 9} y="70" width="4" height="160" fill="#059669" />
          </g>
        );
      })}
      {/* Заглушка */}
      <circle cx="64.5" cy="58" r="3" fill="#0a0c10" />
      <circle cx="334.5" cy="58" r="3" fill="#0a0c10" />
      {/* Кронштейны */}
      <path
        d="M 69 100 L 75 95 L 75 105 Z"
        fill="#fbbf24"
      />
      <path
        d="M 330 100 L 324 95 L 324 105 Z"
        fill="#fbbf24"
      />
      {/* Саморезы */}
      {[100, 200].map((y) =>
        [85, 110, 135, 160, 185, 210, 235, 260, 285, 310].map((x) => (
          <circle key={`${x}-${y}`} cx={x} cy={y + 2.5} r="1.5" fill="#0a0c10" />
        ))
      )}
      {/* Номера элементов */}
      {NUM_BADGE(1, 200, 150)}
      {NUM_BADGE(2, 50, 102)}
      {NUM_BADGE(3, 50, 60)}
      {NUM_BADGE(4, 80, 100)}
      {NUM_BADGE(5, 130, 200)}
      {NUM_BADGE(6, 65, 50)}
      {/* Размер шага */}
      <line x1="64.5" y1="275" x2="334.5" y2="275" stroke="#22d3ee" strokeWidth="0.5" />
      <line x1="64.5" y1="270" x2="64.5" y2="280" stroke="#22d3ee" strokeWidth="0.5" />
      <line x1="334.5" y1="270" x2="334.5" y2="280" stroke="#22d3ee" strokeWidth="0.5" />
      <text x="190" y="290" fontSize="9" fill="#22d3ee" textAnchor="middle" fontFamily="sans-serif">
        Шаг 2.5 м
      </text>
    </SvgFrame>
  );
}

function SvgShtaketnik() {
  return (
    <SvgFrame>
      {/* Столбы */}
      <rect x="60" y="60" width="9" height="200" fill="#475569" />
      <rect x="58" y="56" width="13" height="5" fill="#94a3b8" />
      <rect x="330" y="60" width="9" height="200" fill="#475569" />
      <rect x="328" y="56" width="13" height="5" fill="#94a3b8" />
      {/* Лаги */}
      <rect x="69" y="105" width="261" height="4" fill="#64748b" />
      <rect x="69" y="190" width="261" height="4" fill="#64748b" />
      {/* Штакетины (шахматка — передний ряд + задний) */}
      {[...Array(11)].map((_, i) => {
        const x = 76 + i * 24;
        return <rect key={`back-${i}`} x={x + 11} y="70" width="11" height="160" fill="#3b4453" opacity="0.7" />;
      })}
      {[...Array(11)].map((_, i) => {
        const x = 76 + i * 24;
        return (
          <g key={`front-${i}`}>
            <rect x={x} y="70" width="11" height="160" fill="#1e293b" />
            <rect x={x} y="70" width="11" height="4" fill="#475569" />
          </g>
        );
      })}
      {/* Планка завершения */}
      <rect x="69" y="65" width="261" height="6" fill="#94a3b8" />
      {/* Номера */}
      {NUM_BADGE(1, 200, 150)}
      {NUM_BADGE(2, 50, 107)}
      {NUM_BADGE(3, 50, 60)}
      {NUM_BADGE(4, 100, 230)}
      {NUM_BADGE(5, 200, 60)}
      {NUM_BADGE(6, 65, 50)}
      {/* Размер */}
      <line x1="64.5" y1="275" x2="334.5" y2="275" stroke="#22d3ee" strokeWidth="0.5" />
      <text x="190" y="290" fontSize="9" fill="#22d3ee" textAnchor="middle" fontFamily="sans-serif">
        Шаг 2.5 м · шахматка
      </text>
    </SvgFrame>
  );
}

function SvgMesh3D() {
  return (
    <SvgFrame>
      <rect x="60" y="60" width="9" height="200" fill="#475569" />
      <rect x="330" y="60" width="9" height="200" fill="#475569" />
      {/* Сетка 3D — вертикальные прутки */}
      {[...Array(22)].map((_, i) => (
        <line
          key={`v-${i}`}
          x1={75 + i * 12}
          y1="70"
          x2={75 + i * 12}
          y2="230"
          stroke="#cbd5e1"
          strokeWidth="1.2"
        />
      ))}
      {/* Горизонтальные прутки с V-изгибом */}
      {[90, 130, 170, 210].map((y) => (
        <path
          key={y}
          d={`M 75 ${y} L 340 ${y}`}
          stroke="#94a3b8"
          strokeWidth="1.5"
          fill="none"
        />
      ))}
      {/* V-изгибы */}
      {[100, 200].map((y) => (
        <polyline
          key={y}
          points={`75,${y} 100,${y - 5} 125,${y} 150,${y - 5} 175,${y} 200,${y - 5} 225,${y} 250,${y - 5} 275,${y} 300,${y - 5} 325,${y}`}
          fill="none"
          stroke="#10b981"
          strokeWidth="1.5"
        />
      ))}
      {/* Скобы крепления */}
      <rect x="64" y="120" width="6" height="10" fill="#fbbf24" />
      <rect x="64" y="180" width="6" height="10" fill="#fbbf24" />
      <rect x="330" y="120" width="6" height="10" fill="#fbbf24" />
      <rect x="330" y="180" width="6" height="10" fill="#fbbf24" />
      {NUM_BADGE(1, 200, 150)}
      {NUM_BADGE(2, 50, 100)}
      {NUM_BADGE(3, 75, 125)}
      {NUM_BADGE(4, 50, 60)}
      <line x1="64.5" y1="275" x2="334.5" y2="275" stroke="#22d3ee" strokeWidth="0.5" />
      <text x="190" y="290" fontSize="9" fill="#22d3ee" textAnchor="middle" fontFamily="sans-serif">
        Шаг 2.5 м · секция 3D
      </text>
    </SvgFrame>
  );
}

function SvgRabitsa() {
  return (
    <SvgFrame>
      <rect x="60" y="80" width="7" height="180" fill="#475569" />
      <rect x="330" y="80" width="7" height="180" fill="#475569" />
      {/* Тросы натяжения */}
      <line x1="67" y1="95" x2="330" y2="95" stroke="#fbbf24" strokeWidth="1.2" />
      <line x1="67" y1="225" x2="330" y2="225" stroke="#fbbf24" strokeWidth="1.2" />
      {/* Рабица — сетка ромбами */}
      {[...Array(20)].map((_, i) =>
        [...Array(8)].map((_, j) => (
          <path
            key={`${i}-${j}`}
            d={`M ${70 + i * 14} ${100 + j * 16} l 7 8 l -7 8 l -7 -8 z`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="0.6"
          />
        ))
      )}
      {/* Хомуты */}
      {[120, 160, 200, 240, 280].map((x) => (
        <g key={x}>
          <circle cx={x} cy="95" r="2" fill="#f97316" />
          <circle cx={x} cy="225" r="2" fill="#f97316" />
        </g>
      ))}
      {NUM_BADGE(1, 200, 160)}
      {NUM_BADGE(2, 50, 100)}
      {NUM_BADGE(3, 200, 88)}
      {NUM_BADGE(4, 240, 110)}
      <text x="190" y="285" fontSize="9" fill="#22d3ee" textAnchor="middle" fontFamily="sans-serif">
        Натяжная рабица · шаг 3.0 м
      </text>
    </SvgFrame>
  );
}

function SvgKovka() {
  return (
    <SvgFrame>
      {/* Столбы */}
      <rect x="55" y="50" width="12" height="210" fill="#1f2937" />
      <rect x="333" y="50" width="12" height="210" fill="#1f2937" />
      {/* Капители */}
      <circle cx="61" cy="45" r="7" fill="#92400e" />
      <circle cx="339" cy="45" r="7" fill="#92400e" />
      {/* Рамка-уголок */}
      <rect x="67" y="80" width="266" height="3" fill="#fbbf24" />
      <rect x="67" y="225" width="266" height="3" fill="#fbbf24" />
      <rect x="67" y="80" width="3" height="148" fill="#fbbf24" />
      <rect x="330" y="80" width="3" height="148" fill="#fbbf24" />
      {/* Кованые прутки с завитками */}
      {[80, 110, 140, 170, 200, 230, 260, 290, 320].map((x, i) => (
        <g key={i}>
          <line x1={x} y1="83" x2={x} y2="225" stroke="#0a0c10" strokeWidth="2" />
          {/* Пика наверху */}
          <path d={`M ${x - 3} 88 L ${x} 80 L ${x + 3} 88 Z`} fill="#0a0c10" />
          {/* Завиток в середине */}
          {i % 2 === 0 && (
            <circle cx={x} cy="150" r="5" fill="none" stroke="#0a0c10" strokeWidth="1.5" />
          )}
        </g>
      ))}
      {NUM_BADGE(1, 200, 110)}
      {NUM_BADGE(2, 50, 80)}
      {NUM_BADGE(3, 50, 50)}
      {NUM_BADGE(4, 61, 30)}
      {NUM_BADGE(5, 80, 250)}
      <text x="190" y="285" fontSize="9" fill="#22d3ee" textAnchor="middle" fontFamily="sans-serif">
        Ручная ковка · секция 2.5 м
      </text>
    </SvgFrame>
  );
}
