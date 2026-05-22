/**
 * Реальные фотографии объектов СтальГрупп.
 * Импортированы с Яндекс.Диска клиента, перезалиты на наш CDN.
 *
 * Источник: https://disk.yandex.ru/d/lcLY8nyySdNf9g (папка «Заборы»)
 * Все HEIC сконвертированы в JPEG, ресайз до 1920px по длинной стороне.
 */

const BASE = "https://cdn.poehali.dev/projects/fe32b63a-5996-4288-9a02-963fced45aa0/bucket/yadisk/zabory";

export const REAL_PHOTOS: string[] = [
  `${BASE}/31058bf0c765.jpg`,
  `${BASE}/213a83221e26.jpg`,
  `${BASE}/fb3b59d17131.jpg`,
  `${BASE}/0438b2e85e3a.jpg`,
  `${BASE}/8630bcccb325.jpg`,
  `${BASE}/30a25f3c208b.jpg`,
  `${BASE}/48b3535caf50.jpg`,
  `${BASE}/d8e555bf3631.jpg`,
  `${BASE}/d5337e79c6d7.jpg`,
  `${BASE}/2a83418f5f1c.jpg`,
  `${BASE}/2d973e6e022f.jpg`,
  `${BASE}/df45df0bb500.jpg`,
  `${BASE}/112869c90699.jpg`,
  `${BASE}/170342781fa9.jpg`,
  `${BASE}/2ace81c94781.jpg`,
  `${BASE}/5a647a839960.jpg`,
  `${BASE}/b493781a9b21.jpg`,
  `${BASE}/8536e7d22a83.jpg`,
  `${BASE}/5e2859f18114.jpg`,
  `${BASE}/c9df78757555.jpg`,
  `${BASE}/603a206f71ee.jpg`,
  `${BASE}/db21feb2d3d3.jpg`,
  `${BASE}/6675279fc004.jpg`,
  `${BASE}/c81e5018b853.jpg`,
  `${BASE}/05e15f4a36a4.jpg`,
  `${BASE}/75b3fb8e0c1b.jpg`,
  `${BASE}/2d0442001a1e.jpg`,
  `${BASE}/3254a9cde463.jpg`,
  `${BASE}/7e39a905b5a3.jpg`,
  `${BASE}/b70c7698cf36.jpg`,
  `${BASE}/3ab25f4ed149.jpg`,
  `${BASE}/ba351cef89f8.jpg`,
  `${BASE}/036221e9e18c.jpg`,
  `${BASE}/982b0a12bd63.jpg`,
  `${BASE}/bbdfe352add5.jpg`,
  `${BASE}/7817f2689d41.jpg`,
  `${BASE}/89881c6a37a1.jpg`,
  `${BASE}/75a89807db11.jpg`,
  `${BASE}/7a564b4bfbaf.jpg`,
  `${BASE}/eb984a943e52.jpg`,
  `${BASE}/ad6e3e520571.jpg`,
  `${BASE}/fbcc3e969d2e.jpg`,
  `${BASE}/d06ac6af820e.jpg`,
  `${BASE}/e021987b1e73.jpg`,
  `${BASE}/08b2b156baa6.jpg`,
  `${BASE}/b2f6d9303494.jpg`,
  `${BASE}/9fdefa563d4c.jpg`,
  `${BASE}/c295d78c21e8.jpg`,
  `${BASE}/a50eec5c7043.jpg`,
  `${BASE}/9748b8e1f047.jpg`,
  `${BASE}/97a82db083cf.jpg`,
  `${BASE}/7aae1e6d1675.jpg`,
  `${BASE}/51f2fcbb62e1.jpg`,
  `${BASE}/83f5173476a7.jpg`,
  `${BASE}/30090644bd4c.jpg`,
  `${BASE}/bfd50ffe1d71.jpg`,
  `${BASE}/90a3d13ecd1f.jpg`,
  `${BASE}/23793317b284.jpg`,
  `${BASE}/7c64bb2021ad.jpg`,
  `${BASE}/751c2860e0f0.jpg`,
  `${BASE}/0233a612a7e1.jpg`,
  `${BASE}/3a228ccb0f50.jpg`,
  `${BASE}/d2c51f653b6f.jpg`,
  `${BASE}/d7336c34a304.jpg`,
  `${BASE}/48bc3861dcaa.jpg`,
  `${BASE}/239bac76ae4f.jpg`,
  `${BASE}/a914229d010d.jpg`,
  `${BASE}/41ec99a4f929.jpg`,
  `${BASE}/e103ad05bfe5.jpg`,
  `${BASE}/d9594df166a9.jpg`,
  `${BASE}/76edf503d2ae.jpg`,
  `${BASE}/f412a5fa62dc.jpg`,
  `${BASE}/2781f6210ccc.jpg`,
  `${BASE}/c3ea75ae775b.jpg`,
  `${BASE}/2977e24253e3.jpg`,
  `${BASE}/29b782818464.jpg`,
  `${BASE}/5edc4be0e127.jpg`,
  `${BASE}/d28410cd1a14.jpg`,
];

/**
 * Детерминированный выбор фото для конкретной услуги (стабильный — не меняется при ререндере).
 */
export function photosForService(slug: string, count: number = 4): string[] {
  // Простой хэш-выбор: каждая услуга получает свой набор картинок,
  // но они не пересекаются с соседями.
  const hash = [...slug].reduce((h, c) => h * 31 + c.charCodeAt(0), 7);
  const start = Math.abs(hash) % REAL_PHOTOS.length;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(REAL_PHOTOS[(start + i * 3) % REAL_PHOTOS.length]);
  }
  return out;
}

/**
 * Главное Hero-фото для услуги (стабильный выбор).
 */
export function heroForService(slug: string): string {
  const hash = [...slug].reduce((h, c) => h * 17 + c.charCodeAt(0), 13);
  return REAL_PHOTOS[Math.abs(hash) % REAL_PHOTOS.length];
}