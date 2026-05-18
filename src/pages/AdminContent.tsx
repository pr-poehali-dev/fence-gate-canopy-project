import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import RichEditor from "@/components/RichEditor";
import {
  adminToken, verifyAdmin,
  fetchAllContentPages, fetchPageContentAdmin, saveContentBlocks,
  deleteContentBlock, uploadContentImage,
  ContentBlock, ContentBlockType,
} from "@/lib/api";
import { toast } from "sonner";

// Преднастроенные страницы и стандартные блоки — чтобы было что редактировать
// сразу, даже если в БД ещё ничего нет.
const PRESET_PAGES: { slug: string; title: string; blocks: { key: string; type: ContentBlockType; label: string; placeholder?: string }[] }[] = [
  {
    slug: "global", title: "🌐 Логотип и брендинг",
    blocks: [
      { key: "logo_text_1",   type: "text",  label: "Логотип — первая часть текста (тёмная)" },
      { key: "logo_text_2",   type: "text",  label: "Логотип — вторая часть (оранжевая)" },
      { key: "logo_subtitle", type: "text",  label: "Логотип — подпись под названием" },
      { key: "logo_icon",     type: "text",  label: "Логотип — иконка lucide-react (Fence, Building2, Shield, Factory, Wrench, и т.д.)" },
      { key: "logo_image",    type: "image", label: "Логотип — картинка (если задана, иконка не показывается)" },
      { key: "favicon_url",   type: "image", label: "Favicon (иконка вкладки браузера, 32×32)" },
    ],
  },
  {
    slug: "home", title: "Главная",
    blocks: [
      { key: "hero_badge",    type: "text",  label: "Hero — плашка над заголовком" },
      { key: "hero_title",    type: "html",  label: "Hero — заголовок" },
      { key: "hero_subtitle", type: "html",  label: "Hero — подзаголовок" },
      { key: "hero_image",    type: "image", label: "Hero — главное изображение" },
      { key: "about_text",    type: "html",  label: "О компании — основной текст" },
      { key: "advantages",    type: "html",  label: "Блок преимуществ" },
      { key: "contacts_text", type: "html",  label: "Текст в блоке контактов" },
    ],
  },
  {
    slug: "services/profnastil", title: "Услуга: Профнастил",
    blocks: [
      { key: "hero_title",    type: "html",  label: "Заголовок страницы" },
      { key: "hero_subtitle", type: "html",  label: "Подзаголовок" },
      { key: "hero_image",    type: "image", label: "Главное фото" },
      { key: "description",   type: "html",  label: "Описание услуги" },
    ],
  },
  {
    slug: "services/shtaketnik", title: "Услуга: Штакетник",
    blocks: [
      { key: "hero_title",  type: "html",  label: "Заголовок" },
      { key: "hero_image",  type: "image", label: "Главное фото" },
      { key: "description", type: "html",  label: "Описание" },
    ],
  },
  {
    slug: "services/otkatnye-vorota", title: "Услуга: Откатные ворота",
    blocks: [
      { key: "hero_title",  type: "html",  label: "Заголовок" },
      { key: "hero_image",  type: "image", label: "Главное фото" },
      { key: "description", type: "html",  label: "Описание" },
    ],
  },
  {
    slug: "services/raspashnye-vorota", title: "Услуга: Распашные ворота",
    blocks: [
      { key: "hero_title",  type: "html",  label: "Заголовок" },
      { key: "hero_image",  type: "image", label: "Главное фото" },
      { key: "description", type: "html",  label: "Описание" },
    ],
  },
  {
    slug: "services/navesy", title: "Услуга: Навесы",
    blocks: [
      { key: "hero_title",  type: "html",  label: "Заголовок" },
      { key: "hero_image",  type: "image", label: "Главное фото" },
      { key: "description", type: "html",  label: "Описание" },
    ],
  },
  {
    slug: "services/3d-setka", title: "Услуга: 3D сетка",
    blocks: [
      { key: "hero_title",  type: "html",  label: "Заголовок" },
      { key: "hero_image",  type: "image", label: "Главное фото" },
      { key: "description", type: "html",  label: "Описание" },
    ],
  },
  {
    slug: "services/kovka", title: "Услуга: Ковка",
    blocks: [
      { key: "hero_title",  type: "html",  label: "Заголовок" },
      { key: "hero_image",  type: "image", label: "Главное фото" },
      { key: "description", type: "html",  label: "Описание" },
    ],
  },
  {
    slug: "services/setka-rabitsa", title: "Услуга: Сетка-рабица",
    blocks: [
      { key: "hero_title",  type: "html",  label: "Заголовок" },
      { key: "hero_image",  type: "image", label: "Главное фото" },
      { key: "description", type: "html",  label: "Описание" },
    ],
  },
  {
    slug: "services/kalitki", title: "Услуга: Калитки",
    blocks: [
      { key: "hero_title",  type: "html",  label: "Заголовок" },
      { key: "hero_image",  type: "image", label: "Главное фото" },
      { key: "description", type: "html",  label: "Описание" },
    ],
  },
  {
    slug: "services/besedki", title: "Услуга: Беседки",
    blocks: [
      { key: "hero_title",  type: "html",  label: "Заголовок" },
      { key: "hero_image",  type: "image", label: "Главное фото" },
      { key: "description", type: "html",  label: "Описание" },
    ],
  },
  {
    slug: "services/fundamenty", title: "Услуга: Фундаменты",
    blocks: [
      { key: "hero_title",  type: "html",  label: "Заголовок" },
      { key: "hero_image",  type: "image", label: "Главное фото" },
      { key: "description", type: "html",  label: "Описание" },
    ],
  },
];

interface UnifiedBlock extends ContentBlock {
  label?: string;
  isNew?: boolean;
}

export default function AdminContent() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [currentPage, setCurrentPage] = useState<string>("home");
  const [blocks, setBlocks] = useState<UnifiedBlock[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pagesInfo, setPagesInfo] = useState<{ page_slug: string; blocks_count: number }[]>([]);

  // Проверка авторизации
  useEffect(() => {
    (async () => {
      const ok = await verifyAdmin();
      setAuthed(ok);
      setChecking(false);
      if (!ok) navigate("/admin");
    })();
  }, [navigate]);

  // Загрузка списка страниц
  useEffect(() => {
    if (!authed) return;
    fetchAllContentPages().then(setPagesInfo).catch(() => setPagesInfo([]));
  }, [authed]);

  // Загрузка блоков выбранной страницы
  useEffect(() => {
    if (!authed || !currentPage) return;
    (async () => {
      try {
        const existing = await fetchPageContentAdmin(currentPage);
        // Объединяем с пресетами — те ключи, которых нет в БД, добавляем как пустые
        const preset = PRESET_PAGES.find(p => p.slug === currentPage);
        const map = new Map<string, UnifiedBlock>();
        for (const b of existing) {
          map.set(b.block_key, { ...b });
        }
        if (preset) {
          for (const pb of preset.blocks) {
            if (!map.has(pb.key)) {
              map.set(pb.key, {
                page_slug: currentPage,
                block_key: pb.key,
                block_type: pb.type,
                value: "",
                label: pb.label,
                isNew: true,
              });
            } else {
              const cur = map.get(pb.key)!;
              cur.label = pb.label;
            }
          }
        }
        setBlocks(Array.from(map.values()));
        setDirty(false);
      } catch {
        setBlocks([]);
      }
    })();
  }, [authed, currentPage]);

  const updateBlock = (i: number, patch: Partial<UnifiedBlock>) => {
    setBlocks(arr => arr.map((b, idx) => idx === i ? { ...b, ...patch } : b));
    setDirty(true);
  };

  const addCustomBlock = () => {
    const key = window.prompt("Ключ блока (только латиница, цифры, _):", "custom_block");
    if (!key) return;
    if (!/^[a-z0-9_]+$/i.test(key)) {
      toast.error("Ключ может содержать только латиницу, цифры и подчёркивание");
      return;
    }
    if (blocks.some(b => b.block_key === key)) {
      toast.error("Такой ключ уже есть");
      return;
    }
    setBlocks(arr => [...arr, {
      page_slug: currentPage, block_key: key, block_type: "html",
      value: "", isNew: true, label: key,
    }]);
    setDirty(true);
  };

  const removeBlock = async (i: number) => {
    const b = blocks[i];
    if (!confirm(`Удалить блок "${b.label || b.block_key}"?`)) return;
    if (b.id) {
      await deleteContentBlock(b.id);
    }
    setBlocks(arr => arr.filter((_, idx) => idx !== i));
    setDirty(true);
    toast.success("Блок удалён");
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const toSave = blocks
        .filter(b => b.value !== "" || b.id) // не сохраняем пустые новые
        .map(b => ({
          page_slug: b.page_slug,
          block_key: b.block_key,
          block_type: b.block_type,
          value: b.value || "",
        }));
      const res = await saveContentBlocks(toSave);
      if (res?.ok) {
        toast.success(`Сохранено ${res.saved} блоков`);
        setDirty(false);
        // Перезагрузим из БД, чтобы получить id
        const existing = await fetchPageContentAdmin(currentPage);
        setBlocks(prev => prev.map(b => {
          const found = existing.find(e => e.block_key === b.block_key);
          return found ? { ...b, id: found.id, isNew: false, value: found.value } : b;
        }));
      } else {
        toast.error("Не удалось сохранить");
      }
    } catch (e) {
      toast.error("Ошибка сохранения: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]">
        <Icon name="Loader" size={32} className="animate-spin text-orange-400" />
      </div>
    );
  }
  if (!authed) return null;

  const customPageInput = (
    <input type="text" value={currentPage}
      onChange={e => setCurrentPage(e.target.value.toLowerCase())}
      placeholder="например: home или services/profnastil"
      className="bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none font-mono" />
  );

  return (
    <div className="min-h-screen bg-[#0d0f14]">
      {/* Header */}
      <header className="bg-[#0a0c11] border-b border-[#1e2230] px-4 py-3 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-white/55 hover:text-orange-400 transition-colors flex items-center gap-1.5">
              <Icon name="ArrowLeft" size={16} /> <span className="text-sm">Админка</span>
            </Link>
            <div className="w-px h-5 bg-[#1e2230]" />
            <div className="font-oswald font-bold text-white tracking-wider">
              CMS · <span className="text-orange-400">контент сайта</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dirty && <span className="text-orange-400/80 text-xs">есть несохранённые изменения</span>}
            <button onClick={saveAll} disabled={!dirty || saving}
              className="btn-orange px-5 py-2 rounded-lg text-sm disabled:opacity-40">
              <span className="flex items-center gap-2">
                <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} />
                {saving ? "Сохранение..." : "Сохранить страницу"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar — список страниц */}
        <aside className="bg-[#141720] border border-[#1e2230] rounded-2xl p-4 h-fit lg:sticky lg:top-20">
          <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Страницы</div>
          <nav className="space-y-1 max-h-[60vh] overflow-y-auto">
            {PRESET_PAGES.map(p => {
              const info = pagesInfo.find(x => x.page_slug === p.slug);
              const active = currentPage === p.slug;
              return (
                <button key={p.slug} onClick={() => {
                  if (dirty && !confirm("Несохранённые изменения будут потеряны. Продолжить?")) return;
                  setCurrentPage(p.slug);
                }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between gap-2 ${
                    active ? "bg-orange-500/15 text-orange-300 border border-orange-500/30"
                           : "text-white/70 hover:bg-white/5 border border-transparent"
                  }`}>
                  <div className="truncate">
                    <div className="font-semibold truncate">{p.title}</div>
                    <div className="text-[10px] text-white/40 font-mono truncate">{p.slug}</div>
                  </div>
                  {info && info.blocks_count > 0 && (
                    <span className="text-[10px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded">{info.blocks_count}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="pt-4 mt-4 border-t border-[#1e2230]">
            <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Кастомная страница</div>
            <div className="space-y-2">{customPageInput}</div>
          </div>
        </aside>

        {/* Main — редактор блоков */}
        <main className="space-y-4 min-w-0">
          <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-1">
              <div>
                <div className="font-oswald font-bold text-white text-xl">{currentPage}</div>
                <div className="text-white/40 text-xs">Редактирование блоков страницы</div>
              </div>
              <button onClick={addCustomBlock}
                className="text-xs px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:border-orange-500/50 rounded-lg transition-all flex items-center gap-1.5">
                <Icon name="Plus" size={13} /> Добавить блок
              </button>
            </div>
          </div>

          {blocks.length === 0 && (
            <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-10 text-center text-white/40">
              <Icon name="FileText" size={32} className="mx-auto mb-2 opacity-40" />
              На этой странице ещё нет блоков. Нажмите «Добавить блок».
            </div>
          )}

          {blocks.map((b, i) => (
            <BlockEditor key={b.block_key} block={b}
              onChange={patch => updateBlock(i, patch)}
              onRemove={() => removeBlock(i)} />
          ))}
        </main>
      </div>
    </div>
  );
}

// ─────────── Редактор одного блока ───────────

interface BlockProps {
  block: UnifiedBlock;
  onChange: (patch: Partial<UnifiedBlock>) => void;
  onRemove: () => void;
}

function BlockEditor({ block, onChange, onRemove }: BlockProps) {
  const [uploading, setUploading] = useState(false);

  const pickImage = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadContentImage(file);
      onChange({ value: url });
      toast.success("Изображение загружено");
    } catch (e) {
      toast.error("Не удалось загрузить: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded
                              bg-orange-500/15 text-orange-300 border border-orange-500/30">
              {block.block_type}
            </span>
            <span className="text-white/40 text-xs font-mono">{block.block_key}</span>
            {block.isNew && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300">
                новый
              </span>
            )}
          </div>
          {block.label && <div className="font-semibold text-white text-sm">{block.label}</div>}
        </div>
        <div className="flex items-center gap-1.5">
          <select value={block.block_type}
            onChange={e => onChange({ block_type: e.target.value as ContentBlockType })}
            className="bg-[#0d1017] border border-[#1e2230] rounded-md px-2 py-1 text-xs text-white/70 focus:outline-none">
            <option value="text">text</option>
            <option value="html">html</option>
            <option value="image">image</option>
            <option value="url">url</option>
          </select>
          <button onClick={onRemove}
            className="w-8 h-8 rounded-md text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center"
            title="Удалить блок">
            <Icon name="Trash2" size={14} />
          </button>
        </div>
      </div>

      {/* Поле ввода в зависимости от типа */}
      {block.block_type === "html" && (
        <RichEditor value={block.value || ""} onChange={v => onChange({ value: v })}
          placeholder="Начните вводить текст…" minHeight={160} />
      )}

      {block.block_type === "text" && (
        <textarea value={block.value || ""} onChange={e => onChange({ value: e.target.value })}
          rows={4} placeholder="Простой текст без форматирования"
          className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none resize-y" />
      )}

      {block.block_type === "url" && (
        <input type="text" value={block.value || ""} onChange={e => onChange({ value: e.target.value })}
          placeholder="https://..." 
          className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono" />
      )}

      {block.block_type === "image" && (
        <div className="space-y-3">
          {block.value && (
            <div className="relative inline-block">
              <img src={block.value} alt={block.block_key}
                className="rounded-lg max-h-48 border border-[#1e2230]" />
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <label className={`text-xs px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:border-orange-500/50 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${uploading ? "opacity-50" : ""}`}>
              <Icon name={uploading ? "Loader" : "Upload"} size={13} className={uploading ? "animate-spin" : ""} />
              {uploading ? "Загружаем…" : block.value ? "Заменить" : "Загрузить картинку"}
              <input type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) pickImage(f); e.target.value = ""; }} />
            </label>
            {block.value && (
              <button onClick={() => onChange({ value: "" })}
                className="text-xs px-3 py-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-1.5">
                <Icon name="X" size={13} /> Убрать
              </button>
            )}
          </div>
          <input type="text" value={block.value || ""} onChange={e => onChange({ value: e.target.value })}
            placeholder="или вставьте URL картинки вручную"
            className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-lg px-3 py-2 text-xs text-white/70 placeholder:text-white/25 focus:outline-none font-mono" />
        </div>
      )}
    </div>
  );
}