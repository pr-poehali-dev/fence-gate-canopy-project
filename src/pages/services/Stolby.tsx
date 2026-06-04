import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import SiteHeader from "@/components/SiteHeader";
import EditablePhoto from "@/components/EditablePhoto";
import ServiceTypeTabs, { ServiceTypeTab } from "@/components/service/ServiceTypeTabs";
import QuickQuoteForm from "@/components/QuickQuoteForm";
import { useLeadModal } from "@/hooks/useLeadModal";
import { useMediaByService } from "@/hooks/useMediaByService";
import { usePageContent } from "@/hooks/usePageContent";
import { EditableText } from "@/components/InlineEditor";

const TABS: ServiceTypeTab[] = [
  {
    slug: "tab-proftruba",
    label: "Профильная труба",
    icon: "Square",
    shortDesc: "Стандарт · от 450 ₽",
    badge: "Стандарт",
  },
  {
    slug: "tab-kirpich",
    label: "Кирпичные",
    icon: "Building",
    shortDesc: "Премиум · 80+ лет",
    badge: "Премиум",
  },
  {
    slug: "tab-bloki",
    label: "Из блоков",
    icon: "Box",
    shortDesc: "Декоративные · «рваный камень»",
  },
];

interface ColumnRow {
  size:   string;
  price:  string;
  desc:   string;
}

interface FaqItem {
  q: string;
  a: string;
}

// ── ДАННЫЕ ПО ТИПАМ СТОЛБОВ ─────────────────────────────────────────────────
const PROFTRUBA_ROWS: ColumnRow[] = [
  { size: "Профтруба 60×60×2 мм",  price: "450 ₽/столб",  desc: "Лёгкие заборы до 1.8 м: профнастил, штакетник, рабица." },
  { size: "Профтруба 80×80×2 мм",  price: "650 ₽/столб",  desc: "Универсал: заборы до 2.5 м, любое заполнение." },
  { size: "Профтруба 100×100×3 мм",price: "950 ₽/столб",  desc: "Тяжёлые заборы, ворота, ветровые нагрузки." },
];

const KIRPICH_ROWS: ColumnRow[] = [
  { size: "Столб 1.5×1.5 кирпича",  price: "8 500 ₽/столб",  desc: "Для лёгких заборов из профнастила и штакетника." },
  { size: "Столб 2×2 кирпича",      price: "11 500 ₽/столб", desc: "Универсал — выдержит любое заполнение, включая ковку." },
  { size: "Столб 2×2.5 кирпича",    price: "14 000 ₽/столб", desc: "Премиум, под воротные/угловые столбы, дома «классика»." },
];

const BLOKI_ROWS: ColumnRow[] = [
  { size: "Блок 300×300, «рваный камень»",   price: "3 500 ₽/столб", desc: "Стандартный декоративный столб, готовая фактура." },
  { size: "Блок 400×400, «рваный камень»",   price: "4 800 ₽/столб", desc: "Усиленный, под тяжёлые заборы и воротные столбы." },
  { size: "Блок «колотый кирпич»",            price: "4 200 ₽/столб", desc: "Имитация кладки — внешний вид кирпича за меньшие деньги." },
];

const PROFTRUBA_FAQ: FaqItem[] = [
  { q: "Какое сечение выбрать?", a: "60×60 — для лёгких заборов до 1.8 м. 80×80 — универсал для большинства задач (профнастил до 2.5 м, штакетник, ковка). 100×100 — под воротные столбы, тяжёлые секции, при высокой ветровой нагрузке." },
  { q: "Нужна ли антикоррозийная обработка?", a: "Да. Используем оцинкованную профтрубу + грунт-эмаль 3 в 1. Сверху — порошковая покраска в цвет забора (RAL по каталогу). Срок службы покрытия — 25+ лет." },
  { q: "Как глубоко бетонируется столб?", a: "1.2 м — ниже точки промерзания для МО. Для пучинистых грунтов делаем расширение низа лунки (грушу) или применяем ростверк." },
];

const KIRPICH_FAQ: FaqItem[] = [
  { q: "Нужен ли ростверк под кирпичные столбы?", a: "Обязательно. Без монолитной ж/б ленты, объединяющей все столбы, кирпичная кладка треснет от пучения уже через 1–2 зимы. Ростверк — это основа долговечности." },
  { q: "Какой сорт кирпича лучше?", a: "Клинкер — лидер по долговечности (80–100+ лет), не впитывает воду. Керамический облицовочный — оптимум по цене/качеству, 60–80 лет. Гиперпрессованный — красивая фактура «дикий камень». Для МО — морозостойкость от F75, лучше F100–F150." },
  { q: "Можно ли вести кладку зимой?", a: "Оптимально — с апреля по октябрь при температуре от +5°C. Зимой возможно с противоморозными добавками (до −10°C), но удорожание +15–20% и риск высолов весной. Ростверк льём круглый год." },
];

const BLOKI_FAQ: FaqItem[] = [
  { q: "Чем блоки отличаются от кирпича?", a: "Один блок 300×300 заменяет ~8 кирпичей, 400×400 — ~13. Лицевая сторона уже декоративная (имитация камня), облицовка не нужна. По прочности — сопоставимы с полнотелым кирпичом, монтаж в 2 раза быстрее." },
  { q: "Сколько служат блочные столбы?", a: "40–50 лет при правильном монтаже (ростверк, армирование, заполнение пустот, гидрофобизация). Это больше, чем срок службы заполнения (профнастил 25–30 лет), так что блоки переживают сам забор." },
  { q: "Можно ли красить блоки?", a: "Да, силикатной или фасадной краской по бетону. Через 10–15 лет можно обновить цвет. Рекомендуем сразу покрыть гидрофобизатором — он защищает от высолов и сохраняет насыщенность на 20+ лет." },
];

export default function Stolby() {
  const photos = useMediaByService("stolby");
  const HERO = photos[0];
  const IMG  = photos[1] || photos[0];
  const IMG2 = photos[2] || photos[0];
  const IMG3 = photos[3] || photos[1] || photos[0];

  const cms = usePageContent("services/stolby");
  const lead = useLeadModal({ source: "Услуга: Столбы для забора" });

  const [openFaq, setOpenFaq] = useState<string | null>("proftruba-0");
  const [activeTab, setActiveTab] = useState("tab-proftruba");

  useEffect(() => {
    document.title = "Столбы для забора — профтруба, кирпич, блоки — СтальГрупп, Москва и МО";

    const upsertMeta = (selector: string, attr: string, attrValue: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, attrValue);
        document.head.appendChild(el);
      }
      el.content = content;
    };
    upsertMeta(
      'meta[name="description"]',
      "name",
      "description",
      "Столбы для забора под ключ: профильная труба, кирпичные, из декоративных блоков. Цены от 450 ₽/столб. Москва и МО, гарантия 3 года, монтаж за 1–3 дня.",
    );

    const hash = window.location.hash.replace(/^#/, "");
    if (hash) setActiveTab(hash);

    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  // Подсветка активного таба при скролле к якорю / прямом переходе по hash
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (h) setActiveTab(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {lead.node}

      {/* ── ШАПКА ── */}
      <SiteHeader />

      {/* ── ХЛЕБНЫЕ КРОШКИ ── */}
      <div className="pb-2 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs">
          <Link to="/" className="text-gray-500 hover:text-orange-400 transition-colors">
            Главная
          </Link>
          <Icon name="ChevronRight" size={12} className="text-gray-400" />
          <Link to="/#products" className="text-gray-500 hover:text-orange-400 transition-colors">
            Услуги
          </Link>
          <Icon name="ChevronRight" size={12} className="text-gray-400" />
          <span className="text-orange-400">Столбы для забора</span>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-16 lg:py-20">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 70% 50%, rgba(249,115,22,0.10) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1.5 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-orange-400 text-xs font-medium">
                  3 типа · Под ключ · Гарантия
                </span>
              </div>

              <EditableText
                page="services/stolby"
                blockKey="hero_title"
                value={cms("hero_title")}
                html
                as="h1"
                className="font-oswald font-bold text-4xl sm:text-5xl lg:text-6xl text-gray-900 leading-tight mb-5"
                fallback="Столбы для забора"
              />

              <p className="text-gray-600 text-base sm:text-lg mb-6 leading-relaxed max-w-xl">
                Полный цикл по столбам для забора: профильная труба, кирпичная кладка и декоративные блоки. Подбираем сечение, материал и количество под ваш забор, грунт и бюджет.
              </p>

              <ul className="space-y-2.5 mb-7">
                {[
                  "3 типа: профтруба, кирпич, декоративные блоки",
                  "Бетонирование 1.2 м или ростверк под кирпич",
                  "Антикоррозийная обработка + порошковая покраска",
                  "Шапки металл/бетон, фонари, декоративные навершия",
                  "Гарантия 3 года на конструкцию",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-gray-600 text-sm">
                    <Icon name="CheckCircle2" size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-end gap-6 mb-6 flex-wrap">
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Стартовая цена</div>
                  <div className="font-oswald font-bold text-4xl sm:text-5xl text-orange-400 leading-none">
                    от 450 ₽
                  </div>
                  <div className="text-gray-500 text-xs mt-1">за столб из профтрубы</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() =>
                    lead.open({
                      title: "Заказать замер столбов",
                      serviceHint: "Столбы для забора · от 450 ₽/столб",
                    })
                  }
                  className="btn-orange px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base"
                >
                  <span className="flex items-center gap-2 justify-center">
                    <Icon name="Ruler" size={17} />
                    Заказать замер
                  </span>
                </button>
                <a
                  href="#tab-proftruba"
                  className="btn-outline-orange px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base text-center"
                >
                  Сравнить типы
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-gray-200 shadow-2xl">
                <EditablePhoto
                  src={HERO}
                  alt="Столбы для забора"
                  className="w-full h-full object-cover"
                  service="stolby"
                  mode="hero"
                  label="Сменить главное фото"
                />
              </div>
              <div className="absolute -bottom-5 -left-5 bg-gray-50 border border-orange-500/30 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Icon name="ShieldCheck" size={20} className="text-gray-900" />
                  </div>
                  <div>
                    <div className="font-oswald font-bold text-gray-900 text-base">Гарантия 3 года</div>
                    <div className="text-gray-500 text-xs">По договору</div>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block mt-6">
                <QuickQuoteForm
                  source="Услуга «Столбы»: hero форма"
                  serviceHint="Столбы · от 450 ₽/столб"
                  title=""
                  compact
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ТАБЫ ── */}
      <ServiceTypeTabs
        title="Типы столбов"
        subtitle="Выберите тип, под который мы рассчитаем стоимость, схему фундамента и срок монтажа."
        basePath="/uslugi/stolby"
        activeSlug={activeTab}
        types={TABS}
      />

      {/* ── ТИП 1: ПРОФТРУБА ── */}
      <section id="tab-proftruba" className="py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start mb-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1.5 mb-4">
                <Icon name="Square" size={14} className="text-orange-400" />
                <span className="text-orange-400 text-xs font-medium uppercase tracking-wider">Тип 1 · Стандарт</span>
              </div>
              <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900 mb-4">
                Столбы из <span className="text-orange-400">профильной трубы</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                Самый распространённый и универсальный вариант: оцинкованная профтруба с порошковой покраской в цвет забора. Быстрый монтаж за 1–2 дня, оптимальное соотношение цены и надёжности. Подходит под любое заполнение.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Оцинкованная труба + порошковая покраска RAL",
                  "Заглушки пластиковые сверху и снизу",
                  "Бетонирование М300, глубина 1.2 м",
                  "Сроки монтажа: 1–2 дня на 100 м.п.",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-gray-600 text-sm">
                    <Icon name="CheckCircle2" size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200">
                <EditablePhoto
                  src={IMG}
                  alt="Столбы из профильной трубы"
                  className="w-full h-full object-cover"
                  service="stolby"
                  mode="any"
                />
              </div>
            </div>
          </div>

          {/* Прайс */}
          <h3 className="font-oswald font-bold text-xl text-gray-900 mb-5">Цены на столбы из профтрубы</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {PROFTRUBA_ROWS.map((r) => (
              <div key={r.size} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 hover:border-orange-500/40 transition-colors">
                <div className="font-oswald font-semibold text-gray-900 text-base mb-1">{r.size}</div>
                <div className="text-orange-400 font-oswald font-bold text-2xl mb-2">{r.price}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{r.desc}</div>
              </div>
            ))}
          </div>

          {/* Плюсы / минусы */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <Icon name="Plus" size={20} className="text-green-400 mb-2" />
              <div className="font-oswald font-semibold text-gray-900 text-sm mb-2">Плюсы профтрубы</div>
              <ul className="text-gray-600 text-xs space-y-1 leading-relaxed">
                <li>· Самый бюджетный из надёжных вариантов</li>
                <li>· Быстрый монтаж — 1–2 дня</li>
                <li>· Любое заполнение: профнастил, штакетник, ковка</li>
                <li>· Покраска в любой цвет RAL</li>
                <li>· Срок службы 25–30 лет</li>
              </ul>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <Icon name="Minus" size={20} className="text-red-400 mb-2" />
              <div className="font-oswald font-semibold text-gray-900 text-sm mb-2">Минусы профтрубы</div>
              <ul className="text-gray-600 text-xs space-y-1 leading-relaxed">
                <li>· Менее «премиальный» вид, чем кирпич</li>
                <li>· Требует обновления покраски через 10–15 лет</li>
                <li>· Не подходит для очень тяжёлых ворот без усиления</li>
              </ul>
            </div>
          </div>

          {/* FAQ профтруба */}
          <h3 className="font-oswald font-bold text-xl text-gray-900 mb-5">Вопросы по профтрубе</h3>
          <div className="space-y-3">
            {PROFTRUBA_FAQ.map((f, i) => {
              const key = `proftruba-${i}`;
              const open = openFaq === key;
              return (
                <div
                  key={key}
                  className={`bg-gray-50 border rounded-2xl overflow-hidden transition-all ${
                    open ? "border-orange-500/40" : "border-gray-200 hover:border-orange-500/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : key)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4"
                  >
                    <span className="font-oswald font-semibold text-gray-900 text-base pr-4">{f.q}</span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        open ? "bg-orange-500 text-gray-900 rotate-45" : "bg-white text-orange-400"
                      }`}
                    >
                      <Icon name="Plus" size={18} />
                    </div>
                  </button>
                  {open && (
                    <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-200 pt-4">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ТИП 2: КИРПИЧ ── */}
      <section id="tab-kirpich" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start mb-10">
            <div className="order-2 lg:order-1">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200">
                <EditablePhoto
                  src={IMG2}
                  alt="Кирпичные столбы"
                  className="w-full h-full object-cover"
                  service="stolby"
                  mode="any"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1.5 mb-4">
                <Icon name="Building" size={14} className="text-orange-400" />
                <span className="text-orange-400 text-xs font-medium uppercase tracking-wider">Тип 2 · Премиум · 80+ лет</span>
              </div>
              <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900 mb-4">
                <span className="text-orange-400">Кирпичные</span> столбы
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                Классика премиум-сегмента: облицовочный кирпич + стальной сердечник внутри (профтруба 80×80×3). Кладка ведётся на морозостойкий раствор М150 с цветной расшивкой швов. Обязательно ставится на ростверк — это гарантирует, что кладка не треснет от пучения.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Облицовочный кирпич: керамика, гиперпрессованный или клинкер",
                  "Сердечник — профтруба 80×80×3 мм оцинкованная",
                  "Ростверк обязателен — лента 250×500 мм минимум",
                  "Шапки металл / бетон, опционально фонари",
                  "Срок службы 80+ лет (клинкер) / 60–80 лет (керамика)",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-gray-600 text-sm">
                    <Icon name="CheckCircle2" size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <h3 className="font-oswald font-bold text-xl text-gray-900 mb-5">Цены на кирпичные столбы</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {KIRPICH_ROWS.map((r) => (
              <div key={r.size} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 hover:border-orange-500/40 transition-colors">
                <div className="font-oswald font-semibold text-gray-900 text-base mb-1">{r.size}</div>
                <div className="text-orange-400 font-oswald font-bold text-2xl mb-2">{r.price}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{r.desc}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <Icon name="Plus" size={20} className="text-green-400 mb-2" />
              <div className="font-oswald font-semibold text-gray-900 text-sm mb-2">Плюсы кирпича</div>
              <ul className="text-gray-600 text-xs space-y-1 leading-relaxed">
                <li>· Премиальный вид участка</li>
                <li>· Срок службы 80+ лет</li>
                <li>· Идеально под ковку и комбинированные заборы</li>
                <li>· Подчёркивает статус, не требует обслуживания</li>
              </ul>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <Icon name="Minus" size={20} className="text-red-400 mb-2" />
              <div className="font-oswald font-semibold text-gray-900 text-sm mb-2">Минусы кирпича</div>
              <ul className="text-gray-600 text-xs space-y-1 leading-relaxed">
                <li>· Требует обязательного ростверка</li>
                <li>· Кладку лучше вести с апреля по октябрь</li>
                <li>· Дороже профтрубы в 15–20 раз</li>
                <li>· Срок монтажа 2–4 недели</li>
              </ul>
            </div>
          </div>

          <h3 className="font-oswald font-bold text-xl text-gray-900 mb-5">Вопросы по кирпичу</h3>
          <div className="space-y-3">
            {KIRPICH_FAQ.map((f, i) => {
              const key = `kirpich-${i}`;
              const open = openFaq === key;
              return (
                <div
                  key={key}
                  className={`bg-gray-50 border rounded-2xl overflow-hidden transition-all ${
                    open ? "border-orange-500/40" : "border-gray-200 hover:border-orange-500/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : key)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4"
                  >
                    <span className="font-oswald font-semibold text-gray-900 text-base pr-4">{f.q}</span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        open ? "bg-orange-500 text-gray-900 rotate-45" : "bg-white text-orange-400"
                      }`}
                    >
                      <Icon name="Plus" size={18} />
                    </div>
                  </button>
                  {open && (
                    <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-200 pt-4">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ТИП 3: БЛОКИ ── */}
      <section id="tab-bloki" className="py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start mb-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1.5 mb-4">
                <Icon name="Box" size={14} className="text-orange-400" />
                <span className="text-orange-400 text-xs font-medium uppercase tracking-wider">Тип 3 · Декоративные</span>
              </div>
              <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900 mb-4">
                Столбы из <span className="text-orange-400">декоративных блоков</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                Современная альтернатива классической кирпичной кладке. Пустотелые бетонные блоки 300×300 или 400×400 мм с готовой декоративной лицевой поверхностью: «рваный камень», «колотый кирпич», гладкие фактуры. Облицовка не нужна — выглядит как готовая отделка.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Один блок 300×300 заменяет ~8 кирпичей",
                  "Сердечник — профтруба 80×80×3 мм, заполнение раствором",
                  "Пустоты внутри армируются вертикальными стержнями Ø10",
                  "8–12 цветов: серый, графит, бежевый, терракот",
                  "Срок службы 40–50 лет, монтаж за 1–2 недели",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-gray-600 text-sm">
                    <Icon name="CheckCircle2" size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200">
                <EditablePhoto
                  src={IMG3}
                  alt="Столбы из декоративных блоков"
                  className="w-full h-full object-cover"
                  service="stolby"
                  mode="any"
                />
              </div>
            </div>
          </div>

          <h3 className="font-oswald font-bold text-xl text-gray-900 mb-5">Цены на блочные столбы</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {BLOKI_ROWS.map((r) => (
              <div key={r.size} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 hover:border-orange-500/40 transition-colors">
                <div className="font-oswald font-semibold text-gray-900 text-base mb-1">{r.size}</div>
                <div className="text-orange-400 font-oswald font-bold text-2xl mb-2">{r.price}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{r.desc}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <Icon name="Plus" size={20} className="text-green-400 mb-2" />
              <div className="font-oswald font-semibold text-gray-900 text-sm mb-2">Плюсы блоков</div>
              <ul className="text-gray-600 text-xs space-y-1 leading-relaxed">
                <li>· В 1.5–2 раза дешевле кирпичных</li>
                <li>· Монтаж в 2 раза быстрее</li>
                <li>· Готовая фактура «рваный камень»</li>
                <li>· Большой выбор цветов</li>
                <li>· Облицовка не нужна — лицо декоративное</li>
              </ul>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <Icon name="Minus" size={20} className="text-red-400 mb-2" />
              <div className="font-oswald font-semibold text-gray-900 text-sm mb-2">Минусы блоков</div>
              <ul className="text-gray-600 text-xs space-y-1 leading-relaxed">
                <li>· Срок службы меньше кирпича (40–50 лет vs 80+)</li>
                <li>· Требует гидрофобизации от высолов</li>
                <li>· Грубая фактура — не для всех стилей</li>
                <li>· Также нужен ростверк</li>
              </ul>
            </div>
          </div>

          <h3 className="font-oswald font-bold text-xl text-gray-900 mb-5">Вопросы по блокам</h3>
          <div className="space-y-3">
            {BLOKI_FAQ.map((f, i) => {
              const key = `bloki-${i}`;
              const open = openFaq === key;
              return (
                <div
                  key={key}
                  className={`bg-gray-50 border rounded-2xl overflow-hidden transition-all ${
                    open ? "border-orange-500/40" : "border-gray-200 hover:border-orange-500/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : key)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4"
                  >
                    <span className="font-oswald font-semibold text-gray-900 text-base pr-4">{f.q}</span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        open ? "bg-orange-500 text-gray-900 rotate-45" : "bg-white text-orange-400"
                      }`}
                    >
                      <Icon name="Plus" size={18} />
                    </div>
                  </button>
                  {open && (
                    <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-200 pt-4">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── СРАВНЕНИЕ: КАКОЙ ВЫБРАТЬ? ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="section-tag">Сравнение</span>
            <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900 mb-3">
              КАКОЙ СТОЛБ <span className="text-orange-400">ВЫБРАТЬ?</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">
              Сравните три типа по ключевым параметрам и выберите оптимальный под ваш забор.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-4 sm:p-7 overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">
                    Параметр
                  </th>
                  <th className="text-center py-4 px-3 text-gray-600 font-medium text-xs uppercase tracking-wider">
                    Профтруба
                  </th>
                  <th className="text-center py-4 px-3 text-orange-400 font-medium text-xs uppercase tracking-wider">
                    Кирпич
                    <span className="block text-[10px] text-orange-400/60 normal-case font-normal mt-0.5">
                      премиум
                    </span>
                  </th>
                  <th className="text-center py-4 px-3 text-gray-600 font-medium text-xs uppercase tracking-wider">
                    Блоки
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { p: "Цена за столб",     a: "от 450 ₽",      b: "от 8 500 ₽",   c: "от 3 500 ₽" },
                  { p: "Срок службы",       a: "25–30 лет",     b: "80+ лет",      c: "40–50 лет" },
                  { p: "Нужен ростверк",    a: "Опционально",   b: "Обязательно",  c: "Обязательно" },
                  { p: "Сезон монтажа",     a: "Круглый год",   b: "Апрель–Октябрь", c: "Апрель–Октябрь" },
                  { p: "Срок монтажа",      a: "1–2 дня",       b: "2–4 недели",   c: "1–2 недели" },
                  { p: "Внешний вид",       a: "Минимализм",    b: "Премиум",      c: "Декоративный" },
                  { p: "Под ковку",         a: "Можно",         b: "Идеально",     c: "Можно" },
                ].map((r) => (
                  <tr key={r.p} className="border-b border-gray-200 hover:bg-white/40 transition-colors">
                    <td className="py-3.5 px-3 text-gray-900 font-medium">{r.p}</td>
                    <td className="py-3.5 px-3 text-center text-gray-600 font-oswald">{r.a}</td>
                    <td className="py-3.5 px-3 text-center text-orange-400 font-oswald font-bold">{r.b}</td>
                    <td className="py-3.5 px-3 text-center text-gray-600 font-oswald">{r.c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 text-sm text-gray-600 flex items-start gap-3">
            <Icon name="Info" size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-orange-400 font-medium">Совет инженера:</span> для большинства частных домов с заборами 2–2.2 м оптимум — профтруба 80×80×2 (надёжно и недорого). Если бюджет позволяет и хочется «вау»-эффекта — кирпич 2×2 на ростверке. Блоки — компромисс между ценой и декоративностью.
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO})`, opacity: 0.12 }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0f14] via-[#0d0f14]/95 to-[#0d0f14]/70" />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 80% 50%, rgba(249,115,22,0.15) 0%, transparent 60%)",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
            <div className="lg:col-span-3">
              <span className="section-tag">Бесплатно</span>
              <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-white mb-4 leading-tight">
                ЗАКАЗАТЬ ЗАМЕР И ПОДБОР СТОЛБОВ
              </h2>
              <p className="text-white/60 text-base mb-6 max-w-xl">
                Замерщик-инженер приедет на участок, определит тип грунта (пробное бурение), рекомендует оптимальный тип столбов под вашу нагрузку и бюджет. Бесплатно.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                {[
                  { icon: "Clock", text: "Звонок за 15 мин." },
                  { icon: "Ruler", text: "Замер бесплатно" },
                  { icon: "FileText", text: "Смета на email" },
                  { icon: "Gift", text: "Скидка 5%" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-white/70">
                    <Icon name={icon} size={15} className="text-orange-400 flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-gray-50/95 backdrop-blur border-2 border-orange-500/30 rounded-3xl p-7 shadow-2xl shadow-orange-500/10">
                <div className="font-oswald font-bold text-2xl text-gray-900 mb-1">Точный расчёт</div>
                <p className="text-gray-500 text-xs mb-5">Менеджер перезвонит в течение 15 минут</p>
                <button
                  onClick={() =>
                    lead.open({
                      title: "Заказать замер столбов",
                      source: "Услуга: Столбы (лид-форма)",
                      serviceHint: "Столбы для забора · от 450 ₽/столб",
                    })
                  }
                  className="btn-orange w-full py-4 rounded-xl text-base group"
                >
                  <span className="flex items-center gap-2 justify-center">
                    Заказать замер
                    <Icon
                      name="ArrowRight"
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </span>
                </button>
                <p className="text-gray-500 text-[11px] text-center mt-3">
                  Согласие с{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400/70 hover:text-orange-400 underline"
                  >
                    политикой
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-3 text-gray-500 hover:text-orange-400 transition-colors text-sm"
          >
            <Icon name="ChevronLeft" size={16} />
            Вернуться на главную
          </Link>
          <div className="text-gray-500 text-xs">© 2009–2026 ООО «СтальГрупп» · 8 800 123-45-67</div>
        </div>
      </footer>
    </div>
  );
}