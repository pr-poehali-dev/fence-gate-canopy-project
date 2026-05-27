/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@/components/ui/icon";
import { useLeadModal } from "@/hooks/useLeadModal";

export interface PageBlock {
  id?: number;
  block_type: string;
  position?: number;
  data: Record<string, any>;
}

interface Props {
  block: PageBlock;
}

export default function BlockRenderer({ block }: Props) {
  const { open: openLead } = useLeadModal();
  const d = block.data || {};

  const handleAction = (action?: string) => {
    if (!action || action === "lead") return openLead(`builder:${block.block_type}`);
    if (action.startsWith("http") || action.startsWith("/")) {
      window.location.href = action;
    }
  };

  switch (block.block_type) {
    case "hero":
      return (
        <section
          className="py-16 sm:py-24 px-4"
          style={{
            background: d.bg_image
              ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${d.bg_image}) center/cover`
              : (d.bg_color || "#f97316"),
            color: d.text_color || "#ffffff",
          }}
        >
          <div className="max-w-4xl mx-auto text-center">
            {d.eyebrow && (
              <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm font-bold mb-4">{d.eyebrow}</span>
            )}
            <h1 className="font-oswald font-bold text-3xl sm:text-5xl mb-4">{d.title || "Заголовок"}</h1>
            {d.subtitle && <p className="text-lg sm:text-xl opacity-90 mb-6">{d.subtitle}</p>}
            {d.button_text && (
              <button
                onClick={() => handleAction(d.button_action)}
                className="bg-white text-gray-900 font-bold px-7 py-3.5 rounded-xl hover:scale-105 transition-transform shadow-xl"
              >
                {d.button_text}
              </button>
            )}
          </div>
        </section>
      );

    case "text":
      return (
        <section className="py-12 px-4" style={{ background: d.bg_color || "#ffffff", color: d.text_color || "#111827" }}>
          <div className="max-w-3xl mx-auto">
            {d.title && <h2 className="font-oswald font-bold text-3xl mb-4">{d.title}</h2>}
            {d.content && (
              <div
                className="prose max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: d.content }}
              />
            )}
          </div>
        </section>
      );

    case "image":
      return (
        <section className="py-8 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            {d.image && (
              <img
                src={d.image}
                alt={d.alt || ""}
                className="w-full rounded-2xl shadow-lg"
              />
            )}
            {d.caption && <p className="text-center text-sm text-gray-500 mt-3">{d.caption}</p>}
          </div>
        </section>
      );

    case "cta":
      return (
        <section
          className="py-14 px-4 text-center"
          style={{ background: d.bg_color || "linear-gradient(to bottom right, #f97316, #ea580c)", color: d.text_color || "#ffffff" }}
        >
          <h2 className="font-oswald font-bold text-2xl sm:text-3xl mb-3">{d.title || "Готовы начать?"}</h2>
          {d.subtitle && <p className="opacity-90 mb-5">{d.subtitle}</p>}
          <button
            onClick={() => handleAction(d.button_action)}
            className="bg-white text-orange-600 font-bold px-7 py-3.5 rounded-xl hover:scale-105 transition-transform shadow-xl"
          >
            {d.button_text || "Заказать"}
          </button>
        </section>
      );

    case "features": {
      const items: any[] = Array.isArray(d.items) ? d.items : [];
      return (
        <section className="py-12 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            {d.title && (
              <h2 className="font-oswald font-bold text-3xl text-center text-gray-900 mb-8">{d.title}</h2>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((it, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 hover:border-orange-300 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
                    <Icon name={it.icon || "Check"} size={22} className="text-orange-500" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{it.title}</h3>
                  <p className="text-sm text-gray-600">{it.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "gallery": {
      const items: string[] = Array.isArray(d.items) ? d.items : [];
      return (
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            {d.title && (
              <h2 className="font-oswald font-bold text-3xl text-center text-gray-900 mb-8">{d.title}</h2>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((src, i) => (
                <div key={i} className="aspect-[4/3] rounded-2xl overflow-hidden shadow">
                  <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "video":
      return (
        <section className="py-8 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            {d.url ? (
              <div className="aspect-video rounded-2xl overflow-hidden shadow-xl">
                <iframe
                  src={d.url}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="bg-gray-100 aspect-video rounded-2xl flex items-center justify-center text-gray-400">
                Видео не задано
              </div>
            )}
            {d.caption && <p className="text-center text-sm text-gray-500 mt-3">{d.caption}</p>}
          </div>
        </section>
      );

    case "form":
      return (
        <section className="py-14 px-4 bg-gray-900 text-white">
          <div className="max-w-md mx-auto text-center">
            <h2 className="font-oswald font-bold text-3xl mb-2">{d.title || "Оставьте заявку"}</h2>
            {d.subtitle && <p className="opacity-80 mb-5">{d.subtitle}</p>}
            <button
              onClick={() => openLead("builder-form")}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-7 py-3.5 rounded-xl shadow-xl"
            >
              {d.button_text || "Заказать звонок"}
            </button>
          </div>
        </section>
      );

    case "spacer":
      return <div style={{ height: `${d.height || 40}px` }} />;

    default:
      return (
        <div className="p-4 m-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          Неизвестный тип блока: <b>{block.block_type}</b>
        </div>
      );
  }
}