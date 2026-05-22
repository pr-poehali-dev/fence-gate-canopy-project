import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import SiteLogo from "@/components/SiteLogo";
import { useLeadModal } from "@/hooks/useLeadModal";

// ── Каталог в стиле Мастеровит/GrandLine: 7 категорий, внутри — типы ──────────
interface MenuItem {
  label: string;
  href: string;
  badge?: string;
  desc?: string;
}
interface MenuCategory {
  id: string;
  label: string;
  icon: string;
  items: MenuItem[];
  /** Главная ссылка на «всё» в категории, если есть */
  rootHref?: string;
}

const MENU: MenuCategory[] = [
  {
    id: "fences",
    label: "Заборы",
    icon: "Fence",
    items: [
      { label: "Из профнастила", href: "/services/profnastil",   desc: "От 1 450 ₽/м.п. · Глухой" },
      { label: "Евроштакетник",  href: "/services/shtaketnik",   desc: "От 1 850 ₽/м.п. · Полупрозрачный" },
      { label: "3D-сетка",        href: "/services/3d-setka",     desc: "От 1 200 ₽/м.п. · Эконом" },
      { label: "Ковка",           href: "/services/kovka",        desc: "От 4 800 ₽/м.п. · Премиум", badge: "Премиум" },
      { label: "Сетка-рабица",    href: "/services/setka-rabitsa",desc: "От 650 ₽/м.п. · Дача" },
    ],
  },
  {
    id: "gates",
    label: "Ворота и калитки",
    icon: "DoorOpen",
    items: [
      { label: "Откатные ворота",   href: "/services/otkatnye-vorota",   desc: "От 45 000 ₽ · Автоматика" },
      { label: "Распашные ворота",  href: "/services/raspashnye-vorota", desc: "От 28 000 ₽ · Классика" },
      { label: "Калитки",           href: "/services/kalitki",           desc: "От 7 500 ₽ · С замком" },
    ],
  },
  {
    id: "shelters",
    label: "Навесы и беседки",
    icon: "Home",
    items: [
      { label: "Навесы для авто", href: "/services/navesy",  desc: "От 18 000 ₽/м² · Поликарбонат" },
      { label: "Беседки",         href: "/services/besedki", desc: "От 65 000 ₽ · Под ключ" },
    ],
  },
  {
    id: "foundations",
    label: "Фундаменты",
    icon: "Layers",
    rootHref: "/services/fundamenty",
    items: [
      { label: "Бетонирование",     href: "/services/fundamenty#tab-betonirovanie", desc: "Универсал · М300 · 1.2 м",  badge: "Рекомендуем" },
      { label: "Бутование щебнем",  href: "/services/fundamenty#tab-butovanie",     desc: "Лёгкие заборы · сухие грунты" },
      { label: "Винтовые сваи",     href: "/services/fundamenty#tab-svai",          desc: "Торф · болото · круглый год" },
      { label: "Ленточный ростверк", href: "/services/fundamenty#tab-rostverk",     desc: "Тяжёлые заборы · 50+ лет",  badge: "Премиум" },
    ],
  },
  {
    id: "posts",
    label: "Столбы",
    icon: "Building",
    rootHref: "/uslugi/stolby",
    items: [
      { label: "Из профильной трубы", href: "/uslugi/stolby#tab-proftruba", desc: "От 1 200 ₽ · Стандарт" },
      { label: "Кирпичные",            href: "/uslugi/stolby#tab-kirpich",   desc: "От 8 500 ₽/м.п. · Премиум", badge: "Премиум" },
      { label: "Из блоков",            href: "/uslugi/stolby#tab-bloki",     desc: "От 6 500 ₽/м.п. · Выгодно" },
    ],
  },
  {
    id: "landscape",
    label: "Благоустройство",
    icon: "Trees",
    items: [
      { label: "Бетонные площадки", href: "/services/betonnye-ploschadki", desc: "От 2 200 ₽/м² · Парковка, дорожки" },
      { label: "Заезд на участок",  href: "/services/zaezd-na-uchastok",   desc: "От 18 000 ₽ · Под ключ" },
    ],
  },
  {
    id: "info",
    label: "Информация",
    icon: "FileText",
    items: [
      { label: "Схемы и чертежи", href: "/shemy-chertezi", desc: "Каталог технических узлов" },
      { label: "Отзывы клиентов", href: "/reviews",        desc: "Отзывы и оценки работ" },
    ],
  },
];

// ────────────────────────────────────────────────────────────────────────────
export default function SiteHeader() {
  const { open: openLead } = useLeadModal();
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCat, setMobileCat] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();

  // Закрываем меню при смене страницы
  useEffect(() => {
    setOpenCat(null);
    setMobileOpen(false);
    setMobileCat(null);
  }, [location.pathname]);

  // Закрытие по клику снаружи
  useEffect(() => {
    const onClick = () => setOpenCat(null);
    if (openCat) {
      document.addEventListener("click", onClick);
      return () => document.removeEventListener("click", onClick);
    }
  }, [openCat]);

  const handleEnter = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenCat(id);
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpenCat(null), 150);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0a0c10]/95 backdrop-blur border-b border-[#1e2230]">
      {/* Верхняя полоска контактов */}
      <div className="hidden md:block bg-[#070809] border-b border-[#1e2230]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between text-[11px] text-white/50">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Icon name="MapPin" size={11} className="text-orange-400" /> Москва и МО</span>
            <span className="flex items-center gap-1"><Icon name="Clock" size={11} className="text-orange-400" /> Пн-Вс 9:00–21:00</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:+74951234567" className="hover:text-orange-400 flex items-center gap-1">
              <Icon name="Phone" size={11} /> +7 (495) 123-45-67
            </a>
            <Link to="/admin" className="hover:text-orange-400 opacity-50 hover:opacity-100">
              Админ
            </Link>
          </div>
        </div>
      </div>

      {/* Основная строка меню */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-6">
        <SiteLogo />

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {MENU.map(cat => {
            const isOpen = openCat === cat.id;
            return (
              <div
                key={cat.id}
                className="relative"
                onMouseEnter={() => handleEnter(cat.id)}
                onMouseLeave={handleLeave}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenCat(isOpen ? null : cat.id); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isOpen ? "text-orange-400 bg-[#141720]" : "text-white/80 hover:text-orange-400"
                  }`}
                >
                  <Icon name={cat.icon} size={14} />
                  {cat.label}
                  <Icon name="ChevronDown" size={12} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Выпадашка */}
                {isOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 w-80 bg-[#0a0c10] border border-[#1e2230] rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
                    onClick={e => e.stopPropagation()}
                  >
                    {cat.rootHref && (
                      <Link
                        to={cat.rootHref}
                        className="block px-4 py-3 bg-orange-500/10 border-b border-orange-500/20 text-orange-400 font-bold text-sm hover:bg-orange-500/20"
                      >
                        <div className="flex items-center justify-between">
                          <span>Все {cat.label.toLowerCase()}</span>
                          <Icon name="ArrowRight" size={14} />
                        </div>
                      </Link>
                    )}
                    <div className="p-2">
                      {cat.items.map(item => (
                        <Link
                          key={item.href}
                          to={item.href}
                          className="block px-3 py-2.5 rounded-lg hover:bg-[#141720] transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-medium group-hover:text-orange-400">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded font-bold">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.desc && (
                            <div className="text-[11px] text-white/40 mt-0.5">{item.desc}</div>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Кнопка CTA + мобильное меню */}
        <div className="flex items-center gap-2">
          <a
            href="tel:+74951234567"
            className="hidden md:flex items-center gap-1.5 text-white/80 hover:text-orange-400 text-sm font-bold"
          >
            <Icon name="Phone" size={14} />
            <span className="hidden xl:inline">+7 (495) 123-45-67</span>
          </a>
          <button
            onClick={() => openLead("site-header")}
            className="hidden sm:inline-flex bg-orange-500 hover:bg-orange-400 text-gray-900 font-bold text-sm px-4 py-2.5 rounded-lg items-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <Icon name="Calculator" size={14} />
            Замер бесплатно
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-10 h-10 rounded-lg border border-[#1e2230] text-white flex items-center justify-center"
          >
            <Icon name="Menu" size={20} />
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/80" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[#0a0c10] border-l border-[#1e2230] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2230]">
              <SiteLogo />
              <button
                onClick={() => setMobileOpen(false)}
                className="w-10 h-10 rounded-lg border border-[#1e2230] text-white flex items-center justify-center"
              >
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="overflow-auto flex-1">
              {MENU.map(cat => {
                const isOpen = mobileCat === cat.id;
                return (
                  <div key={cat.id} className="border-b border-[#1e2230]">
                    <button
                      onClick={() => setMobileCat(isOpen ? null : cat.id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-white hover:bg-[#141720]"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon name={cat.icon} size={16} className="text-orange-400" />
                        <span className="font-medium">{cat.label}</span>
                      </span>
                      <Icon name="ChevronDown" size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="bg-[#070809]">
                        {cat.rootHref && (
                          <Link
                            to={cat.rootHref}
                            className="block px-6 py-2.5 text-orange-400 text-sm font-bold border-b border-[#1e2230]"
                          >
                            Все {cat.label.toLowerCase()} →
                          </Link>
                        )}
                        {cat.items.map(item => (
                          <Link
                            key={item.href}
                            to={item.href}
                            className="block px-6 py-2.5 text-white/80 text-sm hover:text-orange-400 border-b border-[#141720] last:border-0"
                          >
                            <div className="flex items-center justify-between">
                              {item.label}
                              {item.badge && (
                                <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded font-bold">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.desc && <div className="text-[10px] text-white/30 mt-0.5">{item.desc}</div>}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-[#1e2230] space-y-2">
              <a
                href="tel:+74951234567"
                className="flex items-center justify-center gap-2 w-full bg-[#141720] border border-[#1e2230] text-white py-3 rounded-lg font-bold"
              >
                <Icon name="Phone" size={16} className="text-orange-400" />
                +7 (495) 123-45-67
              </a>
              <button
                onClick={() => { setMobileOpen(false); openLead("mobile-header"); }}
                className="w-full bg-orange-500 hover:bg-orange-400 text-gray-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Icon name="Calculator" size={16} />
                Бесплатный замер
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
