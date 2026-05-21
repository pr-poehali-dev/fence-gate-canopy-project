import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { erpMe, erpToken } from "@/lib/erp";
import { listDeals, Deal, DEAL_STATUSES, getStats, ErpStats } from "@/lib/erp-deals";
import { SERVICE_LABELS, ServiceKey } from "@/lib/erp/calc-engine";

export default function ErpDeals() {
  const nav = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<ErpStats | null>(null);
  const [q, setQ] = useState("");
  const [mine, setMine] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [r, s] = await Promise.all([listDeals(q, mine), getStats()]);
      setDeals(r.items || []);
      setStats(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!erpToken.get()) { nav("/erp/login"); return; }
    erpMe().then(load).catch(() => nav("/erp/login"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, mine]);

  // Группировка по статусу для Kanban
  const grouped = DEAL_STATUSES.map((st) => ({
    ...st,
    items: deals.filter((d) => d.status === st.value),
  }));

  return (
    <div className="min-h-screen" style={{ background: "var(--dark-bg)" }}>
      <header className="border-b border-[#1e2230] bg-[#0a0c10] sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/erp" className="text-white/50 hover:text-orange-400">
              <Icon name="ArrowLeft" size={18} />
            </Link>
            <Icon name="Briefcase" size={20} className="text-orange-400" />
            <div className="font-oswald font-bold text-white text-lg leading-none">Сделки</div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/erp/calc" className="btn-orange px-4 py-2 rounded-lg text-sm flex items-center gap-1.5">
              <Icon name="Calculator" size={15} /> Новая сделка
            </Link>
          </div>
        </div>
      </header>

      {/* Статистика */}
      {stats && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon="Briefcase" label="Всего сделок" value={stats.deals_total} />
          <StatCard icon="Activity" label="В работе" value={stats.deals_active} />
          <StatCard icon="TrendingUp" label="Пайплайн" value={stats.pipeline_value} money />
          <StatCard icon="Trophy" label="Выручка (выиграно)" value={stats.revenue_won} money green />
          <StatCard icon="Mail" label="Лидов" value={stats.leads_total} />
        </div>
      )}

      {/* Фильтры */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-4">
        <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-3 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по имени, телефону, номеру сделки…"
              className="w-full bg-[#0a0c10] border border-[#1e2230] rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:border-orange-500 outline-none"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-white/70">
            <input
              type="checkbox"
              checked={mine}
              onChange={(e) => setMine(e.target.checked)}
              className="accent-orange-500 w-4 h-4"
            />
            Только мои
          </label>
        </div>
      </div>

      {/* Kanban */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-8 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Icon name="Loader2" size={28} className="text-orange-400 animate-spin" />
          </div>
        ) : (
          <div className="flex gap-3 min-w-max pb-4">
            {grouped.map((col) => (
              <div key={col.value} className="w-72 flex-shrink-0">
                <div
                  className="rounded-xl px-3 py-2 mb-2 flex items-center justify-between"
                  style={{ background: col.color + "20" }}
                >
                  <div className="font-oswald font-semibold text-white text-sm" style={{ color: col.color }}>
                    {col.label}
                  </div>
                  <div className="text-white/55 text-xs">{col.items.length}</div>
                </div>
                <div className="space-y-2">
                  {col.items.length === 0 && (
                    <div className="bg-[#141720] border border-dashed border-[#1e2230] rounded-xl p-4 text-center text-white/30 text-xs">
                      пусто
                    </div>
                  )}
                  {col.items.map((d) => (
                    <Link
                      key={d.id}
                      to={`/erp/deals/${d.id}`}
                      className="block bg-[#141720] border border-[#1e2230] hover:border-orange-500/40 rounded-xl p-3 transition-colors"
                    >
                      <div className="flex items-baseline justify-between mb-1.5">
                        <div className="font-mono text-[10px] text-white/40">{d.deal_num}</div>
                        <div className="text-orange-400 font-oswald font-bold text-sm">
                          {d.total_rub.toLocaleString("ru-RU")} ₽
                        </div>
                      </div>
                      <div className="text-white text-sm font-medium leading-tight mb-1">
                        {d.client_name}
                      </div>
                      <div className="text-white/45 text-[11px]">
                        {d.client_phone}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-white/55">
                        <Icon name="Tag" size={10} className="text-orange-400/70" />
                        {SERVICE_LABELS[d.service_type as ServiceKey] || d.service_type}
                      </div>
                      {d.city && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-white/40">
                          <Icon name="MapPin" size={10} />
                          {d.city}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, money, green,
}: { icon: string; label: string; value: number; money?: boolean; green?: boolean }) {
  return (
    <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-4">
      <Icon name={icon} size={18} className={`mb-2 ${green ? "text-green-400" : "text-orange-400"}`} />
      <div className="text-white/40 text-[10px] uppercase tracking-wider">{label}</div>
      <div className={`font-oswald font-bold text-lg ${green ? "text-green-400" : "text-white"} mt-0.5`}>
        {money ? value.toLocaleString("ru-RU") + " ₽" : value}
      </div>
    </div>
  );
}
