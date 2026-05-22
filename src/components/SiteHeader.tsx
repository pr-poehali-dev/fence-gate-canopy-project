import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import SiteLogo from "@/components/SiteLogo";
import { useLeadModal } from "@/hooks/useLeadModal";
import { useSiteMenu } from "@/hooks/useSiteMenu";
import { usePageContent } from "@/hooks/usePageContent";

export default function SiteHeader() {
  const { open: openLead } = useLeadModal();
  const menu = useSiteMenu();
  const cms = usePageContent("site");
  const phone = cms("contact_phone", "+7 (495) 123-45-67");
  const phoneTel = phone.replace(/[^+\d]/g, "");
  const workHours = cms("work_hours", "Пн-Вс 9:00–21:00");
  const region = cms("region", "Москва и МО");

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
    <header className="sticky top-0 z-50 bg-[#0a0c10]/95 backdrop-blur border-b border-[#1e2230]">
      <div className="hidden md:block bg-[#070809] border-b border-[#1e2230]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between text-[11px] text-white/50">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Icon name="MapPin" size={11} className="text-orange-400" /> {region}</span>
            <span className="flex items-center gap-1"><Icon name="Clock" size={11} className="text-orange-400" /> {workHours}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={`tel:${phoneTel}`} className="hover:text-orange-400 flex items-center gap-1">
              <Icon name="Phone" size={11} /> {phone}
            </a>
            <Link to="/admin" className="hover:text-orange-400 opacity-50 hover:opacity-100">
              Админ
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-6">
        <SiteLogo />

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
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isOpen ? "text-orange-400 bg-[#141720]" : "text-white/80 hover:text-orange-400"
                  }`}
                >
                  {cat.icon && <Icon name={cat.icon} size={14} />}
                  {cat.label}
                  <Icon name="ChevronDown" size={12} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 w-80 bg-[#0a0c10] border border-[#1e2230] rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
                    onClick={e => e.stopPropagation()}
                  >
                    {cat.href && (
                      <Link
                        to={cat.href}
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
                          key={item.id}
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
                          {item.description && (
                            <div className="text-[11px] text-white/40 mt-0.5">{item.description}</div>
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
          <a
            href={`tel:${phoneTel}`}
            className="hidden md:flex items-center gap-1.5 text-white/80 hover:text-orange-400 text-sm font-bold"
          >
            <Icon name="Phone" size={14} />
            <span className="hidden xl:inline">{phone}</span>
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
              {menu.map(cat => {
                const isOpen = mobileCat === cat.id;
                return (
                  <div key={cat.id} className="border-b border-[#1e2230]">
                    <button
                      onClick={() => setMobileCat(isOpen ? null : cat.id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-white hover:bg-[#141720]"
                    >
                      <span className="flex items-center gap-2.5">
                        {cat.icon && <Icon name={cat.icon} size={16} className="text-orange-400" />}
                        <span className="font-medium">{cat.label}</span>
                      </span>
                      <Icon name="ChevronDown" size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="bg-[#070809]">
                        {cat.href && (
                          <Link
                            to={cat.href}
                            className="block px-6 py-2.5 text-orange-400 text-sm font-bold border-b border-[#1e2230]"
                          >
                            Все {cat.label.toLowerCase()} →
                          </Link>
                        )}
                        {cat.items.map(item => (
                          <Link
                            key={item.id}
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
                            {item.description && <div className="text-[10px] text-white/30 mt-0.5">{item.description}</div>}
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
                href={`tel:${phoneTel}`}
                className="flex items-center justify-center gap-2 w-full bg-[#141720] border border-[#1e2230] text-white py-3 rounded-lg font-bold"
              >
                <Icon name="Phone" size={16} className="text-orange-400" />
                {phone}
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
