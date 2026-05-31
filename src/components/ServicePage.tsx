import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import SiteHeader from "@/components/SiteHeader";
import { useLeadModal } from "@/hooks/useLeadModal";
import { generatePriceListPDF } from "@/lib/priceListPDF";
import { sendLead } from "@/lib/api";
import { usePageContent } from "@/hooks/usePageContent";
import { EditableText, EditableImage } from "@/components/InlineEditor";
import EditablePhoto from "@/components/EditablePhoto";
import QuickQuoteForm from "@/components/QuickQuoteForm";
import PaintLevels from "@/components/service/PaintLevels";
import FoundationSchemes from "@/components/service/FoundationSchemes";
import FenceAnatomy from "@/components/service/FenceAnatomy";
import GateSchemes from "@/components/service/GateSchemes";
import SoilCalculator from "@/components/service/SoilCalculator";
import NavesSpec from "@/components/service/NavesSpec";

// ─────────────────────────────────────────────────────────────────
// ТИПЫ ДАННЫХ ШАБЛОНА
// ─────────────────────────────────────────────────────────────────
export interface PriceRow {
  param:        string;
  zink:         string;
  polymer:      string;
  premium:      string;
}

export interface SpecRow {
  param:  string;
  value:  string;
  icon?:  string;
}

export interface FoundationOption {
  name:      string;
  price:     string;
  desc:      string;
  recommend: boolean;
}

export interface RalColor {
  ral:   string;
  name:  string;
  hex:   string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface PortfolioItem {
  img:      string;
  location: string;
  size:     string;
}

export interface ServiceProps {
  // SEO
  metaTitle:         string;
  metaDescription:   string;
  breadcrumb:        string;

  // Hero
  h1:                string;
  subtitle:          string;
  benefits:          string[];
  startPrice:        string;
  priceUnit:         string;
  heroImg:           string;
  heroBadge?:        string;

  // Описание
  aboutTitle:        string;
  aboutText:         string;
  suitableFor:       { icon: string; title: string; desc: string }[];

  // Прайс
  priceRows:         PriceRow[];
  foundations:       FoundationOption[];

  // Спецификация
  specs:             SpecRow[];
  specImg:           string;

  // Варианты и цвета
  profileTypes?:     { img: string; name: string; desc: string; imgStyle?: React.CSSProperties; imgClassName?: string }[];
  topCuts?:          { img: string; name: string; desc: string }[];
  installTypes?:     { img: string; name: string; desc: string }[];
  orientations?:     { img: string; name: string; desc: string }[];
  ralColors?:        RalColor[];

  // Доп. комплектующие
  extras:            { icon: string; name: string; price: string; desc: string }[];

  // Портфолио
  portfolio:         PortfolioItem[];

  // FAQ
  faq:               FaqItem[];

  // Лид-магнит
  leadTitle:         string;
  leadOffer:         string;

  // Опциональные секции (2026 — стандарты, схемы)
  showPaintLevels?:      boolean;  // Блок «3 уровня покраски»
  showFoundationSchemes?: boolean; // SVG-схемы фундаментов
  fenceAnatomy?:         "profnastil" | "shtaketnik" | "mesh3d" | "rabitsa" | "kovka"; // SVG-анатомия секции
  gateScheme?:           "otkatnye" | "raspashnye"; // SVG-схема ворот
  showSoilCalculator?:   boolean; // Калькулятор фундамента по грунту
  navesSpec?:            "naves" | "ploshadka" | "zaezd"; // Спец-блок навесов/площадок/заездов
  warrantyYears?:        number;   // Гарантия в годах (по умолчанию 3)

  /** Произвольная вёрстка, вставляется сразу после Hero-секции (до блока «О конструкции»).
   *  Используется, например, для ленты табов с типами услуги. */
  afterHero?:            React.ReactNode;
  /** Произвольная вёрстка, вставляется после блока цен / типов фундамента.
   *  Используется, например, для секций с детализацией каждого типа услуги. */
  afterPrices?:          React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────
// ШАБЛОН
// ─────────────────────────────────────────────────────────────────
export default function ServicePage(p: ServiceProps & { pageSlug?: string; mediaSlug?: string }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeRal, setActiveRal] = useState<string>(p.ralColors?.[0]?.ral || "");
  // CMS-данные для перезаписи hero (если задан pageSlug)
  const cms = usePageContent(p.pageSlug || "");
  // slug для медиа-библиотеки (по умолчанию вычисляем из pageSlug)
  const mediaSlug = p.mediaSlug || (p.pageSlug || "").replace(/^services\//, "");
  // локальные оптимистичные оверрайды фото после редактирования через библиотеку
  const [heroOverride, setHeroOverride] = useState<string | null>(null);
  const [portfolioOverride, setPortfolioOverride] = useState<Record<number, string>>({});

  // SEO: title, description, canonical, OG, JSON-LD (Service + FAQ + Breadcrumb)
  useEffect(() => {
    document.title = p.metaTitle;

    const upsertMeta = (selector: string, attr: string, attrValue: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, attrValue);
        document.head.appendChild(el);
      }
      el.content = content;
    };
    upsertMeta('meta[name="description"]', "name", "description", p.metaDescription);
    upsertMeta('meta[property="og:title"]', "property", "og:title", p.metaTitle);
    upsertMeta('meta[property="og:description"]', "property", "og:description", p.metaDescription);
    upsertMeta('meta[property="og:image"]', "property", "og:image", p.heroImg);
    upsertMeta('meta[property="og:type"]', "property", "og:type", "article");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", p.metaTitle);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", p.metaDescription);
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", p.heroImg);

    // Canonical
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) {
      canon = document.createElement("link");
      canon.rel = "canonical";
      document.head.appendChild(canon);
    }
    const url = `https://stalgrupp.ru/${p.pageSlug || ""}`;
    canon.href = url;
    upsertMeta('meta[property="og:url"]', "property", "og:url", url);

    // JSON-LD: Service + FAQPage + Breadcrumb
    const startPriceNum = Number(String(p.startPrice).replace(/[^\d]/g, "")) || 0;
    const jsonld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Service",
          name: p.h1,
          description: p.metaDescription,
          image: p.heroImg,
          url,
          provider: { "@id": "https://stalgrupp.ru/#org" },
          areaServed: { "@type": "AdministrativeArea", name: "Москва и Московская область" },
          offers: {
            "@type": "Offer",
            price: startPriceNum,
            priceCurrency: "RUB",
            availability: "https://schema.org/InStock",
            url,
          },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Главная", item: "https://stalgrupp.ru/" },
            { "@type": "ListItem", position: 2, name: "Услуги", item: "https://stalgrupp.ru/#products" },
            { "@type": "ListItem", position: 3, name: p.breadcrumb, item: url },
          ],
        },
        ...(p.faq && p.faq.length > 0
          ? [
              {
                "@type": "FAQPage",
                mainEntity: p.faq.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              },
            ]
          : []),
      ],
    };
    let ld = document.getElementById("service-jsonld") as HTMLScriptElement | null;
    if (!ld) {
      ld = document.createElement("script");
      ld.id = "service-jsonld";
      ld.type = "application/ld+json";
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(jsonld);

    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });

    return () => {
      // Очистка JSON-LD при смене страницы
      const el = document.getElementById("service-jsonld");
      if (el) el.remove();
    };
  }, [p.metaTitle, p.metaDescription, p.heroImg, p.pageSlug, p.h1, p.startPrice, p.breadcrumb, p.faq]);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const lead = useLeadModal({ source: `Услуга: ${p.breadcrumb}` });
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceDone, setPriceDone] = useState(false);

  const downloadPrice = async () => {
    if (priceLoading) return;
    setPriceLoading(true);
    setPriceDone(false);
    try {
      const ok = await generatePriceListPDF();
      if (ok) {
        setPriceDone(true);
        setTimeout(() => setPriceDone(false), 5000);
        try {
          await sendLead({
            order_num:   `КАТАЛОГ-${Date.now().toString().slice(-6)}`,
            name:        "Анонимный гость",
            phone:       "—",
            city:        "",
            address:     "",
            object_type: `[Прайс PDF] Услуга: ${p.breadcrumb}`,
            total_rub:   0,
            payload:     { event: "pricelist_downloaded", service: p.breadcrumb },
          });
        } catch { /* молчим */ }
      }
    } finally {
      setPriceLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-golos">
      {lead.node}

      {/* ── ШАПКА ── */}
      <SiteHeader />

      {/* ── ХЛЕБНЫЕ КРОШКИ ── */}
      <div className="pb-2 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs">
          <Link to="/" className="text-gray-500 hover:text-orange-400 transition-colors">Главная</Link>
          <Icon name="ChevronRight" size={12} className="text-gray-400" />
          <Link to="/#products" className="text-gray-500 hover:text-orange-400 transition-colors">Продукция</Link>
          <Icon name="ChevronRight" size={12} className="text-gray-400" />
          <span className="text-orange-400">{p.breadcrumb}</span>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden grid-pattern py-16 lg:py-20">
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 70% 60% at 70% 50%, rgba(249,115,22,0.10) 0%, transparent 70%)" }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              {p.heroBadge && (
                <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1.5 mb-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                  <span className="text-orange-400 text-xs font-medium">{p.heroBadge}</span>
                </div>
              )}

              {p.pageSlug ? (
                <EditableText
                  page={p.pageSlug} blockKey="hero_title"
                  value={cms("hero_title")} html as="h1"
                  className="font-oswald font-bold text-4xl sm:text-5xl lg:text-6xl text-gray-900 leading-tight mb-5"
                  fallback={p.h1}
                />
              ) : (
                <h1 className="font-oswald font-bold text-4xl sm:text-5xl lg:text-6xl text-gray-900 leading-tight mb-5">
                  {p.h1}
                </h1>
              )}

              {p.pageSlug ? (
                <EditableText
                  page={p.pageSlug} blockKey="hero_subtitle"
                  value={cms("hero_subtitle")} html as="div"
                  className="text-gray-600 text-base sm:text-lg mb-6 leading-relaxed max-w-xl prose prose-p:my-0"
                  fallback={p.subtitle}
                />
              ) : (
                <p className="text-gray-600 text-base sm:text-lg mb-6 leading-relaxed max-w-xl">{p.subtitle}</p>
              )}

              <ul className="space-y-2.5 mb-7">
                {p.benefits.map(b => (
                  <li key={b} className="flex items-start gap-2.5 text-gray-700 text-sm">
                    <Icon name="CheckCircle2" size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-end gap-6 mb-6 flex-wrap">
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Стартовая цена</div>
                  <div className="font-oswald font-bold text-4xl sm:text-5xl text-orange-400 leading-none">
                    от {p.startPrice}
                  </div>
                  <div className="text-gray-500 text-xs mt-1">{p.priceUnit}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button onClick={() => lead.open({
                    title: "Вызвать замерщика",
                    serviceHint: `${p.breadcrumb} · от ${p.startPrice} ${p.priceUnit}`,
                  })}
                  className="btn-orange px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base">
                  <span className="flex items-center gap-2 justify-center">
                    <Icon name="Ruler" size={17} />
                    Вызвать замерщика
                  </span>
                </button>
                <button onClick={() => scrollTo("prices")} className="btn-outline-orange px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base">
                  Прайс-лист
                </button>
              </div>

              {/* Быстрая форма замера */}
              <div className="lg:hidden">
                <QuickQuoteForm
                  source={`Услуга «${p.breadcrumb}»: hero форма`}
                  serviceHint={`${p.breadcrumb} · от ${p.startPrice} ${p.priceUnit}`}
                  title=""
                  compact
                />
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-gray-200 shadow-2xl">
                {mediaSlug ? (
                  <EditablePhoto
                    src={heroOverride || cms("hero_image", p.heroImg)}
                    alt={p.h1}
                    className="w-full h-full object-cover"
                    service={mediaSlug}
                    mode="hero"
                    label="Сменить главное фото"
                    onChange={(url) => setHeroOverride(url)}
                  />
                ) : p.pageSlug ? (
                  <EditableImage
                    page={p.pageSlug} blockKey="hero_image"
                    value={cms("hero_image")} fallback={p.heroImg} alt={p.h1}
                    className="w-full h-full"
                    imgClassName="w-full h-full object-cover"
                  />
                ) : (
                  <img src={cms("hero_image", p.heroImg)} alt={p.h1} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="absolute -bottom-5 -left-5 bg-gray-50 border border-orange-500/30 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Icon name="ShieldCheck" size={20} className="text-gray-900" />
                  </div>
                  <div>
                    <div className="font-oswald font-bold text-gray-900 text-base">Гарантия {p.warrantyYears ?? 3} {(p.warrantyYears ?? 3) === 1 ? "год" : (p.warrantyYears ?? 3) < 5 ? "года" : "лет"}</div>
                    <div className="text-gray-500 text-xs">По договору</div>
                  </div>
                </div>
              </div>

              {/* Быстрая форма замера на десктопе — под фото */}
              <div className="hidden lg:block mt-6">
                <QuickQuoteForm
                  source={`Услуга «${p.breadcrumb}»: hero форма (десктоп)`}
                  serviceHint={`${p.breadcrumb} · от ${p.startPrice} ${p.priceUnit}`}
                  title=""
                  compact
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── СЛОТ: ТАБЫ С ТИПАМИ УСЛУГИ (опционально) ── */}
      {p.afterHero}

      {/* ── ОПИСАНИЕ И ЗАДАЧИ ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            <div>
              <span className="section-tag">О конструкции</span>
              {p.pageSlug ? (
                <>
                  <EditableText
                    page={p.pageSlug} blockKey="about_title"
                    value={cms("about_title")} fallback={p.aboutTitle} as="h2"
                    className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900 mb-4"
                  />
                  <EditableText
                    page={p.pageSlug} blockKey="about_text"
                    value={cms("about_text")} html as="div"
                    fallback={p.aboutText}
                    className="text-gray-600 leading-relaxed whitespace-pre-line"
                  />
                </>
              ) : (
                <>
                  <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900 mb-4">{p.aboutTitle}</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{p.aboutText}</p>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {p.suitableFor.map(({ icon, title, desc }) => (
                <div key={title} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 hover:border-orange-500/40 transition-colors">
                  <Icon name={icon} size={26} className="text-orange-400 mb-3" />
                  <div className="font-oswald font-semibold text-gray-900 text-base mb-1.5">{title}</div>
                  <div className="text-gray-500 text-xs leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ПРАЙС-ЛИСТ ── */}
      <section id="prices" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="section-tag">Прайс</span>
            <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900 mb-3">
              ЦЕНЫ <span className="text-orange-400">ОТ ПРОИЗВОДИТЕЛЯ</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">Стоимость 1 п.м. забора &laquo;под ключ&raquo; с монтажом и материалами. Цены актуальны на 2026 год.</p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-4 sm:p-7 mb-8 overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Высота / толщина</th>
                  <th className="text-center py-4 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Оцинковка</th>
                  <th className="text-center py-4 px-3 text-orange-400 font-medium text-xs uppercase tracking-wider">
                    Полимер
                    <span className="block text-[10px] text-orange-400/60 normal-case font-normal mt-0.5">популярный</span>
                  </th>
                  <th className="text-center py-4 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Премиум (двусторонний)</th>
                </tr>
              </thead>
              <tbody>
                {p.priceRows.map((row, i) => (
                  <tr key={i} className="border-b border-[#1a1f2e] hover:bg-white/40 transition-colors">
                    <td className="py-3.5 px-3 text-gray-900 font-medium">{row.param}</td>
                    <td className="py-3.5 px-3 text-center text-gray-600 font-oswald">{row.zink}</td>
                    <td className="py-3.5 px-3 text-center text-orange-400 font-oswald font-bold">{row.polymer}</td>
                    <td className="py-3.5 px-3 text-center text-gray-600 font-oswald">{row.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Фундаменты */}
          <h3 className="font-oswald font-bold text-2xl text-gray-900 mb-5 text-center">Тип фундамента</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {p.foundations.map(f => (
              <div key={f.name}
                className={`relative rounded-2xl p-5 border transition-all ${
                  f.recommend
                    ? "bg-orange-500/5 border-orange-500/40 hover:border-orange-500/60"
                    : "bg-gray-50 border-gray-200 hover:border-orange-500/30"
                }`}>
                {f.recommend && (
                  <div className="absolute -top-2 left-4 bg-orange-500 text-gray-900 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    Рекомендуем
                  </div>
                )}
                <div className="font-oswald font-bold text-gray-900 text-lg mb-1">{f.name}</div>
                <div className="text-orange-400 font-oswald font-bold text-xl mb-2">{f.price}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 text-sm text-gray-600 flex items-start gap-3">
            <Icon name="Info" size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-orange-400 font-medium">Важно:</span> финальная стоимость зависит от рельефа участка, удалённости и наличия подъезда. Замер и смета — бесплатно, фиксируем цену в договоре.
            </div>
          </div>
        </div>
      </section>

      {/* ── СЛОТ: РАСШИРЕННЫЕ СЕКЦИИ ПО ТИПАМ УСЛУГИ (опционально) ── */}
      {p.afterPrices}

      {/* ── ТЕХНИЧЕСКИЕ СТАНДАРТЫ ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="section-tag">Спецификация</span>
            <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900 mb-3">
              ТЕХНИЧЕСКИЕ <span className="text-orange-400">СТАНДАРТЫ</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">Используем материалы по ГОСТ, чёткие технологические карты на каждом этапе.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden flex items-center justify-center p-6 min-h-[16rem] lg:min-h-full">
              <img
                src={p.specImg}
                alt="Конструктив"
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            </div>

            <div className="space-y-3">
              {p.specs.map(s => (
                <div key={s.param} className="flex items-start gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-orange-500/30 transition-colors">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name={s.icon || "Wrench"} size={18} className="text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-500 text-xs mb-0.5 uppercase tracking-wider">{s.param}</div>
                    <div className="text-gray-900 text-sm font-medium leading-snug">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── АНАТОМИЯ СЕКЦИИ ЗАБОРА (опционально) ── */}
      {p.fenceAnatomy && <FenceAnatomy variant={p.fenceAnatomy} />}

      {/* ── СХЕМА ВОРОТ (опционально) ── */}
      {p.gateScheme && <GateSchemes type={p.gateScheme} />}

      {/* ── НАВЕС/ПЛОЩАДКА/ЗАЕЗД (опционально) ── */}
      {p.navesSpec && <NavesSpec variant={p.navesSpec} />}

      {/* ── СХЕМЫ ФУНДАМЕНТА (опционально) ── */}
      {p.showFoundationSchemes && <FoundationSchemes />}

      {/* ── КАЛЬКУЛЯТОР ПО ГРУНТУ (опционально) ── */}
      {p.showSoilCalculator && <SoilCalculator />}

      {/* ── 3 УРОВНЯ ПОКРАСКИ (опционально) ── */}
      {p.showPaintLevels && <PaintLevels />}

      {/* ── ВАРИАНТЫ ИСПОЛНЕНИЯ + RAL ── */}
      {((p.profileTypes && p.profileTypes.length > 0) || (p.ralColors && p.ralColors.length > 0)) && (
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="section-tag">Варианты</span>
            <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900 mb-3">
              ИСПОЛНЕНИЕ <span className="text-orange-400">И ЦВЕТ</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">Подберите профиль и оттенок RAL под архитектуру дома и дизайн участка.</p>
          </div>

          {/* Типы профиля */}
          {p.profileTypes && p.profileTypes.length > 0 && (
          <>
          <h3 className="font-oswald font-bold text-xl text-gray-900 mb-5">Типы профиля</h3>
          <div className={`grid grid-cols-2 ${p.profileTypes.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4 mb-12`}>
            {p.profileTypes.map(pt => (
              <div key={pt.name} className="bg-gray-50 border border-gray-200 hover:border-orange-500/40 rounded-2xl overflow-hidden transition-all hover:-translate-y-1">
                <div className="aspect-square bg-white flex items-center justify-center p-3 overflow-hidden">
                  <img
                    src={pt.img}
                    alt={pt.name}
                    style={pt.imgStyle}
                    className={pt.imgClassName || "max-w-full max-h-full w-auto h-auto object-contain"}
                  />
                </div>
                <div className="p-4">
                  <div className="font-oswald font-semibold text-gray-900 text-base mb-1">{pt.name}</div>
                  <div className="text-gray-500 text-xs leading-relaxed">{pt.desc}</div>
                </div>
              </div>
            ))}
          </div>
          </>
          )}

          {/* Типы реза верха */}
          {p.topCuts && p.topCuts.length > 0 && (
            <>
              <h3 className="font-oswald font-bold text-xl text-gray-900 mb-5">Типы реза верха</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                {p.topCuts.map(tc => (
                  <div key={tc.name} className="bg-gray-50 border border-gray-200 hover:border-orange-500/40 rounded-2xl overflow-hidden transition-all hover:-translate-y-1">
                    <div className="aspect-[4/3] bg-white flex items-center justify-center p-4 overflow-hidden">
                      <img
                        src={tc.img}
                        alt={tc.name}
                        className="max-w-full max-h-full w-auto h-auto object-contain"
                      />
                    </div>
                    <div className="p-5">
                      <div className="font-oswald font-semibold text-gray-900 text-lg mb-1.5">{tc.name}</div>
                      <div className="text-gray-600 text-sm leading-relaxed">{tc.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Тип нашивки */}
          {p.installTypes && p.installTypes.length > 0 && (
            <>
              <h3 className="font-oswald font-bold text-xl text-gray-900 mb-5">Тип нашивки</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                {p.installTypes.map(it => (
                  <div key={it.name} className="bg-gray-50 border border-gray-200 hover:border-orange-500/40 rounded-2xl overflow-hidden transition-all hover:-translate-y-1">
                    <div className="aspect-[16/9] bg-white flex items-center justify-center p-4 overflow-hidden">
                      <img
                        src={it.img}
                        alt={it.name}
                        className="max-w-full max-h-full w-auto h-auto object-contain"
                      />
                    </div>
                    <div className="p-5">
                      <div className="font-oswald font-semibold text-gray-900 text-lg mb-1.5">{it.name}</div>
                      <div className="text-gray-600 text-sm leading-relaxed">{it.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Способ установки */}
          {p.orientations && p.orientations.length > 0 && (
            <>
              <h3 className="font-oswald font-bold text-xl text-gray-900 mb-5">Способ установки</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                {p.orientations.map(or => (
                  <div key={or.name} className="bg-gray-50 border border-gray-200 hover:border-orange-500/40 rounded-2xl overflow-hidden transition-all hover:-translate-y-1">
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={or.img}
                        alt={or.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5">
                      <div className="font-oswald font-semibold text-gray-900 text-lg mb-1.5">{or.name}</div>
                      <div className="text-gray-600 text-sm leading-relaxed">{or.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Палитра RAL */}
          {p.ralColors && p.ralColors.length > 0 && (
          <>
          <h3 className="font-oswald font-bold text-xl text-gray-900 mb-5">Цветовая палитра RAL</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {p.ralColors.map(c => (
              <button
                key={c.ral}
                onClick={() => setActiveRal(c.ral)}
                className={`group rounded-xl overflow-hidden border-2 transition-all ${
                  activeRal === c.ral ? "border-orange-500 -translate-y-1 shadow-lg shadow-orange-500/20" : "border-gray-200 hover:border-orange-500/40"
                }`}>
                <div className="aspect-square" style={{ background: c.hex }} />
                <div className="bg-gray-50 py-2 px-2 text-center">
                  <div className="font-oswald font-bold text-orange-400 text-sm">{c.ral}</div>
                  <div className="text-gray-500 text-[10px] leading-tight">{c.name}</div>
                </div>
              </button>
            ))}
          </div>

          <p className="text-gray-500 text-xs mt-5 text-center">
            Доступно более 200 оттенков по каталогу RAL Classic. Возможна имитация дерева и камня (PrintPattern).
          </p>
          </>
          )}
        </div>
      </section>
      )}

      {/* ── ДОП. КОМПЛЕКТУЮЩИЕ ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="section-tag">Комплектация</span>
            <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900 mb-3">
              ДОПОЛНИТЕЛЬНЫЕ <span className="text-orange-400">КОМПЛЕКТУЮЩИЕ</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">Доукомплектуйте забор всем необходимым — со скидкой при заказе в комплексе.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {p.extras.map(e => (
              <div key={e.name} className="group bg-gray-50 border border-gray-200 hover:border-orange-500/40 rounded-2xl p-6 transition-all hover:-translate-y-1">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 bg-orange-500/10 group-hover:bg-orange-500/20 rounded-xl flex items-center justify-center transition-colors">
                    <Icon name={e.icon} size={22} className="text-orange-400" />
                  </div>
                  <div className="text-orange-400 font-oswald font-bold text-sm whitespace-nowrap">{e.price}</div>
                </div>
                <div className="font-oswald font-semibold text-gray-900 text-base mb-1">{e.name}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{e.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ПОРТФОЛИО ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="section-tag">Портфолио</span>
            <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900 mb-3">
              НАШИ <span className="text-orange-400">РАБОТЫ</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">Реальные объекты, сданные за 2024–2026 годы.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {p.portfolio.map((item, i) => {
              const curImg = portfolioOverride[i] || item.img;
              return (
              <div key={i} className="group rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 hover:border-orange-500/40 transition-all">
                <div className="aspect-[4/3] overflow-hidden">
                  {mediaSlug ? (
                    <EditablePhoto
                      src={curImg}
                      alt={item.location}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      service={mediaSlug}
                      mode="any"
                      label="Сменить"
                      onChange={(url) => setPortfolioOverride(prev => ({ ...prev, [i]: url }))}
                    />
                  ) : (
                    <img src={curImg} alt={item.location} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-900 text-sm">
                    <Icon name="MapPin" size={14} className="text-orange-500" />
                    {item.location}
                  </div>
                  <span className="text-orange-400 font-oswald font-bold text-sm">{item.size}</span>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ЭТАПЫ РАБОТЫ ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="section-tag">Этапы работы</span>
            <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900 mb-3">
              КАК МЫ <span className="text-orange-400">РАБОТАЕМ</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { n: "01", icon: "PhoneCall",      title: "Заявка",         d: "Звонок или заявка с сайта. Согласуем дату замера." },
              { n: "02", icon: "Ruler",          title: "Замер",          d: "Бесплатный выезд инженера, проект и точная смета." },
              { n: "03", icon: "FileSignature", title: "Договор",        d: "Фиксируем цену, материалы и сроки. Аванс 30%." },
              { n: "04", icon: "Factory",        title: "Производство",   d: "Изготовление секций в нашем цеху. 7–14 дней." },
              { n: "05", icon: "CheckCheck",     title: "Монтаж + акт",   d: "Установка, уборка территории, акт сдачи-приёмки." },
            ].map(({ n, icon, title, d }) => (
              <div key={n} className="bg-gray-50 border border-gray-200 hover:border-orange-500/40 rounded-2xl p-5 text-center transition-all hover:-translate-y-2">
                <div className="w-14 h-14 mx-auto mb-3 bg-orange-500/10 border border-orange-500/30 rounded-full flex items-center justify-center">
                  <Icon name={icon} size={20} className="text-orange-400" />
                </div>
                <div className="font-oswald font-bold text-2xl text-orange-400 mb-1">{n}</div>
                <div className="font-oswald font-semibold text-gray-900 text-base mb-1.5">{title}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ / SEO-БЛОК ── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="section-tag">FAQ</span>
            <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900 mb-3">
              ОТВЕТЫ <span className="text-orange-400">НА ВОПРОСЫ</span>
            </h2>
            <p className="text-gray-500 text-sm">Подробно об особенностях, технологиях и нюансах монтажа.</p>
          </div>

          <div className="space-y-3">
            {p.faq.map((item, i) => (
              <div key={i}
                className={`bg-gray-50 border rounded-2xl overflow-hidden transition-all ${
                  openFaq === i ? "border-orange-500/40" : "border-gray-200 hover:border-orange-500/20"
                }`}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4">
                  <span className="font-oswald font-semibold text-gray-900 text-base sm:text-lg pr-4">{item.q}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    openFaq === i ? "bg-orange-500 text-gray-900 rotate-45" : "bg-white text-orange-400"
                  }`}>
                    <Icon name="Plus" size={18} />
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed whitespace-pre-line border-t border-gray-200 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ЛИД-МАГНИТ ── */}
      <section id="lead" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${p.heroImg})`, opacity: 0.12 }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0f14] via-[#0d0f14]/95 to-[#0d0f14]/70" />
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(circle at 80% 50%, rgba(249,115,22,0.15) 0%, transparent 60%)" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
            <div className="lg:col-span-3">
              <span className="section-tag">Бесплатно</span>
              <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-white mb-4 leading-tight">
                {p.leadTitle}
              </h2>
              <p className="text-gray-600 text-base mb-6 max-w-xl">{p.leadOffer}</p>

              <div className="grid grid-cols-2 gap-3 max-w-md">
                {[
                  { icon: "Clock",       text: "Звонок за 15 мин." },
                  { icon: "Ruler",       text: "Замер бесплатно" },
                  { icon: "FileText",    text: "Смета на email" },
                  { icon: "Gift",        text: "Скидка 5%" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-gray-600">
                    <Icon name={icon} size={15} className="text-orange-400 flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-gray-50/95 backdrop-blur border-2 border-orange-500/30 rounded-3xl p-7 shadow-2xl shadow-orange-500/10">
                <div className="font-oswald font-bold text-2xl text-white mb-1">Точный расчёт</div>
                <p className="text-gray-500 text-xs mb-5">Менеджер перезвонит в течение 15 минут и пришлёт смету</p>

                <div className="space-y-3">
                  <button onClick={() => lead.open({
                      title: "Точный расчёт сметы",
                      source: `Услуга: ${p.breadcrumb} (лид-форма)`,
                      serviceHint: `${p.breadcrumb} · от ${p.startPrice}`,
                    })}
                    className="btn-orange w-full py-4 rounded-xl text-base group">
                    <span className="flex items-center gap-2 justify-center">
                      Получить расчёт и прайс
                      <Icon name="ArrowRight" size={18} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                  <button onClick={downloadPrice}
                    disabled={priceLoading}
                    className={`w-full py-3 rounded-xl text-xs flex items-center justify-center gap-2 border transition-all disabled:opacity-60 ${
                      priceDone
                        ? "border-green-500/40 bg-green-500/10 text-green-300"
                        : "btn-outline-orange"
                    }`}>
                    <Icon name={priceLoading ? "Loader" : priceDone ? "Check" : "Download"} size={14}
                      className={priceLoading ? "animate-spin" : ""} />
                    {priceLoading
                      ? "Формируем PDF..."
                      : priceDone
                        ? "Прайс скачан ✓"
                        : "Скачать прайс PDF"}
                  </button>
                  <p className="text-white/30 text-[11px] text-center">
                    Согласие с <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-400/70 hover:text-orange-400 underline">политикой</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER (упрощённый) ── */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 text-gray-500 hover:text-orange-400 transition-colors text-sm">
            <Icon name="ChevronLeft" size={16} />
            Вернуться на главную
          </Link>
          <div className="text-white/30 text-xs">© 2009–2026 ООО «СтальГрупп» · 8 800 123-45-67</div>
        </div>
      </footer>

      {/* Мобильная плавающая кнопка */}
      <a href="tel:+78001234567"
        className="lg:hidden fixed bottom-5 right-5 z-40 w-14 h-14 bg-orange-500 hover:bg-orange-400 rounded-full shadow-2xl shadow-orange-500/40 flex items-center justify-center animate-pulse"
        aria-label="Позвонить">
        <Icon name="Phone" size={22} className="text-gray-900" />
      </a>
    </div>
  );
}