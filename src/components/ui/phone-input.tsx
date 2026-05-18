import { forwardRef } from "react";
import { formatPhoneRU, phoneDigits } from "@/lib/phone";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "inputMode" | "autoComplete" | "maxLength"
> {
  value: string;
  onChange: (formatted: string) => void;
  /** Базовый CSS-класс инпута (если не передан — используется стандартный SG-стиль). */
  className?: string;
  /** Текст ошибки, при наличии — красная рамка. */
  hasError?: boolean;
}

/**
 * Универсальный инпут телефона РФ:
 *   • маска +7 (XXX) XXX-XX-XX
 *   • 8 → 7 автоматически
 *   • 9999999999 → +7 999 999 99 99 автоматически
 *   • невозможно ввести больше 11 цифр (защита от длинных номеров)
 *   • не даёт ввести буквы и плюсы
 *   • при фокусе и пустом значении подставляет «+7 (» — курсор сразу в правильном месте
 */
const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  { value, onChange, className, hasError, placeholder, onFocus, onBlur, ...rest },
  ref
) {
  const baseCls =
    "w-full bg-[#0a0c10] border-2 border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none";
  const errorCls = hasError ? " border-red-500/60 focus:border-red-500/70" : "";

  return (
    <input
      {...rest}
      ref={ref}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      maxLength={18} // длина «+7 (999) 999-99-99»
      placeholder={placeholder ?? "+7 (___) ___-__-__"}
      value={value}
      onFocus={(e) => {
        // если пусто — сразу подставим префикс, чтобы пользователю не пришлось вводить +7
        if (!value) onChange("+7 (");
        onFocus?.(e);
      }}
      onBlur={(e) => {
        // если пользователь оставил только префикс — очищаем
        const d = phoneDigits(value);
        if (d.length <= 1) onChange("");
        onBlur?.(e);
      }}
      onChange={(e) => onChange(formatPhoneRU(e.target.value))}
      onPaste={(e) => {
        // вставка из буфера — нормализуем
        const txt = e.clipboardData.getData("text");
        if (txt) {
          e.preventDefault();
          onChange(formatPhoneRU(txt));
        }
      }}
      onKeyDown={(e) => {
        // не позволяем вводить буквы или «+» в произвольном месте
        if (
          e.key.length === 1 &&
          !/[0-9]/.test(e.key) &&
          !e.ctrlKey && !e.metaKey
        ) {
          // разрешаем редакционные клавиши через дефолт, блокируем только символы
          e.preventDefault();
        }
      }}
      className={className ?? baseCls + errorCls}
    />
  );
});

export default PhoneInput;
