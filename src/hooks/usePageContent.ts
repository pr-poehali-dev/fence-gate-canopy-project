import { useEffect, useState } from "react";
import { fetchPageContent } from "@/lib/api";

// Кэш в памяти, чтобы не дёргать API на каждом рендере при переходах
const _cache = new Map<string, Record<string, string>>();
const _inflight = new Map<string, Promise<Record<string, string>>>();

/**
 * Подгружает CMS-контент страницы и возвращает функцию, которая возвращает
 * сохранённое значение блока по ключу или fallback (хардкод по умолчанию).
 *
 * Пример:
 *   const c = usePageContent("home");
 *   <h1 dangerouslySetInnerHTML={{ __html: c("hero_title", "Заборы под ключ") }} />
 *   <img src={c("hero_image", "/img/default.jpg")} />
 */
export function usePageContent(pageSlug: string) {
  const [data, setData] = useState<Record<string, string>>(() => _cache.get(pageSlug) || {});
  const [loaded, setLoaded] = useState<boolean>(() => _cache.has(pageSlug));

  useEffect(() => {
    if (_cache.has(pageSlug)) {
      setData(_cache.get(pageSlug)!);
      setLoaded(true);
      return;
    }
    let alive = true;
    const inflight = _inflight.get(pageSlug)
      || fetchPageContent(pageSlug).then(d => { _cache.set(pageSlug, d); return d; });
    _inflight.set(pageSlug, inflight);
    inflight
      .then(d => { if (alive) { setData(d); setLoaded(true); } })
      .catch(() => { if (alive) setLoaded(true); })
      .finally(() => _inflight.delete(pageSlug));
    return () => { alive = false; };
  }, [pageSlug]);

  /** Возвращает значение блока или fallback. */
  const get = (key: string, fallback = ""): string => {
    const v = data[key];
    return v && v.trim() ? v : fallback;
  };

  return Object.assign(get, { loaded, data });
}
