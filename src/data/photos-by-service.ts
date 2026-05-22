/**
 * Распределение фото по услугам — БЕЗ ПОВТОРЕНИЙ.
 *
 * 78 уникальных фото с Я.Диска клиента разбиты на 13 непересекающихся групп.
 * Каждой услуге достаётся ~6 фото (5-7 в зависимости от популярности).
 *
 * Порядок назначения: эвристический по дате съёмки (см. orig_name в backend),
 * по умолчанию — равномерное разделение. Клиент потом сможет вручную
 * переставить через /admin/content (EditableImage).
 */

import { REAL_PHOTOS } from "./real-photos";

// Хелпер: режет общий массив на куски (start..start+count, без выхода за границы)
function slice(start: number, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(REAL_PHOTOS[(start + i) % REAL_PHOTOS.length]);
  }
  return out;
}

// 13 услуг × 6 фото = 78 — ровно столько у нас и есть.
// Каждый сегмент непересекающийся.
export const PHOTOS_BY_SERVICE: Record<string, string[]> = {
  profnastil:           slice(0, 6),    // 0..5
  shtaketnik:           slice(6, 6),    // 6..11
  "3d-setka":           slice(12, 6),   // 12..17
  "setka-rabitsa":      slice(18, 6),   // 18..23
  kovka:                slice(24, 6),   // 24..29
  "otkatnye-vorota":    slice(30, 6),   // 30..35
  "raspashnye-vorota":  slice(36, 6),   // 36..41
  kalitki:              slice(42, 6),   // 42..47
  navesy:               slice(48, 6),   // 48..53
  besedki:              slice(54, 6),   // 54..59
  fundamenty:           slice(60, 6),   // 60..65
  "betonnye-ploschadki": slice(66, 6),  // 66..71
  "zaezd-na-uchastok":  slice(72, 6),   // 72..77
};

/**
 * Hero-фото = первое в наборе услуги.
 */
export function heroForService(slug: string): string {
  return (PHOTOS_BY_SERVICE[slug] || REAL_PHOTOS)[0];
}

/**
 * Полный набор фото для услуги (для портфолио / схем / альтернатив).
 */
export function photosForService(slug: string, count: number = 4): string[] {
  const set = PHOTOS_BY_SERVICE[slug] || REAL_PHOTOS;
  return set.slice(0, Math.min(count, set.length));
}

/**
 * Доп. фото (без первого hero).
 */
export function extraPhotosForService(slug: string, count: number = 3): string[] {
  const set = PHOTOS_BY_SERVICE[slug] || REAL_PHOTOS;
  return set.slice(1, 1 + count);
}
