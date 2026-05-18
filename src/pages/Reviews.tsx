import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { fetchReviews, submitReview, ReviewItem } from "@/lib/api";

const SERVICES = ["Профнастил", "Евроштакетник", "Откатные ворота", "Распашные ворота", "Навесы", "Беседки", "Ковка", "3D-сетка", "Калитки", "Другое"];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "", city: "", rating: 5, text: "", service: "Профнастил",
  });
  const [photo, setPhoto] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = "Отзывы клиентов — СтальГрупп | Заборы, ворота, навесы в Москве и МО";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
    meta.content = "Реальные отзывы клиентов СтальГрупп о заборах, воротах и навесах. С фотографиями объектов в Люберцах, Чапаевке, Назарьево, Астрецово.";
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const items = await fetchReviews(false);
      setReviews(items);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { alert("Файл больше 5 МБ"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhoto(result);
      setPhotoPreview(result);
    };
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) return;
    setSubmitting(true);
    try {
      await submitReview({
        ...form,
        photo_base64: photo || undefined,
      });
      setSuccess(true);
      setForm({ name: "", city: "", rating: 5, text: "", service: "Профнастил" });
      setPhoto(""); setPhotoPreview("");
      setTimeout(() => setSuccess(false), 6000);
    } catch (err) {
      alert("Не удалось отправить. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  return (
    <div className="min-h-screen" style={{ background: "var(--dark-bg)" }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e2230]"
        style={{ background: "rgba(13,15,20,0.93)", backdropFilter: "blur(16px)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Icon name="Fence" size={18} className="text-gray-900" />
            </div>
            <div className="font-oswald font-bold text-white text-lg tracking-wider">
              СТАЛЬ<span className="text-orange-400">ГРУПП</span>
            </div>
          </Link>
          <a href="tel:+78001234567" className="text-orange-400 flex items-center gap-2 text-sm">
            <Icon name="Phone" size={15} /> 8 800 123-45-67
          </a>
        </div>
      </nav>

      <div className="pt-20 pb-2 bg-[#0a0c10] border-b border-[#1e2230]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs">
          <Link to="/" className="text-white/40 hover:text-orange-400">Главная</Link>
          <Icon name="ChevronRight" size={12} className="text-white/25" />
          <span className="text-orange-400">Отзывы клиентов</span>
        </div>
      </div>

      {/* HERO */}
      <section className="py-16 grid-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="section-tag">Отзывы</span>
          <h1 className="font-oswald font-bold text-4xl sm:text-5xl text-white mb-4">
            ЧТО ГОВОРЯТ <span className="text-orange-400">НАШИ КЛИЕНТЫ</span>
          </h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Icon key={i} name="Star" size={28} className="text-orange-400 fill-orange-400" />
            ))}
          </div>
          <p className="text-white/60 text-base">
            <span className="text-orange-400 font-oswald font-bold text-xl">{avgRating}</span> из 5 ·
            на основе <b className="text-white">{reviews.length}</b> отзывов
          </p>
        </div>
      </section>

      {/* СПИСОК */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center text-white/40 py-12">Загрузка отзывов...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center text-white/40 py-12">Пока нет одобренных отзывов. Будьте первым!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.map(r => (
                <div key={r.id} className="bg-[#141720] border border-[#1e2230] hover:border-orange-500/30 rounded-2xl p-5 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-400 font-oswald font-bold">
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm">{r.name}</div>
                        <div className="text-white/40 text-xs flex items-center gap-1">
                          {r.city && <><Icon name="MapPin" size={11} /> {r.city}</>}
                        </div>
                      </div>
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Icon key={i} name="Star" size={13}
                          className={i <= r.rating ? "text-orange-400 fill-orange-400" : "text-white/15"} />
                      ))}
                    </div>
                  </div>
                  {r.service && (
                    <div className="inline-block bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-3">
                      {r.service}
                    </div>
                  )}
                  <p className="text-white/70 text-sm leading-relaxed mb-3 whitespace-pre-line">{r.text}</p>
                  {r.photo_url && (
                    <a href={r.photo_url} target="_blank" rel="noopener noreferrer"
                      className="block rounded-xl overflow-hidden border border-[#1e2230] hover:border-orange-500/40 transition-all">
                      <img src={r.photo_url} alt="Фото объекта" className="w-full h-44 object-cover" />
                    </a>
                  )}
                  {r.created_at && (
                    <div className="text-white/30 text-xs mt-3">
                      {new Date(r.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ФОРМА */}
      <section id="form" className="py-16 bg-[#0a0c10]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="section-tag">Оставить отзыв</span>
            <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-white mb-3">
              ПОДЕЛИТЕСЬ <span className="text-orange-400">ВПЕЧАТЛЕНИЕМ</span>
            </h2>
            <p className="text-white/50 text-sm">Опубликуем после модерации (1–2 рабочих дня).</p>
          </div>

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 mb-6 text-center">
              <Icon name="CheckCircle2" size={28} className="text-green-400 mx-auto mb-2" />
              <div className="text-green-400 font-medium">Спасибо за отзыв!</div>
              <div className="text-white/60 text-sm mt-1">Опубликуем после проверки модератором.</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-[#141720] border border-[#1e2230] rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ваше имя *"
                className="bg-[#1a1f2e] border border-[#1e2230] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50" />
              <input type="text" value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="Город (Люберцы, Чапаевка…)"
                className="bg-[#1a1f2e] border border-[#1e2230] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">Услуга</label>
              <select value={form.service}
                onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                className="w-full bg-[#1a1f2e] border border-[#1e2230] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50">
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">Оценка</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} type="button" onClick={() => setForm(f => ({ ...f, rating: i }))}
                    className="transition-transform hover:scale-110">
                    <Icon name="Star" size={32}
                      className={i <= form.rating ? "text-orange-400 fill-orange-400" : "text-white/20"} />
                  </button>
                ))}
              </div>
            </div>

            <textarea required value={form.text}
              onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
              placeholder="Что понравилось в работе? *"
              rows={5}
              className="w-full bg-[#1a1f2e] border border-[#1e2230] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 resize-none" />

            {/* Загрузка фото */}
            <div>
              <label className="block text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">Фото объекта (необязательно)</label>
              <label className="block bg-[#1a1f2e] border-2 border-dashed border-[#2a3040] hover:border-orange-500/40 rounded-xl p-5 text-center cursor-pointer transition-all">
                <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                {photoPreview ? (
                  <div>
                    <img src={photoPreview} alt="preview" className="max-h-44 mx-auto rounded-lg mb-2" />
                    <div className="text-orange-400 text-xs">Нажмите, чтобы заменить</div>
                  </div>
                ) : (
                  <>
                    <Icon name="ImagePlus" size={28} className="text-orange-400 mx-auto mb-2" />
                    <div className="text-white/70 text-sm">Прикрепить фото объекта</div>
                    <div className="text-white/30 text-xs mt-1">JPG/PNG до 5 МБ</div>
                  </>
                )}
              </label>
            </div>

            <button type="submit" disabled={submitting}
              className="btn-orange w-full py-4 rounded-xl text-base disabled:opacity-60">
              <span className="flex items-center gap-2 justify-center">
                <Icon name={submitting ? "Loader" : "Send"} size={18} className={submitting ? "animate-spin" : ""} />
                {submitting ? "Отправка..." : "Опубликовать отзыв"}
              </span>
            </button>
          </form>
        </div>
      </section>

      <footer className="border-t border-[#1e2230] bg-[#0a0c10] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 text-white/40 hover:text-orange-400 text-sm">
            <Icon name="ChevronLeft" size={16} />
            На главную
          </Link>
          <div className="text-white/30 text-xs">© 2009–2026 ИП Балтаг А. В. · 8 800 123-45-67</div>
        </div>
      </footer>
    </div>
  );
}
