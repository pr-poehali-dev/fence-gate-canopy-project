import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import MediaPickerModal from "@/components/MediaPickerModal";

interface Props {
  /** Текущий url фото */
  src: string;
  alt?: string;
  className?: string;
  /** Slug услуги — нужен для фильтрации фото в библиотеке */
  service: string;
  /** "hero" — главное фото услуги; "any" — любое фото галереи */
  mode?: "hero" | "any";
  /** Если задан — вызывается с новым url после выбора (для оптимистичного обновления стейта) */
  onChange?: (url: string, id: number) => void;
  /** Подпись плавающей кнопки (по умолчанию "Сменить фото") */
  label?: string;
  /** Доп. рендер-проп: например, для постера в hero нужны overlay-градиенты */
  children?: React.ReactNode;
}

/**
 * Обёртка над <img>: для админа поверх показывает кнопку «Сменить фото»,
 * открывает MediaPickerModal. Для обычного посетителя — просто фото.
 */
export default function EditablePhoto({
  src, alt = "", className = "", service, mode = "any", onChange, label, children,
}: Props) {
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${isAdmin ? "group" : ""}`}>
      <img src={src} alt={alt} className={className} loading="lazy" />
      {children}

      {isAdmin && (
        <>
          <button
            onClick={() => setOpen(true)}
            className="absolute top-2 right-2 z-20 bg-orange-500 hover:bg-orange-400 text-gray-900 font-bold text-xs px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5"
            title="Доступно только администратору"
          >
            <Icon name={mode === "hero" ? "Crown" : "ImagePlus"} size={14} />
            {label || (mode === "hero" ? "Сменить главное фото" : "Сменить фото")}
          </button>

          <MediaPickerModal
            open={open}
            service={service}
            currentUrl={src}
            mode={mode}
            onClose={() => setOpen(false)}
            onPicked={(url, id) => onChange?.(url, id)}
          />
        </>
      )}
    </div>
  );
}
