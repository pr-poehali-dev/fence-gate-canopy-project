import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { adminToken, verifyAdmin, fetchCalcPricing, saveCalcPricing, type CalcPriceItem } from "@/lib/api";

const CATEGORY_LABELS: Record<string, string> = {
  post: "Столбы (₽/шт)",
  lag: "Лаги (₽/м)",
  proflist: "Профлист (₽/м²)",
  shtak: "Штакетник (₽/м)",
  coating: "Покрытие (наценка)",
  found: "Фундамент",
  gate: "Ворота",
  wicket: "Калитки (₽/шт)",
  canopy_type: "Навес — кровля (₽/м²)",
  canopy_cover: "Навес — покрытие (₽/м²)",
  fill: "Наполнение (₽/м²)",
  param: "Параметры расчёта",
};

const CATEGORY_ORDER = [
  "proflist", "shtak", "fill", "coating", "post", "lag",
  "found", "gate", "wicket", "canopy_type", "canopy_cover", "param",
];

export default function AdminCalcPrices() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CalcPriceItem[]>([]);
  const [dirty, setDirty] = useState<Record<number, Partial<CalcPriceItem>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Прайс калькулятора — Админка";
    if (!adminToken.get()) { navigate("/admin"); return; }
    verifyAdmin().then(ok => { if (!ok) navigate("/admin"); });
  }, [navigate]);

  const load = async () => {
    setLoading(true);
    try { setItems(await fetchCalcPricing()); setDirty({}); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const g: Record<string, CalcPriceItem[]> = {};
    for (const it of items) (g[it.category] ||= []).push(it);
    return g;
  }, [items]);

  const change = (id: number, field: "price" | "price2" | "coef", value: string) => {
    const num = parseFloat(value.replace(",", ".")) || 0;
    setDirty(d => ({ ...d, [id]: { ...(d[id] || {}), [field]: num } }));
  };

  const valueOf = (it: CalcPriceItem, field: "price" | "price2" | "coef"): number =>
    dirty[it.id]?.[field] ?? it[field];

  const save = async () => {
    const changed = Object.entries(dirty).map(([id, v]) => ({ id: Number(id), ...v }));
    if (!changed.length) { toast.info("Нет изменений"); return; }
    setSaving(true);
    try {
      await saveCalcPricing(changed);
      toast.success(`Сохранено: ${changed.length} позиций. Цены обновятся на сайте и в боте.`);
      window.dispatchEvent(new Event("cms:invalidate"));
      await load();
    } catch {
      toast.error("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const sortedCats = useMemo(
    () => Object.keys(grouped).sort(
      (a, b) => (CATEGORY_ORDER.indexOf(a) + 1 || 99) - (CATEGORY_ORDER.indexOf(b) + 1 || 99)
    ),
    [grouped]
  );

  const dirtyCount = Object.keys(dirty).length;

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <header className="sticky top-0 z-30 bg-[#141720] border-b border-[#1e2230]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-white/50 hover:text-orange-400">
              <Icon name="ArrowLeft" size={20} />
            </Link>
            <div>
              <h1 className="font-oswald text-xl font-bold">Прайс калькулятора</h1>
              <p className="text-white/45 text-xs">Единые цены для сайта и бота</p>
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving || dirtyCount === 0}
            className="btn-orange px-4 py-2 rounded-xl text-sm disabled:opacity-40 flex items-center gap-1.5"
          >
            <Icon name={saving ? "Loader" : "Save"} size={15} className={saving ? "animate-spin" : ""} />
            Сохранить{dirtyCount > 0 ? ` (${dirtyCount})` : ""}
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-5 text-sm text-amber-200/90 flex items-start gap-2">
          <Icon name="Info" size={16} className="mt-0.5 flex-shrink-0" />
          Измените цену — после сохранения она применится сразу и в калькуляторе сайта, и в боте MAX.
        </div>

        {loading && <div className="text-white/40 text-sm">Загрузка…</div>}

        {!loading && sortedCats.map(cat => (
          <div key={cat} className="mb-6">
            <h2 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-2">
              {CATEGORY_LABELS[cat] || cat}
            </h2>
            <div className="bg-[#141720] border border-[#1e2230] rounded-xl overflow-hidden">
              {grouped[cat].map((it, i) => {
                const isFound = cat === "found";
                const isGate = cat === "gate";
                const isCoating = cat === "coating";
                return (
                  <div
                    key={it.id}
                    className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? "border-t border-[#1e2230]" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/90 truncate">{it.label}</div>
                      {it.descr && <div className="text-[11px] text-white/35 truncate">{it.descr}</div>}
                    </div>
                    {isCoating ? (
                      <label className="flex items-center gap-1.5">
                        <span className="text-[10px] text-white/40">наценка</span>
                        <input
                          type="number" step="0.01"
                          value={valueOf(it, "coef")}
                          onChange={e => change(it.id, "coef", e.target.value)}
                          className="w-20 bg-[#0a0c10] border border-[#1e2230] focus:border-orange-500 rounded-lg px-2 py-1.5 text-sm text-white text-right outline-none"
                        />
                        <span className="text-[10px] text-white/40">×</span>
                      </label>
                    ) : (
                      <>
                        <label className="flex items-center gap-1.5">
                          {(isFound || isGate) && <span className="text-[10px] text-white/40">{isFound ? "за столб" : "база"}</span>}
                          <input
                            type="number"
                            value={valueOf(it, "price")}
                            onChange={e => change(it.id, "price", e.target.value)}
                            className="w-24 bg-[#0a0c10] border border-[#1e2230] focus:border-orange-500 rounded-lg px-2 py-1.5 text-sm text-white text-right outline-none"
                          />
                        </label>
                        {(isFound || isGate) && (
                          <label className="flex items-center gap-1.5">
                            <span className="text-[10px] text-white/40">{isFound ? "за метр" : "за метр"}</span>
                            <input
                              type="number"
                              value={valueOf(it, "price2")}
                              onChange={e => change(it.id, "price2", e.target.value)}
                              className="w-24 bg-[#0a0c10] border border-[#1e2230] focus:border-orange-500 rounded-lg px-2 py-1.5 text-sm text-white text-right outline-none"
                            />
                          </label>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}