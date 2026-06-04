import Icon from "@/components/ui/icon";
import { useLeadModal } from "@/hooks/useLeadModal";

const POINTS = [
  {
    icon: "FileSignature",
    title: "Договор с фиксированной ценой",
    text: "Сумма и сроки закреплены документально. Доплат «по ходу» не будет — платите ровно столько, сколько согласовали.",
  },
  {
    icon: "Wallet",
    title: "Оплата по этапам",
    text: "Аванс после договора, остаток — только после монтажа и вашей приёмки. Не платите за невыполненную работу.",
  },
  {
    icon: "ShieldCheck",
    title: "Гарантия 3 года",
    text: "Письменная гарантия на конструкцию, монтаж и покрытие. Гарантийный талон и акт выдаём на руки.",
  },
  {
    icon: "BadgeCheck",
    title: "Все документы",
    text: "Договор, чек, акт выполненных работ, гарантийный талон. Работаем с физлицами и по безналу с юрлицами.",
  },
];

/** Блок «Безопасная сделка» — снимает страх «обманут» у производителя. */
export default function HomeGuarantee() {
  const { open: openLead } = useLeadModal();

  return (
    <section className="py-16 lg:py-20 bg-gray-900 text-white relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 80% 10%, rgba(249,115,22,0.18) 0%, transparent 60%)",
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <span className="inline-block text-orange-400 text-xs font-bold uppercase tracking-[0.25em] mb-3">
            Безопасная сделка
          </span>
          <h2 className="font-oswald font-bold text-3xl sm:text-4xl lg:text-5xl">
            Работаем честно и по договору
          </h2>
          <p className="text-white/60 mt-4 max-w-2xl mx-auto">
            Вы ничем не рискуете: фиксируем цену в договоре, берём оплату по этапам и даём настоящую гарантию. Так работает производитель, который дорожит репутацией.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {POINTS.map(p => (
            <div key={p.title}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center mb-4">
                <Icon name={p.icon} size={24} className="text-gray-900" />
              </div>
              <h3 className="font-oswald font-bold text-lg mb-2">{p.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => openLead("guarantee-section")}
            className="btn-orange px-8 py-4 rounded-xl inline-flex items-center gap-2 text-base"
          >
            <Icon name="FileText" size={18} />
            Получить договор и смету
          </button>
          <span className="text-white/50 text-sm flex items-center gap-2">
            <Icon name="Clock" size={15} className="text-orange-400" />
            Ответим в течение 15 минут
          </span>
        </div>
      </div>
    </section>
  );
}
