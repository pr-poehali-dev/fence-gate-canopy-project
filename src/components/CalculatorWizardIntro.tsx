import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

interface Choice {
  id: "fence" | "gates" | "canopy";
  icon: string;
  title: string;
  desc: string;
  badge?: string;
}

const CHOICES: Choice[] = [
  { id: "fence",  icon: "Fence",     title: "Забор",         desc: "Профнастил, штакетник, 3D-сетка, ковка, рабица", badge: "Популярно" },
  { id: "gates",  icon: "DoorOpen",  title: "Ворота",        desc: "Откатные, распашные, секционные — с автоматикой" },
  { id: "canopy", icon: "Home",      title: "Навес / беседка", desc: "Арочные, двухскатные, односкатные, поликарбонат" },
];

interface Props {
  children: React.ReactNode;
  /** Свернуть калькулятор по умолчанию на мобильных */
  collapseOnMobile?: boolean;
}

/**
 * Вступительный wizard перед полным калькулятором.
 * Показывает 3 крупные кнопки выбора, по клику плавно раскрывает калькулятор ниже.
 * Калькулятор остаётся работать сам по себе — мы только управляем видимостью.
 */
export default function CalculatorWizardIntro({ children, collapseOnMobile = true }: Props) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [selected, setSelected] = useState<Choice["id"] | null>(null);

  // На десктопе по умолчанию показываем калькулятор сразу
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setExpanded(!collapseOnMobile || mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setExpanded(true);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [collapseOnMobile]);

  const handlePick = (id: Choice["id"]) => {
    setSelected(id);
    setExpanded(true);
    // плавно прокрутить к калькулятору
    setTimeout(() => {
      const el = document.getElementById("calc-form");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  return (
    <div>
      {/* Помощник: с чего начнём */}
      <div className="mb-6">
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1.5 mb-3">
            <Icon name="Sparkles" size={14} className="text-orange-400" />
            <span className="text-orange-400 text-xs font-semibold uppercase tracking-wider">Помощник</span>
          </div>
          <div className="font-oswald font-bold text-2xl sm:text-3xl text-white mb-1">
            С чего начнём расчёт?
          </div>
          <div className="text-white/45 text-sm">Выберите, что именно вам нужно — покажем только важные поля</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CHOICES.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => handlePick(c.id)}
              className={`group relative text-left p-4 sm:p-5 rounded-2xl border-2 transition-all ${
                selected === c.id
                  ? "border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10"
                  : "border-[#1e2230] bg-[#0d1017] hover:border-orange-500/50 hover:bg-orange-500/5"
              }`}
            >
              {c.badge && (
                <div className="absolute -top-2 right-3 bg-orange-500 text-gray-900 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                  {c.badge}
                </div>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all ${
                  selected === c.id ? "bg-orange-500 text-gray-900" : "bg-orange-500/15 text-orange-400 group-hover:bg-orange-500/25"
                }`}>
                  <Icon name={c.icon} size={22} />
                </div>
                <div className="font-oswald font-bold text-white text-lg">{c.title}</div>
              </div>
              <div className="text-white/55 text-xs leading-relaxed">{c.desc}</div>
              {selected === c.id && (
                <div className="absolute bottom-3 right-3 text-orange-400">
                  <Icon name="Check" size={18} />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Кнопка "показать/скрыть" — для мобилок */}
        <div className="flex items-center justify-center mt-4 lg:hidden">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 text-sm font-medium"
          >
            <Icon name={expanded ? "ChevronUp" : "ChevronDown"} size={16} />
            {expanded ? "Свернуть калькулятор" : "Открыть полный калькулятор"}
          </button>
        </div>
      </div>

      {/* Сам калькулятор */}
      <div
        id="calc-form"
        className={`transition-all duration-500 overflow-hidden ${
          expanded ? "max-h-none opacity-100" : "max-h-0 opacity-0 lg:max-h-none lg:opacity-100"
        }`}
        aria-hidden={!expanded}
      >
        {children}
      </div>
    </div>
  );
}
