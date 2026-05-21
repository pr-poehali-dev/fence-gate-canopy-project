import Icon from "@/components/ui/icon";

interface FoundationScheme {
  key: string;
  name: string;
  forSoils: string;
  forLoad: string;
  depth: string;
  price: string;
  pros: string[];
  cons: string[];
  recommend?: boolean;
  Diagram: React.FC;
}

const SCHEMES: FoundationScheme[] = [
  {
    key: "buti",
    name: "Бутование щебнем",
    forSoils: "Песок, супесь, плотный сухой грунт",
    forLoad: "Лёгкие заборы: рабица, 3D-сетка, штакетник до 1,8 м",
    depth: "Скважина Ø 200 мм, глубина 1,2 м",
    price: "от 650 ₽/столб",
    pros: [
      "Самый бюджетный способ",
      "Дренирует — вода не задерживается",
      "Не вспучивается при морозе",
    ],
    cons: [
      "Не подходит для глины и торфа",
      "Только для лёгких конструкций",
    ],
    Diagram: DiagramButi,
  },
  {
    key: "concrete",
    name: "Бетонирование",
    forSoils: "Суглинок, глина, средне-пучинистый",
    forLoad: "Профлист, евроштакетник, секционные до 2,2 м",
    depth: "Скважина Ø 250 мм, глубина 1,4–1,5 м (ниже промерзания МО)",
    price: "от 1 400 ₽/столб",
    pros: [
      "Стандарт для МО — справляется с пучением",
      "Бетон М300, ГОСТ 26633-2015",
      "Жёсткая фиксация столба",
    ],
    cons: [
      "Требует 3–5 дней набора прочности",
      "Не подходит для торфа и плывунов",
    ],
    recommend: true,
    Diagram: DiagramConcrete,
  },
  {
    key: "tape",
    name: "Ленточно-ростверковый",
    forSoils: "Сильно-пучинистые, перепад высот, склон",
    forLoad: "Тяжёлые: кирпич, газобетон, кованые секции, фасадный забор",
    depth: "Лента 200×400 мм, заглубление 0,5 м, армокаркас 4×Ø12",
    price: "от 3 200 ₽/п.м.",
    pros: [
      "Распределяет нагрузку — забор не «гуляет»",
      "Закрывает перепад высот участка",
      "Срок службы 50+ лет",
    ],
    cons: [
      "Самый дорогой и долгий",
      "Требует опалубки и арматуры",
    ],
    Diagram: DiagramTape,
  },
  {
    key: "piles",
    name: "Винтовые сваи Ø 86 / Ø 108 мм",
    forSoils: "Торф, обводнённый, плывун, болотистый, склон",
    forLoad: "Универсал: от рабицы до ворот с противовесом",
    depth: "Свая 2,0–2,5 м, заглубление ниже промерзания + 30 см",
    price: "от 1 950 ₽/свая",
    pros: [
      "Монтаж за 1 день в любой сезон, в т.ч. зимой",
      "Не зависит от типа грунта",
      "Несущая способность до 4 тонн (Ø 108)",
      "Под противовесы откатных ворот — обязательны",
    ],
    cons: [
      "Не для скального грунта",
      "Нужна антикоррозийная обработка",
    ],
    Diagram: DiagramPiles,
  },
];

export default function FoundationSchemes() {
  return (
    <section className="py-20 bg-[#0a0c10]" id="foundation-schemes">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="section-tag">Основание</span>
          <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-white mb-3">
            ТИПЫ <span className="text-orange-400">ФУНДАМЕНТА</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-sm">
            Замерщик определяет тип грунта на участке и подбирает основание
            по СП 22.13330.2016 «Основания зданий и сооружений».
            Глубина — ниже промерзания для Московской области (1,4 м).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {SCHEMES.map((s) => (
            <div
              key={s.key}
              className={`relative bg-[#141720] border rounded-3xl overflow-hidden transition-all hover:-translate-y-1 ${
                s.recommend
                  ? "border-orange-500/50"
                  : "border-[#1e2230] hover:border-orange-500/30"
              }`}
            >
              {s.recommend && (
                <div className="absolute top-4 right-4 bg-orange-500 text-gray-900 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full z-10">
                  Стандарт МО
                </div>
              )}

              <div className="bg-gradient-to-b from-[#0a0c10] to-[#141720] px-6 pt-6 pb-2">
                <s.Diagram />
              </div>

              <div className="p-6 pt-2">
                <div className="flex items-baseline justify-between gap-3 mb-3">
                  <h3 className="font-oswald font-bold text-white text-xl leading-tight">
                    {s.name}
                  </h3>
                  <div className="text-orange-400 font-oswald font-bold text-sm whitespace-nowrap">
                    {s.price}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 mb-4">
                  <Row icon="Layers" label="Грунт" value={s.forSoils} />
                  <Row icon="Weight" label="Нагрузка" value={s.forLoad} />
                  <Row icon="Ruler" label="Параметры" value={s.depth} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-orange-400 text-[10px] uppercase tracking-wider mb-1.5 font-semibold">
                      Плюсы
                    </div>
                    <ul className="space-y-1">
                      {s.pros.map((pr) => (
                        <li
                          key={pr}
                          className="flex items-start gap-1.5 text-white/65 text-[11px] leading-snug"
                        >
                          <Icon
                            name="Check"
                            size={11}
                            className="text-green-400 flex-shrink-0 mt-0.5"
                          />
                          <span>{pr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5 font-semibold">
                      Минусы
                    </div>
                    <ul className="space-y-1">
                      {s.cons.map((cn) => (
                        <li
                          key={cn}
                          className="flex items-start gap-1.5 text-white/45 text-[11px] leading-snug"
                        >
                          <Icon
                            name="X"
                            size={11}
                            className="text-white/30 flex-shrink-0 mt-0.5"
                          />
                          <span>{cn}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-[#141720] border border-orange-500/20 rounded-2xl p-5 flex items-start gap-4">
          <Icon
            name="Shovel"
            size={22}
            className="text-orange-400 flex-shrink-0 mt-1"
          />
          <div className="text-white/65 text-xs leading-relaxed">
            <span className="text-white font-medium">
              Бесплатный анализ грунта при выезде замерщика.
            </span>{" "}
            На объекте проверяем плотность, уровень грунтовых вод и
            промерзание. Подбираем основание под нагрузку именно вашего забора
            или ворот. Под противовесы откатных ворот применяем
            винтовые сваи Ø 108 × 2500 мм, длина 2 метра — стандарт под
            компенсацию веса полотна.
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 text-xs">
      <Icon
        name={icon}
        size={14}
        className="text-orange-400 flex-shrink-0 mt-0.5"
      />
      <div>
        <span className="text-white/40 mr-1.5">{label}:</span>
        <span className="text-white/75">{value}</span>
      </div>
    </div>
  );
}

// ───────────────────────── SVG-СХЕМЫ ─────────────────────────

function DiagramFrame({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 320 200"
      className="w-full h-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Земля (фон) */}
      <defs>
        <linearGradient id="groundGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3d2f1f" />
          <stop offset="100%" stopColor="#1f1810" />
        </linearGradient>
        <pattern
          id="soilDots"
          x="0"
          y="0"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="0.7" fill="#5a4530" />
          <circle cx="6" cy="6" r="0.5" fill="#4a3825" />
        </pattern>
      </defs>

      {/* Небо */}
      <rect x="0" y="0" width="320" height="70" fill="#0a0c10" />
      {/* Уровень земли */}
      <line
        x1="0"
        y1="70"
        x2="320"
        y2="70"
        stroke="#f97316"
        strokeWidth="0.8"
        strokeDasharray="2,2"
      />
      <text x="6" y="66" fontSize="7" fill="#f97316" fontFamily="sans-serif">
        0,00 — уровень земли
      </text>
      {/* Грунт */}
      <rect x="0" y="70" width="320" height="130" fill="url(#groundGrad)" />
      <rect x="0" y="70" width="320" height="130" fill="url(#soilDots)" />

      {/* Глубина промерзания */}
      <line
        x1="0"
        y1="135"
        x2="320"
        y2="135"
        stroke="#22d3ee"
        strokeWidth="0.4"
        strokeDasharray="3,3"
      />
      <text x="6" y="132" fontSize="6" fill="#22d3ee" fontFamily="sans-serif">
        −1,40 м · граница промерзания
      </text>

      {children}
    </svg>
  );
}

function DiagramButi() {
  return (
    <DiagramFrame>
      {/* Столб */}
      <rect x="150" y="20" width="10" height="100" fill="#94a3b8" />
      <rect x="148" y="18" width="14" height="4" fill="#cbd5e1" />
      {/* Скважина со щебнем */}
      <path
        d="M 142 70 L 142 145 L 168 145 L 168 70 Z"
        fill="#1a1f2e"
        stroke="#475569"
        strokeWidth="0.5"
      />
      {/* Щебень — россыпь камешков */}
      {[
        [145, 80],
        [155, 78],
        [163, 82],
        [148, 88],
        [158, 90],
        [144, 96],
        [162, 98],
        [150, 102],
        [156, 108],
        [146, 114],
        [164, 116],
        [152, 122],
        [160, 128],
        [148, 134],
        [156, 140],
      ].map(([cx, cy], i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={2.2}
          ry={1.6}
          fill="#8b95a7"
          stroke="#475569"
          strokeWidth="0.3"
        />
      ))}
      {/* Подписи */}
      <line
        x1="175"
        y1="70"
        x2="195"
        y2="70"
        stroke="#f97316"
        strokeWidth="0.4"
      />
      <line
        x1="175"
        y1="145"
        x2="195"
        y2="145"
        stroke="#f97316"
        strokeWidth="0.4"
      />
      <line
        x1="195"
        y1="70"
        x2="195"
        y2="145"
        stroke="#f97316"
        strokeWidth="0.4"
      />
      <text
        x="200"
        y="110"
        fontSize="8"
        fill="#f97316"
        fontFamily="sans-serif"
      >
        1,2 м
      </text>
      <text
        x="200"
        y="120"
        fontSize="6"
        fill="#9ca3af"
        fontFamily="sans-serif"
      >
        Ø 200 мм
      </text>
      <text x="100" y="35" fontSize="8" fill="#fff" fontFamily="sans-serif">
        Профтруба
      </text>
      <text x="100" y="44" fontSize="7" fill="#9ca3af" fontFamily="sans-serif">
        60×60×2 мм
      </text>
      <text x="40" y="170" fontSize="7" fill="#cbd5e1" fontFamily="sans-serif">
        Щебень фр. 20–40
      </text>
      <text x="40" y="180" fontSize="6" fill="#9ca3af" fontFamily="sans-serif">
        утрамбовка послойно
      </text>
    </DiagramFrame>
  );
}

function DiagramConcrete() {
  return (
    <DiagramFrame>
      {/* Столб */}
      <rect x="150" y="20" width="10" height="120" fill="#94a3b8" />
      <rect x="148" y="18" width="14" height="4" fill="#cbd5e1" />
      {/* Бетонный «стакан» */}
      <path
        d="M 138 70 L 138 150 L 172 150 L 172 70 Z"
        fill="#6b7280"
        stroke="#9ca3af"
        strokeWidth="0.5"
      />
      {/* Бетонная текстура */}
      {[
        [142, 78],
        [165, 82],
        [148, 92],
        [160, 96],
        [144, 108],
        [168, 112],
        [152, 120],
        [158, 132],
        [146, 142],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={1} fill="#4b5563" />
      ))}
      {/* Песчаная подушка */}
      <rect x="138" y="150" width="34" height="6" fill="#d4a574" />
      <text x="180" y="156" fontSize="6" fill="#d4a574" fontFamily="sans-serif">
        Песок ПГС
      </text>
      {/* Подписи размеров */}
      <line
        x1="178"
        y1="70"
        x2="198"
        y2="70"
        stroke="#f97316"
        strokeWidth="0.4"
      />
      <line
        x1="178"
        y1="150"
        x2="198"
        y2="150"
        stroke="#f97316"
        strokeWidth="0.4"
      />
      <line
        x1="198"
        y1="70"
        x2="198"
        y2="150"
        stroke="#f97316"
        strokeWidth="0.4"
      />
      <text
        x="203"
        y="115"
        fontSize="8"
        fill="#f97316"
        fontFamily="sans-serif"
      >
        1,4 м
      </text>
      <text
        x="203"
        y="125"
        fontSize="6"
        fill="#9ca3af"
        fontFamily="sans-serif"
      >
        Ø 250 мм
      </text>
      <text x="100" y="35" fontSize="8" fill="#fff" fontFamily="sans-serif">
        Профтруба
      </text>
      <text x="100" y="44" fontSize="7" fill="#9ca3af" fontFamily="sans-serif">
        60×60×3 мм
      </text>
      <text x="20" y="170" fontSize="7" fill="#cbd5e1" fontFamily="sans-serif">
        Бетон М300
      </text>
      <text x="20" y="180" fontSize="6" fill="#9ca3af" fontFamily="sans-serif">
        ГОСТ 26633-2015 · F150 W6
      </text>
    </DiagramFrame>
  );
}

function DiagramTape() {
  return (
    <DiagramFrame>
      {/* Два столба */}
      <rect x="80" y="20" width="9" height="80" fill="#94a3b8" />
      <rect x="231" y="20" width="9" height="80" fill="#94a3b8" />
      {/* Лента — выходит над землёй */}
      <rect
        x="40"
        y="60"
        width="240"
        height="40"
        fill="#6b7280"
        stroke="#9ca3af"
        strokeWidth="0.4"
      />
      {/* Подземная часть ленты */}
      <rect
        x="40"
        y="100"
        width="240"
        height="20"
        fill="#6b7280"
        stroke="#9ca3af"
        strokeWidth="0.4"
      />
      {/* Армокаркас — 4 нитки */}
      <line
        x1="50"
        y1="68"
        x2="270"
        y2="68"
        stroke="#fbbf24"
        strokeWidth="0.8"
      />
      <line
        x1="50"
        y1="78"
        x2="270"
        y2="78"
        stroke="#fbbf24"
        strokeWidth="0.8"
      />
      <line
        x1="50"
        y1="112"
        x2="270"
        y2="112"
        stroke="#fbbf24"
        strokeWidth="0.8"
      />
      {/* Хомуты */}
      {[60, 100, 140, 180, 220, 260].map((x) => (
        <rect
          key={x}
          x={x}
          y="66"
          width="0.6"
          height="48"
          fill="#fbbf24"
          opacity="0.7"
        />
      ))}
      {/* Подушка */}
      <rect x="40" y="120" width="240" height="5" fill="#d4a574" />
      {/* Размеры */}
      <line
        x1="285"
        y1="60"
        x2="300"
        y2="60"
        stroke="#f97316"
        strokeWidth="0.4"
      />
      <line
        x1="285"
        y1="100"
        x2="300"
        y2="100"
        stroke="#f97316"
        strokeWidth="0.4"
      />
      <line
        x1="300"
        y1="60"
        x2="300"
        y2="100"
        stroke="#f97316"
        strokeWidth="0.4"
      />
      <text
        x="303"
        y="83"
        fontSize="7"
        fill="#f97316"
        fontFamily="sans-serif"
      >
        40 см
      </text>
      <line
        x1="285"
        y1="100"
        x2="300"
        y2="100"
        stroke="#22d3ee"
        strokeWidth="0.4"
      />
      <line
        x1="285"
        y1="125"
        x2="300"
        y2="125"
        stroke="#22d3ee"
        strokeWidth="0.4"
      />
      <line
        x1="300"
        y1="100"
        x2="300"
        y2="125"
        stroke="#22d3ee"
        strokeWidth="0.4"
      />
      <text
        x="303"
        y="118"
        fontSize="7"
        fill="#22d3ee"
        fontFamily="sans-serif"
      >
        25 см
      </text>
      <text x="20" y="40" fontSize="8" fill="#fff" fontFamily="sans-serif">
        Армокаркас 4×Ø12
      </text>
      <text x="20" y="50" fontSize="7" fill="#fbbf24" fontFamily="sans-serif">
        А500С · хомут Ø8/300
      </text>
      <text x="20" y="170" fontSize="7" fill="#cbd5e1" fontFamily="sans-serif">
        Ростверк 200×400 мм
      </text>
      <text x="20" y="180" fontSize="6" fill="#9ca3af" fontFamily="sans-serif">
        Бетон В22.5 · СП 63.13330.2018
      </text>
    </DiagramFrame>
  );
}

function DiagramPiles() {
  return (
    <DiagramFrame>
      {/* Свая Ø 86 */}
      <g>
        <rect x="80" y="55" width="6" height="125" fill="#3b4453" />
        <rect x="78" y="50" width="10" height="5" fill="#cbd5e1" />
        {/* Лопасть */}
        <path d="M 76 175 L 86 180 L 96 175 L 86 180 Z" fill="#475569" />
        <ellipse cx="83" cy="180" rx="10" ry="2.5" fill="#475569" />
        {/* Спираль вдоль ствола */}
        <path
          d="M 80 60 L 86 62 L 80 64 L 86 66 L 80 68 L 86 70 L 80 72 L 86 74 L 80 76 L 86 78"
          stroke="#64748b"
          strokeWidth="0.4"
          fill="none"
        />
      </g>
      {/* Свая Ø 108 (более крупная) */}
      <g>
        <rect x="220" y="40" width="10" height="155" fill="#3b4453" />
        <rect x="217" y="35" width="16" height="5" fill="#cbd5e1" />
        {/* Лопасть крупнее */}
        <path d="M 213 188 L 225 195 L 237 188 L 225 195 Z" fill="#475569" />
        <ellipse cx="225" cy="195" rx="14" ry="3" fill="#475569" />
      </g>

      {/* Размеры — для Ø86 */}
      <line
        x1="100"
        y1="70"
        x2="115"
        y2="70"
        stroke="#f97316"
        strokeWidth="0.4"
      />
      <line
        x1="100"
        y1="180"
        x2="115"
        y2="180"
        stroke="#f97316"
        strokeWidth="0.4"
      />
      <line
        x1="115"
        y1="70"
        x2="115"
        y2="180"
        stroke="#f97316"
        strokeWidth="0.4"
      />
      <text
        x="118"
        y="128"
        fontSize="8"
        fill="#f97316"
        fontFamily="sans-serif"
      >
        2,0 м
      </text>
      <text x="50" y="45" fontSize="8" fill="#fff" fontFamily="sans-serif">
        Свая Ø 86
      </text>
      <text x="50" y="55" fontSize="6" fill="#9ca3af" fontFamily="sans-serif">
        Заборы, лёгкие ворота
      </text>

      {/* Размеры — для Ø108 */}
      <line
        x1="245"
        y1="70"
        x2="260"
        y2="70"
        stroke="#22d3ee"
        strokeWidth="0.4"
      />
      <line
        x1="245"
        y1="195"
        x2="260"
        y2="195"
        stroke="#22d3ee"
        strokeWidth="0.4"
      />
      <line
        x1="260"
        y1="70"
        x2="260"
        y2="195"
        stroke="#22d3ee"
        strokeWidth="0.4"
      />
      <text
        x="263"
        y="135"
        fontSize="8"
        fill="#22d3ee"
        fontFamily="sans-serif"
      >
        2,5 м
      </text>
      <text x="200" y="25" fontSize="8" fill="#fff" fontFamily="sans-serif">
        Свая Ø 108
      </text>
      <text x="200" y="33" fontSize="6" fill="#9ca3af" fontFamily="sans-serif">
        Противовес откатных
      </text>
    </DiagramFrame>
  );
}
