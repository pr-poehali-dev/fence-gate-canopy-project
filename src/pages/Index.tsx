import { useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import SiteHeader from "@/components/SiteHeader";
import CalculatorWizard from "@/components/CalculatorWizard";
import { useLeadModal } from "@/hooks/useLeadModal";
import { useSiteMenu } from "@/hooks/useSiteMenu";
import { useMediaByService } from "@/hooks/useMediaByService";
import { usePageContent } from "@/hooks/usePageContent";
import { useCompany } from "@/hooks/useCompany";

const ADVANTAGES = [
  { icon: "ShieldCheck", title: "Гарантия 3 года", desc: "Письменная гарантия на каркас и монтаж" },
  { icon: "Truck",       title: "Бесплатный замер", desc: "Замер и расчёт сметы в день обращения" },
  { icon: "Banknote",    title: "Цена от производителя", desc: "Без посредников и переплат" },
  { icon: "Calendar",    title: "Монтаж за 1-2 дня",   desc: "Своя бригада, не подряд" },
  { icon: "Award",       title: "17 лет на рынке",      desc: "С 2008 года, 5000+ объектов" },
  { icon: "FileText",    title: "Договор и закр. док.", desc: "Официально, чек, акт, гарантия" },
];

const STAGES = [
  { n: 1, title: "Заявка",           desc: "Звонок или форма — ответим за 15 мин" },
  { n: 2, title: "Бесплатный замер", desc: "Выезд на участок в день обращения" },
  { n: 3, title: "Смета и договор",  desc: "Фиксируем цену и сроки на бумаге" },
  { n: 4, title: "Монтаж 1-2 дня",   desc: "Своя бригада со всем оборудованием" },
  { n: 5, title: "Сдача + гарантия", desc: "Акт, чек, договор, гарантийный талон" },
];

const PORTFOLIO_LOCS = [
  "Красногорск, ул. Заречная",
  "Истра, кп Малая Истра",
  "Подольск, мкр-н Кузнечики",
  "Балашиха, СНТ Энергетик",
  "Мытищи, дер. Беляниново",
  "Химки, ул. Лавочкина",
];

export default function Index() {
  const { open: openLead } = useLeadModal();
  const menu = useSiteMenu();
  const cms = usePageContent("home");
  const company = useCompany();

  const heroPhotos = useMediaByService("profnastil");
  const shtaketnikPhotos = useMediaByService("shtaketnik");
  const otkatPhotos = useMediaByService("otkatnye-vorota");
  const kovkaPhotos = useMediaByService("kovka");
  const portfolioPhotos = [
    ...heroPhotos,
    ...shtaketnikPhotos,
    ...otkatPhotos,
    ...kovkaPhotos,
  ].filter(Boolean).slice(0, 6);

  useEffect(() => {
    document.title = "СтальГрупп — заборы под ключ в Москве и МО, цена от 1 450 ₽/м";
  }, []);

  const fenceCat = menu.find(c => c.label.toLowerCase().includes("забор"));
  const gateCat  = menu.find(c => c.label.toLowerCase().includes("ворота"));
  const popularItems = [
    ...(fenceCat?.items || []),
    ...(gateCat?.items || []).slice(0, 2),
  ].slice(0, 7);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-golos">
      <SiteHeader />

      {/* HERO */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        {heroPhotos[0] && (
          <div
            className="absolute inset-0 opacity-30"
            style={{ backgroundImage: `url(${heroPhotos[0]})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/70 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28 grid lg:grid-cols-2 gap-8 items-center">
          <div className="text-white">
            <span className="inline-flex items-center gap-2 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              <Icon name="Star" size={12} fill="currentColor" /> 17 лет опыта · 5000+ объектов
            </span>
            <h1 className="font-oswald font-bold text-3xl sm:text-5xl lg:text-6xl leading-[1.05] mb-5">
              {cms("hero_title", "Заборы под ключ ")}
              <span className="text-orange-400">в Москве и&nbsp;МО</span>
            </h1>
            <p className="text-lg text-white/80 mb-7 max-w-xl">
              {cms("hero_subtitle", "Производство и монтаж заборов от 1 450 ₽/м.п. Замер бесплатно. Договор. Гарантия 3 года.")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button
                onClick={() => openLead("hero-main")}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:scale-[1.02] transition-all"
              >
                <Icon name="Calculator" size={18} />
                Бесплатный замер и смета
              </button>
              <a
                href="#calculator"
                className="bg-white/10 hover:bg-white/20 backdrop-blur border-2 border-white/30 text-white font-bold px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Icon name="Sliders" size={18} />
                Рассчитать сейчас
              </a>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { v: "1 450 ₽", l: "за метр забора" },
                { v: "1-2 дня", l: "монтаж под ключ" },
                { v: "3 года",  l: "гарантия письменная" },
              ].map((it, i) => (
                <div key={i} className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-3">
                  <div className="font-oswald font-bold text-xl sm:text-2xl text-orange-400">{it.v}</div>
                  <div className="text-[11px] sm:text-xs text-white/70">{it.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-3">
            {heroPhotos.slice(0, 4).map((src, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-2xl border-4 border-white/10 shadow-2xl ${
                  i === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"
                }`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ПРЕИМУЩЕСТВА */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900 mb-2">
              ПОЧЕМУ ВЫБИРАЮТ <span className="text-orange-500">СТАЛЬГРУПП</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">6 причин, по которым к нам обращаются и возвращаются</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ADVANTAGES.map((a, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-orange-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name={a.icon} size={22} className="text-orange-500" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-1">{a.title}</h3>
                <p className="text-sm text-gray-600">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* КАТАЛОГ УСЛУГ */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full mb-2">КАТАЛОГ</span>
            <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900 mb-2">
              ЗАБОРЫ И ВОРОТА <span className="text-orange-500">ПОД КЛЮЧ</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">От бюджетной рабицы до премиум-ковки. Любой материал, любая сложность.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {popularItems.map((item, idx) => (
              <ServiceCard key={item.id} item={item} idx={idx} />
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/shemy-chertezi" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-bold text-sm">
              Смотреть все услуги <Icon name="ArrowRight" size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* КАЛЬКУЛЯТОР */}
      <section id="calculator" className="py-12 sm:py-16 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full mb-2">КАЛЬКУЛЯТОР</span>
            <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900 mb-2">
              УЗНАЙТЕ ЦЕНУ <span className="text-orange-500">ЗА 1 МИНУТУ</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">Пошаговый расчёт — материалы, фундамент, ворота, монтаж и доставка</p>
          </div>
          <CalculatorWizard />
        </div>
      </section>

      {/* ЭТАПЫ */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900 mb-2">
              КАК МЫ <span className="text-orange-500">РАБОТАЕМ</span>
            </h2>
            <p className="text-gray-500">5 простых этапов — от заявки до сдачи объекта</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {STAGES.map(s => (
              <div key={s.n} className="bg-white border border-gray-200 rounded-xl p-4 relative hover:border-orange-300 transition-all">
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-orange-500 text-white font-oswald font-bold text-lg rounded-full flex items-center justify-center shadow-md">
                  {s.n}
                </div>
                <h3 className="font-bold text-gray-900 mb-1 text-base pr-8">{s.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ПОРТФОЛИО */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full mb-2">ПОРТФОЛИО</span>
            <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900 mb-2">
              НАШИ <span className="text-orange-500">РАБОТЫ</span>
            </h2>
            <p className="text-gray-500">Объекты, сданные за 2024–2026 годы</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {portfolioPhotos.map((src, i) => (
              <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all">
                <img src={src} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div className="text-white">
                    <div className="flex items-center gap-1 text-xs mb-1">
                      <Icon name="MapPin" size={12} className="text-orange-400" />
                      {PORTFOLIO_LOCS[i % PORTFOLIO_LOCS.length]}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-oswald font-bold text-3xl sm:text-4xl mb-3">ЗАКАЖИТЕ БЕСПЛАТНЫЙ ЗАМЕР</h2>
          <p className="text-white/90 mb-6 text-lg">Замерщик приедет на участок, рассчитает смету и заключит договор в день обращения</p>
          <button
            onClick={() => openLead("cta-main")}
            className="bg-white text-orange-600 hover:bg-gray-50 font-bold px-8 py-4 rounded-xl inline-flex items-center gap-2 shadow-xl"
          >
            <Icon name="Phone" size={18} />
            Заказать замер за 0 ₽
          </button>
        </div>
      </section>

      {/* ФУТЕР */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img
                src="https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/bucket/33123399-f344-46dc-adea-1165734f8f3f.png"
                alt="СТАЛЬ ГРУП"
                className="h-20 w-auto bg-white rounded-lg px-3 py-2"
              />
            </div>
            <p className="text-sm text-white/60">Производство и монтаж заборов в Москве и МО с 2008 года.</p>
          </div>
          <div>
            <div className="font-bold text-orange-400 text-sm mb-3">УСЛУГИ</div>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li><Link to="/services/profnastil" className="hover:text-orange-400">Профнастил</Link></li>
              <li><Link to="/services/shtaketnik" className="hover:text-orange-400">Евроштакетник</Link></li>
              <li><Link to="/services/kovka" className="hover:text-orange-400">Ковка</Link></li>
              <li><Link to="/uslugi/stolby" className="hover:text-orange-400">Столбы</Link></li>
              <li><Link to="/services/fundamenty" className="hover:text-orange-400">Фундаменты</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-orange-400 text-sm mb-3">КОМПАНИЯ</div>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li><Link to="/reviews" className="hover:text-orange-400">Отзывы</Link></li>
              <li><Link to="/shemy-chertezi" className="hover:text-orange-400">Схемы и чертежи</Link></li>
              <li><Link to="/privacy" className="hover:text-orange-400">Политика конфиденциальности</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-orange-400 text-sm mb-3">КОНТАКТЫ</div>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href={`tel:${company.phoneE164}`} className="flex items-center gap-2 hover:text-orange-400"><Icon name="Phone" size={14} className="text-orange-400" /> {company.phone}</a></li>
              <li><a href={`mailto:${company.email}`} className="flex items-center gap-2 hover:text-orange-400"><Icon name="Mail" size={14} className="text-orange-400" /> {company.email}</a></li>
              <li className="flex items-center gap-2"><Icon name="MapPin" size={14} className="text-orange-400" /> {company.region}</li>
              <li className="flex items-center gap-2"><Icon name="Clock" size={14} className="text-orange-400" /> {company.schedule}</li>
            </ul>
            {(company.whatsapp || company.telegram || company.vk || company.maxLink) && (
              <div className="flex items-center gap-2 mt-4">
                {company.whatsapp && (
                  <a href={company.whatsapp} target="_blank" rel="noopener noreferrer" title="WhatsApp"
                    className="w-9 h-9 rounded-lg bg-white/5 hover:bg-orange-500 flex items-center justify-center transition-colors">
                    <Icon name="MessageCircle" size={16} />
                  </a>
                )}
                {company.telegram && (
                  <a href={company.telegram} target="_blank" rel="noopener noreferrer" title="Telegram"
                    className="w-9 h-9 rounded-lg bg-white/5 hover:bg-orange-500 flex items-center justify-center transition-colors">
                    <Icon name="Send" size={16} />
                  </a>
                )}
                {company.vk && (
                  <a href={company.vk} target="_blank" rel="noopener noreferrer" title="ВКонтакте"
                    className="w-9 h-9 rounded-lg bg-white/5 hover:bg-orange-500 flex items-center justify-center transition-colors">
                    <Icon name="Share2" size={16} />
                  </a>
                )}
                {company.maxLink && (
                  <a href={company.maxLink} target="_blank" rel="noopener noreferrer" title="MAX"
                    className="w-9 h-9 rounded-lg bg-white/5 hover:bg-orange-500 flex items-center justify-center transition-colors">
                    <Icon name="MessagesSquare" size={16} />
                  </a>
                )}
              </div>
            )}
            <button
              onClick={() => openLead("footer")}
              className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-lg text-sm"
            >
              Заказать звонок
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-white/10 text-xs text-white/40 text-center space-y-1">
          <div>© {new Date().getFullYear()} {company.name}. Все права защищены.</div>
          <div>{company.legalName} · ИНН {company.inn} · ОГРН {company.ogrn}</div>
        </div>
      </footer>

      <a
        href={`tel:${company.phoneE164}`}
        className="lg:hidden fixed bottom-5 right-5 z-40 w-14 h-14 bg-orange-500 hover:bg-orange-600 rounded-full shadow-2xl flex items-center justify-center animate-pulse"
      >
        <Icon name="Phone" size={22} className="text-white" />
      </a>
    </div>
  );
}

function ServiceCard({ item, idx }: { item: { label: string; href: string; description?: string; badge?: string }; idx: number }) {
  const slug = (item.href || "").replace(/.*\//, "").replace(/#.*/, "");
  const photos = useMediaByService(slug);
  const img = photos[0];

  return (
    <Link
      to={item.href}
      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-orange-300 hover:shadow-xl transition-all"
    >
      <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
        {img ? (
          <img src={img} alt={item.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-5xl font-oswald">
            {idx + 1}
          </div>
        )}
        {item.badge && (
          <span className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">
            {item.badge}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">{item.label}</h3>
        {item.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.description}</p>
        )}
        <span className="inline-flex items-center gap-1 text-orange-600 font-bold text-sm">
          Подробнее <Icon name="ArrowRight" size={14} className="group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </Link>
  );
}