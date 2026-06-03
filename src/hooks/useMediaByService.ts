import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import { PHOTOS_BY_SERVICE } from "@/data/photos-by-service";

export interface MediaItem {
  id: number;
  url: string;
  service: string | null;
  position: number;
  is_hidden: boolean;
  is_hero?: boolean;
  project?: string;
  caption?: string;
  alt_text?: string;
}

// Простой in-memory кэш, чтобы не дёргать API на каждой странице
const cache: Record<string, string[]> = {};
const itemsCache: Record<string, MediaItem[]> = {};
const inflight: Record<string, Promise<MediaItem[]>> = {};

function sortItems(items: MediaItem[]): MediaItem[] {
  return items
    .filter((it) => !it.is_hidden)
    .sort((a, b) => {
      // главное фото — всегда первым
      if (!!a.is_hero !== !!b.is_hero) return a.is_hero ? -1 : 1;
      return a.position - b.position;
    });
}

async function fetchServiceItems(slug: string): Promise<MediaItem[]> {
  if (itemsCache[slug]) return itemsCache[slug];
  if (inflight[slug]) return inflight[slug];

  inflight[slug] = (async () => {
    try {
      const r = await fetch(`${API.media}?action=list&service=${encodeURIComponent(slug)}`);
      const j = await r.json();
      const sorted = sortItems(j.items || []);
      itemsCache[slug] = sorted;
      cache[slug] = sorted.map((it) => it.url);
      return sorted;
    } catch {
      return [];
    } finally {
      delete inflight[slug];
    }
  })();

  return inflight[slug];
}

async function fetchService(slug: string): Promise<string[]> {
  const items = await fetchServiceItems(slug);
  return items.map((it) => it.url);
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

export interface ProjectGroup {
  /** Название объекта/проекта ("" — одиночные фото без объекта) */
  title: string;
  /** Главное фото проекта (обложка карточки) */
  cover: string;
  /** Все фото проекта */
  photos: string[];
  /** Подпись (берётся с обложки) */
  caption: string;
}

/**
 * Портфолио по услуге, сгруппированное в объекты/проекты.
 * Фото с одинаковым непустым `project` объединяются в один объект (галерею).
 * Фото без проекта показываются как отдельные одиночные карточки.
 */
export function useProjectsByService(slug: string): ProjectGroup[] {
  const [groups, setGroups] = useState<ProjectGroup[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchServiceItems(slug).then(items => {
      if (cancelled) return;
      const byProject = new Map<string, MediaItem[]>();
      const singles: MediaItem[] = [];
      for (const it of items) {
        const p = (it.project || "").trim();
        if (p) {
          if (!byProject.has(p)) byProject.set(p, []);
          byProject.get(p)!.push(it);
        } else {
          singles.push(it);
        }
      }
      const result: ProjectGroup[] = [];
      for (const [title, list] of byProject) {
        result.push({
          title,
          cover: list[0].url,
          photos: list.map(i => i.url),
          caption: list[0].caption?.trim() || title,
        });
      }
      for (const it of singles) {
        result.push({
          title: "",
          cover: it.url,
          photos: [it.url],
          caption: it.caption?.trim() || "",
        });
      }
      setGroups(result);
    });
    return () => { cancelled = true; };
  }, [slug]);

  return groups;
}