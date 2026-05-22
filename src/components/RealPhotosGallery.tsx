import { useState } from "react";
import Icon from "@/components/ui/icon";
import { REAL_PHOTOS } from "@/data/real-photos";

export default function RealPhotosGallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [visible, setVisible] = useState(12);

  const items = REAL_PHOTOS.slice(0, visible);

  return (
    <section className="py-20" id="our-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="section-tag">Наши работы</span>
          <h2 className="font-oswald font-bold text-3xl sm:text-5xl text-white mb-3">
            ОБЪЕКТЫ <span className="text-orange-400">2024–2026</span>
          </h2>
          <p className="text-white/55 max-w-2xl mx-auto text-sm sm:text-base">
            Реальные фото с наших объектов в Москве и Московской области.
            Заборы, ворота, навесы и площадки — каждый снимок сделан после
            подписания акта приёма-передачи.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {items.map((src, i) => (
            <button
              key={src}
              onClick={() => setLightbox(i)}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-[#141720] border border-[#1e2230] hover:border-orange-500/50 transition-all"
            >
              <img
                src={src}
                alt={`Объект СтальГрупп ${i + 1} — забор/ворота под ключ в Московской области`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div className="flex items-center gap-2 text-white text-xs">
                  <Icon name="ZoomIn" size={14} className="text-orange-400" />
                  <span>Открыть</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {visible < REAL_PHOTOS.length && (
          <div className="text-center mt-8">
            <button
              onClick={() => setVisible(Math.min(visible + 12, REAL_PHOTOS.length))}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-orange-500/40 hover:border-orange-500 text-white hover:bg-orange-500/10 transition-all text-sm font-oswald"
            >
              <Icon name="Plus" size={16} className="text-orange-400" />
              Показать ещё ({REAL_PHOTOS.length - visible})
            </button>
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-white/55 text-sm">
          <Stat icon="ImageIcon" value={REAL_PHOTOS.length + "+"} label="фото объектов" />
          <Stat icon="MapPin" value="МО" label="зона работ" />
          <Stat icon="Award" value="3 года" label="гарантия" />
          <Stat icon="Calendar" value="2024–2026" label="актуальность" />
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-orange-500 text-white flex items-center justify-center transition-colors z-10"
            aria-label="Закрыть"
          >
            <Icon name="X" size={22} />
          </button>

          {lightbox > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
              className="absolute left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-orange-500 text-white flex items-center justify-center transition-colors"
              aria-label="Предыдущее"
            >
              <Icon name="ChevronLeft" size={24} />
            </button>
          )}
          {lightbox < REAL_PHOTOS.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
              className="absolute right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-orange-500 text-white flex items-center justify-center transition-colors"
              aria-label="Следующее"
            >
              <Icon name="ChevronRight" size={24} />
            </button>
          )}

          <img
            src={REAL_PHOTOS[lightbox]}
            alt={`Объект ${lightbox + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white text-sm">
            {lightbox + 1} / {REAL_PHOTOS.length}
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon name={icon} size={20} className="text-orange-400" />
      <div>
        <div className="text-white font-oswald font-bold text-lg leading-none">{value}</div>
        <div className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">{label}</div>
      </div>
    </div>
  );
}
