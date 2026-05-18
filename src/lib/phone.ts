// Утилиты для работы с телефоном РФ
// Формат хранения: +7 (XXX) XXX-XX-XX (для отображения)
// Формат отправки: +7XXXXXXXXXX (e164)

/** Очищает строку, оставляет только цифры. Преобразует 8/7 → 7 в начале. */
export function phoneDigits(input: string): string {
  let d = (input || "").replace(/\D/g, "");
  if (d.startsWith("8") && d.length === 11) d = "7" + d.slice(1);
  if (d.length === 10) d = "7" + d;          // 9XXXXXXXXX → 79XXXXXXXXX
  if (d.startsWith("7") === false && d.length === 11) d = "7" + d.slice(1);
  return d.slice(0, 11);
}

/** Форматирует ввод как маску +7 (XXX) XXX-XX-XX по мере набора. */
export function formatPhoneRU(input: string): string {
  const d = phoneDigits(input);
  if (!d) return "";
  // Гарантируем что начинается с 7
  const tail = d.startsWith("7") ? d.slice(1) : d; // до 10 цифр
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

/** Возвращает true, если введён корректный 11-значный российский номер (7XXXXXXXXXX). */
export function isPhoneValid(input: string): boolean {
  const d = phoneDigits(input);
  return d.length === 11 && d.startsWith("7") && /^7[3489]\d{9}$/.test(d);
}

/** Возвращает номер в формате E.164: +7XXXXXXXXXX */
export function phoneE164(input: string): string {
  const d = phoneDigits(input);
  return d.length === 11 ? `+${d}` : "";
}

/** Проверка email на минимальную корректность */
export function isEmailValid(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
