import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  fetchLeads, resendLead, verifyAdmin, adminToken,
  LeadItem,
} from "@/lib/api";

type StatusFilter = "all" | "delivered" | "failed";

function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function fmtMoney(n: number) {
  return Math.round(n).toLocaleString("ru-RU") + " ₽";
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

export default function AdminLeads() {
  const nav = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<LeadItem[]>([]);
  const [stats, setStats] = useState({ total: 0, delivered: 0, sum_rub: 0 });

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [resendingId, setResendingId] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Заявки — Админ-панель СтальГрупп";
    verifyAdmin().then(ok => {
      setAuthed(ok);
      if (!ok) nav("/admin");
    });
  }, [nav]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetchLeads({ from, to, status });
      setItems(r.items);
      setStats(r.stats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (authed) load();   }, [authed, from, to, status]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(it =>
      (it.name || "").toLowerCase().includes(q) ||
      (it.phone || "").toLowerCase().includes(q) ||
      (it.city || "").toLowerCase().includes(q) ||
      (it.order_num || "").toLowerCase().includes(q) ||
      (it.object_type || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const doResend = async (id: number) => {
    setResendingId(id);
    try {
      const r = await resendLead(id);
      if (r?.ok) {
        await load();
      } else {
        alert("Не удалось отправить в MAX. Проверьте токен и chat_id в Настройках.");
      }
    } finally {
      setResendingId(null);
    }
  };

  const doLogout = () => { adminToken.clear(); nav("/admin"); };

  const setQuickRange = (days: number) => {
    setFrom(todayISO(-days));
    setTo(todayISO(0));
  };

  if (authed === null) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0d0f14] text-white/40">Проверка доступа...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0d0f14]">
      {/* TopBar */}
      <header className="border-b border-[#1e2230] bg-[#141720] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="ShieldCheck" size={16} className="text-gray-900" />
            </div>
            <div>
              <div className="font-oswald font-bold text-white text-sm">АДМИН-ПАНЕЛЬ</div>
              <div className="text-white/40 text-[10px]">СтальГрупп · ИП Балтаг А. В.</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-white/40 hover:text-orange-400 text-xs flex items-center gap-1">
              <Icon name="ChevronLeft" size={13} /> К админке
            </Link>
            <Link to="/" className="text-white/40 hover:text-orange-400 text-xs flex items-center gap-1">
              <Icon name="ExternalLink" size={13} /> Сайт
            </Link>
            <button onClick={doLogout}
              className="text-white/40 hover:text-red-400 text-xs flex items-center gap-1">
              <Icon name="LogOut" size={13} /> Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-oswald font-bold text-2xl text-white mb-1">Журнал заявок</h2>
            <p className="text-white/40 text-sm">Все заявки с калькулятора и форм, статусы доставки в MAX-бот.</p>
          </div>
          <button onClick={load}
            className="text-white/50 hover:text-orange-400 text-xs flex items-center gap-1.5 px-3 py-2 border border-[#1e2230] hover:border-orange-500/40 rounded-lg transition-all">
            <Icon name={loading ? "Loader" : "RotateCw"} size={13} className={loading ? "animate-spin" : ""} />
            Обновить
          </button>
        </div>

        {/* Сводка */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-4">
            <div className="text-white/40 text-xs mb-1">Всего заявок</div>
            <div className="font-oswald font-bold text-2xl text-white">{stats.total}</div>
          </div>
          <div className="bg-[#141720] border border-green-500/20 rounded-2xl p-4">
            <div className="text-green-400 text-xs mb-1 flex items-center gap-1">
              <Icon name="CheckCircle2" size={12} /> Доставлено в MAX
            </div>
            <div className="font-oswald font-bold text-2xl text-green-400">{stats.delivered}</div>
          </div>
          <div className="bg-[#141720] border border-red-500/20 rounded-2xl p-4">
            <div className="text-red-400 text-xs mb-1 flex items-center gap-1">
              <Icon name="XCircle" size={12} /> Не доставлено
            </div>
            <div className="font-oswald font-bold text-2xl text-red-400">{stats.total - stats.delivered}</div>
          </div>
          <div className="bg-[#141720] border border-orange-500/20 rounded-2xl p-4">
            <div className="text-orange-400 text-xs mb-1">Сумма выборки</div>
            <div className="font-oswald font-bold text-2xl text-orange-400">{fmtMoney(stats.sum_rub)}</div>
          </div>
        </div>

        {/* Фильтры */}
        <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-4 mb-5">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">С даты</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">По дату</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div className="flex gap-1.5 ml-1">
              {[
                { label: "Сегодня",  d: 0 },
                { label: "7 дней",   d: 7 },
                { label: "30 дней",  d: 30 },
              ].map(({ label, d }) => (
                <button key={label} onClick={() => setQuickRange(d)}
                  className="text-[11px] px-2.5 py-2 bg-[#0d1017] border border-[#1e2230] hover:border-orange-500/40 hover:text-orange-400 text-white/55 rounded-lg transition-all">
                  {label}
                </button>
              ))}
              <button onClick={() => { setFrom(""); setTo(""); }}
                className="text-[11px] px-2.5 py-2 bg-[#0d1017] border border-[#1e2230] hover:border-red-500/40 hover:text-red-400 text-white/40 rounded-lg transition-all">
                Сброс
              </button>
            </div>
            <div className="ml-auto flex items-end gap-3">
              <div>
                <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">Статус</label>
                <select value={status} onChange={e => setStatus(e.target.value as StatusFilter)}
                  className="bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                  <option value="all">Все</option>
                  <option value="delivered">Доставлено в MAX</option>
                  <option value="failed">Не доставлено</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">Поиск</label>
                <div className="relative">
                  <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Имя, телефон, город, №..."
                    className="bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none w-56" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Таблица */}
        <div className="bg-[#141720] border border-[#1e2230] rounded-2xl overflow-x-auto">
          {loading ? (
            <div className="text-center text-white/40 py-16">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-white/40 py-16">
              <Icon name="Inbox" size={32} className="mx-auto mb-3 text-white/20" />
              Заявок по выбранным фильтрам нет
            </div>
          ) : (
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="border-b border-[#1e2230] text-left">
                  <th className="py-3 px-3 text-white/40 text-[10px] uppercase tracking-wider">Дата</th>
                  <th className="py-3 px-3 text-white/40 text-[10px] uppercase tracking-wider">№ заказа</th>
                  <th className="py-3 px-3 text-white/40 text-[10px] uppercase tracking-wider">Клиент</th>
                  <th className="py-3 px-3 text-white/40 text-[10px] uppercase tracking-wider">Телефон</th>
                  <th className="py-3 px-3 text-white/40 text-[10px] uppercase tracking-wider">Город</th>
                  <th className="py-3 px-3 text-white/40 text-[10px] uppercase tracking-wider">Тип</th>
                  <th className="py-3 px-3 text-white/40 text-[10px] uppercase tracking-wider text-right">Сумма</th>
                  <th className="py-3 px-3 text-white/40 text-[10px] uppercase tracking-wider text-center">MAX</th>
                  <th className="py-3 px-3 text-white/40 text-[10px] uppercase tracking-wider text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(it => {
                  const telDigits = (it.phone || "").replace(/[^\d+]/g, "");
                  return (
                    <tr key={it.id} className="border-b border-[#1a1f2e] hover:bg-[#1a1f2e]/40 transition-colors">
                      <td className="py-3 px-3 text-white/60 text-xs whitespace-nowrap">{fmtDate(it.created_at)}</td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs text-orange-400/80">{it.order_num || "—"}</span>
                      </td>
                      <td className="py-3 px-3 text-white text-sm">{it.name || "—"}</td>
                      <td className="py-3 px-3">
                        {it.phone ? (
                          <a href={`tel:${telDigits}`} className="text-white/80 hover:text-orange-400 text-sm font-mono whitespace-nowrap">
                            {it.phone}
                          </a>
                        ) : <span className="text-white/30">—</span>}
                      </td>
                      <td className="py-3 px-3 text-white/60 text-sm">{it.city || "—"}</td>
                      <td className="py-3 px-3 text-white/60 text-xs">{it.object_type || "—"}</td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-oswald font-bold text-orange-400">{fmtMoney(it.total_rub)}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {it.delivered_to_max ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-green-500/15 text-green-400 font-bold uppercase tracking-wider">
                            <Icon name="Check" size={11} /> OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-red-500/15 text-red-400 font-bold uppercase tracking-wider">
                            <Icon name="X" size={11} /> Нет
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {telDigits && (
                            <a href={`tel:${telDigits}`}
                              className="px-2 py-1.5 bg-[#1a1f2e] hover:bg-orange-500/10 text-white/50 hover:text-orange-400 rounded-lg transition-all"
                              title="Позвонить">
                              <Icon name="Phone" size={13} />
                            </a>
                          )}
                          <button onClick={() => doResend(it.id)}
                            disabled={resendingId === it.id}
                            className="px-3 py-1.5 bg-[#2563eb]/15 hover:bg-[#2563eb]/25 text-[#3b82f6] rounded-lg text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-1.5"
                            title="Повторно отправить в MAX">
                            <Icon name={resendingId === it.id ? "Loader" : "Send"} size={12}
                              className={resendingId === it.id ? "animate-spin" : ""} />
                            {resendingId === it.id ? "..." : "В MAX"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
