/**
 * Реальные фотографии объектов СтальГрупп.
 * Импортированы с Яндекс.Диска клиента, перезалиты на наш CDN.
 *
 * Источник: https://disk.yandex.ru/d/lcLY8nyySdNf9g (папка «Заборы»)
 * Все HEIC сконвертированы в JPEG, ресайз до 1920px по длинной стороне.
 */

/**
 * Галерея «Наши работы» очищена по запросу клиента.
 * Каталог услуг использует фолбэк CATALOG_PHOTOS (заменяется отдельно).
 */
export const REAL_PHOTOS: string[] = [];

/** Фолбэк-фото для каталога услуг, пока не загружены новые. */
const CATALOG_PHOTOS: string[] = [];

/**
 * Детерминированный выбор фото для конкретной услуги (стабильный — не меняется при ререндере).
 */
export function photosForService(slug: string, count: number = 4): string[] {
  if (CATALOG_PHOTOS.length === 0) return [];
  // Простой хэш-выбор: каждая услуга получает свой набор картинок,
  // но они не пересекаются с соседями.
  const hash = [...slug].reduce((h, c) => h * 31 + c.charCodeAt(0), 7);
  const start = Math.abs(hash) % CATALOG_PHOTOS.length;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(CATALOG_PHOTOS[(start + i * 3) % CATALOG_PHOTOS.length]);
  }
  return out;
}

/**
 * Главное Hero-фото для услуги (стабильный выбор).
 */
export function heroForService(slug: string): string {
  if (CATALOG_PHOTOS.length === 0) return "";
  const hash = [...slug].reduce((h, c) => h * 17 + c.charCodeAt(0), 13);
  return CATALOG_PHOTOS[Math.abs(hash) % CATALOG_PHOTOS.length];
}