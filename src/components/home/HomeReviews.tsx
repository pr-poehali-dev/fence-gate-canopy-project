import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { fetchReviews, type ReviewItem } from "@/lib/api";

/** Секция отзывов клиентов на главной. Берёт одобренные отзывы из БД. */
export default function HomeReviews() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchReviews(false)
      .then(items => setReviews(items.slice(0, 6)))
      .catch(() => setReviews([]))
      .finally(() => setLoaded(true));
  }, []);

  // Пока не загрузилось — ничего не рендерим (нет «прыжка» layout)
  if (!loaded) return null;
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length;

  return (
    <section className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="section-tag">Отзывы</span>
            <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-gray-900">
              Что говорят клиенты
            </h2>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(i => (
                  <Icon key={i} name="Star" size={18}
                    className={i <= Math.round(avg) ? "text-orange-500 fill-orange-500" : "text-gray-300"} />
                ))}
              </div>
              <span className="text-gray-700 font-semibold">{avg.toFixed(1)}</span>
              <span className="text-gray-500 text-sm">· реальные отзывы с фото объектов</span>
            </div>
          </div>
          <Link to="/reviews"
            className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors">
            Все отзывы <Icon name="ArrowRight" size={16} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map(r => (
            <div key={r.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-xl hover:border-orange-200 transition-all flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-orange-500 flex items-center justify-center text-white font-oswald font-bold text-lg flex-shrink-0">
                  {(r.name || "К").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{r.name || "Клиент"}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {[r.city, r.service].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
              <div className="flex mb-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Icon key={i} name="Star" size={14}
                    className={i <= (r.rating || 5) ? "text-orange-500 fill-orange-500" : "text-gray-300"} />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed flex-1">{r.text}</p>
              {r.photo_url && (
                <img src={r.photo_url} alt={`Объект клиента ${r.name || ""}`} loading="lazy"
                  className="mt-4 w-full h-40 object-cover rounded-xl" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
