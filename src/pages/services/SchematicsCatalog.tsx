import { useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import SiteLogo from "@/components/SiteLogo";
import { useLeadModal } from "@/hooks/useLeadModal";
import { useMediaByService } from "@/hooks/useMediaByService";

interface SchemaCategory {
  title:    string;
  desc:     string;
  icon:     string;
  to:       string;
  slug:     string;
}

const CATEGORIES: SchemaCategory[] = [
  {
    title: "Фундаменты и ростверки",
    desc:  "Бутование, бетонирование, винтовые сваи, ленточный монолит. Сечения, глубины, армирование.",
    icon:  "Layers",
    to:    "/services/fundamenty",
    slug:  "fundamenty",
  },
  {
    title: "Узлы крепления столбов",
    desc:  "Профтруба 60×60, крепление лаг, заглушки, шаг столбов, бутование/бетонирование.",
    icon:  "Anchor",
    to:    "/services/profnastil",
    slug:  "profnastil",
  },
  {
    title: "Кирпичные и блочные столбы",
    desc:  "Сечения 1.5/2/2.5 кирпича, сердечник, армирование, шапки, расшивка швов.",
    icon:  "Building",
    to:    "/zabory/kirpichnye-stolby",
    slug:  "kirpichnye-stolby",
  },
  {
    title: "Откатные ворота — схема консоли",
    desc:  "Консоль ЭКО / КСД, ролики Combi Arialdo, противовес, фундамент под ворота.",
    icon:  "MoveHorizontal",
    to:    "/services/otkatnye-vorota",
    slug:  "otkatnye-vorota",
  },
  {
    title: "Распашные ворота",
    desc:  "Каркас 60×40, петли с подшипниками, ригельный замок, упоры, автоматика.",
    icon:  "DoorOpen",
    to:    "/services/raspashnye-vorota",
    slug:  "raspashnye-vorota",
  },
  {
    title: "Сечения профилей",
    desc:  "С8, С20, С21, МП20, НС35 — высота волны, ширина листа, толщина стали.",
    icon:  "Layers",
    to:    "/services/profnastil",
    slug:  "profnastil",
  },
  {
    title: "Калитки",
    desc:  "Размеры полотна, врезные/накладные замки, петли, доводчики, электрозамки.",
    icon:  "DoorClosed",
    to:    "/services/kalitki",
    slug:  "kalitki",
  },
  {
    title: "Навесы",
    desc:  "Сечения ферм, узлы крепления, поликарбонат / профнастил, снеговая нагрузка.",
    icon:  "Umbrella",
    to:    "/services/navesy",
    slug:  "navesy",
  },
];

function CategoryCard({ cat }: { cat: SchemaCategory }) {
  const photos = useMediaByService(cat.slug);
  const preview = photos[0];

  return (
    <Link
      to={cat.to}
      className="group bg-[#141720] border border-[#1e2230] hover:border-orange-500/50 rounded-2xl overflow-hidden transition-all hover:-translate-y-1"
    >
      <div className="aspect-[4/3] overflow-hidden bg-[#0a0c10] relative">
        {preview ? (
          <img
            src={preview}
            alt={cat.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <Icon name={cat.icon} size={48} />
          </div>
        )}
        <div className="absolute top-3 left-3 w-11 h-11 bg-orange-500/90 backdrop-blur rounded-xl flex items-center justify-center text-gray-900 shadow-lg">
          <Icon name={cat.icon} size={20} />
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-oswald font-bold text-white text-lg mb-1.5 group-hover:text-orange-400 transition-colors">
          {cat.title}
        </h3>
        <p className="text-white/50 text-xs leading-relaxed mb-3">{cat.desc}</p>
        <div className="flex items-center gap-1.5 text-orange-400 text-xs font-medium">
          Открыть схемы
          <Icon name="ArrowRight" size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

export default function SchematicsCatalog() {
  const lead = useLeadModal({ source: "Каталог схем и чертежей" });

  useEffect(() => {
    document.title = "Технические схемы и чертежи — СтальГрупп";
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      {lead.node}

      {/* ── ШАПКА ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e2230]"
        style={{ background: "rgba(13,15,20,0.93)", backdropFilter: "blur(16px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <SiteLogo size="md" />

            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1e2230] hover:border-orange-500/50 text-white/70 hover:text-orange-400 transition-colors text-sm"
            >
              <Icon name="ChevronLeft" size={16} />
              <span className="hidden sm:inline">Назад на главную</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── ХЛЕБНЫЕ КРОШКИ ── */}
      <div className="pt-20 pb-2 bg-[#0a0c10] border-b border-[#1e2230]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs">
          <Link to="/" className="text-white/40 hover:text-orange-400 transition-colors">
            Главная
          </Link>
          <Icon name="ChevronRight" size={12} className="text-white/25" />
          <span className="text-orange-400">Технические схемы</span>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-14 lg:py-20">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 70% 50%, rgba(249,115,22,0.10) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1.5 mb-5">
            <Icon name="FileText" size={14} className="text-orange-400" />
            <span className="text-orange-400 text-xs font-medium">Технический отдел</span>
          </div>
          <h1 className="font-oswald font-bold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-5">
            Технические <span className="text-orange-400">схемы и чертежи</span>
          </h1>
          <p className="text-white/60 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Все размеры, узлы и сечения, которые мы используем при работе. Можете скачать или сохранить для согласования.
          </p>
        </div>
      </section>

      {/* ── СЕТКА КАТЕГОРИЙ ── */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CATEGORIES.map((cat) => (
              <CategoryCard key={cat.title} cat={cat} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 80% 50%, rgba(249,115,22,0.15) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-[#141720]/95 backdrop-blur border-2 border-orange-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-orange-500/10">
            <div className="w-14 h-14 mx-auto bg-orange-500/15 rounded-2xl flex items-center justify-center mb-5">
              <Icon name="HelpCircle" size={26} className="text-orange-400" />
            </div>
            <h2 className="font-oswald font-bold text-2xl sm:text-3xl text-white mb-3 leading-tight">
              Не нашли нужную схему?
            </h2>
            <p className="text-white/60 text-sm sm:text-base mb-6 max-w-xl mx-auto">
              Закажите консультацию — инженер пришлёт нужные чертежи на email, ответит на технические вопросы и подготовит индивидуальный проект под ваш участок.
            </p>
            <button
              onClick={() =>
                lead.open({
                  title: "Консультация инженера",
                  subtitle: "Расскажите, какая схема нужна — пришлём по email в течение дня.",
                })
              }
              className="btn-orange px-7 py-3.5 rounded-xl text-base inline-flex items-center gap-2 group"
            >
              Заказать консультацию
              <Icon
                name="ArrowRight"
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
            <div className="mt-5 flex items-center justify-center gap-5 text-xs text-white/40">
              <span className="flex items-center gap-1.5">
                <Icon name="Clock" size={12} className="text-orange-400" />
                Ответ за 15 минут
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="Mail" size={12} className="text-orange-400" />
                Чертежи на email
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#1e2230] bg-[#0a0c10] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-3 text-white/40 hover:text-orange-400 transition-colors text-sm"
          >
            <Icon name="ChevronLeft" size={16} />
            Вернуться на главную
          </Link>
          <div className="text-white/30 text-xs">
            © 2009–2026 ООО «СтальГрупп» · 8 800 123-45-67
          </div>
        </div>
      </footer>
    </div>
  );
}
