import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  adminToken, verifyAdmin, fetchOrdersBoard,
  type BoardDay, type Order,
} from "@/lib/api";

const fmtRub = (n: number) => Math.round(n || 0).toLocaleString("ru-RU") + " ₽";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  new: { label: "Новый", color: "#3b82f6" },
  measure: { label: "Замер", color: "#06b6d4" },
  contract: { label: "Договор", color: "#a855f7" },
  production: { label: "Производство", color: "#eab308" },
  montage: { label: "Монтаж", color: "#f97316" },
  done: { label: "Выполнен", color: "#22c55e" },
};

function dayTitle(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  const wd = d.toLocaleDateString("ru-RU", { weekday: "long" });
  const dm = d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long" });
  if (diff === 0) return `Сегодня · ${dm}`;
  if (diff === 1) return `Завтра · ${dm}`;
  if (diff === 2) return `Послезавтра · ${dm}`;
  return `${wd[0].toUpperCase()}${wd.slice(1)} · ${dm}`;
}

export default function AdminBoard() {
  const navigate = useNavigate();
  const [days, setDays] = useState<BoardDay[]>([]);
  const [noDate, setNoDate] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Табло заказов — СтальГрупп";
    if (!adminToken.get()) { navigate("/admin"); return; }
    verifyAdmin().then(ok => { if (!ok) navigate("/admin"); });
  }, [navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchOrdersBoard();
      setDays(d.days || []);
      setNoDate(d.no_date || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  // автообновление каждые 30 сек — табло «в реальном времени»
  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <header className="sticky top-0 z-30 bg-[#0a0c10]/95 backdrop-blur border-b border-[#1e2230]">
        <div className="max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin/crm" className="text-white/50 hover:text-orange-400"><Icon name="ArrowLeft" size={20} /></Link>
            <div>
              <h1 className="font-oswald text-2xl font-bold">Табло монтажей · 7 дней</h1>
              <p className="text-white/50 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> обновляется автоматически
              </p>
            </div>
          </div>
          <button onClick={load} className="text-white/40 hover:text-orange-400 px-2" title="Обновить">
            <Icon name={loading ? "Loader" : "RefreshCw"} size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {days.map(day => {
            const sum = day.orders.reduce((a, o) => a + (o.total_rub || 0), 0);
            return (
              <div key={day.date} className="bg-[#141720] border border-[#1e2230] rounded-2xl flex flex-col min-h-[200px]">
                <div className="p-3 border-b border-[#1e2230]">
                  <div className="font-oswald font-bold text-sm text-white leading-tight">{dayTitle(day.date)}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs ${day.count > 0 ? "text-orange-400" : "text-white/30"}`}>
                      {day.count} монтаж{day.count === 1 ? "" : day.count >= 2 && day.count <= 4 ? "а" : "ей"}
                    </span>
                    {sum > 0 && <span className="text-[11px] text-white/40">{fmtRub(sum)}</span>}
                  </div>
                </div>
                <div className="p-2 space-y-2 flex-1">
                  {day.orders.length === 0 && (
                    <div className="text-center text-white/20 text-xs py-6">Свободно</div>
                  )}
                  {day.orders.map(o => {
                    const st = STATUS_LABEL[o.status] || { label: o.status, color: "#888" };
                    return (
                      <div key={o.id} className="bg-[#0a0c10] border border-[#1e2230] rounded-xl p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: st.color }} />
                          <span className="text-[10px] uppercase tracking-wider" style={{ color: st.color }}>{st.label}</span>
                        </div>
                        <div className="text-sm text-white font-medium truncate">{o.client_name || "—"}</div>
                        <div className="text-xs text-white/45 truncate">{o.object_type}</div>
                        {o.address && <div className="text-[11px] text-white/35 truncate flex items-center gap-1 mt-0.5"><Icon name="MapPin" size={10} /> {o.address}</div>}
                        <div className="text-xs text-orange-400 font-oswald font-bold mt-1">{fmtRub(o.total_rub)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Без даты монтажа */}
        {noDate.length > 0 && (
          <div className="mt-6">
            <h2 className="font-oswald font-bold text-lg text-white/70 mb-3 flex items-center gap-2">
              <Icon name="CalendarOff" size={18} className="text-white/40" />
              Без даты монтажа ({noDate.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {noDate.map(o => {
                const st = STATUS_LABEL[o.status] || { label: o.status, color: "#888" };
                return (
                  <div key={o.id} className="bg-[#141720] border border-[#1e2230] rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: st.color }} />
                      <span className="text-[10px] uppercase" style={{ color: st.color }}>{st.label}</span>
                    </div>
                    <div className="text-sm text-white font-medium truncate">{o.client_name || "—"}</div>
                    <div className="text-xs text-white/45 truncate">{o.object_type}</div>
                    <div className="text-xs text-orange-400 font-oswald font-bold mt-1">{fmtRub(o.total_rub)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
