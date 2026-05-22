import { useEffect, useState, useRef, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { API } from "@/lib/api";
import { toast } from "sonner";

interface MediaItem {
  id: number;
  url: string;
  service: string | null;
  position: number;
  is_hero: boolean;
  is_hidden: boolean;
}

interface Props {
  open: boolean;
  service: string;
  /** Текущий выбранный url (подсветим в галерее) */
  currentUrl?: string;
  /** "hero" — кнопка «Сделать главным», "any" — просто выбрать фото */
  mode?: "hero" | "any";
  onClose: () => void;
  /** Когда юзер выбрал фото — отдаём id (и url) наверх */
  onPicked: (url: string, id: number) => void;
}

export default function MediaPickerModal({
  open, service, currentUrl, mode = "any", onClose, onPicked,
}: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [allItems, setAllItems] = useState<MediaItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r1 = await fetch(`${API.media}?action=list&service=${encodeURIComponent(service)}`);
      const j1 = await r1.json();
      setItems((j1.items || []).filter((i: MediaItem) => !i.is_hidden));

      const r2 = await fetch(`${API.media}?action=list`);
      const j2 = await r2.json();
      setAllItems((j2.items || []).filter((i: MediaItem) => !i.is_hidden));
    } catch (e) {
      toast.error("Не удалось загрузить фото");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) load(); }, [open, service]);

  const visible = useMemo(() => showAll ? allItems : items, [showAll, items, allItems]);

  const fileToBase64 = (f: File): Promise<string> => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result || "").split(",")[1] || "");
    r.onerror = () => rej(r.error);
    r.readAsDataURL(f);
  });

  const onUpload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const list = Array.from(files);
    setUploadProgress({ done: 0, total: list.length });
    for (let i = 0; i < list.length; i++) {
      try {
        const b64 = await fileToBase64(list[i]);
        await fetch(API.media, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "upload",
            filename: list[i].name,
            content_base64: b64,
            service,
          }),
        });
      } catch (e) {
        console.error(e);
      }
      setUploadProgress({ done: i + 1, total: list.length });
    }
    setUploadProgress(null);
    if (fileRef.current) fileRef.current.value = "";
    await load();
    toast.success(`Загружено ${list.length} фото`);
  };

  const onPick = async (it: MediaItem) => {
    // если у фото не выставлен сервис — выставим
    if (it.service !== service) {
      await fetch(API.media, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tag", id: it.id, service }),
      });
    }
    if (mode === "hero") {
      await fetch(API.media, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_hero", id: it.id }),
      });
      toast.success("Главное фото обновлено");
    } else {
      toast.success("Фото добавлено в услугу");
    }
    onPicked(it.url, it.id);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#0a0c10] border border-[#1e2230] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Шапка */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2230]">
          <div>
            <h2 className="font-oswald text-lg font-bold text-white">
              {mode === "hero" ? "Выбрать главное фото" : "Выбрать фото"}
            </h2>
            <p className="text-white/40 text-xs mt-0.5">
              Услуга: <span className="text-orange-400">{service}</span> · {items.length} фото
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="bg-orange-500 hover:bg-orange-400 text-gray-900 font-bold text-xs px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => onUpload(e.target.files)}
              />
              <Icon name="Upload" size={14} />
              Загрузить
            </label>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg border border-[#1e2230] hover:border-orange-500/50 text-white/70 hover:text-white flex items-center justify-center"
            >
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>

        {/* Переключатель источника */}
        <div className="flex gap-2 px-4 py-2 border-b border-[#1e2230]">
          <button
            onClick={() => setShowAll(false)}
            className={`text-xs px-3 py-1.5 rounded-lg ${
              !showAll
                ? "bg-orange-500 text-gray-900 font-bold"
                : "bg-[#141720] border border-[#1e2230] text-white/70"
            }`}
          >
            Этой услуги ({items.length})
          </button>
          <button
            onClick={() => setShowAll(true)}
            className={`text-xs px-3 py-1.5 rounded-lg ${
              showAll
                ? "bg-orange-500 text-gray-900 font-bold"
                : "bg-[#141720] border border-[#1e2230] text-white/70"
            }`}
          >
            Все фото ({allItems.length})
          </button>
        </div>

        {/* Прогресс загрузки */}
        {uploadProgress && (
          <div className="bg-orange-500/10 px-4 py-2 text-xs text-orange-300 flex items-center gap-2">
            <Icon name="Loader" size={14} className="animate-spin" />
            Загрузка {uploadProgress.done}/{uploadProgress.total}…
          </div>
        )}

        {/* Сетка */}
        <div className="overflow-auto flex-1 p-3">
          {loading && (
            <div className="text-center py-12 text-white/40 text-sm">Загрузка…</div>
          )}
          {!loading && visible.length === 0 && (
            <div className="text-center py-12">
              <Icon name="ImageOff" size={36} className="mx-auto text-white/20 mb-2" />
              <p className="text-white/50 text-sm">Здесь пока пусто</p>
              <p className="text-white/30 text-xs mt-1">Нажмите «Загрузить», чтобы добавить фото</p>
            </div>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {visible.map(it => {
              const selected = it.url === currentUrl;
              return (
                <button
                  key={it.id}
                  onClick={() => onPick(it)}
                  className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    selected
                      ? "border-orange-500 ring-2 ring-orange-500/30"
                      : "border-[#1e2230] hover:border-orange-500/60"
                  }`}
                >
                  <img
                    src={it.url}
                    loading="lazy"
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {it.is_hero && (
                    <span className="absolute top-1 left-1 bg-orange-500 text-gray-900 text-[9px] font-bold px-1.5 py-0.5 rounded">
                      HERO
                    </span>
                  )}
                  {it.service && it.service !== service && (
                    <span className="absolute top-1 right-1 bg-black/70 text-white/70 text-[9px] px-1.5 py-0.5 rounded">
                      {it.service.slice(0, 8)}
                    </span>
                  )}
                  {selected && (
                    <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                      <Icon name="CheckCircle" size={28} className="text-orange-500 drop-shadow-lg" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Подсказка */}
        <div className="px-4 py-2 border-t border-[#1e2230] text-[11px] text-white/40">
          Кликните по фото, чтобы {mode === "hero" ? "сделать его главным" : "добавить в услугу"}.
        </div>
      </div>
    </div>
  );
}
