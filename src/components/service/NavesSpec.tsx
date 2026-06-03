import Icon from "@/components/ui/icon";

interface NavesSpecProps {
  variant: "naves" | "ploshadka" | "zaezd";
}

export default function NavesSpec({ variant }: NavesSpecProps) {
  const cfg = CFG[variant];

  return (
    <section className="py-20" id="naves-spec">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="section-tag">{cfg.tag}</span>
          <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-white mb-3">
            {cfg.title1} <span className="text-orange-400">{cfg.title2}</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-sm">{cfg.intro}</p>
        </div>

        {/* Схема в разрезе + список элементов */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-10">
          <div className="lg:col-span-3 bg-[#141720] border border-[#1e2230] rounded-3xl p-6">
            {variant === "naves" && <SvgNaves />}
            {variant === "ploshadka" && <SvgPloshadka />}
            {variant === "zaezd" && <SvgZaezd />}
          </div>

          <div className="lg:col-span-2 space-y-3">
            {cfg.parts.map((p, i) => (
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
                        {p.name}
                      </div>
                      <div className="text-orange-400 text-[11px] font-oswald whitespace-nowrap">
                        {p.spec}
                      </div>
                    </div>
                    <div className="text-white/55 text-xs leading-relaxed">
                      {p.desc}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Расчётные нагрузки */}
        <div className="bg-[#0a0c10] border border-[#1e2230] rounded-3xl p-6">
          <div className="flex items-start gap-3 mb-5">
            <Icon name={cfg.loadIcon} size={22} className="text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-oswald font-bold text-white text-xl mb-1">
                {cfg.loadTitle}
              </h3>
              <p className="text-white/50 text-xs">{cfg.loadSubtitle}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-[#1e2230]">
                  {cfg.tableHead.map((h, i) => (
                    <th
                      key={i}
                      className={`py-3 px-3 font-medium text-xs uppercase tracking-wider ${
                        i === 0 ? "text-left text-white/45" : i === cfg.tableHead.length - 1 ? "text-center text-orange-400" : "text-center text-white/45"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cfg.tableRows.map((row, i) => (
                  <tr key={i} className="border-b border-[#1a1f2e] hover:bg-[#141720]/40 transition-colors">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`py-3 px-3 ${
                          j === 0
                            ? "text-white font-medium"
                            : j === row.length - 1
                            ? "text-center text-orange-400 font-oswald font-bold"
                            : "text-center text-white/70 font-oswald text-xs"
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            {cfg.facts.map((f) => (
              <div
                key={f.label}
                className="bg-[#141720] border border-[#1e2230] rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <Icon name={f.icon} size={18} className="text-orange-400 flex-shrink-0" />
                <div>
                  <div className="text-white/40 text-[10px] uppercase tracking-wider">
                    {f.label}
                  </div>
                  <div className="text-white text-xs font-medium leading-tight mt-0.5">
                    {f.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────── КОНФИГИ ─────────
const CFG = {
  naves: {
    tag: "Конструкция навеса",
    title1: "ИЗ ЧЕГО",
    title2: "СДЕЛАН НАВЕС",
    intro:
      "Расчёт по СП 20.13330.2016 для III снегового района МО — нормативная нагрузка 180 кгс/м². Каркас выдерживает 240 кг/м² с запасом 1.3×.",
    parts: [
      { name: "Стойка опорная", spec: "80×80×3 мм", desc: "Профильная труба, оцинковка + полимер. Бетонируется на 1.0 м под стандартный навес 6×4 м." },
      { name: "Стропильная ферма", spec: "60×40×2 мм", desc: "Сварная треугольная ферма, шаг 1.0–1.5 м под снег МО. Сборка на болтах М10." },
      { name: "Обрешётка", spec: "40×20×2 мм", desc: "Под поликарбонат — шаг 0.7 м, под профнастил — шаг 0.5 м." },
      { name: "Кровля", spec: "Поликарбонат 8 мм / профнастил С8", desc: "Сотовый поликарбонат с УФ-защитой, гарантия 3 года от пожелтения. Или профнастил." },
      { name: "Термошайба", spec: "Ø 25 мм с EPDM", desc: "Не пережимает поликарбонат, компенсирует тепловое расширение." },
      { name: "Торцевой профиль", spec: "F / U-образный", desc: "Закрывает соты от пыли и насекомых. С перфорацией для конденсата." },
    ],
    loadIcon: "Snowflake",
    loadTitle: "Снеговая и ветровая нагрузка",
    loadSubtitle:
      "Подбор сечения стропил и шага опор по СП 20.13330.2016. МО — III район по снегу (180 кгс/м²) и I по ветру (23 кгс/м²).",
    tableHead: ["Размер навеса", "Стойка", "Ферма", "Шаг стропил", "Снег"],
    tableRows: [
      ["3×3 м (1 авто)", "80×80×3", "60×40×2", "1.5 м", "180 кгс/м²"],
      ["6×4 м (2 авто)", "80×80×3", "60×40×3", "1.2 м", "180 кгс/м²"],
      ["6×6 м (3 авто)", "100×100×3", "80×40×3", "1.0 м", "180 кгс/м²"],
      ["8×6 м (большой)", "100×100×4", "80×60×3", "1.0 м", "240 кгс/м² ✓"],
    ],
    facts: [
      { icon: "Snowflake", value: "180 кгс/м²", label: "Снег МО (III район)" },
      { icon: "Wind", value: "23 кгс/м²", label: "Ветер МО (I район)" },
      { icon: "ShieldCheck", value: "запас 1.3×", label: "Коэффициент надёжности" },
    ],
  },
  ploshadka: {
    tag: "Пирог площадки",
    title1: "СЛОИ",
    title2: "ПОД БЕТОНОМ",
    intro:
      "Бетонная площадка под автомобиль по технологии монолитного пола. Состав слоёв — по СП 22.13330.2016 и СП 78.13330.2012.",
    parts: [
      { name: "Бетон М300", spec: "120 мм, F150 W6", desc: "Тяжёлый бетон, морозостойкость F150 (минимум 150 циклов) — ГОСТ 26633-2015." },
      { name: "Армосетка", spec: "100×100×4 ВР-1", desc: "Сварная сетка из проволоки Ø4, шаг 100 мм. Зазор от грунта — 30 мм (защитный слой)." },
      { name: "Плёнка ПЭ", spec: "150 мкм", desc: "Гидроизоляция от ухода цементного молока в подушку. Внахлёст 200 мм со склейкой скотчем." },
      { name: "Песок речной", spec: "100 мм, фр. 0–5", desc: "Подушка под бетон, выравнивающая. Уплотнение виброплитой до 0.95." },
      { name: "Щебень", spec: "200 мм, фр. 20–40", desc: "Дренаж и распределение нагрузки. Плотное основание под весь пирог." },
      { name: "Геотекстиль", spec: "Плотность 200 г/м²", desc: "Разделитель — не даёт песку и щебню перемешиваться с грунтом. Срок службы 50+ лет." },
    ],
    loadIcon: "Car",
    loadTitle: "Толщина пирога под разную нагрузку",
    loadSubtitle:
      "Расчёт по нагрузке от типа техники. Для легкового авто — стандарт, для грузовика — усиленная схема.",
    tableHead: ["Тип нагрузки", "Бетон", "Армирование", "Подушка", "Общая толщина"],
    tableRows: [
      ["Пешеходная", "80 мм", "сетка 100×100×3", "150 мм", "230 мм"],
      ["Легковой авто", "120 мм", "сетка 100×100×4", "300 мм", "420 мм"],
      ["Внедорожник/микроавтобус", "150 мм", "сетка 100×100×5", "350 мм", "500 мм"],
      ["Грузовик до 5 т", "200 мм", "сетка 150×150×6", "400 мм", "600 мм"],
    ],
    facts: [
      { icon: "Layers", value: "5 слоёв", label: "Пирог по ГОСТ" },
      { icon: "Cuboid", value: "М300 F150 W6", label: "Класс бетона" },
      { icon: "Thermometer", value: "до −15 °C", label: "Зимний бетон с добавками" },
    ],
  },
  zaezd: {
    tag: "Заезд на участок",
    title1: "ПЕРЕЕЗД",
    title2: "ЧЕРЕЗ КАНАВУ",
    intro:
      "Заезд через ливневую канаву — это инженерное сооружение. Главное — водопропускная труба, чтобы канава не заиливалась. По СП 32.13330.2018 «Канализация» и СП 34.13330.2021 «Автомобильные дороги».",
    parts: [
      { name: "Труба ПНД ПЭ", spec: "Ø 300 / 400 / 500 мм", desc: "Гофрированная двухстенная труба SN8. Не ржавеет, рассчитана на 50+ лет. Длина 6 м." },
      { name: "Оголовок входной", spec: "ЖБИ или бетон", desc: "Защищает от попадания мусора, фиксирует трубу, не даёт грунту осыпаться в канаву." },
      { name: "Оголовок выходной", spec: "ЖБИ или бетон", desc: "Аналогично — с обратной стороны. С выбросом потока на расстояние 1 м." },
      { name: "Щебень обсыпки", spec: "Фр. 20–40, 300 мм", desc: "Подушка под трубу + обсыпка вокруг. Защищает от продавливания и дренирует." },
      { name: "Геотекстиль", spec: "200 г/м²", desc: "Обёртывает трубу + подсыпку. Не даёт грунту вымываться в течение лет." },
      { name: "Покрытие верха", spec: "Бетон М300 / асфальт / плитка", desc: "Финиш под нагрузку. Толщина 120 мм для легкового, 200 мм для грузового." },
      { name: "Отбойник", spec: "Бетонный блок / труба", desc: "Защищает оголовки от наезда колёсами при манёврах." },
    ],
    loadIcon: "Droplets",
    loadTitle: "Диаметр трубы по водосбору",
    loadSubtitle:
      "Расчёт по СП 32.13330.2018. Для МО — интенсивность дождя 0.5 л/с с 1 м² при ливне q=100 л/с·га.",
    tableHead: ["Канава / сток", "Диаметр трубы", "Длина", "Толщина стенки", "Цена под ключ"],
    tableRows: [
      ["Дренажная, до 5 л/с", "Ø 300 мм", "6 м", "SN8", "от 28 000 ₽"],
      ["Ливневая, до 15 л/с", "Ø 400 мм", "6 м", "SN8", "от 38 000 ₽"],
      ["Магистральная, до 30 л/с", "Ø 500 мм", "8 м", "SN8", "от 56 000 ₽"],
      ["Большая канава, >30 л/с", "2× Ø 500 мм", "8 м", "SN8", "от 89 000 ₽"],
    ],
    facts: [
      { icon: "Droplets", value: "ПНД SN8", label: "Гофрированная труба" },
      { icon: "ShieldCheck", value: "50+ лет", label: "Срок службы" },
      { icon: "ClipboardCheck", value: "СП 34.13330", label: "Норматив" },
    ],
  },
};

// ───────── SVG ─────────
function NumBadge({ n, x, y }: { n: number; x: number; y: number }) {
  return (
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
}

function SvgNaves() {
  return (
    <svg viewBox="0 0 500 320" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="500" height="270" fill="#0a0c10" />
      <rect x="0" y="270" width="500" height="50" fill="#2a1f12" />
      <line x1="0" y1="270" x2="500" y2="270" stroke="#f97316" strokeWidth="0.5" strokeDasharray="3,2" />

      {/* Стойки */}
      <rect x="80" y="160" width="14" height="110" fill="#475569" />
      <rect x="240" y="160" width="14" height="110" fill="#475569" />
      <rect x="400" y="160" width="14" height="110" fill="#475569" />

      {/* Двускатная крыша */}
      <polygon points="60,160 247,90 434,160" fill="none" stroke="#fbbf24" strokeWidth="2" />
      <polygon points="60,160 247,90 434,160 434,170 247,100 60,170" fill="#fbbf24" opacity="0.2" />

      {/* Стропильные фермы (внутри) */}
      <line x1="100" y1="160" x2="200" y2="115" stroke="#94a3b8" strokeWidth="1" />
      <line x1="200" y1="115" x2="260" y2="115" stroke="#94a3b8" strokeWidth="1" />
      <line x1="260" y1="115" x2="350" y2="160" stroke="#94a3b8" strokeWidth="1" />
      <line x1="100" y1="160" x2="350" y2="160" stroke="#94a3b8" strokeWidth="1" />
      {/* Внутренние раскосы */}
      {[140, 180, 220].map((x) => (
        <line key={x} x1={x} y1="160" x2={x + 20} y2="135" stroke="#94a3b8" strokeWidth="0.8" />
      ))}
      {[270, 310, 350].map((x) => (
        <line key={x} x1={x} y1="160" x2={x - 20} y2="135" stroke="#94a3b8" strokeWidth="0.8" />
      ))}

      {/* Кровля поликарбонат */}
      <polygon points="60,160 247,90 434,160" fill="#3b82f6" opacity="0.35" />

      {/* Снег сверху */}
      {[80, 130, 180, 220, 260, 310, 360, 410].map((x, i) => (
        <circle key={i} cx={x} cy={i % 2 === 0 ? 80 : 70} r="3" fill="#fff" opacity="0.7" />
      ))}

      {/* Стрелка снеговой нагрузки */}
      <line x1="247" y1="40" x2="247" y2="85" stroke="#22d3ee" strokeWidth="1.5" markerEnd="url(#arr)" />
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <polygon points="0,0 6,3 0,6" fill="#22d3ee" />
        </marker>
      </defs>
      <text x="252" y="55" fontSize="9" fill="#22d3ee" fontFamily="sans-serif">180 кгс/м²</text>

      {/* Авто */}
      <rect x="120" y="220" width="80" height="40" rx="6" fill="#475569" />
      <rect x="135" y="200" width="50" height="25" rx="4" fill="#374151" />
      <circle cx="135" cy="265" r="8" fill="#1f2937" />
      <circle cx="185" cy="265" r="8" fill="#1f2937" />

      <rect x="300" y="220" width="80" height="40" rx="6" fill="#475569" />
      <rect x="315" y="200" width="50" height="25" rx="4" fill="#374151" />
      <circle cx="315" cy="265" r="8" fill="#1f2937" />
      <circle cx="365" cy="265" r="8" fill="#1f2937" />

      <NumBadge n={1} x={87} y={250} />
      <NumBadge n={2} x={195} y={115} />
      <NumBadge n={3} x={290} y={140} />
      <NumBadge n={4} x={247} y={100} />
      <NumBadge n={5} x={170} y={130} />
      <NumBadge n={6} x={400} y={155} />

      {/* Размер */}
      <line x1="87" y1="295" x2="407" y2="295" stroke="#22d3ee" strokeWidth="0.5" />
      <text x="247" y="310" fontSize="9" fill="#22d3ee" textAnchor="middle" fontFamily="sans-serif">Навес 6×4 м · 2 авто</text>
    </svg>
  );
}

function SvgPloshadka() {
  return (
    <svg viewBox="0 0 500 320" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="500" height="320" fill="#0a0c10" />
      {/* Авто сверху */}
      <rect x="180" y="20" width="140" height="50" rx="8" fill="#475569" />
      <rect x="210" y="0" width="80" height="25" rx="4" fill="#374151" />
      <circle cx="210" cy="75" r="10" fill="#1f2937" />
      <circle cx="290" cy="75" r="10" fill="#1f2937" />

      {/* Стрелка нагрузки */}
      <line x1="250" y1="85" x2="250" y2="115" stroke="#22d3ee" strokeWidth="1.5" markerEnd="url(#arrP)" />
      <defs>
        <marker id="arrP" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <polygon points="0,0 6,3 0,6" fill="#22d3ee" />
        </marker>
      </defs>
      <text x="260" y="100" fontSize="9" fill="#22d3ee" fontFamily="sans-serif">1.5–2 т</text>

      {/* Слои пирога */}
      <g>
        {/* 1. Бетон */}
        <rect x="60" y="120" width="380" height="22" fill="#9ca3af" />
        {/* Армосетка */}
        <line x1="70" y1="131" x2="430" y2="131" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="3,3" />
        {[80, 120, 160, 200, 240, 280, 320, 360, 400].map((x) => (
          <line key={x} x1={x} y1="125" x2={x} y2="138" stroke="#fbbf24" strokeWidth="0.8" />
        ))}
        <text x="445" y="135" fontSize="8" fill="#fff" fontFamily="sans-serif">120 мм</text>

        {/* 2. Плёнка ПЭ */}
        <rect x="60" y="142" width="380" height="4" fill="#60a5fa" />
        <text x="445" y="146" fontSize="7" fill="#60a5fa" fontFamily="sans-serif">плёнка</text>

        {/* 3. Песок */}
        <rect x="60" y="146" width="380" height="22" fill="#d4a574" />
        {[80, 140, 200, 260, 320, 380].map((x, i) => (
          <circle key={i} cx={x} cy={i % 2 === 0 ? 155 : 162} r="1" fill="#a16207" />
        ))}
        <text x="445" y="160" fontSize="8" fill="#fff" fontFamily="sans-serif">100 мм</text>

        {/* 4. Щебень */}
        <rect x="60" y="168" width="380" height="35" fill="#6b7280" />
        {[80, 110, 140, 170, 200, 230, 260, 290, 320, 350, 380, 410].map((x, i) => (
          <ellipse key={i} cx={x} cy={175 + (i % 3) * 8} rx="3.5" ry="2.5" fill="#475569" />
        ))}
        <text x="445" y="188" fontSize="8" fill="#fff" fontFamily="sans-serif">200 мм</text>

        {/* 5. Геотекстиль */}
        <line
          x1="60"
          y1="203"
          x2="440"
          y2="203"
          stroke="#a78bfa"
          strokeWidth="2"
        />
        <text x="445" y="207" fontSize="7" fill="#a78bfa" fontFamily="sans-serif">геотекстиль</text>

        {/* 6. Грунт */}
        <rect x="0" y="205" width="500" height="115" fill="#2a1f12" />
        {[50, 120, 200, 280, 350, 430].map((x, i) => (
          <circle key={i} cx={x} cy={240 + (i % 2) * 30} r="2" fill="#5a4530" />
        ))}
      </g>

      <NumBadge n={1} x={465} y={131} />
      <NumBadge n={2} x={80} y={131} />
      <NumBadge n={3} x={30} y={144} />
      <NumBadge n={4} x={465} y={157} />
      <NumBadge n={5} x={465} y={185} />
      <NumBadge n={6} x={30} y={203} />

      <text x="250" y="295" fontSize="9" fill="#22d3ee" textAnchor="middle" fontFamily="sans-serif">
        Пирог 420 мм · нагрузка до 2 т
      </text>
    </svg>
  );
}

function SvgZaezd() {
  return (
    <svg viewBox="0 0 500 320" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="500" height="180" fill="#0a0c10" />
      <rect x="0" y="180" width="500" height="140" fill="#2a1f12" />

      {/* Дорога слева — улица */}
      <rect x="0" y="160" width="120" height="20" fill="#1f2937" />
      <line x1="0" y1="170" x2="120" y2="170" stroke="#fbbf24" strokeWidth="1" strokeDasharray="6,4" />

      {/* Канава */}
      <path d="M 120 180 L 140 220 L 220 220 L 240 180" fill="#1e3a5f" />
      {/* Вода в канаве */}
      <path d="M 140 220 L 220 220" stroke="#3b82f6" strokeWidth="1" />
      {/* Волны воды */}
      <path d="M 145 215 q 5 -3 10 0 q 5 -3 10 0 q 5 -3 10 0 q 5 -3 10 0 q 5 -3 10 0 q 5 -3 10 0" fill="none" stroke="#60a5fa" strokeWidth="0.6" />

      {/* Заезд (бетон сверху) */}
      <rect x="120" y="160" width="120" height="20" fill="#6b7280" />
      <rect x="120" y="160" width="120" height="20" fill="none" stroke="#9ca3af" strokeWidth="0.5" />

      {/* Труба под заездом */}
      <ellipse cx="135" cy="195" rx="14" ry="18" fill="#22d3ee" opacity="0.7" />
      <ellipse cx="225" cy="195" rx="14" ry="18" fill="#22d3ee" opacity="0.7" />
      <rect x="135" y="180" width="90" height="36" fill="#22d3ee" opacity="0.45" />
      <rect x="135" y="180" width="90" height="36" fill="none" stroke="#06b6d4" strokeWidth="1" />
      {/* Гофра */}
      {[148, 161, 174, 187, 200, 213].map((x) => (
        <line key={x} x1={x} y1="180" x2={x} y2="216" stroke="#06b6d4" strokeWidth="0.5" />
      ))}

      {/* Оголовки ЖБИ */}
      <rect x="124" y="178" width="14" height="40" fill="#9ca3af" stroke="#cbd5e1" strokeWidth="0.5" />
      <rect x="222" y="178" width="14" height="40" fill="#9ca3af" stroke="#cbd5e1" strokeWidth="0.5" />

      {/* Щебень обсыпки */}
      {[
        [150, 175],
        [180, 175],
        [210, 175],
        [130, 220],
        [160, 225],
        [190, 225],
        [220, 220],
      ].map(([cx, cy], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx="2" ry="1.5" fill="#475569" />
      ))}

      {/* Геотекстиль (линия вокруг) */}
      <path
        d="M 124 175 L 140 175 L 235 175 L 236 175"
        stroke="#a78bfa"
        strokeWidth="1"
        fill="none"
      />

      {/* Участок справа от заезда */}
      <rect x="240" y="160" width="260" height="20" fill="#10b981" opacity="0.3" />
      {/* Забор на участке */}
      <rect x="240" y="120" width="3" height="40" fill="#475569" />
      <rect x="270" y="120" width="3" height="40" fill="#475569" />
      <rect x="300" y="120" width="3" height="40" fill="#475569" />
      <rect x="330" y="120" width="3" height="40" fill="#475569" />
      <rect x="360" y="120" width="3" height="40" fill="#475569" />
      <rect x="390" y="120" width="3" height="40" fill="#475569" />
      <rect x="420" y="120" width="3" height="40" fill="#475569" />
      <rect x="450" y="120" width="3" height="40" fill="#475569" />
      <rect x="480" y="120" width="3" height="40" fill="#475569" />

      {/* Авто заезжает */}
      <rect x="155" y="135" width="60" height="25" rx="4" fill="#dc2626" />
      <rect x="170" y="125" width="35" height="12" rx="2" fill="#7f1d1d" />
      <circle cx="170" cy="162" r="5" fill="#0a0c10" />
      <circle cx="205" cy="162" r="5" fill="#0a0c10" />

      {/* Отбойники */}
      <rect x="130" y="155" width="4" height="6" fill="#fbbf24" />
      <rect x="232" y="155" width="4" height="6" fill="#fbbf24" />

      <NumBadge n={1} x={180} y={197} />
      <NumBadge n={2} x={124} y={170} />
      <NumBadge n={3} x={236} y={170} />
      <NumBadge n={4} x={195} y={170} />
      <NumBadge n={5} x={140} y={230} />
      <NumBadge n={6} x={180} y={155} />
      <NumBadge n={7} x={130} y={160} />

      <text x="180" y="280" fontSize="9" fill="#22d3ee" textAnchor="middle" fontFamily="sans-serif">
        Заезд 6 м · труба Ø 400 ПНД SN8
      </text>
    </svg>
  );
}