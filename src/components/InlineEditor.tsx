import { useEffect, useRef, useState, ReactNode } from "react";
import Icon from "@/components/ui/icon";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { saveContentBlocks, uploadContentImage, ContentBlockType } from "@/lib/api";
import { toast } from "sonner";

interface BaseProps {
  page: string;
  blockKey: string;
  className?: string;
}

interface EditableTextProps extends BaseProps {
  value: string;
  as?: "div" | "span" | "h1" | "h2" | "h3" | "h4" | "p";
  /** true — редактируем как HTML (rich), иначе как plain text */
  html?: boolean;
  /** Если value не пустое, считается приоритетным; fallback показывается только если value пустое */
  fallback?: ReactNode;
  onSaved?: (newValue: string) => void;
}

/**
 * Текстовый/HTML блок с inline-редактированием прямо на странице (только для админа).
 *
 * Использование:
 *   <EditableText page="home" blockKey="hero_title" value={c("hero_title", "Заборы")} html />
 */
export function EditableText({
  page, blockKey, value, as = "div", html, className, fallback, onSaved,
}: EditableTextProps) {
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const Tag = as as keyof JSX.IntrinsicElements;

  useEffect(() => { setDraft(value); }, [value]);

  const content = value && value.trim()
    ? (html
        ? <Tag className={className} dangerouslySetInnerHTML={{ __html: value }} />
        : <Tag className={className}>{value}</Tag>)
    : (fallback != null
        ? <Tag className={className}>{fallback}</Tag>
        : <Tag className={className} />);

  if (!isAdmin) return content;

  const save = async () => {
    setSaving(true);
    try {
      await saveContentBlocks([{
        page_slug: page, block_key: blockKey,
        block_type: (html ? "html" : "text") as ContentBlockType,
        value: draft,
      }]);
      toast.success("Сохранено");
      onSaved?.(draft);
      setOpen(false);
      // Принудительная перезагрузка кэша usePageContent
      window.dispatchEvent(new CustomEvent("cms:invalidate", { detail: { page } }));
    } catch (e) {
      toast.error("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <span className="group/edit relative inline-block align-baseline w-full">
        {content}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
          title={`Редактировать: ${blockKey}`}
          className="absolute -top-2 -right-2 z-40 hidden group-hover/edit:flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600 transition"
        >
          <Icon name="Pencil" size={14} />
        </button>
      </span>
      {open && (
        <EditorModal
          title={`Редактирование: ${blockKey}`}
          isHtml={!!html}
          value={draft}
          onChange={setDraft}
          onClose={() => setOpen(false)}
          onSave={save}
          saving={saving}
        />
      )}
    </>
  );
}

interface EditableImageProps extends BaseProps {
  value: string;
  fallback?: string;
  alt?: string;
  imgClassName?: string;
}

/**
 * Картинка с inline-редактированием. Поддерживает любые форматы:
 * jpg/jpeg/png/webp/avif/heic/svg/gif/bmp/tiff/ico
 */
export function EditableImage({
  page, blockKey, value, fallback, alt, className, imgClassName,
}: EditableImageProps) {
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const src = value && value.trim() ? value : (fallback || "");

  const img = src
    ? <img src={src} alt={alt || blockKey} className={imgClassName} loading="lazy" />
    : <div className={`${imgClassName || ""} bg-slate-200 flex items-center justify-center text-slate-500`}>Нет фото</div>;

  if (!isAdmin) return <div className={className}>{img}</div>;

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadContentImage(file);
      await saveContentBlocks([{
        page_slug: page, block_key: blockKey, block_type: "image", value: url,
      }]);
      toast.success("Фото обновлено");
      setOpen(false);
      window.dispatchEvent(new CustomEvent("cms:invalidate", { detail: { page } }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className={`relative group/edit ${className || ""}`}>
        {img}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
          title={`Изменить фото: ${blockKey}`}
          className="absolute top-2 right-2 z-40 hidden group-hover/edit:flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-500 text-white text-xs font-semibold shadow-lg hover:bg-orange-600 transition"
        >
          <Icon name="Camera" size={14} /> Заменить
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => !uploading && setOpen(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Замена фото</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
                <Icon name="X" size={20} />
              </button>
            </div>
            {src && <img src={src} alt="" className="w-full max-h-64 object-cover rounded-lg mb-4" />}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.heic,.heif,.avif,.bmp,.tif,.tiff,.svg,.ico"
              hidden
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading
                ? <><Icon name="Loader2" className="animate-spin" size={18} /> Загрузка…</>
                : <><Icon name="Upload" size={18} /> Выбрать файл</>}
            </button>
            <p className="text-xs text-slate-500 mt-3 text-center">
              Любой формат: JPG, PNG, WebP, AVIF, HEIC, SVG, GIF, BMP, TIFF, ICO
            </p>
          </div>
        </div>
      )}
    </>
  );
}

interface EditorModalProps {
  title: string;
  isHtml: boolean;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}

function EditorModal({ title, isHtml, value, onChange, onClose, onSave, saving }: EditorModalProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => !saving && onClose()}>
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <Icon name="X" size={20} />
          </button>
        </div>
        {isHtml ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={10}
            className="w-full p-3 border-2 border-slate-200 rounded-lg font-mono text-sm focus:border-orange-500 outline-none"
            placeholder="HTML-код или текст"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-orange-500 outline-none"
            placeholder="Введите текст"
            autoFocus
          />
        )}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 border-2 border-slate-200 rounded-lg font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving
              ? <><Icon name="Loader2" className="animate-spin" size={16} /> Сохранение…</>
              : <><Icon name="Check" size={16} /> Сохранить</>}
          </button>
        </div>
      </div>
    </div>
  );
}