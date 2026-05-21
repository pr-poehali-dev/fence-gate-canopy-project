import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  ErpMe, ErpFunnel, ErpLead, ErpEmployee, ErpStage,
  erpMe, erpLogout, erpFunnel, erpBoard, erpEmployees, erpUpdateLead, erpAddNote, erpLeadEvents,
} from "@/lib/erp";
import ErpProfileModal from "@/components/ErpProfileModal";
import { toast } from "sonner";

export default function ErpDashboard() {
  const navigate = useNavigate();
  const [me, setMe] = useState<ErpMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState<ErpFunnel | null>(null);
  const [leads, setLeads] = useState<ErpLead[]>([]);
  const [employees, setEmployees] = useState<ErpEmployee[]>([]);
  const [onlyMine, setOnlyMine] = useState(false);
  const [search, setSearch] = useState("");
  const [activeLead, setActiveLead] = useState<ErpLead | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const m = await erpMe();
      if (!m) { navigate("/erp/login"); return; }
      setMe(m);
      const f = await erpFunnel("sales");
      setFunnel(f);
      const items = await erpBoard("sales", false);
      setLeads(items);
      if (m.role.is_owner || ["ceo", "production", "manager"].includes(m.role.slug)) {
        const emps = await erpEmployees();
        setEmployees(emps);
      }
      setLoading(false);
    })();
  }, [navigate]);

  const reloadBoard = async () => {
    const items = await erpBoard("sales", onlyMine);
    setLeads(items);
  };

  useEffect(() => { if (me) reloadBoard(); }, [onlyMine]); // eslint-disable-line

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(l =>
      [l.name, l.phone, l.order_num, l.city, l.address, l.object_type]
        .some(s => (s || "").toLowerCase().includes(q))
    );
  }, [leads, search]);

  const byStage = useMemo(() => {
    const m = new Map<number, ErpLead[]>();
    if (!funnel) return m;
    for (const s of funnel.stages) m.set(s.id, []);
    for (const l of filtered) {
      if (l.stage_id && m.has(l.stage_id)) m.get(l.stage_id)!.push(l);
      else if (funnel.stages[0]) m.get(funnel.stages[0].id)!.push(l);
    }
    return m;
  }, [filtered, funnel]);

  const handleDrop = async (leadId: number, stageId: number) => {
    setLeads(arr => arr.map(l => l.id === leadId ? { ...l, stage_id: stageId } : l));
    try {
      await erpUpdateLead(leadId, { stage_id: stageId });
      toast.success("Стадия обновлена");
    } catch {
      toast.error("Не удалось обновить");
      reloadBoard();
    }
  };

  const handleLogout = async () => {
    await erpLogout();
    navigate("/erp/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]">
        <Icon name="Loader" size={32} className="animate-spin text-orange-400" />
      </div>
    );
  }
  if (!me || !funnel) return null;

  const stats = {
    total: leads.length,
    won: funnel.stages.filter(s => s.is_won).reduce(
      (sum, s) => sum + (byStage.get(s.id)?.reduce((x, l) => x + l.total_rub, 0) || 0), 0
    ),
    open: leads.filter(l => {
      const st = funnel.stages.find(s => s.id === l.stage_id);
      return !st?.is_won && !st?.is_lost;
    }).length,
  };

  return (
    <div className="min-h-screen bg-[#0d0f14] flex flex-col">
      {/* Header */}
      <header className="bg-[#0a0c11] border-b border-[#1e2230] px-4 py-3 sticky top-0 z-20">
        <div className="max-w-[1800px] mx-auto flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md shadow-orange-500/30">
              <Icon name="Building2" size={18} className="text-white" />
            </div>
            <div>
              <div className="font-oswald font-bold text-white text-sm tracking-wider">ERP — {me.role.title}</div>
              <div className="text-white/40 text-[11px]">СтальГрупп · {me.full_name}</div>
            </div>
          </div>

          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по имени, телефону, № заявки..."
                className="w-full bg-[#141720] border border-[#1e2230] focus:border-orange-500/50 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none" />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs text-white/55 flex items-center gap-1.5 cursor-pointer bg-[#141720] border border-[#1e2230] hover:border-orange-500/30 px-3 py-2 rounded-lg">
              <input type="checkbox" checked={onlyMine} onChange={e => setOnlyMine(e.target.checked)}
                className="w-3.5 h-3.5 accent-orange-500" />
              Только мои
            </label>

            <Link to="/erp/deals" className="text-xs px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:border-blue-500/50 rounded-lg transition-all flex items-center gap-1.5">
              <Icon name="Briefcase" size={13} /> Сделки
            </Link>
            <Link to="/erp/calc" className="text-xs px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/30 hover:border-green-500/50 rounded-lg transition-all flex items-center gap-1.5">
              <Icon name="Calculator" size={13} /> Калькулятор
            </Link>

            {(me.role.is_owner) && (
              <Link to="/erp/employees" className="text-xs px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:border-purple-500/50 rounded-lg transition-all flex items-center gap-1.5">
                <Icon name="Users" size={13} /> Сотрудники
              </Link>
            )}
            <Link to="/admin" className="text-xs px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:border-orange-500/50 rounded-lg transition-all flex items-center gap-1.5">
              <Icon name="Settings" size={13} /> Админ
            </Link>
            <button onClick={() => setProfileOpen(true)}
              className="text-xs px-3 py-2 bg-[#141720] hover:bg-orange-500/10 hover:text-orange-300 text-white/70 border border-[#1e2230] hover:border-orange-500/40 rounded-lg transition-all flex items-center gap-1.5"
              title="Сменить логин и пароль">
              <Icon name="UserCog" size={13} /> Профиль
            </button>
            <button onClick={handleLogout}
              className="text-xs px-3 py-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-1.5">
              <Icon name="LogOut" size={13} /> Выйти
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-[1800px] mx-auto mt-3 flex items-center gap-3 flex-wrap text-xs">
          <span className="px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
            Всего: <b>{stats.total}</b>
          </span>
          <span className="px-3 py-1.5 rounded-md bg-orange-500/10 text-orange-300 border border-orange-500/20">
            В работе: <b>{stats.open}</b>
          </span>
          <span className="px-3 py-1.5 rounded-md bg-green-500/10 text-green-300 border border-green-500/20">
            Выручка по выигранным: <b>{Math.round(stats.won).toLocaleString("ru-RU")} ₽</b>
          </span>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-3 min-w-max pb-4">
          {funnel.stages.map(stage => (
            <KanbanColumn key={stage.id}
              stage={stage}
              leads={byStage.get(stage.id) || []}
              employees={employees}
              onCardClick={setActiveLead}
              onDrop={(leadId) => handleDrop(leadId, stage.id)} />
          ))}
        </div>
      </main>

      {activeLead && (
        <LeadDetail lead={activeLead}
          stages={funnel.stages}
          employees={employees}
          canAssign={me.role.is_owner || ["ceo", "production", "manager"].includes(me.role.slug)}
          onClose={() => setActiveLead(null)}
          onChange={async () => { setActiveLead(null); await reloadBoard(); }} />
      )}

      {profileOpen && (
        <ErpProfileModal me={me}
          onClose={() => setProfileOpen(false)}
          onSaved={async () => {
            const fresh = await erpMe();
            if (fresh) setMe(fresh);
            setProfileOpen(false);
          }} />
      )}
    </div>
  );
}

// ─────────── Kanban Column ───────────
interface ColProps {
  stage: ErpStage;
  leads: ErpLead[];
  employees: ErpEmployee[];
  onCardClick: (l: ErpLead) => void;
  onDrop: (leadId: number) => void;
}

function KanbanColumn({ stage, leads, employees, onCardClick, onDrop }: ColProps) {
  const [over, setOver] = useState(false);
  const sum = leads.reduce((s, l) => s + l.total_rub, 0);
  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault(); setOver(false);
        const id = Number(e.dataTransfer.getData("lead"));
        if (id) onDrop(id);
      }}
      className={`w-72 flex-shrink-0 rounded-2xl border ${
        over ? "border-orange-400 bg-orange-500/5" : "border-[#1e2230] bg-[#141720]"
      } transition-colors`}>
      <div className="px-3 py-2.5 border-b border-[#1e2230] flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: stage.color }} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm truncate">{stage.title}</div>
          <div className="text-[10px] text-white/40">
            {leads.length} · {Math.round(sum).toLocaleString("ru-RU")} ₽
          </div>
        </div>
      </div>
      <div className="p-2 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto">
        {leads.map(l => <LeadCard key={l.id} lead={l} employees={employees} onClick={() => onCardClick(l)} />)}
        {leads.length === 0 && (
          <div className="text-[11px] text-white/25 text-center py-6">— пусто —</div>
        )}
      </div>
    </div>
  );
}

// ─────────── Lead Card ───────────
function LeadCard({ lead, employees, onClick }: { lead: ErpLead; employees: ErpEmployee[]; onClick: () => void }) {
  const emp = employees.find(e => e.id === lead.assigned_to);
  const initials = lead.name?.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData("lead", String(lead.id))}
      onClick={onClick}
      className="bg-[#0d1017] border border-[#1e2230] hover:border-orange-500/40 rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-lg hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="text-white font-semibold text-sm truncate">{lead.name || "Без имени"}</div>
        <div className="w-7 h-7 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
          {initials || "?"}
        </div>
      </div>
      <div className="text-[11px] text-white/50 font-mono mb-2">{lead.order_num}</div>
      <div className="space-y-1 text-[11px] text-white/60">
        {lead.phone && <div className="flex items-center gap-1.5"><Icon name="Phone" size={10} /> {lead.phone}</div>}
        {lead.city && <div className="flex items-center gap-1.5 truncate"><Icon name="MapPin" size={10} /> {lead.city}</div>}
      </div>
      <div className="mt-2 pt-2 border-t border-[#1e2230] flex items-center justify-between text-[11px]">
        <span className="text-orange-400 font-semibold">
          {lead.total_rub > 0 ? `${Math.round(lead.total_rub).toLocaleString("ru-RU")} ₽` : ""}
        </span>
        {emp && (
          <span className="text-white/40 flex items-center gap-1 truncate" title={emp.full_name}>
            <Icon name="User" size={10} /> <span className="truncate max-w-[80px]">{emp.full_name}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────── Lead Detail Drawer ───────────
function LeadDetail({ lead, stages, employees, canAssign, onClose, onChange }: {
  lead: ErpLead;
  stages: ErpStage[];
  employees: ErpEmployee[];
  canAssign: boolean;
  onClose: () => void;
  onChange: () => void;
}) {
  const [stageId, setStageId] = useState<number>(lead.stage_id || stages[0]?.id);
  const [assigned, setAssigned] = useState<number | "">(lead.assigned_to || "");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState(lead.erp_notes || "");
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<{ id: number; type: string; payload: Record<string, unknown>; created_at: string | null; author: string | null }[]>([]);

  useEffect(() => {
    erpLeadEvents(lead.id).then(setEvents);
  }, [lead.id]);

  const save = async () => {
    setSaving(true);
    try {
      await erpUpdateLead(lead.id, {
        stage_id: stageId,
        assigned_to: assigned === "" ? null : Number(assigned),
        erp_notes: notes,
      });
      if (note.trim()) {
        await erpAddNote(lead.id, note.trim());
      }
      toast.success("Сохранено");
      onChange();
    } catch {
      toast.error("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}
      style={{ background: "rgba(8,10,14,0.7)", backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()}
        className="w-full max-w-xl h-full bg-[#0d0f14] border-l border-[#1e2230] overflow-y-auto">
        <div className="sticky top-0 bg-[#0a0c11] border-b border-[#1e2230] px-5 py-3 flex items-center justify-between z-10">
          <div>
            <div className="font-oswald font-bold text-white text-lg">{lead.name}</div>
            <div className="text-white/40 text-xs font-mono">{lead.order_num}</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 hover:bg-white/5 rounded-lg flex items-center justify-center text-white/55 hover:text-white">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Контакты */}
          <div className="bg-[#141720] border border-[#1e2230] rounded-xl p-4 space-y-2 text-sm">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Контакт</div>
            {lead.phone && <div className="flex items-center gap-2 text-white"><Icon name="Phone" size={14} className="text-orange-400" /> <a href={`tel:${lead.phone}`} className="hover:text-orange-400">{lead.phone}</a></div>}
            {lead.city && <div className="flex items-center gap-2 text-white/80"><Icon name="MapPin" size={14} className="text-orange-400" /> {lead.city}</div>}
            {lead.address && <div className="flex items-center gap-2 text-white/80"><Icon name="Home" size={14} className="text-orange-400" /> {lead.address}</div>}
            {lead.object_type && <div className="flex items-center gap-2 text-white/80"><Icon name="Wrench" size={14} className="text-orange-400" /> {lead.object_type}</div>}
            {lead.total_rub > 0 && <div className="flex items-center gap-2 text-white"><Icon name="Banknote" size={14} className="text-green-400" /> <b>{Math.round(lead.total_rub).toLocaleString("ru-RU")} ₽</b></div>}
          </div>

          {/* Стадия и ответственный */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-white/55 uppercase tracking-wider mb-2">Стадия</label>
              <select value={stageId} onChange={e => setStageId(Number(e.target.value))}
                className="w-full bg-[#141720] border border-[#1e2230] focus:border-orange-500/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none">
                {stages.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-white/55 uppercase tracking-wider mb-2">Ответственный</label>
              {canAssign ? (
                <select value={assigned} onChange={e => setAssigned(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-[#141720] border border-[#1e2230] focus:border-orange-500/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none">
                  <option value="">— не назначен —</option>
                  {employees.filter(e => e.is_active).map(e =>
                    <option key={e.id} value={e.id}>{e.full_name} ({e.role_title})</option>
                  )}
                </select>
              ) : (
                <div className="text-white/55 text-sm px-3 py-2.5 bg-[#141720] border border-[#1e2230] rounded-lg">
                  {employees.find(e => e.id === lead.assigned_to)?.full_name || "не назначен"}
                </div>
              )}
            </div>
          </div>

          {/* Заметки */}
          <div>
            <label className="block text-xs font-bold text-white/55 uppercase tracking-wider mb-2">Заметки по заявке</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Договорённости, особенности заказа..."
              className="w-full bg-[#141720] border border-[#1e2230] focus:border-orange-500/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none resize-none" />
          </div>

          {/* Новый комментарий */}
          <div>
            <label className="block text-xs font-bold text-white/55 uppercase tracking-wider mb-2">Новый комментарий</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="Звонил, договорились о замере на завтра..."
              className="w-full bg-[#141720] border border-[#1e2230] focus:border-orange-500/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none resize-none" />
          </div>

          <button onClick={save} disabled={saving}
            className="btn-orange w-full py-3 rounded-lg disabled:opacity-60">
            <span className="flex items-center justify-center gap-2 text-sm">
              <Icon name={saving ? "Loader" : "Save"} size={15} className={saving ? "animate-spin" : ""} />
              {saving ? "Сохраняем..." : "Сохранить изменения"}
            </span>
          </button>

          {/* История */}
          {events.length > 0 && (
            <div>
              <div className="text-xs font-bold text-white/55 uppercase tracking-wider mb-2">История</div>
              <div className="space-y-2">
                {events.map(ev => (
                  <div key={ev.id} className="bg-[#141720] border border-[#1e2230] rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between text-white/40 mb-1">
                      <span>{ev.author || "система"}</span>
                      <span>{ev.created_at ? new Date(ev.created_at).toLocaleString("ru-RU") : ""}</span>
                    </div>
                    <div className="text-white/80">
                      {ev.type === "note" && (ev.payload as { text: string }).text}
                      {ev.type === "stage_changed" && "Стадия изменена"}
                      {ev.type === "assigned" && "Назначен ответственный"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}