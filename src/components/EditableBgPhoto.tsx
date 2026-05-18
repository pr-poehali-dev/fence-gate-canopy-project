import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { saveContentBlocks, uploadContentImage } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  page: string;
  blockKey: string;
  label?: string;
  /** Если true — кнопка фиксированная (для hero, где фон — bg-image) */
  className?: string;
}

/**
 * Маленькая плавающая кнопка «Заменить фото» для блоков, где картинка — это
 * CSS background-image, а не <img>. Видна только админу.
 */
export default function EditableBgPhoto({ page, blockKey, label = "Заменить фон", className }: Props) {
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) return null;

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadContentImage(file);
      await saveContentBlocks([{ page_slug: page, block_key: blockKey, block_type: "image", value: url }]);
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`absolute top-20 left-4 sm:top-24 lg:top-20 z-30 flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-500/90 hover:bg-orange-500 text-white text-xs font-semibold shadow-lg ${className || ""}`}
      >
        <Icon name="Image" size={14} /> {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => !uploading && setOpen(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900">{label}</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
                <Icon name="X" size={20} />
              </button>
            </div>
            <input
              ref={fileRef} type="file" hidden
              accept="image/*,.heic,.heif,.avif,.bmp,.tif,.tiff,.svg,.ico"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <button
              type="button" disabled={uploading}
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