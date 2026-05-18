import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { usePageContent } from "@/hooks/usePageContent";

interface Props {
  /** Размер логотипа: 'sm' | 'md' (default) | 'lg' */
  size?: "sm" | "md" | "lg";
  /** Линковать ли на главную */
  asLink?: boolean;
  /** Скрыть подпись «производство» */
  hideSubtitle?: boolean;
  /** Цвет фона по-умолчанию (если в CMS не задан) */
  className?: string;
}

/**
 * Универсальный логотип компании.
 * Все элементы редактируются через /admin/content → раздел "global":
 *   - logo_text_1   — первая часть текста (по умолчанию "СТАЛЬ")
 *   - logo_text_2   — вторая часть (оранжевая) ("ГРУПП")
 *   - logo_subtitle — подпись ("ПРОИЗВОДСТВО")
 *   - logo_icon     — иконка из lucide-react (Fence, Building2, Shield, и т.д.)
 *   - logo_image    — URL картинки (если указана, иконка не показывается)
 */
export default function SiteLogo({
  size = "md", asLink = true, hideSubtitle = false, className = "",
}: Props) {
  const c = usePageContent("global");

  const text1   = c("logo_text_1",   "СТАЛЬ");
  const text2   = c("logo_text_2",   "ГРУПП");
  const subtitle= c("logo_subtitle", "ПРОИЗВОДСТВО");
  const iconName= c("logo_icon",     "Fence");
  const imageUrl= c("logo_image",    "");

  const sizes = {
    sm: { box: "w-7 h-7", icon: 14, text: "text-base", sub: "text-[9px]" },
    md: { box: "w-8 h-8", icon: 18, text: "text-lg",   sub: "text-[10px]" },
    lg: { box: "w-12 h-12", icon: 26, text: "text-2xl", sub: "text-xs" },
  }[size];

  const Wrapper: React.ElementType = asLink ? Link : "div";
  const props = asLink ? { to: "/", "aria-label": "На главную" } : {};

  return (
    <Wrapper {...props} className={`flex items-center gap-3 group ${className}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={`${text1}${text2}`}
          className={`${sizes.box} rounded-lg object-contain group-hover:scale-110 transition-transform`} />
      ) : (
        <div className={`${sizes.box} bg-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
          <Icon name={iconName} fallback="Fence" size={sizes.icon} className="text-gray-900" />
        </div>
      )}
      <div className="min-w-0">
        <div className={`font-oswald font-bold text-white ${sizes.text} leading-none tracking-wider group-hover:text-orange-200 transition-colors`}>
          {text1}<span className="text-orange-400">{text2}</span>
        </div>
        {!hideSubtitle && subtitle && (
          <div className={`text-white/30 ${sizes.sub} leading-none tracking-widest mt-0.5`}>{subtitle}</div>
        )}
      </div>
    </Wrapper>
  );
}
