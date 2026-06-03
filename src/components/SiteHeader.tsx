import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useLeadModal } from "@/hooks/useLeadModal";
import { useSiteMenu } from "@/hooks/useSiteMenu";
import { useCompany } from "@/hooks/useCompany";

export default function SiteHeader() {
  const { open: openLead } = useLeadModal();
  const menu = useSiteMenu();
  const company = useCompany();
  const phone = company.phone;
  const phoneTel = company.phoneE164;
  const workHours = company.schedule;
  const region = company.region;

  const [openCat, setOpenCat] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCat, setMobileCat] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();

  useEffect(() => {
    setOpenCat(null);
    setMobileOpen(false);
    setMobileCat(null);
  }, [location.pathname]);

  useEffect(() => {
    const onClick = () => setOpenCat(null);
    if (openCat) {
      document.addEventListener("click", onClick);
      return () => document.removeEventListener("click", onClick);
    }
  }, [openCat]);

  const handleEnter = (id: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenCat(id);
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpenCat(null), 150);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="hidden md:block bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between text-[12px] text-gray-600">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5"><Icon name="MapPin" size={12} className="text-orange-500" />{region}</span>
            <span className="flex items-center gap-1.5"><Icon name="Clock" size={12} className="text-orange-500" />{workHours}</span>
            <Link to="/reviews" className="hover:text-orange-500">Отзывы</Link>
            <Link to="/shemy-chertezi" className="hover:text-orange-500">Схемы и чертежи</Link>
          </div>
          <div className="flex items-center gap-3">
            <a href={`tel:${phoneTel}`} className="hover:text-orange-500 flex items-center gap-1 font-semibold">
              <Icon name="Phone" size={12} /> {phone}
            </a>
            <Link to="/admin" className="hover:text-orange-500 opacity-40 hover:opacity-100">Админ</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src="https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/bucket/33123399-f344-46dc-adea-1165734f8f3f.png"
            alt="СТАЛЬ ГРУП — заборы, ворота, навесы под ключ"
            className="h-16 sm:h-20 w-auto"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {menu.map(cat => {
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
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[14px] font-semibold transition-colors ${
                    isOpen ? "text-orange-500 bg-orange-50" : "text-gray-700 hover:text-orange-500"
                  }`}
                >
                  {cat.icon && <Icon name={cat.icon} size={15} />}
                  {cat.label}
                  <Icon name="ChevronDown" size={12} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
                    onClick={e => e.stopPropagation()}
                  >
                    {cat.href && (
                      <Link
                        to={cat.href}
                        className="block px-4 py-3 bg-orange-500 text-white font-bold text-sm hover:bg-orange-600"
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
                          key={item.id}
                          to={item.href}
                          className="block px-3 py-2.5 rounded-lg hover:bg-orange-50 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-900 text-sm font-semibold group-hover:text-orange-600">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <div className="text-[11px] text-gray-500 mt-0.5">{item.description}</div>
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

        <div className="flex items-center gap-2">
          <a href={`tel:${phoneTel}`} className="hidden md:flex flex-col items-end leading-tight">
            <span className="text-gray-900 font-bold text-base">{phone}</span>
            <span className="text-[11px] text-gray-500">бесплатный звонок</span>
          </a>
          <button
            onClick={() => openLead("site-header")}
            className="hidden sm:inline-flex bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-5 py-2.5 rounded-lg items-center gap-2 shadow-md shadow-orange-500/30 hover:shadow-lg transition-all"
          >
            <Icon name="Phone" size={14} />
            Заказать звонок
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center"
          >
            <Icon name="Menu" size={20} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <img
                  src="https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/bucket/33123399-f344-46dc-adea-1165734f8f3f.png"
                  alt="СТАЛЬ ГРУП"
                  className="h-14 w-auto"
                />
              </div>
              <button onClick={() => setMobileOpen(false)} className="w-10 h-10 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="overflow-auto flex-1">
              {menu.map(cat => {
                const isOpen = mobileCat === cat.id;
                return (
                  <div key={cat.id} className="border-b border-gray-100">
                    <button
                      onClick={() => setMobileCat(isOpen ? null : cat.id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-gray-900 hover:bg-orange-50"
                    >
                      <span className="flex items-center gap-2.5">
                        {cat.icon && <Icon name={cat.icon} size={16} className="text-orange-500" />}
                        <span className="font-semibold">{cat.label}</span>
                      </span>
                      <Icon name="ChevronDown" size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="bg-gray-50">
                        {cat.href && (
                          <Link to={cat.href} className="block px-6 py-2.5 text-orange-600 text-sm font-bold border-b border-gray-200">
                            Все {cat.label.toLowerCase()} →
                          </Link>
                        )}
                        {cat.items.map(item => (
                          <Link
                            key={item.id}
                            to={item.href}
                            className="block px-6 py-2.5 text-gray-700 text-sm hover:text-orange-500 border-b border-gray-100 last:border-0"
                          >
                            <div className="flex items-center justify-between">
                              {item.label}
                              {item.badge && (
                                <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">{item.badge}</span>
                              )}
                            </div>
                            {item.description && <div className="text-[10px] text-gray-500 mt-0.5">{item.description}</div>}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-gray-200 space-y-2">
              <a href={`tel:${phoneTel}`} className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-bold">
                <Icon name="Phone" size={16} className="text-orange-500" />
                {phone}
              </a>
              <button
                onClick={() => { setMobileOpen(false); openLead("mobile-header"); }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
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