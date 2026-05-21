import Icon from "@/components/ui/icon";

interface GateSchemesProps {
  type: "otkatnye" | "raspashnye";
}

export default function GateSchemes({ type }: GateSchemesProps) {
  const cfg = type === "otkatnye" ? OTKATNYE : RASPASHNYE;

  return (
    <section className="py-20" id="gate-schemes">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="section-tag">Конструкция</span>
          <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-white mb-3">
            СХЕМА <span className="text-orange-400">{type === "otkatnye" ? "ОТКАТНЫХ" : "РАСПАШНЫХ"} ВОРОТ</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-sm">
            {cfg.intro}
          </p>
        </div>

        {/* Схема в разрезе */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-10">
          <div className="lg:col-span-3 bg-[#141720] border border-[#1e2230] rounded-3xl p-6">
            {type === "otkatnye" ? <SvgOtkatnye /> : <SvgRaspashnye />}
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
                        {p.brand}
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

        {/* Таблица автоматики */}
        {type === "otkatnye" && (
          <div className="bg-[#0a0c10] border border-[#1e2230] rounded-3xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-5">
              <Icon name="Cpu" size={22} className="text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-oswald font-bold text-white text-xl mb-1">
                  Автоматика под вес полотна
                </h3>
                <p className="text-white/50 text-xs">
                  Подбираем привод по массе и проёму. Все модели —
                  с энкодером, плавным стартом/стопом и встроенным приёмником 433 МГц.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-[#1e2230]">
                    <th className="text-left py-3 px-3 text-white/45 font-medium text-xs uppercase tracking-wider">Модель</th>
                    <th className="text-center py-3 px-3 text-white/45 font-medium text-xs uppercase tracking-wider">Производитель</th>
                    <th className="text-center py-3 px-3 text-white/45 font-medium text-xs uppercase tracking-wider">До веса</th>
                    <th className="text-center py-3 px-3 text-white/45 font-medium text-xs uppercase tracking-wider">До проёма</th>
                    <th className="text-center py-3 px-3 text-orange-400 font-medium text-xs uppercase tracking-wider">Цена</th>
                  </tr>
                </thead>
                <tbody>
                  {AUTOMATION.map((a, i) => (
                    <tr
                      key={i}
                      className="border-b border-[#1a1f2e] hover:bg-[#141720]/40 transition-colors"
                    >
                      <td className="py-3 px-3 text-white font-medium">{a.model}</td>
                      <td className="py-3 px-3 text-center text-white/70 font-oswald text-xs">{a.brand}</td>
                      <td className="py-3 px-3 text-center text-white/70 font-oswald">{a.weight}</td>
                      <td className="py-3 px-3 text-center text-white/70 font-oswald">{a.opening}</td>
                      <td className="py-3 px-3 text-center text-orange-400 font-oswald font-bold">{a.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-white/45 text-xs flex items-center gap-2">
              <Icon name="Info" size={13} className="text-orange-400" />
              В комплект каждой автоматики входит: блок управления, 2 пульта, фотоэлементы, сигнальная лампа, зубчатая рейка 4 м.
            </div>
          </div>
        )}

        {/* Технические факты */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cfg.facts.map((f) => (
            <div
              key={f.label}
              className="bg-[#141720] border border-[#1e2230] rounded-xl p-4"
            >
              <Icon name={f.icon} size={22} className="text-orange-400 mb-2" />
              <div className="font-oswald font-bold text-white text-lg">{f.value}</div>
              <div className="text-white/45 text-[11px] mt-0.5 leading-tight">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const OTKATNYE = {
  intro:
    "Консольная конструкция: полотно висит на роликовых тележках, не задевает землю и работает даже под снегом. Противовес — 50% от длины проёма, обязательное условие по ГОСТ 31174-2017.",
  parts: [
    { name: "Балка несущая", brand: "Alutech SG", desc: "Профиль 95×88×5 мм, длина 5/6/9 м. Внутри — стальной направляющий профиль с антифрикционным покрытием." },
    { name: "Роликовая тележка", brand: "Combi Arialdo", desc: "2 шт. на ворота, 8 роликов в каждой. Подшипники закрытые, не требуют смазки." },
    { name: "Концевой ролик", brand: "Combi Arialdo", desc: "Поддерживает балку в крайнем положении, гасит инерцию закрытия." },
    { name: "Верхний улавливатель", brand: "Стальной", desc: "Фиксирует створку при ветровой нагрузке, не даёт «уйти» полотну в сторону." },
    { name: "Нижний улавливатель", brand: "С роликом", desc: "Принимает вес створки в закрытом положении, разгружает тележки." },
    { name: "Привод", brand: "Came / Nice / DoorHan", desc: "Серводвигатель с энкодером, концевики Hall-датчиками. Защита от затирания." },
    { name: "Противовес", brand: "50% длины проёма", desc: "Часть полотна, выступающая за столб с роликами. Не менее половины проёма — это ГОСТ." },
    { name: "Свая под противовес", brand: "Ø 108 × 2.5 м", desc: "Винтовая свая под мощный фундамент роликовой опоры. Без неё ворота «гуляют»." },
  ],
  facts: [
    { icon: "Weight", value: "до 800 кг", label: "Вес полотна" },
    { icon: "Move", value: "до 9 м", label: "Проём" },
    { icon: "Thermometer", value: "−40 °C", label: "Работа в мороз" },
    { icon: "Clock", value: "12 сек", label: "Открытие на 4 м" },
  ],
};

const RASPASHNYE = {
  intro:
    "Две створки на петлях с шарикоподшипниками. Самая надёжная и бюджетная схема — на 30–40% дешевле откатных. Подходит для проёмов 3–6 м.",
  parts: [
    { name: "Каркас створки", brand: "Профтруба 40×40×3", desc: "Сварная рама с диагональной перемычкой против провисания. Под любую обшивку." },
    { name: "Столб опорный", brand: "100×100×3", desc: "Усиленный, на 30 см глубже стандартного забора. Под бетонирование 1.5 м." },
    { name: "Петля", brand: "BISON 30/170", desc: "С шариковыми подшипниками, на 4 болтах. Срок службы 25+ лет, без обслуживания." },
    { name: "Засов-упор центральный", brand: "Сталь оцинк.", desc: "Земляной упор по центру + замок. Бетонируется в гильзе для зимней эксплуатации." },
    { name: "Стопор верхний", brand: "Регулируемый", desc: "Не даёт ветру распахнуть створки на 180°. Защищает петли от обратной нагрузки." },
    { name: "Привод (опц.)", brand: "Nice WINGO / Came AXO", desc: "Линейные приводы скрытого монтажа. Скорость открытия — 14 секунд." },
  ],
  facts: [
    { icon: "Weight", value: "до 400 кг", label: "Вес створки" },
    { icon: "Move", value: "3–6 м", label: "Проём" },
    { icon: "Percent", value: "−35%", label: "Экономия vs откатные" },
    { icon: "Wrench", value: "1 день", label: "Срок монтажа" },
  ],
};

const AUTOMATION = [
  { model: "BX-708", brand: "Came (Италия)", weight: "800 кг", opening: "до 9 м", price: "от 42 000 ₽" },
  { model: "ROBUS RB600", brand: "Nice (Италия)", weight: "600 кг", opening: "до 8 м", price: "от 38 000 ₽" },
  { model: "Sliding-800", brand: "DoorHan (РФ)", weight: "800 кг", opening: "до 8 м", price: "от 32 000 ₽" },
  { model: "AN-Motors ASL500", brand: "AN-Motors", weight: "500 кг", opening: "до 6 м", price: "от 24 000 ₽" },
];

// ───────────────── SVG ─────────────────
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

function SvgOtkatnye() {
  return (
    <svg viewBox="0 0 500 320" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="500" height="250" fill="#0a0c10" />
      <rect x="0" y="250" width="500" height="70" fill="#2a1f12" />
      <line x1="0" y1="250" x2="500" y2="250" stroke="#f97316" strokeWidth="0.6" strokeDasharray="3,2" />

      {/* Столбы */}
      <rect x="50" y="80" width="14" height="170" fill="#475569" />
      <rect x="100" y="80" width="14" height="170" fill="#475569" />
      <rect x="370" y="80" width="14" height="170" fill="#475569" />

      {/* Противовес — линия от 100 до 200 (50% от проёма 200-380=180 → 90px) */}
      <rect x="120" y="120" width="240" height="100" fill="#1e293b" />
      {/* Обшивка профлистом */}
      {[...Array(10)].map((_, i) => {
        const x = 125 + i * 23.5;
        return (
          <g key={i}>
            <rect x={x} y="125" width="22" height="90" fill="#10b981" opacity="0.85" />
            <rect x={x + 9} y="125" width="3" height="90" fill="#059669" />
          </g>
        );
      })}
      {/* Балка несущая */}
      <rect x="120" y="220" width="240" height="10" fill="#fbbf24" />
      <rect x="120" y="220" width="240" height="3" fill="#f97316" />
      {/* Роликовые тележки */}
      <g>
        <rect x="60" y="225" width="40" height="20" fill="#374151" rx="2" />
        <circle cx="68" cy="247" r="5" fill="#1f2937" />
        <circle cx="82" cy="247" r="5" fill="#1f2937" />
        <circle cx="94" cy="247" r="5" fill="#1f2937" />
      </g>
      <g>
        <rect x="100" y="225" width="40" height="20" fill="#374151" rx="2" />
        <circle cx="108" cy="247" r="5" fill="#1f2937" />
        <circle cx="122" cy="247" r="5" fill="#1f2937" />
      </g>
      {/* Верхний улавливатель */}
      <rect x="368" y="115" width="18" height="20" fill="#94a3b8" />
      {/* Нижний улавливатель */}
      <rect x="368" y="225" width="18" height="14" fill="#94a3b8" />
      {/* Концевой ролик */}
      <circle cx="360" cy="232" r="6" fill="#fbbf24" />
      {/* Привод */}
      <rect x="38" y="240" width="20" height="14" fill="#dc2626" rx="2" />
      <rect x="42" y="232" width="12" height="8" fill="#374151" />

      {/* Свая под противовес */}
      <rect x="69" y="250" width="8" height="60" fill="#3b4453" />
      <ellipse cx="73" cy="310" rx="9" ry="2" fill="#475569" />

      {/* Размеры */}
      <line x1="114" y1="290" x2="370" y2="290" stroke="#22d3ee" strokeWidth="0.5" />
      <line x1="114" y1="285" x2="114" y2="295" stroke="#22d3ee" strokeWidth="0.5" />
      <line x1="370" y1="285" x2="370" y2="295" stroke="#22d3ee" strokeWidth="0.5" />
      <text x="242" y="305" fontSize="9" fill="#22d3ee" textAnchor="middle" fontFamily="sans-serif">Проём 4–9 м</text>

      <line x1="57" y1="80" x2="120" y2="80" stroke="#ef4444" strokeWidth="0.5" />
      <text x="88" y="73" fontSize="8" fill="#ef4444" textAnchor="middle" fontFamily="sans-serif">Противовес 50%</text>

      {/* Номера */}
      <NumBadge n={1} x={250} y={225} />
      <NumBadge n={2} x={80} y={245} />
      <NumBadge n={3} x={360} y={232} />
      <NumBadge n={4} x={377} y={125} />
      <NumBadge n={5} x={377} y={232} />
      <NumBadge n={6} x={48} y={247} />
      <NumBadge n={7} x={150} y={170} />
      <NumBadge n={8} x={73} y={280} />
    </svg>
  );
}

function SvgRaspashnye() {
  return (
    <svg viewBox="0 0 500 320" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="500" height="250" fill="#0a0c10" />
      <rect x="0" y="250" width="500" height="70" fill="#2a1f12" />
      <line x1="0" y1="250" x2="500" y2="250" stroke="#f97316" strokeWidth="0.6" strokeDasharray="3,2" />

      {/* Столбы */}
      <rect x="80" y="70" width="16" height="180" fill="#475569" />
      <rect x="404" y="70" width="16" height="180" fill="#475569" />
      <rect x="78" y="66" width="20" height="5" fill="#94a3b8" />
      <rect x="402" y="66" width="20" height="5" fill="#94a3b8" />

      {/* Створка левая */}
      <g>
        <rect x="96" y="90" width="154" height="155" fill="#1e293b" stroke="#fbbf24" strokeWidth="2" />
        {/* Диагональ */}
        <line x1="96" y1="90" x2="250" y2="245" stroke="#fbbf24" strokeWidth="1" opacity="0.5" />
        {/* Обшивка */}
        {[...Array(7)].map((_, i) => (
          <rect key={`l-${i}`} x={100 + i * 21} y="93" width="20" height="148" fill="#10b981" opacity="0.85" />
        ))}
      </g>
      {/* Створка правая */}
      <g>
        <rect x="250" y="90" width="154" height="155" fill="#1e293b" stroke="#fbbf24" strokeWidth="2" />
        <line x1="250" y1="90" x2="404" y2="245" stroke="#fbbf24" strokeWidth="1" opacity="0.5" />
        {[...Array(7)].map((_, i) => (
          <rect key={`r-${i}`} x={254 + i * 21} y="93" width="20" height="148" fill="#10b981" opacity="0.85" />
        ))}
      </g>

      {/* Петли */}
      <rect x="92" y="110" width="6" height="14" fill="#dc2626" />
      <rect x="92" y="210" width="6" height="14" fill="#dc2626" />
      <rect x="402" y="110" width="6" height="14" fill="#dc2626" />
      <rect x="402" y="210" width="6" height="14" fill="#dc2626" />

      {/* Засов центральный */}
      <rect x="248" y="240" width="4" height="20" fill="#fbbf24" />
      <rect x="244" y="258" width="12" height="6" fill="#374151" />

      {/* Стопор сверху */}
      <rect x="244" y="86" width="12" height="6" fill="#94a3b8" />

      {/* Привод (скрытый — пунктир) */}
      <line x1="80" y1="170" x2="160" y2="170" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
      <rect x="155" y="165" width="10" height="10" fill="#ef4444" opacity="0.6" />

      {/* Размер */}
      <line x1="88" y1="290" x2="412" y2="290" stroke="#22d3ee" strokeWidth="0.5" />
      <text x="250" y="305" fontSize="9" fill="#22d3ee" textAnchor="middle" fontFamily="sans-serif">Проём 3–6 м</text>

      {/* Номера */}
      <NumBadge n={1} x={170} y={170} />
      <NumBadge n={2} x={88} y={60} />
      <NumBadge n={3} x={95} y={117} />
      <NumBadge n={4} x={250} y={270} />
      <NumBadge n={5} x={250} y={80} />
      <NumBadge n={6} x={140} y={175} />
    </svg>
  );
}
