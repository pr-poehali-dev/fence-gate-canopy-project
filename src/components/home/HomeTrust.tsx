import Icon from "@/components/ui/icon";

const STATS = [
  { value: "17", suffix: " лет", label: "на рынке Москвы и МО" },
  { value: "5000", suffix: "+", label: "объектов сдано" },
  { value: "3", suffix: " года", label: "гарантия по договору" },
  { value: "98", suffix: "%", label: "клиентов рекомендуют нас" },
];

const REASONS = [
  {
    icon: "Factory",
    title: "Своё производство",
    text: "Варим и красим металл на собственной базе — без посредников и накруток. Поэтому цена ниже, а контроль качества — на каждом этапе.",
  },
  {
    icon: "Users",
    title: "Своя бригада монтажа",
    text: "Не нанимаем случайных людей. Опытные сварщики и монтажники в штате — аккуратно, в срок и с гарантией на работу.",
  },
  {
    icon: "FileCheck2",
    title: "Договор и фиксированная цена",
    text: "Стоимость и сроки прописаны в договоре. Никаких доплат «по ходу дела» — что согласовали, то и платите.",
  },
  {
    icon: "Ruler",
    title: "Бесплатный замер в день обращения",
    text: "Замерщик выезжает сегодня, считает точную смету на месте и советует оптимальный материал под ваш бюджет и грунт.",
  },
  {
    icon: "ShieldCheck",
    title: "Честная гарантия 3 года",
    text: "Письменная гарантия на конструкцию, монтаж и покрытие. Полный пакет документов: договор, акт, чек, гарантийный талон.",
  },
  {
    icon: "Truck",
    title: "Работаем по всей области",
    text: "Люберцы, Балашиха, Мытищи, Реутов и вся Московская область. Своя доставка материалов прямо на ваш участок.",
  },
];

/** Блок доверия: цифры + причины выбрать нас. Усиливает конверсию. */
export default function HomeTrust() {
  return (
    <section className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Цифры */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {STATS.map(s => (
            <div key={s.label}
              className="bg-white border border-gray-200 rounded-2xl p-5 text-center hover:border-orange-200 hover:shadow-lg transition-all">
              <div className="font-oswald font-bold text-4xl sm:text-5xl text-orange-500 leading-none">
                {s.value}<span className="text-2xl sm:text-3xl">{s.suffix}</span>
              </div>
              <div className="text-gray-600 text-sm mt-2">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Причины */}
        <div className="text-center mb-10">
          <span className="section-tag">Почему мы</span>
          <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900">
            Почему клиенты выбирают СтальГрупп
          </h2>
          <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
            Мы — производственная компания полного цикла, а не посредник. Поэтому вы получаете честную цену, контроль качества и реальную гарантию.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {REASONS.map(r => (
            <div key={r.title}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-orange-200 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                <Icon name={r.icon} size={24} className="text-orange-500" />
              </div>
              <h3 className="font-oswald font-bold text-lg text-gray-900 mb-2">{r.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
