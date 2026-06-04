import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import {
  adminToken, verifyAdmin,
  fetchOrders, fetchOrdersStats, upsertOrder, setOrderStatus, deleteOrder,
  type Order, type OrderStatus, type OrdersStats,
} from "@/lib/api";
import ManagerCalculator, { type ManagerCalcResult } from "@/components/admin/ManagerCalculator";
import { generateKpPDF } from "@/lib/kpPdf";
import { useCompany } from "@/hooks/useCompany";

interface EstimateLine { label: string; qty?: string; value: number; unitPrice?: number; }

const STATUSES: { id: OrderStatus; label: string; color: string }[] = [
  { id: "new",        label: "Новый",       color: "#3b82f6" },
  { id: "measure",    label: "Замер",       color: "#06b6d4" },
  { id: "contract",   label: "Договор",     color: "#a855f7" },
  { id: "production", label: "Производство", color: "#eab308" },
  { id: "montage",    label: "Монтаж",      color: "#f97316" },
  { id: "done",       label: "Выполнен",    color: "#22c55e" },
  { id: "archive",    label: "Архив",       color: "#6b7280" },
  { id: "cancelled",  label: "Отменён",     color: "#ef4444" },
];

const EMPTY: Partial<Order> = {
  order_num: "", client_name: "", client_phone: "", address: "", object_type: "",
  source: "manual", status: "new", montage_date: null, total_rub: 0,
  materials_cost: 0, fot: 0, profit: 0, paid_rub: 0, comment: "",
};

const fmtRub = (n: number) => Math.round(n || 0).toLocaleString("ru-RU") + " ₽";

export default function AdminCrm() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrdersStats | null>(null);
  const [filter, setFilter] = useState<string>("active");
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState<Partial<Order> | null>(null);
  const [saving, setSaving] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  const applyCalc = (r: ManagerCalcResult) => {
    setEdit(e => ({
      ...(e || {}),
      object_type: r.object_type,
      total_rub: r.total,
      materials_cost: r.materials,
      fot: r.fot,
      profit: r.profit,
      items_json: r.lines,
    }));
    setCalcOpen(false);
  };

  useEffect(() => {
    document.title = "Кабинет менеджера — СтальГрупп";
    if (!adminToken.get()) { navigate("/admin"); return; }
    verifyAdmin().then(ok => { if (!ok) navigate("/admin"); });
  }, [navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, s] = await Promise.all([fetchOrders("all"), fetchOrdersStats()]);
      setOrders(o);
      setStats(s);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = orders.filter(o => {
    if (filter === "active") return !["archive", "cancelled"].includes(o.status);
    if (filter === "all") return true;
    return o.status === filter;
  });

  const save = async () => {
    if (!edit) return;
    setSaving(true);
    try {
      // backend upsert ждёт поле items для сохранения сметы в items_json
      await upsertOrder({ ...edit, items: edit.items_json } as Partial<Order> & { items?: unknown[] });
      toast.success("Заказ сохранён");
      setEdit(null);
      await load();
    } finally { setSaving(false); }
  };

  const changeStatus = async (o: Order, status: OrderStatus) => {
    await setOrderStatus(o.id, status);
    setOrders(arr => arr.map(x => x.id === o.id ? { ...x, status } : x));
    fetchOrdersStats().then(setStats);
  };

  const remove = async (o: Order) => {
    if (!confirm(`Удалить заказ ${o.order_num || o.client_name}?`)) return;
    await deleteOrder(o.id);
    setOrders(arr => arr.filter(x => x.id !== o.id));
    fetchOrdersStats().then(setStats);
  };

  const statusOf = (id: string) => STATUSES.find(s => s.id === id);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <header className="sticky top-0 z-30 bg-[#0a0c10]/95 backdrop-blur border-b border-[#1e2230]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-white/50 hover:text-orange-400"><Icon name="ArrowLeft" size={20} /></Link>
            <div>
              <h1 className="font-oswald text-2xl font-bold">Кабинет менеджера</h1>
              <p className="text-white/50 text-xs">Заказы, статусы, экономика и выгода</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/board" className="text-xs px-3 py-2 border border-orange-500/30 text-orange-400 rounded-lg hover:border-orange-500/60 flex items-center gap-1.5">
              <Icon name="CalendarDays" size={14} /> Табло
            </Link>
            <button onClick={() => setEdit({ ...EMPTY })} className="btn-orange px-4 py-2 rounded-lg text-sm flex items-center gap-1.5">
              <Icon name="Plus" size={15} /> Новый заказ
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Сводка */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard icon="Briefcase" label="Активных заказов" value={String(stats.active_count)} />
            <StatCard icon="Wallet" label="Сумма в работе" value={fmtRub(stats.active_sum)} />
            <StatCard icon="TrendingUp" label="Прогноз выгоды" value={fmtRub(stats.active_profit)} accent />
            <StatCard icon="CheckCircle2" label="Выполнено" value={String(stats.by_status?.done?.count || 0)} />
          </div>
        )}

        {/* Фильтры */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[{ id: "active", label: "В работе" }, { id: "all", label: "Все" }, ...STATUSES].map(f => {
            const cnt = f.id === "active"
              ? orders.filter(o => !["archive", "cancelled"].includes(o.status)).length
              : f.id === "all" ? orders.length
              : orders.filter(o => o.status === f.id).length;
            return (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                  filter === f.id ? "bg-orange-500 text-gray-900 font-medium" : "bg-[#141720] text-white/60 hover:text-white border border-[#1e2230]"
                }`}>
                {f.label}<span className="opacity-60">{cnt}</span>
              </button>
            );
          })}
          <button onClick={load} className="ml-auto text-white/40 hover:text-orange-400 px-2" title="Обновить">
            <Icon name={loading ? "Loader" : "RefreshCw"} size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Таблица заказов */}
        <div className="bg-[#141720] border border-[#1e2230] rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-[#1e2230] text-white/40 text-xs uppercase">
                <th className="text-left py-3 px-4">Клиент</th>
                <th className="text-left py-3 px-4">Объект</th>
                <th className="text-left py-3 px-4">Статус</th>
                <th className="text-left py-3 px-4">Монтаж</th>
                <th className="text-right py-3 px-4">Сумма</th>
                <th className="text-right py-3 px-4">Выгода</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-white/35">Нет заказов в этой категории</td></tr>
              )}
              {visible.map(o => {
                const st = statusOf(o.status);
                return (
                  <tr key={o.id} className="border-b border-[#1e2230] hover:bg-white/5">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{o.client_name || "—"}</div>
                      <div className="text-white/40 text-xs">{o.client_phone} · {o.source}</div>
                    </td>
                    <td className="py-3 px-4 text-white/70">{o.object_type || "—"}</td>
                    <td className="py-3 px-4">
                      <select value={o.status} onChange={e => changeStatus(o, e.target.value as OrderStatus)}
                        className="bg-[#0a0c10] border border-[#1e2230] rounded-lg text-xs px-2 py-1 focus:outline-none focus:border-orange-500"
                        style={{ color: st?.color }}>
                        {STATUSES.map(s => <option key={s.id} value={s.id} style={{ color: "#fff" }}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-white/60 text-xs">{o.montage_date || "—"}</td>
                    <td className="py-3 px-4 text-right font-oswald font-bold text-white">{fmtRub(o.total_rub)}</td>
                    <td className="py-3 px-4 text-right font-oswald text-amber-400">{fmtRub(o.profit)}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button onClick={() => setEdit(o)} className="text-white/40 hover:text-orange-400 p-1" title="Изменить"><Icon name="Pencil" size={14} /></button>
                      <button onClick={() => remove(o)} className="text-white/40 hover:text-red-400 p-1" title="Удалить"><Icon name="Trash2" size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* Модалка редактирования */}
      {edit && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto" onClick={() => setEdit(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-[#141720] border border-[#1e2230] rounded-2xl w-full max-w-2xl p-4 sm:p-6 my-2 sm:my-auto max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-oswald font-bold text-xl">{edit.id ? "Редактировать заказ" : "Новый заказ"}</h3>
              <button onClick={() => setEdit(null)} className="text-white/40 hover:text-white"><Icon name="X" size={20} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Имя клиента" value={edit.client_name || ""} onChange={v => setEdit({ ...edit, client_name: v })} />
              <Field label="Телефон" value={edit.client_phone || ""} onChange={v => setEdit({ ...edit, client_phone: v })} />
              <Field label="Адрес объекта" value={edit.address || ""} onChange={v => setEdit({ ...edit, address: v })} full />
              <Field label="Тип объекта" value={edit.object_type || ""} onChange={v => setEdit({ ...edit, object_type: v })} />
              <div>
                <label className="block text-xs text-white/50 mb-1">Источник</label>
                <select value={edit.source || "manual"} onChange={e => setEdit({ ...edit, source: e.target.value })}
                  className="w-full bg-[#0a0c10] border border-[#1e2230] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
                  <option value="manual">Вручную</option>
                  <option value="сайт">Сайт</option>
                  <option value="звонок">Звонок</option>
                  <option value="сарафан">Сарафан</option>
                  <option value="авито">Авито</option>
                  <option value="другое">Другое</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Статус</label>
                <select value={edit.status || "new"} onChange={e => setEdit({ ...edit, status: e.target.value as OrderStatus })}
                  className="w-full bg-[#0a0c10] border border-[#1e2230] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
                  {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Дата монтажа</label>
                <input type="date" value={edit.montage_date || ""} onChange={e => setEdit({ ...edit, montage_date: e.target.value || null })}
                  className="w-full bg-[#0a0c10] border border-[#1e2230] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <NumField label="Сумма заказа, ₽" value={edit.total_rub || 0} onChange={v => setEdit({ ...edit, total_rub: v })} />
              <NumField label="Себестоимость, ₽" value={edit.materials_cost || 0} onChange={v => setEdit({ ...edit, materials_cost: v })} />
              <NumField label="ФОТ бригады, ₽" value={edit.fot || 0} onChange={v => setEdit({ ...edit, fot: v })} />
              <NumField label="Выгода, ₽" value={edit.profit || 0} onChange={v => setEdit({ ...edit, profit: v })} />
              <NumField label="Оплачено, ₽" value={edit.paid_rub || 0} onChange={v => setEdit({ ...edit, paid_rub: v })} />
              <div className="sm:col-span-2">
                <label className="block text-xs text-white/50 mb-1">Комментарий</label>
                <textarea value={edit.comment || ""} onChange={e => setEdit({ ...edit, comment: e.target.value })} rows={2}
                  className="w-full bg-[#0a0c10] border border-[#1e2230] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 resize-none" />
              </div>
            </div>

            <SavedEstimate
              lines={(edit.items_json as EstimateLine[]) || []}
              orderNum={edit.order_num || ""}
              clientName={edit.client_name || ""}
              objectType={edit.object_type || ""}
            />
            <div className="flex flex-wrap justify-between items-center gap-2 mt-5">
              <button onClick={() => setCalcOpen(true)}
                className="px-4 py-2 rounded-lg text-sm border border-orange-500/40 text-orange-400 hover:border-orange-500/70 flex items-center gap-1.5">
                <Icon name="Calculator" size={15} /> Детальный расчёт
              </button>
              <div className="flex gap-2">
                <button onClick={() => setEdit(null)} className="px-4 py-2 rounded-lg text-sm border border-[#1e2230] text-white/60 hover:text-white">Отмена</button>
                <button onClick={save} disabled={saving} className="btn-orange px-5 py-2 rounded-lg text-sm disabled:opacity-60 flex items-center gap-1.5">
                  <Icon name={saving ? "Loader" : "Save"} size={15} className={saving ? "animate-spin" : ""} /> Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Детальный калькулятор менеджера */}
      {calcOpen && edit && (
        <ManagerCalculator
          orderNum={edit.order_num || `СГ-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`}
          clientName={edit.client_name || ""}
          clientPhone={edit.client_phone || ""}
          address={edit.address || ""}
          onApply={applyCalc}
          onClose={() => setCalcOpen(false)}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-4">
      <Icon name={icon} size={18} className={accent ? "text-amber-400 mb-2" : "text-orange-400 mb-2"} />
      <div className={`font-oswald font-bold text-xl ${accent ? "text-amber-400" : "text-white"}`}>{value}</div>
      <div className="text-white/40 text-xs mt-0.5">{label}</div>
    </div>
  );
}

function Field({ label, value, onChange, full }: { label: string; value: string; onChange: (v: string) => void; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="block text-xs text-white/50 mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-[#0a0c10] border border-[#1e2230] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-1">{label}</label>
      <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-[#0a0c10] border border-[#1e2230] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
    </div>
  );
}

const fmtR = (n: number) => Math.round(n || 0).toLocaleString("ru-RU") + " ₽";

function SavedEstimate({ lines, orderNum, clientName, objectType }: {
  lines: EstimateLine[]; orderNum: string; clientName: string; objectType: string;
}) {
  const company = useCompany();
  const [busy, setBusy] = useState(false);
  if (!lines || lines.length === 0) return null;
  const total = lines.reduce((s, l) => s + (l.value || 0), 0);

  const makePdf = async () => {
    setBusy(true);
    try {
      await generateKpPDF(
        orderNum || `СГ-${Date.now().toString().slice(-5)}`,
        lines.map(l => ({ label: l.label, value: l.value, qty: l.qty })),
        total,
        {
          "Объект": objectType || "—",
          ...(clientName ? { "Клиент": clientName } : {}),
        },
        {
          company: {
            brand: company.name, legalName: company.legalName, shortName: company.legalName,
            inn: company.inn, ogrnip: company.ogrn, legalAddress: company.legalAddress,
            phone: company.phone, email: company.email, site: company.site,
          },
        }
      );
      toast.success("КП сформировано");
    } catch {
      toast.error("Не удалось сформировать КП");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 bg-[#0a0c10] border border-[#1e2230] rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
          <Icon name="ReceiptText" size={13} /> Сохранённая смета ({lines.length})
        </span>
        <button onClick={makePdf} disabled={busy}
          className="text-[11px] text-white/70 hover:text-white disabled:opacity-50 flex items-center gap-1">
          <Icon name={busy ? "Loader" : "FileDown"} size={12} className={busy ? "animate-spin" : ""} /> Скачать КП
        </button>
      </div>
      <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
        {lines.map((l, i) => (
          <div key={i} className={`flex items-center gap-2 text-xs ${l.value === 0 ? "text-white/40" : "text-white/80"}`}>
            <span className="flex-1 min-w-0 truncate">{l.label}</span>
            {l.qty && <span className="text-white/35 text-[11px] flex-shrink-0">{l.qty}</span>}
            <span className="w-20 text-right flex-shrink-0">{l.value ? fmtR(l.value) : "—"}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1e2230]">
        <span className="text-xs text-white/50">Итого</span>
        <span className="font-oswald font-bold text-orange-400">{fmtR(total)}</span>
      </div>
    </div>
  );
}