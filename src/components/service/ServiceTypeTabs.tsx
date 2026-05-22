import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

export interface ServiceTypeTab {
  slug:      string;   // якорь без #, например "tab-rostverk"
  label:     string;   // короткое название таба
  icon:      string;   // имя lucide-иконки
  shortDesc: string;   // подпись 1-2 слова под названием
  badge?:    string;   // опциональная плашка "Рекомендуем" / "Премиум" и т.п.
}

interface Props {
  /** Список табов с типами услуги. */
  types:       ServiceTypeTab[];
  /** Slug активного таба (без #). */
  activeSlug:  string;
  /** Базовый путь страницы (например, "/uslugi/fundamenty"). */
  basePath:    string;
  /** Заголовок над лентой табов. */
  title?:      string;
  /** Подзаголовок. */
  subtitle?:   string;
}

/**
 * Горизонтальная лента табов — для группировки типов внутри одной услуги.
 * Каждый таб — это <Link> к якорю внутри текущей страницы.
 * Активный таб подсвечивается оранжевой обводкой + фоном.
 */
export default function ServiceTypeTabs({
  types,
  activeSlug,
  basePath,
  title,
  subtitle,
}: Props) {
  return (
    <section className="py-10 sm:py-14 bg-[#0a0c10] border-y border-[#1e2230]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="text-center mb-8">
            {title && (
              <h2 className="font-oswald font-bold text-2xl sm:text-3xl text-white mb-2">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-white/50 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* На мобиле — горизонтальный скролл, на десктопе — flex по центру */}
        <div className="-mx-4 sm:mx-0 overflow-x-auto sm:overflow-visible no-scrollbar">
          <div className="flex sm:flex-wrap sm:justify-center gap-3 sm:gap-4 px-4 sm:px-0 min-w-min">
            {types.map((t) => {
              const isActive = t.slug === activeSlug;
              return (
                <Link
                  key={t.slug}
                  to={`${basePath}#${t.slug}`}
                  className={`relative flex-shrink-0 w-[170px] sm:w-[200px] rounded-2xl border-2 p-4 sm:p-5 transition-all text-left ${
                    isActive
                      ? "bg-orange-500/10 border-orange-500 -translate-y-0.5 shadow-lg shadow-orange-500/10"
                      : "bg-[#141720] border-[#1e2230] hover:border-orange-500/50 hover:-translate-y-0.5"
                  }`}
                >
                  {t.badge && (
                    <div className="absolute -top-2 left-3 bg-orange-500 text-gray-900 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                      {t.badge}
                    </div>
                  )}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                      isActive
                        ? "bg-orange-500 text-gray-900"
                        : "bg-orange-500/10 text-orange-400"
                    }`}
                  >
                    <Icon name={t.icon} size={20} />
                  </div>
                  <div
                    className={`font-oswald font-bold text-base sm:text-lg leading-tight mb-1 ${
                      isActive ? "text-orange-400" : "text-white"
                    }`}
                  >
                    {t.label}
                  </div>
                  <div className="text-white/45 text-xs leading-snug">
                    {t.shortDesc}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
