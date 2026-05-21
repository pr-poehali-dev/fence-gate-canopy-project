import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";

type SoilType = "sand" | "loam" | "clay" | "peat" | "slope";
type LoadType = "light" | "medium" | "heavy";

interface Recommendation {
  foundation: string;
  reason: string;
  params: string;
  pricePerPoint: number;
  gost: string;
  badge: "ok" | "warn" | "premium";
}

const SOIL_OPTIONS: { value: SoilType; label: string; desc: string; icon: string }[] = [
  { value: "sand",  label: "Песок / супесь",  desc: "Сухой, дренирует, не вспучивает", icon: "Mountain" },
  { value: "loam",  label: "Суглинок",         desc: "Стандарт для МО, средне-пучинистый", icon: "Layers" },
  { value: "clay",  label: "Глина плотная",    desc: "Тяжёлая, сильно пучинистая", icon: "Cuboid" },
  { value: "peat",  label: "Торф / обводнённый", desc: "Болото, плывун, грунтовые воды", icon: "Droplets" },
  { value: "slope", label: "Склон / перепад",  desc: "Уклон более 5°, неровный участок", icon: "TrendingUp" },
];

const LOAD_OPTIONS: { value: LoadType; label: string; desc: string; icon: string }[] = [
  { value: "light",  label: "Лёгкая",   desc: "Рабица, 3D-сетка, штакетник до 1.8 м", icon: "Feather" },
  { value: "medium", label: "Средняя",  desc: "Профлист, штакетник 2 м, секционные",  icon: "Square" },
  { value: "heavy",  label: "Тяжёлая",  desc: "Откатные ворота, кованые, кирпич, фасад", icon: "Weight" },
];

function recommend(soil: SoilType, load: LoadType): Recommendation {
  // Матрица решений по СП 22.13330.2016
  if (soil === "peat" || (soil === "clay" && load === "heavy") || soil === "slope") {
    return {
      foundation: "Винтовые сваи Ø 108 × 2500 мм",
      reason:
        "Слабонесущий или сильнопучинистый грунт. Свая проходит насквозь нестабильные слои и опирается на плотный — гарантия от «выдавливания» зимой.",
      params: "Длина 2.5 м · Заглубление 2.0 м · Антикор горячее цинкование",
      pricePerPoint: 2950,
      gost: "ГОСТ Р 57414-2017 · СП 22.13330.2016",
      badge: "premium",
    };
  }
  if (soil === "loam" || (soil === "clay" && load !== "heavy")) {
    return {
      foundation: load === "heavy" ? "Ленточно-ростверковый 200×400" : "Бетонирование Ø 250 мм",
      reason:
        load === "heavy"
          ? "Тяжёлая конструкция на пучинистом грунте — ростверк распределяет нагрузку и не даёт забору «гулять»."
          : "Суглинок Московской области — стандартная задача. Бетон ниже промерзания (1.4 м) держит столб неподвижно.",
      params:
        load === "heavy"
          ? "Лента 200×400 мм · 4×Ø12 А500С · бетон B22.5 · глубина 0.5 м"
          : "Скважина Ø 250 · глубина 1.4 м · бетон М300 F150 W6",
      pricePerPoint: load === "heavy" ? 3200 : 1400,
      gost: "ГОСТ 26633-2015 · СП 63.13330.2018",
      badge: "ok",
    };
  }
  if (soil === "sand") {
    return {
      foundation: load === "light" ? "Бутование щебнем" : "Бетонирование Ø 250 мм",
      reason:
        load === "light"
          ? "Сухой песок не вспучивает — щебень дренирует и расклинивает столб. Самый бюджетный надёжный вариант."
          : "Под средне-тяжёлый забор на песке — стандартное бетонирование на 1.2 м.",
      params:
        load === "light"
          ? "Скважина Ø 200 мм · глубина 1.2 м · щебень фр. 20–40 с трамбовкой"
          : "Скважина Ø 250 · глубина 1.2 м · бетон М300",
      pricePerPoint: load === "light" ? 650 : 1250,
      gost: "СП 45.13330.2017",
      badge: "ok",
    };
  }
  // fallback
  return {
    foundation: "Бетонирование Ø 250 мм",
    reason: "Стандарт для большинства условий МО.",
    params: "Глубина 1.4 м · бетон М300",
    pricePerPoint: 1400,
    gost: "ГОСТ 26633-2015",
    badge: "ok",
  };
}

export default function SoilCalculator() {
  const [soil, setSoil] = useState<SoilType>("loam");
  const [load, setLoad] = useState<LoadType>("medium");
  const [length, setLength] = useState(50);

  const rec = useMemo(() => recommend(soil, load), [soil, load]);

  const postsCount = Math.ceil(length / 2.5);
  const totalCost = useMemo(() => {
    if (rec.foundation.includes("Ленточно")) {
      return rec.pricePerPoint * length;
    }
    return rec.pricePerPoint * postsCount;
  }, [rec, length, postsCount]);

  return (
    <section className="py-20 bg-[#0a0c10]" id="soil-calculator">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="section-tag">Подбор по грунту</span>
          <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-white mb-3">
            КАЛЬКУЛЯТОР <span className="text-orange-400">ФУНДАМЕНТА</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-sm">
            Укажите тип грунта и нагрузку — выдадим рекомендованное основание
            по СП 22.13330.2016, рассчитаем количество точек и стоимость.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Параметры */}
          <div className="space-y-6">
            <div>
              <div className="text-white/45 text-xs uppercase tracking-wider mb-3">
                1. Тип грунта на участке
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SOIL_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setSoil(o.value)}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${
                      soil === o.value
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-[#1e2230] bg-[#141720] hover:border-orange-500/40"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon
                        name={o.icon}
                        size={18}
                        className={soil === o.value ? "text-orange-400" : "text-white/40"}
                      />
                      <div className="flex-1">
                        <div className="text-white font-oswald font-semibold text-sm">
                          {o.label}
                        </div>
                        <div className="text-white/45 text-[11px] mt-0.5 leading-tight">
                          {o.desc}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-white/45 text-xs uppercase tracking-wider mb-3">
                2. Нагрузка на основание
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {LOAD_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setLoad(o.value)}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${
                      load === o.value
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-[#1e2230] bg-[#141720] hover:border-orange-500/40"
                    }`}
                  >
                    <Icon
                      name={o.icon}
                      size={18}
                      className={`mb-1.5 ${
                        load === o.value ? "text-orange-400" : "text-white/40"
                      }`}
                    />
                    <div className="text-white font-oswald font-semibold text-sm">
                      {o.label}
                    </div>
                    <div className="text-white/45 text-[11px] mt-0.5 leading-tight">
                      {o.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-white/45 text-xs uppercase tracking-wider mb-3">
                3. Длина забора, м
              </div>
              <div className="bg-[#141720] border border-[#1e2230] rounded-xl p-4">
                <input
                  type="range"
                  min={10}
                  max={300}
                  step={5}
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-white/40 text-xs">10 м</span>
                  <span className="font-oswald font-bold text-orange-400 text-2xl">
                    {length} м
                  </span>
                  <span className="text-white/40 text-xs">300 м</span>
                </div>
              </div>
            </div>
          </div>

          {/* Результат */}
          <div className="bg-gradient-to-br from-[#141720] to-[#0a0c10] border border-orange-500/30 rounded-3xl p-6 lg:p-7 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full -translate-y-20 translate-x-20 blur-2xl" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="section-tag">Рекомендация</span>
                <BadgeChip type={rec.badge} />
              </div>

              <h3 className="font-oswald font-bold text-white text-2xl sm:text-3xl leading-tight mb-3">
                {rec.foundation}
              </h3>

              <p className="text-white/65 text-sm leading-relaxed mb-5">
                {rec.reason}
              </p>

              <div className="space-y-2.5 mb-5">
                <ResultRow icon="Ruler" label="Параметры" value={rec.params} />
                <ResultRow icon="FileCheck" label="Норматив" value={rec.gost} />
                <ResultRow
                  icon="Hash"
                  label="Точек/п.м."
                  value={
                    rec.foundation.includes("Ленточно")
                      ? `${length} п.м. ленты`
                      : `${postsCount} столбов · шаг 2.5 м`
                  }
                />
              </div>

              <div className="border-t border-orange-500/20 pt-5">
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
                  Ориентировочная стоимость основания
                </div>
                <div className="font-oswald font-bold text-orange-400 text-4xl sm:text-5xl leading-none">
                  {totalCost.toLocaleString("ru-RU")} ₽
                </div>
                <div className="text-white/40 text-xs mt-2">
                  Финальная цена — после замера на объекте и проверки грунта.
                  Возможны скидки от 30 м.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Дисклеймер по нормам */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
          <NormCard
            code="СП 22.13330.2016"
            title="Основания зданий и сооружений"
            desc="Главный документ по выбору фундамента под нагрузку и грунт"
          />
          <NormCard
            code="ГОСТ Р 57414-2017"
            title="Сваи винтовые"
            desc="Технические условия, антикоррозийная защита, расчёт несущей способности"
          />
          <NormCard
            code="ГОСТ 26633-2015"
            title="Бетон тяжёлый"
            desc="М300 для МО, морозостойкость F150, водонепроницаемость W6"
          />
        </div>
      </div>
    </section>
  );
}

function ResultRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon name={icon} size={15} className="text-orange-400 flex-shrink-0 mt-0.5" />
      <div>
        <span className="text-white/40 mr-2">{label}:</span>
        <span className="text-white/85">{value}</span>
      </div>
    </div>
  );
}

function BadgeChip({ type }: { type: "ok" | "warn" | "premium" }) {
  const cfg = {
    ok: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", label: "Стандарт" },
    warn: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Внимание" },
    premium: { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", label: "Усиленный" },
  }[type];
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.color + "40" }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </div>
  );
}

function NormCard({
  code,
  title,
  desc,
}: {
  code: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-4 flex items-start gap-3">
      <Icon name="BookOpen" size={20} className="text-orange-400 flex-shrink-0 mt-0.5" />
      <div>
        <div className="text-orange-400 font-oswald font-bold text-sm">{code}</div>
        <div className="text-white text-sm mt-0.5 leading-tight">{title}</div>
        <div className="text-white/45 text-[11px] mt-1.5 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}
