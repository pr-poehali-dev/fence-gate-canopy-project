import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { API, adminToken } from "@/lib/api";
import { invalidateMenu } from "@/hooks/useSiteMenu";

interface FlatItem {
  id: number;
  parent_id: number | null;
  label: string;
  href: string;
  icon: string;
  badge: string;
  description: string;
  position: number;
  is_hidden: boolean;
}

interface EditForm {
  id: number | null;
  parent_id: number | null;
  label: string;
  href: string;
  icon: string;
  badge: string;
  description: string;
  position: number;
  is_hidden: boolean;
}

const EMPTY_FORM: EditForm = {
  id: null,
  parent_id: null,
  label: "",
  href: "",
  icon: "",
  badge: "",
  description: "",
  position: 0,
  is_hidden: false,
};

async function apiGetFlat(): Promise<FlatItem[]> {
  const r = await fetch(`${API.menu}?flat=1`, {
    headers: { "X-Auth-Token": adminToken.get() },
  });
  if (!r.ok) throw new Error(`status ${r.status}`);
  const j = await r.json();
  return Array.isArray(j?.items) ? j.items : [];
}

async function apiUpsert(payload: Partial<FlatItem> & { action?: string }) {
  const r = await fetch(API.menu, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": adminToken.get(),
    },
    body: JSON.stringify({ action: "upsert", ...payload }),
  });
  if (!r.ok) throw new Error(`status ${r.status}`);
  return r.json();
}

async function apiReorder(items: { id: number; position: number; parent_id: number | null }[]) {
  const r = await fetch(API.menu, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": adminToken.get(),
    },
    body: JSON.stringify({ action: "reorder", items }),
  });
  if (!r.ok) throw new Error(`status ${r.status}`);
  return r.json();
}

async function apiToggleVisibility(id: number, hide: boolean) {
  const r = await fetch(API.menu, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": adminToken.get(),
    },
    body: JSON.stringify({ action: hide ? "hide" : "show", id }),
  });
  if (!r.ok) throw new Error(`status ${r.status}`);
  return r.json();
}

async function apiDelete(id: number) {
  const r = await fetch(`${API.menu}?id=${id}`, {
    method: "DELETE",
    headers: { "X-Auth-Token": adminToken.get() },
  });
  if (!r.ok) throw new Error(`status ${r.status}`);
  return r.json();
}

export default function AdminMenu() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FlatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [editing, setEditing] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  // Защита: без токена — на /admin
  useEffect(() => {
    if (!adminToken.get()) {
      navigate("/admin", { replace: true });
      return;
    }
    document.title = "Меню сайта — Админка";
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reload() {
    setLoading(true);
    try {
      const flat = await apiGetFlat();
      setItems(flat);
      // По умолчанию раскрываем все категории
      setExpanded(prev => {
        const next = { ...prev };
        for (const it of flat) {
          if (it.parent_id === null && next[it.id] === undefined) next[it.id] = true;
        }
        return next;
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      if (msg.includes("401")) {
        toast.error("Сессия истекла");
        navigate("/admin", { replace: true });
        return;
      }
      toast.error("Не удалось загрузить меню");
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(
    () => items.filter(i => i.parent_id === null).sort((a, b) => a.position - b.position || a.id - b.id),
    [items]
  );

  const childrenOf = (parentId: number) =>
    items
      .filter(i => i.parent_id === parentId)
      .sort((a, b) => a.position - b.position || a.id - b.id);

  function openCreateCategory() {
    const maxPos = categories.reduce((m, c) => Math.max(m, c.position), 0);
    setEditing({ ...EMPTY_FORM, parent_id: null, position: maxPos + 1 });
  }

  function openCreateChild(parentId: number) {
    const siblings = childrenOf(parentId);
    const maxPos = siblings.reduce((m, c) => Math.max(m, c.position), 0);
    setEditing({ ...EMPTY_FORM, parent_id: parentId, position: maxPos + 1 });
  }

  function openEdit(it: FlatItem) {
    setEditing({
      id: it.id,
      parent_id: it.parent_id,
      label: it.label,
      href: it.href || "",
      icon: it.icon || "",
      badge: it.badge || "",
      description: it.description || "",
      position: it.position,
      is_hidden: it.is_hidden,
    });
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.label.trim()) {
      toast.error("Укажите название");
      return;
    }
    setSaving(true);
    try {
      await apiUpsert({
        id: editing.id ?? undefined,
        parent_id: editing.parent_id ?? undefined,
        label: editing.label.trim(),
        href: editing.href.trim(),
        icon: editing.icon.trim(),
        badge: editing.badge.trim(),
        description: editing.description.trim(),
        position: editing.position,
        is_hidden: editing.is_hidden,
      });
      toast.success("Сохранено");
      setEditing(null);
      invalidateMenu();
      await reload();
    } catch {
      toast.error("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleHide(it: FlatItem) {
    try {
      await apiToggleVisibility(it.id, !it.is_hidden);
      toast.success(it.is_hidden ? "Показан" : "Скрыт");
      invalidateMenu();
      await reload();
    } catch {
      toast.error("Не удалось изменить видимость");
    }
  }

  async function handleDelete(it: FlatItem) {
    const hasChildren = items.some(i => i.parent_id === it.id);
    const msg = hasChildren
      ? `Удалить «${it.label}» вместе с дочерними пунктами?`
      : `Удалить пункт «${it.label}»?`;
    if (!confirm(msg)) return;
    try {
      await apiDelete(it.id);
      toast.success("Удалено");
      invalidateMenu();
      await reload();
    } catch {
      toast.error("Не удалось удалить");
    }
  }

  async function handleMove(it: FlatItem, dir: -1 | 1) {
    const siblings = it.parent_id === null
      ? categories
      : childrenOf(it.parent_id);
    const idx = siblings.findIndex(s => s.id === it.id);
    if (idx < 0) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const a = siblings[idx];
    const b = siblings[swapIdx];
    try {
      await apiReorder([
        { id: a.id, position: b.position, parent_id: a.parent_id },
        { id: b.id, position: a.position, parent_id: b.parent_id },
      ]);
      invalidateMenu();
      await reload();
    } catch {
      toast.error("Не удалось изменить порядок");
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      {/* Шапка */}
      <header className="border-b border-[#1e2230] bg-[#141720] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="text-white/60 hover:text-orange-400 text-xs flex items-center gap-1 px-2.5 py-1 border border-[#1e2230] hover:border-orange-500/40 rounded-lg transition-all"
            >
              <Icon name="ArrowLeft" size={13} /> Назад в админку
            </Link>
            <div className="font-oswald font-bold text-white text-sm">
              📋 Меню сайта
            </div>
          </div>
          <button
            onClick={openCreateCategory}
            className="btn-orange px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
          >
            <Icon name="Plus" size={13} /> Добавить категорию
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center text-white/40 py-12">Загрузка...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16">
            <Icon name="ListTree" size={36} className="text-white/20 mx-auto mb-3" />
            <div className="text-white/60 mb-4">Меню пока пустое</div>
            <button onClick={openCreateCategory} className="btn-orange px-5 py-2 rounded-lg text-sm">
              + Добавить категорию
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map(cat => {
              const kids = childrenOf(cat.id);
              const isOpen = expanded[cat.id];
              return (
                <div
                  key={cat.id}
                  className={`bg-[#141720] border rounded-2xl overflow-hidden transition-colors ${
                    cat.is_hidden ? "border-[#2a2030] opacity-60" : "border-[#1e2230]"
                  }`}
                >
                  {/* Категория */}
                  <div className="flex items-center gap-2 px-4 py-3">
                    <button
                      onClick={() => setExpanded(e => ({ ...e, [cat.id]: !isOpen }))}
                      className="w-7 h-7 rounded-md hover:bg-[#1e2230] flex items-center justify-center text-white/60"
                      title={isOpen ? "Свернуть" : "Раскрыть"}
                    >
                      <Icon name={isOpen ? "ChevronDown" : "ChevronRight"} size={16} />
                    </button>

                    {cat.icon && (
                      <Icon name={cat.icon} size={18} className="text-orange-400 shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-oswald font-bold text-white truncate">
                          {cat.label}
                        </span>
                        {cat.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300 uppercase tracking-wider">
                            {cat.badge}
                          </span>
                        )}
                        <span className="text-[10px] text-white/40">
                          {kids.length} пункт{kids.length === 1 ? "" : kids.length > 1 && kids.length < 5 ? "а" : "ов"}
                        </span>
                        {cat.is_hidden && (
                          <span className="text-[10px] text-white/40 uppercase">скрыта</span>
                        )}
                      </div>
                      {cat.href && (
                        <div className="text-[11px] text-white/40 truncate">{cat.href}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMove(cat, -1)}
                        className="w-7 h-7 rounded-md hover:bg-[#1e2230] flex items-center justify-center text-white/50 hover:text-white"
                        title="Выше"
                      >
                        <Icon name="ChevronUp" size={14} />
                      </button>
                      <button
                        onClick={() => handleMove(cat, 1)}
                        className="w-7 h-7 rounded-md hover:bg-[#1e2230] flex items-center justify-center text-white/50 hover:text-white"
                        title="Ниже"
                      >
                        <Icon name="ChevronDown" size={14} />
                      </button>
                      <button
                        onClick={() => openCreateChild(cat.id)}
                        className="text-orange-400/90 hover:text-orange-400 text-xs flex items-center gap-1 px-2 py-1 border border-orange-500/30 hover:border-orange-500/60 rounded-md transition-all"
                        title="Добавить пункт"
                      >
                        <Icon name="Plus" size={12} /> Пункт
                      </button>
                      <button
                        onClick={() => openEdit(cat)}
                        className="w-7 h-7 rounded-md hover:bg-[#1e2230] flex items-center justify-center text-white/60 hover:text-orange-400"
                        title="Редактировать"
                      >
                        <Icon name="Pencil" size={13} />
                      </button>
                      <button
                        onClick={() => handleToggleHide(cat)}
                        className="w-7 h-7 rounded-md hover:bg-[#1e2230] flex items-center justify-center text-white/60 hover:text-yellow-400"
                        title={cat.is_hidden ? "Показать" : "Скрыть"}
                      >
                        <Icon name={cat.is_hidden ? "Eye" : "EyeOff"} size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="w-7 h-7 rounded-md hover:bg-[#1e2230] flex items-center justify-center text-white/60 hover:text-red-400"
                        title="Удалить"
                      >
                        <Icon name="Trash2" size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Дети */}
                  {isOpen && (
                    <div className="border-t border-[#1e2230] bg-[#0f1218]">
                      {kids.length === 0 ? (
                        <div className="px-4 py-4 text-xs text-white/40">
                          В категории пока нет пунктов
                        </div>
                      ) : (
                        <ul className="divide-y divide-[#1a1f2e]">
                          {kids.map(kid => (
                            <li
                              key={kid.id}
                              className={`flex items-center gap-2 px-4 py-2.5 hover:bg-[#1a1f2e]/40 ${
                                kid.is_hidden ? "opacity-50" : ""
                              }`}
                            >
                              <Icon name="CornerDownRight" size={13} className="text-white/30 shrink-0" />
                              {kid.icon && (
                                <Icon name={kid.icon} size={14} className="text-orange-400/80 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-white text-sm truncate">{kid.label}</span>
                                  {kid.badge && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300 uppercase tracking-wider">
                                      {kid.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-white/40 truncate">
                                  {kid.href && <span>{kid.href}</span>}
                                  {kid.description && (
                                    <span className="text-white/30">· {kid.description}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleMove(kid, -1)}
                                  className="w-7 h-7 rounded-md hover:bg-[#1e2230] flex items-center justify-center text-white/50 hover:text-white"
                                  title="Выше"
                                >
                                  <Icon name="ChevronUp" size={13} />
                                </button>
                                <button
                                  onClick={() => handleMove(kid, 1)}
                                  className="w-7 h-7 rounded-md hover:bg-[#1e2230] flex items-center justify-center text-white/50 hover:text-white"
                                  title="Ниже"
                                >
                                  <Icon name="ChevronDown" size={13} />
                                </button>
                                <button
                                  onClick={() => openEdit(kid)}
                                  className="w-7 h-7 rounded-md hover:bg-[#1e2230] flex items-center justify-center text-white/60 hover:text-orange-400"
                                  title="Редактировать"
                                >
                                  <Icon name="Pencil" size={13} />
                                </button>
                                <button
                                  onClick={() => handleToggleHide(kid)}
                                  className="w-7 h-7 rounded-md hover:bg-[#1e2230] flex items-center justify-center text-white/60 hover:text-yellow-400"
                                  title={kid.is_hidden ? "Показать" : "Скрыть"}
                                >
                                  <Icon name={kid.is_hidden ? "Eye" : "EyeOff"} size={13} />
                                </button>
                                <button
                                  onClick={() => handleDelete(kid)}
                                  className="w-7 h-7 rounded-md hover:bg-[#1e2230] flex items-center justify-center text-white/60 hover:text-red-400"
                                  title="Удалить"
                                >
                                  <Icon name="Trash2" size={13} />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Модалка редактирования */}
      {editing && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => !saving && setEditing(null)}
        >
          <div
            className="bg-[#141720] border border-[#1e2230] rounded-2xl w-full max-w-lg p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-oswald font-bold text-white text-lg">
                {editing.id ? "Редактирование" : editing.parent_id ? "Новый пункт" : "Новая категория"}
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="text-white/40 hover:text-white"
                disabled={saving}
              >
                <Icon name="X" size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <Field label="Название" hint="Например: Заборы">
                <input
                  type="text"
                  value={editing.label}
                  onChange={e => setEditing({ ...editing, label: e.target.value })}
                  className="input-dark"
                  autoFocus
                />
              </Field>

              <Field
                label="Ссылка (href)"
                hint='Можно с якорем: /services/fundamenty#tab-betonirovanie. Оставьте пустым для категории-обёртки.'
              >
                <input
                  type="text"
                  value={editing.href}
                  onChange={e => setEditing({ ...editing, href: e.target.value })}
                  className="input-dark"
                  placeholder="/services/profnastil"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Иконка" hint="Имя из lucide: Layers, Building, DoorOpen, Fence, Home, Trees, FileText…">
                  <input
                    type="text"
                    value={editing.icon}
                    onChange={e => setEditing({ ...editing, icon: e.target.value })}
                    className="input-dark"
                    placeholder="Layers"
                  />
                </Field>
                <Field label="Бейдж" hint="Короткий лейбл: «Премиум», «Хит»">
                  <input
                    type="text"
                    value={editing.badge}
                    onChange={e => setEditing({ ...editing, badge: e.target.value })}
                    className="input-dark"
                    placeholder="Премиум"
                  />
                </Field>
              </div>

              <Field label="Описание" hint="Подпись под пунктом в шапке">
                <input
                  type="text"
                  value={editing.description}
                  onChange={e => setEditing({ ...editing, description: e.target.value })}
                  className="input-dark"
                  placeholder="От 1 450 ₽/м.п."
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Порядок (position)" hint="Меньше — выше">
                  <input
                    type="number"
                    value={editing.position}
                    onChange={e => setEditing({ ...editing, position: parseInt(e.target.value, 10) || 0 })}
                    className="input-dark"
                  />
                </Field>
                <label className="flex items-center gap-2 mt-7 text-sm text-white/80 select-none">
                  <input
                    type="checkbox"
                    checked={editing.is_hidden}
                    onChange={e => setEditing({ ...editing, is_hidden: e.target.checked })}
                    className="accent-orange-500"
                  />
                  Скрыт на сайте
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setEditing(null)}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white border border-[#1e2230]"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-orange px-5 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} />
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Локальные стили для инпутов */}
      <style>{`
        .input-dark {
          width: 100%;
          background: #1a1f2e;
          border: 1px solid #1e2230;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          color: #fff;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-dark:focus { border-color: rgba(249, 115, 22, 0.5); }
        .input-dark::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-white/50 mb-1">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-white/30 mt-1">{hint}</div>}
    </label>
  );
}
