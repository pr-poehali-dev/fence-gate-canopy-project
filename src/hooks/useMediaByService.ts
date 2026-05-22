import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import { PHOTOS_BY_SERVICE } from "@/data/photos-by-service";

interface MediaItem {
  id: number;
  url: string;
  service: string | null;
  position: number;
  is_hidden: boolean;
}

// Простой in-memory кэш, чтобы не дёргать API на каждой странице
const cache: Record<string, string[]> = {};
const inflight: Record<string, Promise<string[]>> = {};

async function fetchService(slug: string): Promise<string[]> {
  if (cache[slug]) return cache[slug];
  if (inflight[slug]) return inflight[slug];

  inflight[slug] = (async () => {
    try {
      const r = await fetch(`${API.media}?action=list&service=${encodeURIComponent(slug)}`);
      const j = await r.json();
      const urls = (j.items || [])
        .filter((it: MediaItem) => !it.is_hidden)
        .sort((a: MediaItem, b: MediaItem) => a.position - b.position)
        .map((it: MediaItem) => it.url);
      cache[slug] = urls;
      return urls;
    } catch {
      return [];
    } finally {
      delete inflight[slug];
    }
  })();

  return inflight[slug];
}

/**
 * Хук возвращает фото услуги:
 *  - если в админ-библиотеке есть привязки — используем их
 *  - если фото < 4 (или вообще нет) — берём дефолты из PHOTOS_BY_SERVICE
 */
export function useMediaByService(slug: string, minCount = 4): string[] {
  const fallback = PHOTOS_BY_SERVICE[slug] || [];
  const [photos, setPhotos] = useState<string[]>(fallback);

  useEffect(() => {
    let cancelled = false;
    fetchService(slug).then(urls => {
      if (cancelled) return;
      if (urls.length >= 1) {
        // докомплектовываем недостающее фолбэком, чтобы порядок страниц не «прыгал»
        const combined = [...urls];
        for (const f of fallback) {
          if (combined.length >= minCount) break;
          if (!combined.includes(f)) combined.push(f);
        }
        setPhotos(combined);
      }
    });
    return () => { cancelled = true; };
  }, [slug, minCount]);

  return photos;
}
