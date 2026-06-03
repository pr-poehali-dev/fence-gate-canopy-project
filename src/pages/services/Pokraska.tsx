import { useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import SiteHeader from "@/components/SiteHeader";
import PaintLevels from "@/components/service/PaintLevels";
import { useLeadModal } from "@/hooks/useLeadModal";

export default function Pokraska() {
  const lead = useLeadModal();

  useEffect(() => {
    document.title = "Покраска заборов и металлоконструкций — СтальГрупп, Москва и МО";
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-golos">
      {lead.node}
      <SiteHeader />

      {/* Хлебные крошки */}
      <div className="pb-2 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs">
          <Link to="/" className="text-gray-500 hover:text-orange-400 transition-colors">Главная</Link>
          <Icon name="ChevronRight" size={12} className="text-gray-400" />
          <Link to="/#products" className="text-gray-500 hover:text-orange-400 transition-colors">Услуги</Link>
          <Icon name="ChevronRight" size={12} className="text-gray-400" />
          <span className="text-orange-400">Покраска</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden grid-pattern py-16 lg:py-20 bg-[#0d0f14]">
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(circle at 75% 30%, rgba(249,115,22,0.18) 0%, transparent 60%)" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="section-tag">Защитное покрытие</span>
            <h1 className="font-oswald font-bold text-4xl sm:text-5xl text-white mb-5 leading-tight">
              Покраска заборов <span className="text-orange-400">и металлоконструкций</span>
            </h1>
            <p className="text-white/60 text-base sm:text-lg mb-7 leading-relaxed">
              Подбираем покрытие под бюджет и условия эксплуатации — от молотковой эмали до заводской
              порошковой полимеризации по ГОСТ. Двухкомпонентный грунт и гарантия 3 года по договору.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => lead.open({
                  title: "Расчёт покраски",
                  source: "Услуга: Покраска (hero)",
                  serviceHint: "Покраска заборов и металлоконструкций",
                })}
                className="btn-orange px-6 py-3.5 rounded-xl text-base group">
                <span className="flex items-center gap-2 justify-center">
                  Рассчитать покраску
                  <Icon name="ArrowRight" size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <Link to="/#products" className="btn-outline-orange px-6 py-3.5 rounded-xl text-base flex items-center gap-2">
                <Icon name="LayoutGrid" size={18} /> Все услуги
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Три уровня покраски */}
      <PaintLevels />

      {/* CTA */}
      <section className="py-20 bg-[#0d0f14] relative overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(circle at 80% 50%, rgba(249,115,22,0.15) 0%, transparent 60%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-white mb-4">
            Не знаете, какое покрытие выбрать?
          </h2>
          <p className="text-white/60 mb-7">
            Бесплатный замер и подбор покрытия под ваш забор. Менеджер перезвонит в течение 15 минут.
          </p>
          <button onClick={() => lead.open({
              title: "Подбор покрытия",
              source: "Услуга: Покраска (CTA)",
              serviceHint: "Покраска заборов и металлоконструкций",
            })}
            className="btn-orange px-8 py-4 rounded-xl text-base group inline-flex">
            <span className="flex items-center gap-2 justify-center">
              Получить расчёт
              <Icon name="ArrowRight" size={18} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
