/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { API, adminToken } from "@/lib/api";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import BlockRenderer, { PageBlock } from "@/components/builder/BlockRenderer";
import MediaPickerModal from "@/components/MediaPickerModal";

interface UserPage {
  id: number;
  slug: string;
  title: string;
  seo_description: string;
  is_published: boolean;
  updated_at?: string;
}

const BLOCK_TEMPLATES: { type: string; label: string; icon: string; data: any }[] = [
  { type: "hero",     label: "Hero-баннер",  icon: "Flag",       data: { title: "Заголовок", subtitle: "Подзаголовок", button_text: "Заказать", button_action: "lead", bg_color: "#f97316", text_color: "#ffffff" } },
  { type: "text",     label: "Текст",         icon: "Type",       data: { title: "Заголовок секции", content: "<p>Ваш текст…</p>" } },
  { type: "image",    label: "Картинка",      icon: "Image",      data: { image: "", alt: "", caption: "" } },
  { type: "features", label: "Преимущества",  icon: "Star",       data: { title: "Почему мы", items: [{ icon: "ShieldCheck", title: "Гарантия", desc: "3 года" }, { icon: "Truck", title: "Доставка", desc: "Бесплатно" }] } },
  { type: "gallery",  label: "Галерея фото",  icon: "Images",     data: { title: "Наши работы", items: [] } },
  { type: "video",    label: "Видео",         icon: "Video",      data: { url: "", caption: "" } },
  { type: "form",     label: "Форма заявки",  icon: "Send",       data: { title: "Оставьте заявку", subtitle: "Перезвоним за 15 минут", button_text: "Заказать звонок" } },
  { type: "cta",      label: "CTA-блок",      icon: "Megaphone",  data: { title: "Готовы начать?", subtitle: "Замер бесплатно", button_text: "Заказать", button_action: "lead" } },
  { type: "spacer",   label: "Отступ",        icon: "ArrowDownUp",data: { height: 40 } },
];

export default function AdminBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  const [pages, setPages] = useState<UserPage[]>([]);
  const [currentPage, setCurrentPage] = useState<UserPage | null>(null);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [showNewPage, setShowNewPage] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [mediaPicker, setMediaPicker] = useState<{ field: string; idx?: number } | null>(null);

  useEffect(() => {
    if (!adminToken.get()) { navigate("/admin"); return; }
    loadPages();
  }, []);

  useEffect(() => {
    if (editId) loadPage(+editId);
  }, [editId]);

  const loadPages = async () => {
    const r = await fetch(`${API.builder}?list=1`, { headers: { "X-Auth-Token": adminToken.get() } });
    const j = await r.json();
    if (j.pages) setPages(j.pages);
  };

  const loadPage = async (id: number) => {
    const r = await fetch(`${API.builder}?id=${id}`, { headers: { "X-Auth-Token": adminToken.get() } });
    const j = await r.json();
    if (j.error) { toast.error("Не удалось загрузить страницу"); return; }
    setCurrentPage(j);
    setBlocks(j.blocks || []);
  };

  const createPage = async () => {
    if (!newSlug.trim()) { toast.error("Введите URL-адрес страницы"); return; }
    const r = await fetch(`${API.builder}?action=upsert_page`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": adminToken.get() },
      body: JSON.stringify({ slug: newSlug.trim(), title: newTitle || newSlug, is_published: false }),
    });
    const j = await r.json();
    if (j.ok) {
      toast.success("Страница создана");
      setShowNewPage(false);
      setNewSlug(""); setNewTitle("");
      await loadPages();
      navigate(`/admin/builder?id=${j.id}`);
    } else {
      toast.error(j.error || "Ошибка");
    }
  };

  const savePageInfo = async (changes: Partial<UserPage>) => {
    if (!currentPage) return;
    const next = { ...currentPage, ...changes };
    setCurrentPage(next);
    await fetch(`${API.builder}?action=upsert_page`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": adminToken.get() },
      body: JSON.stringify(next),
    });
  };

  const saveBlocks = async () => {
    if (!currentPage) return;
    setSaving(true);
    const r = await fetch(`${API.builder}?action=save_blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": adminToken.get() },
      body: JSON.stringify({ page_id: currentPage.id, blocks }),
    });
    const j = await r.json();
    setSaving(false);
    if (j.ok) toast.success(`Сохранено блоков: ${j.saved}`);
    else toast.error(j.error || "Ошибка сохранения");
  };

  const deletePage = async () => {
    if (!currentPage) return;
    if (!confirm(`Удалить страницу «${currentPage.title}»?`)) return;
    await fetch(`${API.builder}?id=${currentPage.id}`, {
      method: "DELETE",
      headers: { "X-Auth-Token": adminToken.get() },
    });
    toast.success("Удалено");
    setCurrentPage(null); setBlocks([]);
    navigate("/admin/builder");
    await loadPages();
  };

  const addBlock = (tplIdx: number) => {
    const tpl = BLOCK_TEMPLATES[tplIdx];
    const newBlock: PageBlock = { block_type: tpl.type, data: JSON.parse(JSON.stringify(tpl.data)) };
    setBlocks([...blocks, newBlock]);
    setActiveIdx(blocks.length);
  };

  const moveBlock = (i: number, dir: -1 | 1) => {
    const ni = i + dir;
    if (ni < 0 || ni >= blocks.length) return;
    const arr = [...blocks];
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    setBlocks(arr);
    if (activeIdx === i) setActiveIdx(ni);
    else if (activeIdx === ni) setActiveIdx(i);
  };

  const removeBlock = (i: number) => {
    const arr = blocks.filter((_, idx) => idx !== i);
    setBlocks(arr);
    if (activeIdx === i) setActiveIdx(null);
  };

  const updateBlockData = (i: number, patch: Record<string, any>) => {
    const arr = [...blocks];
    arr[i] = { ...arr[i], data: { ...arr[i].data, ...patch } };
    setBlocks(arr);
  };

  // ─────── Список страниц ───────
  if (!currentPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/admin" className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                <Icon name="ArrowLeft" size={16} />
              </Link>
              <div>
                <h1 className="font-oswald font-bold text-gray-900 text-lg">Конструктор страниц</h1>
                <p className="text-xs text-gray-500">Drag & drop редактор для лендингов и акций</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewPage(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Icon name="Plus" size={16} /> Новая страница
            </button>
          </div>
        </header>

        <div className="max-w-5xl mx-auto p-4 sm:p-6">
          {pages.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <Icon name="FileText" size={48} className="text-gray-300 mx-auto mb-3" />
              <h2 className="font-oswald font-bold text-xl text-gray-900 mb-2">Пока нет страниц</h2>
              <p className="text-gray-500 mb-5">Создайте первую страницу — акцию, лендинг, спецпредложение.</p>
              <button
                onClick={() => setShowNewPage(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-lg"
              >
                + Создать первую страницу
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pages.map(p => (
                <Link
                  key={p.id}
                  to={`/admin/builder?id=${p.id}`}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-gray-900">{p.title || p.slug}</div>
                    {p.is_published ? (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Опубл.</span>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">Черновик</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">/p/{p.slug}</div>
                  {p.updated_at && (
                    <div className="text-[11px] text-gray-400">обновлено {new Date(p.updated_at).toLocaleString("ru-RU")}</div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {showNewPage && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowNewPage(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h3 className="font-oswald font-bold text-xl text-gray-900 mb-4">Новая страница</h3>
              <input
                value={newSlug}
                onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="url-страницы (например: akciya)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:border-orange-500 outline-none"
              />
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Название (для админки)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:border-orange-500 outline-none"
              />
              <div className="text-xs text-gray-500 mb-4">
                Адрес страницы: <code className="bg-gray-100 px-1.5 py-0.5 rounded">/p/{newSlug || "..."}</code>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowNewPage(false)} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50">Отмена</button>
                <button onClick={createPage} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-lg">Создать</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────── Редактор ───────
  const active = activeIdx !== null ? blocks[activeIdx] : null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-full px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/admin/builder" className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center shrink-0">
              <Icon name="ArrowLeft" size={16} />
            </Link>
            <input
              value={currentPage.title}
              onChange={e => savePageInfo({ title: e.target.value })}
              className="font-oswald font-bold text-lg text-gray-900 bg-transparent border-none outline-none min-w-0 max-w-xs"
            />
            <span className="text-xs text-gray-400 hidden sm:inline">/p/{currentPage.slug}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => savePageInfo({ is_published: !currentPage.is_published })}
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${currentPage.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
            >
              {currentPage.is_published ? "Опубликовано" : "Черновик"}
            </button>
            <button
              onClick={() => setPreviewMode(p => !p)}
              className={`text-sm font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 ${previewMode ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"}`}
            >
              <Icon name={previewMode ? "Edit3" : "Eye"} size={14} />
              {previewMode ? "Правка" : "Превью"}
            </button>
            {currentPage.is_published && (
              <a
                href={`/p/${currentPage.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-gray-700 hover:text-orange-500 font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5"
              >
                <Icon name="ExternalLink" size={14} /> На сайт
              </a>
            )}
            <button onClick={deletePage} className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center">
              <Icon name="Trash2" size={15} />
            </button>
            <button
              onClick={saveBlocks}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-lg flex items-center gap-2"
            >
              {saving ? <><Icon name="Loader" size={14} className="animate-spin" />Сохранение</> : <><Icon name="Save" size={14} />Сохранить</>}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Левая колонка — блоки */}
        {!previewMode && (
          <aside className="w-56 bg-white border-r border-gray-200 p-3 overflow-y-auto">
            <h3 className="font-bold text-xs text-gray-500 uppercase mb-2 px-2">Добавить блок</h3>
            <div className="space-y-1">
              {BLOCK_TEMPLATES.map((t, i) => (
                <button
                  key={t.type}
                  onClick={() => addBlock(i)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600"
                >
                  <Icon name={t.icon} size={14} />
                  {t.label}
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Центр — превью */}
        <main className="flex-1 overflow-auto bg-white">
          {blocks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-32">
              <Icon name="LayoutPanelTop" size={48} className="mb-3 opacity-50" />
              <p className="font-bold mb-1">Пустая страница</p>
              <p className="text-sm">Добавьте блоки слева</p>
            </div>
          ) : (
            blocks.map((b, i) => (
              <div
                key={i}
                onClick={() => !previewMode && setActiveIdx(i)}
                className={`relative group ${!previewMode ? "cursor-pointer" : ""} ${activeIdx === i && !previewMode ? "ring-4 ring-orange-400 ring-inset" : ""}`}
              >
                <BlockRenderer block={b} />
                {!previewMode && (
                  <div className="absolute top-2 right-2 flex gap-1 bg-white border border-gray-300 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); moveBlock(i, -1); }} className="w-7 h-7 hover:bg-gray-100 rounded-l-lg flex items-center justify-center" title="Вверх">
                      <Icon name="ChevronUp" size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); moveBlock(i, 1); }} className="w-7 h-7 hover:bg-gray-100 flex items-center justify-center" title="Вниз">
                      <Icon name="ChevronDown" size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); removeBlock(i); }} className="w-7 h-7 hover:bg-red-100 text-red-600 rounded-r-lg flex items-center justify-center" title="Удалить">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </main>

        {/* Правая колонка — свойства блока */}
        {!previewMode && active && activeIdx !== null && (
          <aside className="w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
              <Icon name="Settings" size={14} /> Настройки блока: {active.block_type}
            </h3>
            <BlockEditor
              block={active}
              onChange={(patch) => updateBlockData(activeIdx, patch)}
              onPickImage={(field) => setMediaPicker({ field, idx: activeIdx })}
            />
          </aside>
        )}
      </div>

      {mediaPicker && (
        <MediaPickerModal
          open={!!mediaPicker}
          mode="pick"
          onClose={() => setMediaPicker(null)}
          onPicked={(url) => {
            if (mediaPicker.idx !== undefined && mediaPicker.field) {
              const field = mediaPicker.field;
              if (field === "gallery_add") {
                const arr = [...(blocks[mediaPicker.idx].data.items || []), url];
                updateBlockData(mediaPicker.idx, { items: arr });
              } else {
                updateBlockData(mediaPicker.idx, { [field]: url });
              }
            }
            setMediaPicker(null);
          }}
        />
      )}
    </div>
  );
}

/* ───── Редактор свойств блока ───── */
function BlockEditor({
  block, onChange, onPickImage,
}: {
  block: PageBlock;
  onChange: (patch: Record<string, any>) => void;
  onPickImage: (field: string) => void;
}) {
  const d = block.data;
  const Field = ({ label, value, onChange: oc, type = "text", placeholder = "" }: any) => (
    <label className="block mb-3">
      <span className="block text-xs font-bold text-gray-500 mb-1">{label}</span>
      <input type={type} value={value || ""} onChange={e => oc(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:border-orange-500 outline-none" />
    </label>
  );

  const Textarea = ({ label, value, onChange: oc }: any) => (
    <label className="block mb-3">
      <span className="block text-xs font-bold text-gray-500 mb-1">{label}</span>
      <textarea value={value || ""} onChange={e => oc(e.target.value)} rows={4}
        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:border-orange-500 outline-none resize-y" />
    </label>
  );

  const PickButton = ({ field, label }: { field: string; label: string }) => (
    <button onClick={() => onPickImage(field)} className="w-full mb-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg text-sm flex items-center justify-center gap-1.5">
      <Icon name="Image" size={14} /> {label}
    </button>
  );

  switch (block.block_type) {
    case "hero":
      return (
        <>
          <Field label="Заголовок" value={d.title} onChange={(v: string) => onChange({ title: v })} />
          <Field label="Подзаголовок" value={d.subtitle} onChange={(v: string) => onChange({ subtitle: v })} />
          <Field label="Текст кнопки" value={d.button_text} onChange={(v: string) => onChange({ button_text: v })} />
          <Field label="Действие (lead / URL)" value={d.button_action} onChange={(v: string) => onChange({ button_action: v })} />
          <Field label="Цвет фона" type="color" value={d.bg_color} onChange={(v: string) => onChange({ bg_color: v })} />
          <Field label="Цвет текста" type="color" value={d.text_color} onChange={(v: string) => onChange({ text_color: v })} />
          <PickButton field="bg_image" label={d.bg_image ? "Сменить фон-фото" : "Выбрать фон-фото"} />
          {d.bg_image && (
            <button onClick={() => onChange({ bg_image: "" })} className="w-full text-xs text-red-500 hover:underline mb-3">Убрать фон-фото</button>
          )}
        </>
      );

    case "text":
      return (
        <>
          <Field label="Заголовок" value={d.title} onChange={(v: string) => onChange({ title: v })} />
          <Textarea label="HTML контент" value={d.content} onChange={(v: string) => onChange({ content: v })} />
        </>
      );

    case "image":
      return (
        <>
          <PickButton field="image" label={d.image ? "Сменить картинку" : "Выбрать картинку"} />
          {d.image && <img src={d.image} alt="" className="w-full rounded-lg mb-3" />}
          <Field label="Alt-текст" value={d.alt} onChange={(v: string) => onChange({ alt: v })} />
          <Field label="Подпись" value={d.caption} onChange={(v: string) => onChange({ caption: v })} />
        </>
      );

    case "cta":
      return (
        <>
          <Field label="Заголовок" value={d.title} onChange={(v: string) => onChange({ title: v })} />
          <Field label="Подзаголовок" value={d.subtitle} onChange={(v: string) => onChange({ subtitle: v })} />
          <Field label="Текст кнопки" value={d.button_text} onChange={(v: string) => onChange({ button_text: v })} />
          <Field label="Действие" value={d.button_action} onChange={(v: string) => onChange({ button_action: v })} />
        </>
      );

    case "features": {
      const items = (d.items || []) as any[];
      return (
        <>
          <Field label="Заголовок" value={d.title} onChange={(v: string) => onChange({ title: v })} />
          {items.map((it: any, i: number) => (
            <div key={i} className="bg-gray-50 rounded-lg p-2 mb-2 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-500">Карточка {i + 1}</span>
                <button onClick={() => onChange({ items: items.filter((_, ii) => ii !== i) })} className="text-red-500 text-xs hover:underline">×</button>
              </div>
              <input value={it.icon || ""} onChange={e => { const arr = [...items]; arr[i] = { ...arr[i], icon: e.target.value }; onChange({ items: arr }); }} placeholder="Icon" className="w-full text-xs border border-gray-300 rounded px-2 py-1 mb-1" />
              <input value={it.title || ""} onChange={e => { const arr = [...items]; arr[i] = { ...arr[i], title: e.target.value }; onChange({ items: arr }); }} placeholder="Заголовок" className="w-full text-xs border border-gray-300 rounded px-2 py-1 mb-1" />
              <input value={it.desc || ""} onChange={e => { const arr = [...items]; arr[i] = { ...arr[i], desc: e.target.value }; onChange({ items: arr }); }} placeholder="Описание" className="w-full text-xs border border-gray-300 rounded px-2 py-1" />
            </div>
          ))}
          <button onClick={() => onChange({ items: [...items, { icon: "Check", title: "Новая", desc: "Описание" }] })} className="w-full text-sm bg-gray-100 hover:bg-gray-200 py-1.5 rounded-lg">+ Карточка</button>
        </>
      );
    }

    case "gallery": {
      const items = (d.items || []) as string[];
      return (
        <>
          <Field label="Заголовок" value={d.title} onChange={(v: string) => onChange({ title: v })} />
          <div className="grid grid-cols-2 gap-1 mb-2">
            {items.map((src: string, i: number) => (
              <div key={i} className="relative">
                <img src={src} alt="" className="w-full aspect-square object-cover rounded" />
                <button onClick={() => onChange({ items: items.filter((_, ii) => ii !== i) })} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs">×</button>
              </div>
            ))}
          </div>
          <PickButton field="gallery_add" label="+ Добавить фото" />
        </>
      );
    }

    case "video":
      return (
        <>
          <Field label="URL видео (YouTube/Rutube embed)" value={d.url} onChange={(v: string) => onChange({ url: v })} placeholder="https://www.youtube.com/embed/..." />
          <Field label="Подпись" value={d.caption} onChange={(v: string) => onChange({ caption: v })} />
        </>
      );

    case "form":
      return (
        <>
          <Field label="Заголовок" value={d.title} onChange={(v: string) => onChange({ title: v })} />
          <Field label="Подзаголовок" value={d.subtitle} onChange={(v: string) => onChange({ subtitle: v })} />
          <Field label="Текст кнопки" value={d.button_text} onChange={(v: string) => onChange({ button_text: v })} />
        </>
      );

    case "spacer":
      return <Field label="Высота отступа, px" type="number" value={d.height} onChange={(v: string) => onChange({ height: +v })} />;

    default:
      return <div className="text-sm text-gray-500">Этот блок не имеет настроек</div>;
  }
}
