import Icon from "@/components/ui/icon";

interface PaintLevel {
  tier: "Базовый" | "Средний" | "Премиум";
  name: string;
  tech: string;
  thickness: string;
  lifespan: string;
  resist: string;
  pros: string[];
  cons: string[];
  priceLabel: string;
  priceBar: number;
  accent: string;
  recommend?: boolean;
}

const LEVELS: PaintLevel[] = [
  {
    tier: "Базовый",
    name: "Глянцевая / молотковая эмаль",
    tech: "Алкидная или алкидно-уретановая краска (ПФ-115, эмаль молотковая)",
    thickness: "40–60 мкм в 2 слоя",
    lifespan: "3–5 лет до подкраски",
    resist: "УФ — средняя · Скол — низкая · Коррозия — базовая",
    pros: [
      "Самый бюджетный вариант",
      "Лёгкое подновление на месте",
      "Молотковая фактура маскирует мелкие дефекты",
    ],
    cons: [
      "Боится сколов и царапин",
      "Выгорает на солнце за 3–4 сезона",
      "Без двусторонней обработки кромок",
    ],
    priceLabel: "−25% к базе",
    priceBar: 35,
    accent: "#8b95a7",
  },
  {
    tier: "Средний",
    name: "Hammerite 3-в-1",
    tech: "Однокомпонентная алкидно-стирольная по ржавчине (грунт + краска + антикор)",
    thickness: "60–80 мкм в 2 слоя",
    lifespan: "7–10 лет",
    resist: "УФ — высокая · Скол — средняя · Коррозия — высокая",
    pros: [
      "Наносится прямо по ржавчине",
      "Не требует отдельной грунтовки",
      "Молотковая, гладкая и кузнечная фактуры",
      "Хорошо держит МО-климат",
    ],
    cons: [
      "Дороже стандартной эмали",
      "Требует чистой сухой поверхности",
    ],
    priceLabel: "База",
    priceBar: 60,
    accent: "#f97316",
    recommend: true,
  },
  {
    tier: "Премиум",
    name: "Порошковая полимерная",
    tech: "Полиэфирная порошковая краска, запекание при +180 °C, толщина по ГОСТ 9.410-88",
    thickness: "80–120 мкм, монослой",
    lifespan: "20–25 лет",
    resist: "УФ — максимальная · Скол — максимальная · Коррозия — максимальная",
    pros: [
      "Заводское нанесение по всей RAL-палитре",
      "Двусторонняя покраска кромок",
      "Не царапается монтажным инструментом",
      "Не выгорает 20+ лет",
    ],
    cons: [
      "+30–45% к стоимости",
      "Подкраска только на производстве",
    ],
    priceLabel: "+30–45% к базе",
    priceBar: 100,
    accent: "#22c55e",
  },
];

export default function PaintLevels() {
  return (
    <section className="py-20 bg-[#0a0c10]" id="paint-levels">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="section-tag">Защитное покрытие</span>
          <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-white mb-3">
            ТРИ УРОВНЯ <span className="text-orange-400">ПОКРАСКИ</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-sm">
            От бюджетной алкидной эмали до заводской порошковой полимеризации.
            Все варианты идут с двухкомпонентным грунтом и гарантией 3 года по договору.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {LEVELS.map((lvl) => (
            <div
              key={lvl.tier}
              className={`relative bg-[#141720] border rounded-3xl p-6 transition-all hover:-translate-y-1 ${
                lvl.recommend
                  ? "border-orange-500/50 shadow-xl shadow-orange-500/10"
                  : "border-[#1e2230] hover:border-orange-500/30"
              }`}
            >
              {lvl.recommend && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-gray-900 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Оптимально
                </div>
              )}

              <div
                className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: lvl.accent }}
              >
                {lvl.tier}
              </div>
              <h3 className="font-oswald font-bold text-white text-xl leading-tight mb-3">
                {lvl.name}
              </h3>

              <PaintSwatch accent={lvl.accent} tier={lvl.tier} />

              <div className="text-white/55 text-xs leading-relaxed mb-4">
                {lvl.tech}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <SpecMini label="Толщина" value={lvl.thickness} />
                <SpecMini label="Срок службы" value={lvl.lifespan} />
              </div>

              <div className="text-white/40 text-[11px] mb-4 leading-snug">
                {lvl.resist}
              </div>

              <ul className="space-y-1.5 mb-4">
                {lvl.pros.map((pr) => (
                  <li
                    key={pr}
                    className="flex items-start gap-2 text-white/70 text-xs"
                  >
                    <Icon
                      name="Plus"
                      size={14}
                      className="text-orange-400 flex-shrink-0 mt-0.5"
                    />
                    <span>{pr}</span>
                  </li>
                ))}
                {lvl.cons.map((cn) => (
                  <li
                    key={cn}
                    className="flex items-start gap-2 text-white/40 text-xs"
                  >
                    <Icon
                      name="Minus"
                      size={14}
                      className="text-white/30 flex-shrink-0 mt-0.5"
                    />
                    <span>{cn}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-[#1e2230] pt-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-white/40 text-[11px] uppercase tracking-wider">
                    Стоимость
                  </span>
                  <span
                    className="font-oswald font-bold text-base"
                    style={{ color: lvl.accent }}
                  >
                    {lvl.priceLabel}
                  </span>
                </div>
                <div className="h-1.5 bg-[#0a0c10] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${lvl.priceBar}%`,
                      background: lvl.accent,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-[#141720] border border-[#1e2230] rounded-2xl p-5 flex items-start gap-4">
          <Icon
            name="Info"
            size={20}
            className="text-orange-400 flex-shrink-0 mt-0.5"
          />
          <div className="text-white/60 text-xs leading-relaxed">
            <span className="text-white font-medium">Какой выбрать?</span>{" "}
            Для дачи и сезонной эксплуатации достаточно молотковой эмали.
            Для коттеджа в МО рекомендуем Hammerite — оптимум по цене и сроку.
            Для премиум-объектов и фасадного забора — только заводская порошковая
            по ГОСТ 9.410-88.
          </div>
        </div>
      </div>
    </section>
  );
}

function SpecMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0a0c10] border border-[#1e2230] rounded-lg px-2.5 py-2">
      <div className="text-white/35 text-[10px] uppercase tracking-wider">
        {label}
      </div>
      <div className="text-white text-xs font-medium leading-tight mt-0.5">
        {value}
      </div>
    </div>
  );
}

function PaintSwatch({ accent, tier }: { accent: string; tier: string }) {
  // SVG-схема сечения покрытия: металл → грунт → краска
  const layers =
    tier === "Базовый"
      ? [{ color: accent, h: 8, label: "Эмаль 1 слой" }]
      : tier === "Средний"
      ? [
          { color: accent, h: 6, label: "Краска" },
          { color: "#fbbf24", h: 4, label: "Антикор-грунт" },
        ]
      : [
          { color: accent, h: 6, label: "Полимер" },
          { color: "#fbbf24", h: 4, label: "Грунт" },
          { color: "#22d3ee", h: 3, label: "Фосфатирование" },
        ];

  return (
    <div className="bg-[#0a0c10] border border-[#1e2230] rounded-xl p-3 mb-4">
      <svg viewBox="0 0 200 60" className="w-full h-auto">
        {/* Металл (основа) */}
        <rect x="10" y="40" width="180" height="14" fill="#3b4453" rx="1" />
        <text
          x="100"
          y="50"
          textAnchor="middle"
          fontSize="7"
          fill="#9ca3af"
          fontFamily="sans-serif"
        >
          Сталь
        </text>

        {/* Слои покрытия снизу вверх */}
        {(() => {
          let y = 40;
          return layers
            .slice()
            .reverse()
            .map((layer, i) => {
              y -= layer.h + 1;
              return (
                <g key={i}>
                  <rect
                    x="10"
                    y={y}
                    width="180"
                    height={layer.h}
                    fill={layer.color}
                    rx="0.5"
                    opacity="0.92"
                  />
                </g>
              );
            });
        })()}

        {/* Подписи слоёв справа */}
        {(() => {
          let y = 40;
          return layers
            .slice()
            .reverse()
            .map((layer, i) => {
              y -= layer.h + 1;
              return (
                <g key={`label-${i}`}>
                  <line
                    x1="190"
                    y1={y + layer.h / 2}
                    x2="196"
                    y2={y + layer.h / 2}
                    stroke={layer.color}
                    strokeWidth="0.5"
                  />
                </g>
              );
            });
        })()}
      </svg>
      <div className="text-white/35 text-[10px] text-center mt-1">
        Сечение покрытия · {layers.length + 1}{" "}
        {layers.length + 1 === 2 ? "слоя" : "слоёв"}
      </div>
    </div>
  );
}
