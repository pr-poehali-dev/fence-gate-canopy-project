import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { API, adminToken, fetchPrices, PriceItem } from "@/lib/api";

interface EditForm {
  id: number | null;
  slug: string;
  title: string;
  price: number;
  unit: string;
  category: string;
}

const CATEGORIES: { slug: string; label: string; icon: string }[] = [
  { slug: "fence",      label: "Заборы",            icon: "Fence" },
  { slug: "gates",      label: "Ворота и калитки",  icon: "DoorOpen" },
  { slug: "canopy",     label: "Навесы и беседки",  icon: "Home" },
  { slug: "foundation", label: "Фундаменты",        icon: "Layers" },
  { slug: "posts",      label: "Столбы",            icon: "Building" },
  { slug: "landscape",  label: "Благоустройство",   icon: "Trees" },
  { slug: "other",      label: "Прочее",            icon: "Package" },
];

const EMPTY_FORM: EditForm = {
  id: null,
  slug: "",
  title: "",
  price: 0,
  unit: "руб",
  category: "fence",
};

async function apiUpsert(payload: EditForm) {
  const r = await fetch(API.prices, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": adminToken.get(),
    },
    body: JSON.stringify({
      action: "upsert",
      id: payload.id ?? undefined,
      slug: payload.slug,
      title: payload.title,
      price: payload.price,
      unit: payload.unit,
      category: payload.category,
    }),
  });
  if (!r.ok) throw new Error(`status ${r.status}`);
  return r.json();
}

async function apiDelete(id: number) {
  const r = await fetch(`${API.prices}?id=${id}`, {
    method: "DELETE",
    headers: { "X-Auth-Token": adminToken.get() },
  });
  if (!r.ok) throw new Error(`status ${r.status}`);
  return r.json();
}

function categoryLabel(slug: string): string {
  return CATEGORIES.find(c => c.slug === slug)?.label || slug;
}

function categoryIcon(slug: string): string {
  return CATEGORIES.find(c => c.slug === slug)?.icon || "Tag";
}

export default function AdminPrices() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingPriceId, setSavingPriceId] = useState<number | null>(null);

  // Защита: без токена — на /admin
  useEffect(() => {
    if (!adminToken.get()) {
      navigate("/admin", { replace: true });
      return;
    }
    document.title = "Цены услуг — Админка";
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reload() {
    setLoading(true);
    try {
      const list = await fetchPrices();
      setItems(list);
    } catch {
      toast.error("Не удалось загрузить цены");
    } finally {
      setLoading(false);
    }
  }

  // Группировка по категориям. Категории, отсутствующие в списке выше, идут в "other".
  const grouped = useMemo(() => {
    const map: Record<string, PriceItem[]> = {};
    for (const c of CATEGORIES) map[c.slug] = [];
    for (const it of items) {
      const key = CATEGORIES.some(c => c.slug === it.category) ? it.category : "other";
      (map[key] ||= []).push(it);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.title.localeCompare(b.title, "ru"));
    }
    return map;
  }, [items]);

  function openCreate(category: string) {
    setEditing({ ...EMPTY_FORM, category });
  }

  function openEdit(it: PriceItem) {
    setEditing({
      id: it.id,
      slug: it.slug,
      title: it.title,
      price: it.price,
      unit: it.unit || "руб",
      category: it.category,
    });
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.title.trim()) {
      toast.error("Укажите название");
      return;
    }
    if (!editing.slug.trim()) {
      toast.error("Укажите slug (английскими буквами, без пробелов)");
      return;
    }
    setSaving(true);
    try {
      await apiUpsert({
        ...editing,
        title: editing.title.trim(),
        slug: editing.slug.trim(),
        unit: (editing.unit || "руб").trim(),
        category: editing.category.trim() || "other",
      });
      toast.success("Сохранено");
      setEditing(null);
      await reload();
    } catch {
      toast.error("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(it: PriceItem) {
    if (!confirm(`Удалить «${it.title}»?`)) return;
    try {
      await apiDelete(it.id);
      toast.success("Удалено");
      await reload();
    } catch {
      toast.error("Не удалось удалить");
    }
  }

  // Inline-сохранение цены при blur
  async function saveInlinePrice(it: PriceItem, newPriceRaw: string) {
    const newPrice = parseFloat(newPriceRaw.replace(",", "."));
    if (!isFinite(newPrice) || newPrice < 0) {
      toast.error("Некорректная цена");
      // Откатить визуально
      setItems(arr => arr.map(x => x.id === it.id ? { ...x, price: it.price } : x));
      return;
    }
    if (newPrice === it.price) return;
    setSavingPriceId(it.id);
    try {
      await apiUpsert({
        id: it.id,
        slug: it.slug,
        title: it.title,
        price: newPrice,
        unit: it.unit,
        category: it.category,
      });
      setItems(arr => arr.map(x => x.id === it.id ? { ...x, price: newPrice } : x));
      toast.success("Цена обновлена");
    } catch {
      toast.error("Не удалось сохранить цену");
      setItems(arr => arr.map(x => x.id === it.id ? { ...x, price: it.price } : x));
    } finally {
      setSavingPriceId(null);
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
              💰 Цены услуг
            </div>
          </div>
          <div className="text-[11px] text-white/40">
            Всего позиций: {items.length}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center text-white/40 py-12">Загрузка...</div>
        ) : (
          <div className="space-y-6">
            {CATEGORIES.map(cat => {
              const list = grouped[cat.slug] || [];
              return (
                <section
                  key={cat.slug}
                  className="bg-[#141720] border border-[#1e2230] rounded-2xl overflow-hidden"
                >
                  <header className="flex items-center gap-2 px-5 py-3 border-b border-[#1e2230] bg-[#0f1218]">
                    <Icon name={cat.icon} size={16} className="text-orange-400" />
                    <h2 className="font-oswald font-bold text-white">
                      {cat.label}
                    </h2>
                    <span className="text-[11px] text-white/40">· {list.length}</span>
                  </header>

                  {list.length === 0 ? (
                    <div className="px-5 py-4 text-xs text-white/40">
                      В категории пока нет позиций
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[640px]">
                        <thead>
                          <tr className="border-b border-[#1e2230]">
                            <th className="text-left py-2 px-5 text-white/40 text-[11px] uppercase">Название</th>
                            <th className="text-left py-2 px-3 text-white/40 text-[11px] uppercase">Slug</th>
                            <th className="text-right py-2 px-3 text-white/40 text-[11px] uppercase">Цена</th>
                            <th className="text-left py-2 px-3 text-white/40 text-[11px] uppercase">Ед.</th>
                            <th className="py-2 px-5 w-24"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map(it => (
                            <tr key={it.id} className="border-b border-[#1a1f2e] hover:bg-[#1a1f2e]/40">
                              <td className="py-2 px-5 text-white">{it.title}</td>
                              <td className="py-2 px-3 text-white/40 text-xs font-mono">{it.slug}</td>
                              <td className="py-2 px-3 text-right">
                                <InlinePrice
                                  initial={it.price}
                                  busy={savingPriceId === it.id}
                                  onCommit={v => saveInlinePrice(it, v)}
                                />
                              </td>
                              <td className="py-2 px-3 text-white/60 text-xs">{it.unit}</td>
                              <td className="py-2 px-5">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => openEdit(it)}
                                    className="w-7 h-7 rounded-md hover:bg-[#1e2230] flex items-center justify-center text-white/60 hover:text-orange-400"
                                    title="Редактировать"
                                  >
                                    <Icon name="Pencil" size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(it)}
                                    className="w-7 h-7 rounded-md hover:bg-[#1e2230] flex items-center justify-center text-white/60 hover:text-red-400"
                                    title="Удалить"
                                  >
                                    <Icon name="Trash2" size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="px-5 py-3 border-t border-[#1e2230] bg-[#0f1218]">
                    <button
                      onClick={() => openCreate(cat.slug)}
                      className="text-orange-400/90 hover:text-orange-400 text-xs flex items-center gap-1.5 px-3 py-1.5 border border-orange-500/30 hover:border-orange-500/60 rounded-md transition-all"
                    >
                      <Icon name="Plus" size={12} /> Добавить услугу в «{cat.label}»
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Модалка */}
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
                {editing.id ? "Редактирование услуги" : "Новая услуга"}
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
              <Field label="Название" hint="Например: Забор из профнастила">
                <input
                  type="text"
                  value={editing.title}
                  onChange={e => setEditing({ ...editing, title: e.target.value })}
                  className="input-dark"
                  autoFocus
                />
              </Field>

              <Field label="Slug" hint="Английскими буквами, без пробелов. Должен быть уникальным.">
                <input
                  type="text"
                  value={editing.slug}
                  onChange={e => setEditing({ ...editing, slug: e.target.value })}
                  className="input-dark"
                  placeholder="zabor-profnastil"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Цена" hint="Только число (₽)">
                  <input
                    type="number"
                    value={editing.price}
                    step="50"
                    onChange={e => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })}
                    className="input-dark"
                  />
                </Field>
                <Field label="Ед. измерения" hint="м.п., м², шт., руб">
                  <input
                    type="text"
                    value={editing.unit}
                    onChange={e => setEditing({ ...editing, unit: e.target.value })}
                    className="input-dark"
                    placeholder="м.п."
                  />
                </Field>
              </div>

              <Field label="Категория">
                <select
                  value={editing.category}
                  onChange={e => setEditing({ ...editing, category: e.target.value })}
                  className="input-dark"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.slug} value={c.slug}>{c.label}</option>
                  ))}
                </select>
              </Field>
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

function InlinePrice({
  initial,
  busy,
  onCommit,
}: {
  initial: number;
  busy: boolean;
  onCommit: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(initial));

  useEffect(() => {
    setValue(String(initial));
  }, [initial]);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-white hover:text-orange-400 px-2 py-1 rounded hover:bg-[#1e2230] inline-flex items-center gap-1.5"
        title="Кликните, чтобы изменить"
      >
        {busy && <Icon name="Loader" size={12} className="animate-spin text-orange-400" />}
        {initial.toLocaleString("ru-RU")} ₽
      </button>
    );
  }

  return (
    <input
      type="number"
      step="50"
      value={value}
      autoFocus
      onChange={e => setValue(e.target.value)}
      onBlur={() => {
        setEditing(false);
        onCommit(value);
      }}
      onKeyDown={e => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setValue(String(initial));
          setEditing(false);
        }
      }}
      className="bg-[#1a1f2e] border border-orange-500/50 rounded px-2 py-1 text-white text-right w-28 focus:outline-none"
    />
  );
}
