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

const CDN = "https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/bucket";

// Фото услуг. Заполняем пачками по мере получения от клиента.
// Первое фото в массиве = главное (hero).
export const PHOTOS_BY_SERVICE: Record<string, string[]> = {
  profnastil: [
    `${CDN}/477c91c0-abe2-42e9-b0bb-788f004dd98a.jpg`, // главное фото — забор из профнастила
    `${CDN}/9694eeb4-892f-46cd-94db-7726358ab3bb.jpg`, // профиль С21-1000
    `${CDN}/ac964b0b-47d7-46de-b206-68bff8895d41.png`, // профиль С20
    `${CDN}/c21936bf-c0bc-4b3a-b8b6-3ed8f9da4153.png`, // профиль С8
  ],
};

/**
 * Hero-фото = первое в наборе услуги.
 */
export function heroForService(slug: string): string {
  return (PHOTOS_BY_SERVICE[slug] || [])[0] || "";
}

/**
 * Полный набор фото для услуги (для портфолио / схем / альтернатив).
 */
export function photosForService(slug: string, count: number = 4): string[] {
  const set = PHOTOS_BY_SERVICE[slug] || [];
  return set.slice(0, Math.min(count, set.length));
}

/**
 * Доп. фото (без первого hero).
 */
export function extraPhotosForService(slug: string, count: number = 3): string[] {
  const set = PHOTOS_BY_SERVICE[slug] || [];
  return set.slice(1, 1 + count);
}