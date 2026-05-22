import { useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { API } from "@/lib/api";

interface MediaItem {
  id: number;
  url: string;
  s3_key: string | null;
  service: string | null;
  position: number;
  caption: string;
  alt_text: string;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  is_hidden: boolean;
  created_at: string | null;
}

interface Stats {
  _total: number;
  _unassigned: number;
  [k: string]: number;
}

const SERVICES: { slug: string; label: string; icon: string }[] = [
  { slug: "profnastil",          label: "Профнастил",        icon: "Fence" },
  { slug: "shtaketnik",          label: "Евроштакетник",     icon: "AlignVerticalSpaceAround" },
  { slug: "3d-setka",            label: "3D-сетка",          icon: "Grid3x3" },
  { slug: "setka-rabitsa",       label: "Сетка-рабица",      icon: "Grid2x2" },
  { slug: "kovka",               label: "Кованые заборы",    icon: "Sparkles" },
  { slug: "otkatnye-vorota",     label: "Откатные ворота",   icon: "MoveHorizontal" },
  { slug: "raspashnye-vorota",   label: "Распашные ворота",  icon: "DoorOpen" },
  { slug: "kalitki",             label: "Калитки",           icon: "DoorClosed" },
  { slug: "navesy",              label: "Навесы",            icon: "Umbrella" },
  { slug: "besedki",             label: "Беседки",           icon: "TreePine" },
  { slug: "fundamenty",          label: "Фундаменты",        icon: "Layers" },
  { slug: "betonnye-ploschadki", label: "Бетонные площадки", icon: "Square" },
  { slug: "zaezd-na-uchastok",   label: "Заезд на участок",  icon: "Car" },
  { slug: "zabor-na-rostverke",  label: "Забор на ростверке", icon: "Layers" },
  { slug: "kirpichnye-stolby",   label: "Кирпичные столбы",   icon: "Building" },
  { slug: "bloki-stolby",        label: "Блочные столбы",     icon: "Building" },
  { slug: "shemy-chertezi",      label: "Схемы и чертежи",    icon: "FileText" },
];

const FILTERS = [
  { slug: "_all",        label: "Все",          icon: "Image" },
  { slug: "_unassigned", label: "Без категории", icon: "HelpCircle" },
  ...SERVICES,
];

export default function AdminMedia() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<Stats>({ _total: 0, _unassigned: 0 });
  const [filter, setFilter] = useState<string>("_all");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<Record<number, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(API.media + "?action=list");
      const j = await r.json();
      setItems(j.items || []);
      setStats(j.stats || { _total: 0, _unassigned: 0 });
    } catch (e) {
      alert("Не удалось загрузить медиа: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (filter === "_all") return items;
    if (filter === "_unassigned") return items.filter(i => !i.service);
    return items.filter(i => i.service === filter);
  }, [items, filter]);

  async function setTag(id: number, service: string | null) {
    setBusy(b => ({ ...b, [id]: true }));
    try {
      await fetch(API.media, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(service ? { action: "tag", id, service } : { action: "untag", id }),
      });
      setItems(arr => arr.map(it => it.id === id ? { ...it, service: service || null } : it));
      // обновить stats локально
      setStats(s => {
        const n = { ...s };
        const old = items.find(i => i.id === id)?.service;
        if (old) n[old] = Math.max(0, (n[old] || 0) - 1);
        else n._unassigned = Math.max(0, n._unassigned - 1);
        if (service) n[service] = (n[service] || 0) + 1;
        else n._unassigned = (n._unassigned || 0) + 1;
        return n;
      });
    } catch (e) {
      alert("Ошибка: " + (e as Error).message);
    } finally {
      setBusy(b => ({ ...b, [id]: false }));
    }
  }

  async function deleteItem(id: number) {
    if (!confirm("Удалить фото из библиотеки? Файл в хранилище останется.")) return;
    setBusy(b => ({ ...b, [id]: true }));
    try {
      await fetch(API.media + "?id=" + id, { method: "DELETE" });
      setItems(arr => arr.filter(it => it.id !== id));
    } finally {
      setBusy(b => ({ ...b, [id]: false }));
    }
  }

  function fileToBase64(f: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result || "").split(",")[1] || "");
      r.onerror = () => rej(r.error);
      r.readAsDataURL(f);
    });
  }

  async function onUpload(files: FileList | null) {
    if (!files || !files.length) return;
    const list = Array.from(files);
    setUploadProgress({ done: 0, total: list.length });
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      try {
        const b64 = await fileToBase64(f);
        const r = await fetch(API.media, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "upload",
            filename: f.name,
            content_base64: b64,
            service: filter !== "_all" && filter !== "_unassigned" ? filter : undefined,
          }),
        });
        if (!r.ok) throw new Error(await r.text());
      } catch (e) {
        console.error("upload failed", f.name, e);
      }
      setUploadProgress({ done: i + 1, total: list.length });
    }
    setUploadProgress(null);
    await load();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const fmtSize = (b: number | null) => {
    if (!b) return "—";
    if (b < 1024 * 1024) return Math.round(b / 1024) + " КБ";
    return (b / 1024 / 1024).toFixed(1) + " МБ";
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      {/* Шапка */}
      <header className="sticky top-0 z-30 bg-[#0a0c10]/95 backdrop-blur border-b border-[#1e2230]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-white/50 hover:text-orange-400 transition-colors">
              <Icon name="ArrowLeft" size={20} />
            </Link>
            <div>
              <h1 className="font-oswald text-2xl font-bold">Медиа-библиотека</h1>
              <p className="text-white/50 text-xs">
                {stats._total} фото · без категории: {stats._unassigned}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="btn-orange px-4 py-2.5 rounded-xl text-sm cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => onUpload(e.target.files)}
              />
              <span className="flex items-center gap-2">
                <Icon name="Upload" size={16} />
                Загрузить фото
              </span>
            </label>
            <button
              onClick={load}
              className="p-2.5 rounded-xl border border-[#1e2230] hover:border-orange-500/50 text-white/70 hover:text-white transition-colors"
              title="Обновить"
            >
              <Icon name="RefreshCw" size={16} />
            </button>
          </div>
        </div>

        {/* Прогресс загрузки */}
        {uploadProgress && (
          <div className="bg-orange-500/10 border-t border-orange-500/30 px-4 py-2">
            <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
              <Icon name="Loader" size={16} className="animate-spin text-orange-400" />
              <span>Загрузка {uploadProgress.done} из {uploadProgress.total}…</span>
              <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all"
                  style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Фильтр-категории */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2 mb-6">
          {FILTERS.map(f => {
            const count = f.slug === "_all" ? stats._total : (stats[f.slug] || 0);
            const active = filter === f.slug;
            return (
              <button
                key={f.slug}
                onClick={() => setFilter(f.slug)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? "bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25"
                    : "bg-[#141720] border border-[#1e2230] hover:border-orange-500/50 text-white/70"
                }`}
              >
                <Icon name={f.icon} size={14} className={active ? "" : "text-orange-400"} />
                <span className="truncate flex-1 text-left">{f.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${active ? "bg-black/20" : "bg-white/5"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Подсказка пустой категории */}
        {filtered.length === 0 && !loading && (
          <div className="text-center py-20 border-2 border-dashed border-[#1e2230] rounded-2xl">
            <Icon name="ImageOff" size={48} className="mx-auto text-white/20 mb-3" />
            <p className="text-white/50 text-sm">В этой категории пока нет фото</p>
            <p className="text-white/30 text-xs mt-1">Нажмите «Загрузить фото» сверху, чтобы добавить</p>
          </div>
        )}

        {/* Сетка фото */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(it => {
            const svc = SERVICES.find(s => s.slug === it.service);
            return (
              <div
                key={it.id}
                className="group relative bg-[#141720] border border-[#1e2230] rounded-xl overflow-hidden hover:border-orange-500/50 transition-all"
              >
                <button
                  onClick={() => setPreview(it)}
                  className="block w-full aspect-square overflow-hidden bg-black"
                >
                  <img
                    src={it.url}
                    loading="lazy"
                    alt={it.alt_text || `фото #${it.id}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </button>

                {/* Бейдж услуги или "без категории" */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1.5 pointer-events-none">
                  {svc ? (
                    <span className="bg-orange-500 text-gray-900 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                      <Icon name={svc.icon} size={10} />
                      {svc.label}
                    </span>
                  ) : (
                    <span className="bg-black/70 text-white/70 text-[10px] px-2 py-1 rounded flex items-center gap-1">
                      <Icon name="HelpCircle" size={10} />
                      Без категории
                    </span>
                  )}
                  <span className="bg-black/70 text-white/50 text-[10px] px-1.5 py-0.5 rounded">
                    #{it.id}
                  </span>
                </div>

                {/* Действия */}
                <div className="p-2 border-t border-[#1e2230]">
                  <select
                    value={it.service || ""}
                    disabled={busy[it.id]}
                    onChange={e => setTag(it.id, e.target.value || null)}
                    className="w-full bg-[#0a0c10] border border-[#1e2230] rounded-lg text-xs text-white px-2 py-1.5 focus:border-orange-500 outline-none cursor-pointer"
                  >
                    <option value="">— Выбрать услугу —</option>
                    {SERVICES.map(s => (
                      <option key={s.slug} value={s.slug}>{s.label}</option>
                    ))}
                  </select>
                  <div className="flex items-center justify-between mt-1.5 text-[10px] text-white/35">
                    <span>{fmtSize(it.size_bytes)}</span>
                    <button
                      onClick={() => deleteItem(it.id)}
                      className="text-red-400/60 hover:text-red-400 transition-colors p-0.5"
                      title="Удалить"
                    >
                      <Icon name="Trash2" size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Пояснение */}
        <div className="mt-8 p-4 bg-[#141720] border border-[#1e2230] rounded-2xl">
          <h3 className="font-oswald text-base font-bold mb-2 flex items-center gap-2">
            <Icon name="Info" size={16} className="text-orange-400" />
            Как это работает
          </h3>
          <ul className="space-y-1.5 text-sm text-white/60">
            <li><span className="text-orange-400">1.</span> Под каждым фото выберите услугу из выпадающего списка — фото сразу появится на странице этой услуги.</li>
            <li><span className="text-orange-400">2.</span> Кнопка «Загрузить фото» — можно перетащить или выбрать несколько файлов сразу. HEIC и большие фото автоматически уменьшатся.</li>
            <li><span className="text-orange-400">3.</span> Фильтры сверху — быстро найти фото конкретной услуги или те, что ещё без категории.</li>
            <li><span className="text-orange-400">4.</span> Корзина — удалить фото из библиотеки (файл в хранилище сохранится).</li>
          </ul>
        </div>
      </div>

      {/* Лайтбокс */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <button
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-orange-500 flex items-center justify-center text-white"
            onClick={() => setPreview(null)}
          >
            <Icon name="X" size={22} />
          </button>
          <img
            src={preview.url}
            alt={preview.alt_text || ""}
            className="max-w-[92vw] max-h-[90vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 rounded-full px-4 py-2 text-sm text-white/80">
            #{preview.id} · {preview.width || "?"}×{preview.height || "?"} · {fmtSize(preview.size_bytes)}
          </div>
        </div>
      )}
    </div>
  );
}