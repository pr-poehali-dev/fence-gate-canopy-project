import ServicePage from "@/components/ServicePage";
import ServiceTypeTabs, { ServiceTypeTab } from "@/components/service/ServiceTypeTabs";
import EditablePhoto from "@/components/EditablePhoto";
import Icon from "@/components/ui/icon";
import { useMediaByService } from "@/hooks/useMediaByService";

// Все четыре типа фундаментов теперь живут в одной странице на якорях-табах.
// Старый отдельный маршрут /zabory/na-rostverke редиректит сюда.
const TABS: ServiceTypeTab[] = [
  {
    slug: "tab-betonirovanie",
    label: "Бетонирование",
    icon: "Hammer",
    shortDesc: "Универсал · М300 · 1.2 м",
    badge: "Рекомендуем",
  },
  {
    slug: "tab-butovanie",
    label: "Бутование щебнем",
    icon: "Mountain",
    shortDesc: "Песок · лёгкие заборы",
  },
  {
    slug: "tab-svai",
    label: "Винтовые сваи",
    icon: "TrendingDown",
    shortDesc: "Торф · болото · круглый год",
  },
  {
    slug: "tab-rostverk",
    label: "Ленточный + ростверк",
    icon: "Layers",
    shortDesc: "Тяжёлые заборы · 50+ лет",
    badge: "Премиум",
  },
];

export default function Foundations() {
  const PHOTOS = useMediaByService("fundamenty");
  const HERO = PHOTOS[0];
  const IMG = PHOTOS[1];
  const IMG2 = PHOTOS[2];
  const IMG3 = PHOTOS[3];

  // Якорь, по которому пришёл пользователь — для подсветки активного таба.
  const activeTab = typeof window !== "undefined" && window.location.hash
    ? window.location.hash.replace(/^#/, "")
    : "tab-betonirovanie";

  // ── ТАБЫ (слот сразу после Hero) ─────────────────────────────────────────
  const tabsNode = (
    <ServiceTypeTabs
      title="Типы фундаментов"
      subtitle="Подбираем по типу грунта, нагрузке и сезону монтажа. Все варианты — под ключ с гарантией 3 года."
      basePath="/uslugi/fundamenty"
      activeSlug={activeTab}
      types={TABS}
    />
  );

  // ── ДЕТАЛЬНЫЕ СЕКЦИИ ПО КАЖДОМУ ТИПУ (слот после блока цен) ─────────────
  const detailsNode = (
    <>
      {/* ── БЕТОНИРОВАНИЕ ── */}
      <section id="tab-betonirovanie" className="py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1.5 mb-4">
                <Icon name="Hammer" size={14} className="text-orange-400" />
                <span className="text-orange-400 text-xs font-medium uppercase tracking-wider">Тип 1 · Рекомендуем</span>
              </div>
              <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-white mb-4">
                Бетонирование <span className="text-orange-400">столбов</span>
              </h2>
              <p className="text-white/60 leading-relaxed mb-5">
                Универсальный фундамент для большинства грунтов МО: песок, супесь, суглинок. Цементный раствор М300 заливается в лунку глубиной 1.2 м (ниже точки промерзания), вокруг металлического столба. Гарантирует устойчивость даже к пучению.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Цемент ПЦ400/М500, бетон М300 с пластификатором",
                  "Глубина 1.2 м — ниже точки промерзания для МО",
                  "Расширение низа лунки для «якоря» против пучения",
                  "Можно работать зимой с противоморозными добавками",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-white/75 text-sm">
                    <Icon name="CheckCircle2" size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="flex items-end gap-6 flex-wrap">
                <div>
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Цена</div>
                  <div className="font-oswald font-bold text-3xl text-orange-400 leading-none">от 1 500 ₽</div>
                  <div className="text-white/40 text-xs mt-1">за столб «под ключ»</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-5">
                <Icon name="Plus" size={20} className="text-green-400 mb-2" />
                <div className="font-oswald font-semibold text-white text-sm mb-1">Плюсы</div>
                <ul className="text-white/55 text-xs space-y-1 leading-relaxed">
                  <li>· Подходит почти под все грунты</li>
                  <li>· Цена/качество — оптимум</li>
                  <li>· Можно ставить в день монтажа</li>
                  <li>· Срок службы 25–30 лет</li>
                </ul>
              </div>
              <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-5">
                <Icon name="Minus" size={20} className="text-red-400 mb-2" />
                <div className="font-oswald font-semibold text-white text-sm mb-1">Минусы</div>
                <ul className="text-white/55 text-xs space-y-1 leading-relaxed">
                  <li>· Не подходит для торфа/болота</li>
                  <li>· Полная нагрузка — через 7 дней</li>
                  <li>· Для тяжёлых заборов нужен ростверк</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── БУТОВАНИЕ ── */}
      <section id="tab-butovanie" className="py-20 bg-[#0a0c10] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1 grid grid-cols-2 gap-4">
              <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-5">
                <Icon name="Plus" size={20} className="text-green-400 mb-2" />
                <div className="font-oswald font-semibold text-white text-sm mb-1">Плюсы</div>
                <ul className="text-white/55 text-xs space-y-1 leading-relaxed">
                  <li>· Самый дешёвый способ</li>
                  <li>· Монтаж без застывания</li>
                  <li>· Не нужны бетономешалки</li>
                  <li>· Хорошо работает на песке</li>
                </ul>
              </div>
              <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-5">
                <Icon name="Minus" size={20} className="text-red-400 mb-2" />
                <div className="font-oswald font-semibold text-white text-sm mb-1">Минусы</div>
                <ul className="text-white/55 text-xs space-y-1 leading-relaxed">
                  <li>· Только для лёгких заборов</li>
                  <li>· Не любит глину и пучение</li>
                  <li>· Зимой не делаем</li>
                  <li>· Срок службы 15–20 лет</li>
                </ul>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1.5 mb-4">
                <Icon name="Mountain" size={14} className="text-orange-400" />
                <span className="text-orange-400 text-xs font-medium uppercase tracking-wider">Тип 2 · Эконом</span>
              </div>
              <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-white mb-4">
                Бутование <span className="text-orange-400">щебнем</span>
              </h2>
              <p className="text-white/60 leading-relaxed mb-5">
                Самый бюджетный фундамент: лунка засыпается щебнем фракции 20–40 и послойно трамбуется вокруг столба. Применяется на песчаных и сухих супесчаных грунтах под лёгкие заборы из профнастила, штакетника или рабицы.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Щебень гранитный, фракция 20–40 мм",
                  "Трамбовка слоями по 20 см",
                  "Глубина 1.0–1.2 м",
                  "Подходит для заборов до 2 м из лёгких материалов",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-white/75 text-sm">
                    <Icon name="CheckCircle2" size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="flex items-end gap-6 flex-wrap">
                <div>
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Цена</div>
                  <div className="font-oswald font-bold text-3xl text-orange-400 leading-none">от 800 ₽</div>
                  <div className="text-white/40 text-xs mt-1">за столб</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ВИНТОВЫЕ СВАИ ── */}
      <section id="tab-svai" className="py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1.5 mb-4">
                <Icon name="TrendingDown" size={14} className="text-orange-400" />
                <span className="text-orange-400 text-xs font-medium uppercase tracking-wider">Тип 3 · Сложные грунты</span>
              </div>
              <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-white mb-4">
                Винтовые <span className="text-orange-400">сваи</span>
              </h2>
              <p className="text-white/60 leading-relaxed mb-5">
                Стальные трубы с лопастью, вкручиваются в грунт на 2.5–4 м до плотного слоя. Идеальное решение для торфа, болота, обводнённого грунта или промёрзшей земли. Готовый забор можно ставить в день монтажа свай — никакого ожидания твердения бетона.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Сталь Ст3, труба Ø108×4 мм, лопасть Ø250",
                  "Длина свай 2.5–4 м под нагрузку и грунт",
                  "Монтаж в день — без бетона и ожидания",
                  "Работаем круглый год, в т.ч. зимой",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-white/75 text-sm">
                    <Icon name="CheckCircle2" size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="flex items-end gap-6 flex-wrap">
                <div>
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Цена</div>
                  <div className="font-oswald font-bold text-3xl text-orange-400 leading-none">от 2 400 ₽</div>
                  <div className="text-white/40 text-xs mt-1">за столб со сваей</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-5">
                <Icon name="Plus" size={20} className="text-green-400 mb-2" />
                <div className="font-oswald font-semibold text-white text-sm mb-1">Плюсы</div>
                <ul className="text-white/55 text-xs space-y-1 leading-relaxed">
                  <li>· Идеален для слабых грунтов</li>
                  <li>· Монтаж в день, без бетона</li>
                  <li>· Круглый год, даже зимой</li>
                  <li>· Можно снять/перенести</li>
                </ul>
              </div>
              <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-5">
                <Icon name="Minus" size={20} className="text-red-400 mb-2" />
                <div className="font-oswald font-semibold text-white text-sm mb-1">Минусы</div>
                <ul className="text-white/55 text-xs space-y-1 leading-relaxed">
                  <li>· Дороже бетонирования</li>
                  <li>· Не любят каменистые грунты</li>
                  <li>· Требуется антикоррозийная обработка</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ЛЕНТОЧНЫЙ + РОСТВЕРК ── */}
      <section id="tab-rostverk" className="py-20 bg-[#0a0c10] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start mb-12">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1.5 mb-4">
                <Icon name="Layers" size={14} className="text-orange-400" />
                <span className="text-orange-400 text-xs font-medium uppercase tracking-wider">Тип 4 · Премиум · 50+ лет</span>
              </div>
              <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-white mb-4">
                Ленточный фундамент <span className="text-orange-400">(ростверк)</span>
              </h2>
              <p className="text-white/60 leading-relaxed mb-5">
                Монолитная железобетонная балка, проходящая вдоль всей линии забора и объединяющая столбы в единую конструкцию. Единственное правильное решение для тяжёлых заборов с кирпичными столбами и коваными секциями, а также для пучинистых грунтов МО.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Бетон В22.5 (М300), морозостойкость F150",
                  "Арматура Ø12 А3 — 4 стержня + хомуты Ø8 шаг 200 мм",
                  "Готовый цоколь 15–25 см над землёй",
                  "Шаг столбов 2.5–3.0 м, не боится пучения",
                  "Срок службы конструкции 50+ лет",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-white/75 text-sm">
                    <Icon name="CheckCircle2" size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="flex items-end gap-6 flex-wrap mb-6">
                <div>
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Цена</div>
                  <div className="font-oswald font-bold text-3xl text-orange-400 leading-none">от 4 200 ₽</div>
                  <div className="text-white/40 text-xs mt-1">за погонный метр с заполнением</div>
                </div>
              </div>
            </div>

            <div>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-[#1e2230]">
                <EditablePhoto
                  src={IMG || HERO}
                  alt="Ленточный фундамент с ростверком"
                  className="w-full h-full object-cover"
                  service="fundamenty"
                  mode="any"
                />
              </div>
            </div>
          </div>

          {/* Спецификация ростверка */}
          <h3 className="font-oswald font-bold text-xl text-white mb-5">Спецификация ленты</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              { icon: "Minus",     label: "Лента 200×400 мм",  price: "от 3 800 ₽/м",  desc: "Лёгкие заборы из профнастила/штакетника" },
              { icon: "Square",    label: "Лента 250×500 мм",  price: "от 4 600 ₽/м",  desc: "Универсал, под комбинированные заборы" },
              { icon: "Box",       label: "Лента 300×600 мм",  price: "от 5 400 ₽/м",  desc: "Под тяжёлые: кирпич, ковка, бетон" },
              { icon: "TrendingDown", label: "Со сваями Ø150",  price: "от 7 200 ₽/м", desc: "Для слабых, торфяных грунтов" },
            ].map((row) => (
              <div key={row.label} className="bg-[#141720] border border-[#1e2230] rounded-2xl p-5 hover:border-orange-500/40 transition-colors">
                <Icon name={row.icon} size={22} className="text-orange-400 mb-3" />
                <div className="font-oswald font-semibold text-white text-base mb-1">{row.label}</div>
                <div className="text-orange-400 font-oswald font-bold text-lg mb-1.5">{row.price}</div>
                <div className="text-white/45 text-xs leading-relaxed">{row.desc}</div>
              </div>
            ))}
          </div>

          {/* Фото монтажа ростверка */}
          <h3 className="font-oswald font-bold text-xl text-white mb-5">Этапы монтажа ростверка</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {[
              { src: IMG  || HERO, title: "Земляные работы и опалубка",   desc: "2–3 дня на 100 м.п." },
              { src: IMG2 || HERO, title: "Армирование и заливка М300",    desc: "1 день, с виброуплотнением" },
              { src: IMG3 || HERO, title: "Распалубка и гидроизоляция",    desc: "Через 3–5 дней" },
            ].map((step) => (
              <div key={step.title} className="bg-[#141720] border border-[#1e2230] rounded-2xl overflow-hidden hover:border-orange-500/40 transition-all">
                <div className="aspect-[4/3] overflow-hidden">
                  <EditablePhoto
                    src={step.src}
                    alt={step.title}
                    className="w-full h-full object-cover"
                    service="fundamenty"
                    mode="any"
                  />
                </div>
                <div className="p-4">
                  <div className="font-oswald font-semibold text-white text-base mb-1">{step.title}</div>
                  <div className="text-white/45 text-xs">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ по ростверку */}
          <h3 className="font-oswald font-bold text-xl text-white mb-5">Вопросы о ростверке</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              {
                q: "Боится ли ростверк морозного пучения?",
                a: "При правильном устройстве — нет. Заглубляем ленту на 400–600 мм, делаем щебневую подушку 100–150 мм под лентой и предусматриваем компенсационные зазоры. На особо пучинистых грунтах применяем висячий ростверк на сваях Ø150 — лента «висит» над грунтом на 50–100 мм.",
              },
              {
                q: "Какую толщину ленты выбрать?",
                a: "200×400 мм — для профнастила/штакетника. 250×500 мм — универсал. 300×600 мм — обязательно для кирпичных столбов 2×2 и тяжёлой ковки.",
              },
              {
                q: "Сколько времени занимают работы?",
                a: "На 100 м.п.: земляные работы и опалубка — 2–3 дня, армирование и заливка — 1 день, распалубка — через 3–5 дней. К монтажу забора приступаем через 7 дней (50% прочности бетона), полную нагрузку даём через 21 день.",
              },
              {
                q: "Можно ли заливать ростверк зимой?",
                a: "Да, до −20°C с противоморозными добавками типа «Поташ» и подогревом смеси. Удорожание 15–20%. Альтернатива зимой — свайно-ростверковая система, где сваи закручиваются в любую погоду.",
              },
            ].map((f) => (
              <div key={f.q} className="bg-[#141720] border border-[#1e2230] rounded-2xl p-5">
                <div className="font-oswald font-semibold text-white text-base mb-2 flex items-start gap-2">
                  <Icon name="HelpCircle" size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
                  {f.q}
                </div>
                <p className="text-white/55 text-sm leading-relaxed pl-7">{f.a}</p>
              </div>
            ))}
          </div>

          {/* Портфолио ростверков */}
          <h3 className="font-oswald font-bold text-xl text-white mb-5 mt-12">Портфолио объектов с ростверком</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { src: HERO,         loc: "Красногорск, КП «Лазурный» — лента 250×500", size: "180 м" },
              { src: IMG  || HERO, loc: "Истра, частный дом — лента + кирпич",         size: "120 м" },
              { src: IMG2 || HERO, loc: "Одинцово, пучинистый грунт — 300×600",         size: "95 м"  },
              { src: IMG3 || HERO, loc: "Подольск, дача — лента 200×400",                size: "80 м"  },
              { src: HERO,         loc: "Балашиха, перепад рельефа 1.2 м",               size: "140 м" },
              { src: IMG  || HERO, loc: "Химки, ростверк со сваями Ø150",                size: "210 м" },
            ].map((it, i) => (
              <div key={i} className="bg-[#141720] border border-[#1e2230] rounded-2xl overflow-hidden hover:border-orange-500/40 transition-all">
                <div className="aspect-[4/3] overflow-hidden">
                  <EditablePhoto
                    src={it.src}
                    alt={it.loc}
                    className="w-full h-full object-cover"
                    service="fundamenty"
                    mode="any"
                  />
                </div>
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="text-white/70 text-xs flex items-center gap-1.5 truncate">
                    <Icon name="MapPin" size={14} className="text-orange-400 flex-shrink-0" />
                    <span className="truncate">{it.loc}</span>
                  </div>
                  <span className="text-orange-400 font-oswald font-bold text-sm whitespace-nowrap">{it.size}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );

  return (
    <ServicePage
      pageSlug="services/fundamenty"
      mediaSlug="fundamenty"
      metaTitle="Фундаменты под забор от 650 ₽/м.п. — СтальГрупп, Москва и МО"
      metaDescription="Бутование, бетонирование, винтовые сваи, ленточный фундамент с ростверком. Москва, Люберцы, Чапаевка. Расчёт по типу грунта. Гарантия 3 года."
      breadcrumb="Фундаменты под забор"
      h1="Фундаменты под забор и ворота"
      heroBadge="Все типы · Расчёт по грунту · Гарантия"
      subtitle="Подбираем оптимальный фундамент под ваш забор: от бутования щебнем за 800 ₽/столб до ленточного монолита с ростверком. Учитываем тип грунта, нагрузку и сезон монтажа."
      benefits={[
        "Подбор по типу грунта (песок, глина, торф, скала)",
        "Глубина ниже точки промерзания (1.2 м для МО)",
        "Цемент М300, армирование, опалубка",
        "Зимний монтаж с противоморозными добавками",
        "Гарантия 3 года на конструкцию",
      ]}
      startPrice="650 ₽"
      priceUnit="за погонный метр (бутование лёгкого забора)"
      heroImg={HERO}

      aboutTitle="Фундамент — основа долговечности забора"
      aboutText={`Правильный фундамент решает 80% долговечности забора. Неправильный вызывает «гуляние» столбов через 2–3 зимы и переустановку всего ограждения.

Мы используем 4 проверенных метода в зависимости от грунта и типа забора: бутование, бетонирование, винтовые сваи, ленточный монолит с ростверком.`}

      suitableFor={[
        { icon: "Mountain",  title: "Песок и супесь",  desc: "Бутование или бетонирование 1.2 м" },
        { icon: "Droplets",  title: "Глина",            desc: "Только бетонирование с расширением низа" },
        { icon: "Waves",     title: "Торф, болото",    desc: "Винтовые сваи с длиной 2.5–4 м" },
        { icon: "Construction", title: "Сложный рельеф", desc: "Свайно-ростверковый или ленточный" },
      ]}

      priceRows={[
        { param: "Присыпка щебнем (от 30 м — бесплатно)", zink: "650 ₽/м",   polymer: "—", premium: "—" },
        { param: "Бутование (щебень + трамбовка)",         zink: "800 ₽/столб",  polymer: "—", premium: "—" },
        { param: "Бетонирование М300, глубина 1.2 м",      zink: "1 500 ₽/столб", polymer: "—", premium: "—" },
        { param: "Винтовые сваи Ø108 мм",                   zink: "2 400 ₽/столб", polymer: "—", premium: "—" },
        { param: "Ленточный 30×40 см, армирование",         zink: "3 200 ₽/м",   polymer: "—", premium: "—" },
        { param: "Свайно-ростверковый (под ворота)",        zink: "от 18 000 ₽", polymer: "—", premium: "—" },
      ]}

      foundations={[
        { name: "Бутование",      price: "800 ₽/столб",  desc: "Песок, сухая супесь. Лёгкие заборы.", recommend: false },
        { name: "Бетонирование",  price: "1 500 ₽/столб", desc: "Универсал для большинства грунтов МО.", recommend: true },
        { name: "Винтовые сваи",  price: "2 400 ₽/столб", desc: "Торф, болото, промёрзший грунт.", recommend: false },
        { name: "Ленточный + ростверк", price: "от 4 200 ₽/м", desc: "Премиум, с цоколем. Тяжёлые заборы.", recommend: false },
      ]}

      specs={[
        { param: "Глубина бурения",   value: "1.2 м (ниже точки промерзания для Москвы и МО)",              icon: "ArrowDown" },
        { param: "Диаметр лунки",     value: "Ø180–250 мм (зависит от типа фундамента)",                     icon: "Circle" },
        { param: "Цемент",             value: "ПЦ400/М500, бетон М300 с пластификатором",                     icon: "Package" },
        { param: "Армирование",       value: "Арматура Ø10–12 мм, 4 стержня + хомуты Ø6–8 мм",                icon: "Grid3x3" },
        { param: "Винтовые сваи",     value: "Ø108×4 мм, длина 2.5–4 м, сталь Ст3",                          icon: "TrendingDown" },
        { param: "Зимний монтаж",     value: "Противоморозная добавка «Поташ» до −20°C",                       icon: "Snowflake" },
      ]}
      specImg={IMG}

      profileTypes={[
        { img: IMG,  name: "Бутование",         desc: "Щебень + трамбовка." },
        { img: IMG2, name: "Бетонирование",     desc: "Цемент М300 на 1.2 м." },
        { img: IMG3, name: "Винтовые сваи",     desc: "Готово в день монтажа." },
        { img: HERO, name: "Ленточный + ростверк", desc: "Премиум, с цоколем." },
      ]}

      ralColors={[]}

      extras={[
        { icon: "Hammer",  name: "Демонтаж старого фундамента", price: "от 4 500 ₽/м", desc: "С вывозом мусора." },
        { icon: "Truck",    name: "Вывоз грунта",                price: "от 3 500 ₽/м³", desc: "После бурения лунок." },
        { icon: "Wrench",   name: "Расчёт нагрузок (проект)",    price: "от 8 500 ₽",  desc: "Для сложных объектов." },
      ]}

      portfolio={[
        { img: HERO, location: "Назарьево, ленточный 180 м",   size: "180 м" },
        { img: IMG2, location: "Чапаевка, сваи на торфе",      size: "85 столбов" },
        { img: IMG3, location: "Астрецово, бетонирование",     size: "120 столбов" },
      ]}

      faq={[
        { q: "Какой фундамент для тяжёлой ковки?", a: "Только бетонирование 1.5 м или ленточный монолит с ростверком. Бутование не выдержит вес кованых секций — столб «уйдёт» через 1–2 зимы." },
        { q: "Можно ли работать зимой?", a: "Да, до −20°C — с противоморозными добавками в бетон. Бутование зимой не делаем (щебень не трамбуется в мёрзлом грунте). Винтовые сваи — круглый год." },
        { q: "В чём разница между бетонированием и ростверком?", a: "Бетонирование — точечное (каждый столб в своей лунке). Ростверк — это монолитная лента, объединяющая все столбы в одну балку. Ростверк нужен для тяжёлых заборов (кирпич, ковка) и пучинистых грунтов." },
      ]}

      leadTitle="ПОДБОР ФУНДАМЕНТА ПОД ВАШ ЗАБОР"
      leadOffer="Замерщик-инженер определит тип грунта на участке (бурение пробной лунки) и подберёт оптимальный фундамент."
      warrantyYears={3}
      showFoundationSchemes
      showSoilCalculator

      afterHero={tabsNode}
      afterPrices={detailsNode}
    />
  );
}
