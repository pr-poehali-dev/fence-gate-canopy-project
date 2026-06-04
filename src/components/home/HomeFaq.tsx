import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useLeadModal } from "@/hooks/useLeadModal";

const FAQ = [
  {
    q: "Сколько стоит забор под ключ?",
    a: "Профнастил — от 1450 ₽/м.п., евроштакетник — от 1750 ₽/м.п., сетка-рабица — от 650 ₽/м.п. Точную стоимость покажет калькулятор на сайте или менеджер после бесплатного замера. Цена фиксируется в договоре и не меняется.",
  },
  {
    q: "Бесплатный ли замер?",
    a: "Да, замер бесплатный. Замерщик выезжает в день обращения по Москве и всей области, делает замеры, советует материал и тип фундамента, рассчитывает точную смету на месте.",
  },
  {
    q: "Какая гарантия на работы?",
    a: "3 года письменной гарантии по договору на конструкцию, монтаж и покраску. Срок службы материалов — до 25 лет в зависимости от покрытия. Все документы (договор, акт, чек, гарантийный талон) выдаём на руки.",
  },
  {
    q: "За сколько устанавливаете забор?",
    a: "Изготовление — 7–14 дней, монтаж — 1–3 дня в зависимости от объёма. Работает своя бригада, без посредников и субподряда, поэтому сроки соблюдаем точно.",
  },
  {
    q: "Как происходит оплата?",
    a: "50% предоплата после подписания договора, 50% — после монтажа и приёмки работ. Для юридических лиц работаем по безналу с полным пакетом документов. Есть рассрочка.",
  },
  {
    q: "Работаете зимой?",
    a: "Да. Заборы на профильную трубу ставим круглый год — бетонирование возможно с противоморозными добавками. Кирпичную кладку рекомендуем с апреля по октябрь. Зимой часто действуют скидки на монтаж.",
  },
];

/** Секция «Частые вопросы» — снимает возражения перед заявкой. */
export default function HomeFaq() {
  const [open, setOpen] = useState<number | null>(0);
  const { open: openLead } = useLeadModal();

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="section-tag">Вопросы и ответы</span>
          <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900">
            Отвечаем на частые вопросы
          </h2>
          <p className="text-gray-600 mt-3">
            Не нашли ответ? Позвоните нам — проконсультируем бесплатно.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i}
                className={`border rounded-2xl overflow-hidden transition-all ${isOpen ? "border-orange-300 shadow-md" : "border-gray-200"}`}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-orange-50/50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{item.q}</span>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isOpen ? "bg-orange-500 text-white rotate-45" : "bg-gray-100 text-gray-500"}`}>
                    <Icon name="Plus" size={16} />
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-gray-600 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => openLead("faq-section")}
            className="btn-orange px-7 py-3.5 rounded-xl inline-flex items-center gap-2"
          >
            <Icon name="MessageCircle" size={18} />
            Задать свой вопрос
          </button>
        </div>
      </div>
    </section>
  );
}
