// Превращает значение настройки max_link (username вида "@id..._bot",
// "id..._bot" или уже готовый URL) в кликабельную ссылку на бота в MAX.
// Опционально добавляет ?start=payload, чтобы боту ушёл автотекст.

export function maxBotUrl(raw: string, startPayload?: string): string {
  let link = (raw || "").trim();
  if (!link) return "";

  // Если это username (@xxx или просто xxx без http) — собираем URL
  if (!/^https?:\/\//i.test(link)) {
    link = link.replace(/^@/, "");
    link = `https://max.ru/${link}`;
  }

  if (startPayload) {
    const sep = link.includes("?") ? "&" : "?";
    link = `${link}${sep}start=${encodeURIComponent(startPayload)}`;
  }
  return link;
}
