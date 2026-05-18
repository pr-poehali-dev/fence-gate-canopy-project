// Утилиты для работы с телефоном РФ
// Формат отображения: +7 (XXX) XXX-XX-XX
// Формат отправки:    +7XXXXXXXXXX (E.164)
//
// Правила нормализации (для удобства пользователя):
//  • Любые нецифры удаляются
//  • Ведущая 8 заменяется на 7  (8 999 123-45-67 → 79991234567)
//  • Если вводят с 9 (без кода страны) — добавляем 7 впереди
//  • Если строка длиннее 11 цифр — обрезаем хвост (защита от вставки лишнего)
//  • Если строка короче — отдаём как есть; форматтер дорисует маску по мере набора

/** Превращает любой ввод в 0..11 цифр телефона РФ, гарантируя префикс 7 для длин ≥ 10. */
export function phoneDigits(input: string): string {
  let d = (input || "").replace(/\D/g, "");
  if (!d) return "";
  // Ведущая 8 (как 8 800…, 8 999…) → 7
  if (d[0] === "8") d = "7" + d.slice(1);
  // Если 10 цифр и начинаются с 9 — это номер без кода страны, добавляем 7
  if (d.length === 10 && d[0] === "9") d = "7" + d;
  // Если 11 цифр, но первая не 7 — принудительно ставим 7 (например, на «99991234567»)
  if (d.length === 11 && d[0] !== "7") d = "7" + d.slice(1);
  // Не даём ввести больше 11 цифр
  if (d.length > 11) d = d.slice(0, 11);
  return d;
}

/** Форматирует ввод как маску +7 (XXX) XXX-XX-XX по мере набора. */
export function formatPhoneRU(input: string): string {
  const d = phoneDigits(input);
  if (!d) return "";
  // tail = до 10 цифр после кода страны
  const tail = d.startsWith("7") ? d.slice(1) : d;
  const p1 = tail.slice(0, 3);
  const p2 = tail.slice(3, 6);
  const p3 = tail.slice(6, 8);
  const p4 = tail.slice(8, 10);
  let out = "+7";
  if (p1) out += ` (${p1}`;
  if (p1.length === 3) out += ")";
  if (p2) out += ` ${p2}`;
  if (p3) out += `-${p3}`;
  if (p4) out += `-${p4}`;
  return out;
}

/** Возвращает true, если номер — корректный 11-значный российский. */
export function isPhoneValid(input: string): boolean {
  const d = phoneDigits(input);
  return d.length === 11 && /^7[3489]\d{9}$/.test(d);
}

/** Возвращает номер в формате E.164: +7XXXXXXXXXX (или пустую строку). */
export function phoneE164(input: string): string {
  const d = phoneDigits(input);
  return d.length === 11 ? `+${d}` : "";
}

/** Проверка email на минимальную корректность */
export function isEmailValid(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}