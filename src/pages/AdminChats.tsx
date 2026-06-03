import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  adminToken, verifyAdmin,
  fetchBotDialogs, fetchBotMessages, replyToBotDialog,
  type BotDialog, type BotMessage,
} from "@/lib/api";

export default function AdminChats() {
  const navigate = useNavigate();
  const [dialogs, setDialogs] = useState<BotDialog[]>([]);
  const [active, setActive] = useState<BotDialog | null>(null);
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Диалоги с ботом — СтальГрупп";
    if (!adminToken.get()) { navigate("/admin"); return; }
    verifyAdmin().then(ok => { if (!ok) navigate("/admin"); });
  }, [navigate]);

  const loadDialogs = useCallback(async () => {
    setLoading(true);
    try { setDialogs(await fetchBotDialogs()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDialogs(); }, [loadDialogs]);

  // автообновление списка каждые 15 сек
  useEffect(() => {
    const t = setInterval(loadDialogs, 15000);
    return () => clearInterval(t);
  }, [loadDialogs]);

  const openDialog = useCallback(async (d: BotDialog) => {
    setActive(d);
    setMessages(await fetchBotMessages(d.chat_id));
    setDialogs(arr => arr.map(x => x.chat_id === d.chat_id ? { ...x, unread: 0 } : x));
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  // автообновление открытого диалога
  useEffect(() => {
    if (!active) return;
    const t = setInterval(async () => {
      setMessages(await fetchBotMessages(active.chat_id));
    }, 10000);
    return () => clearInterval(t);
  }, [active]);

  const send = async () => {
    if (!active || !reply.trim()) return;
    setSending(true);
    try {
      await replyToBotDialog(active.chat_id, reply.trim());
      setMessages(m => [...m, { direction: "out", sender: "manager", text: reply.trim(), created_at: new Date().toISOString() }]);
      setReply("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } finally {
      setSending(false);
    }
  };

  const fmtTime = (s: string | null) =>
    s ? new Date(s).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white flex flex-col">
      <header className="sticky top-0 z-30 bg-[#0a0c10]/95 backdrop-blur border-b border-[#1e2230]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/admin" className="text-white/50 hover:text-orange-400">
            <Icon name="ArrowLeft" size={20} />
          </Link>
          <div>
            <h1 className="font-oswald text-2xl font-bold">Диалоги с ботом</h1>
            <p className="text-white/50 text-xs">{dialogs.length} диалогов · переписка клиентов в MAX</p>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4">
        {/* Список диалогов */}
        <div className="bg-[#141720] border border-[#1e2230] rounded-2xl overflow-hidden flex flex-col max-h-[75vh]">
          <div className="p-3 border-b border-[#1e2230] flex items-center justify-between">
            <span className="text-sm font-medium text-white/70">Клиенты</span>
            <button onClick={loadDialogs} className="text-white/40 hover:text-orange-400" title="Обновить">
              <Icon name={loading ? "Loader" : "RefreshCw"} size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="overflow-y-auto flex-1">
            {dialogs.length === 0 && !loading && (
              <div className="p-6 text-center text-white/35 text-sm">
                Пока нет диалогов. Они появятся, когда клиенты напишут боту.
              </div>
            )}
            {dialogs.map(d => (
              <button
                key={d.chat_id}
                onClick={() => openDialog(d)}
                className={`w-full text-left px-3 py-3 border-b border-[#1e2230] hover:bg-white/5 transition-colors ${
                  active?.chat_id === d.chat_id ? "bg-orange-500/10" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-sm font-medium text-white truncate flex items-center gap-1.5">
                    {d.needs_manager && <Icon name="Hand" size={12} className="text-amber-400 flex-shrink-0" />}
                    {d.client_name || `Клиент ${d.chat_id}`}
                  </span>
                  {d.unread > 0 && (
                    <span className="bg-orange-500 text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {d.unread}
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/45 truncate">{d.last_message || "—"}</div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-[10px] text-white/30">{fmtTime(d.last_at)}</span>
                  {d.assigned_manager && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 truncate">
                      <Icon name="UserCheck" size={10} /> {d.assigned_manager}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Переписка */}
        <div className="bg-[#141720] border border-[#1e2230] rounded-2xl flex flex-col max-h-[75vh]">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-white/35 text-sm">
              <div className="text-center">
                <Icon name="MessageSquare" size={40} className="mx-auto mb-2 text-white/15" />
                Выберите диалог слева
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-[#1e2230] flex items-center gap-2">
                <Icon name="User" size={16} className="text-orange-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{active.client_name || `Клиент ${active.chat_id}`}</div>
                  <div className="text-[11px] text-white/40 flex items-center gap-2 flex-wrap">
                    {active.client_phone && <span>{active.client_phone}</span>}
                    {active.client_city && <span>· {active.client_city}</span>}
                  </div>
                </div>
                {active.assigned_manager && (
                  <span className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                    <Icon name="UserCheck" size={11} /> Ведёт: {active.assigned_manager}
                  </span>
                )}
                {active.needs_manager && (
                  <span className="bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[10px] px-2 py-1 rounded-full">
                    Просит менеджера
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m, i) => {
                  const out = m.direction === "out";
                  return (
                    <div key={i} className={`flex ${out ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                        out
                          ? (m.sender === "manager" ? "bg-orange-500 text-gray-900" : "bg-[#1e2230] text-white/80")
                          : "bg-[#0a0c10] border border-[#1e2230] text-white/90"
                      }`}>
                        <div className="whitespace-pre-wrap break-words">{m.text}</div>
                        <div className={`text-[10px] mt-1 ${out && m.sender === "manager" ? "text-gray-900/60" : "text-white/30"}`}>
                          {m.sender === "bot" ? "🤖 бот" : m.sender === "manager" ? "👤 вы" : "клиент"} · {fmtTime(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="p-3 border-t border-[#1e2230] flex items-end gap-2">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={1}
                  placeholder="Ответить клиенту…"
                  className="flex-1 bg-[#0a0c10] border border-[#1e2230] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-500 outline-none resize-none"
                />
                <button
                  onClick={send}
                  disabled={sending || !reply.trim()}
                  className="btn-orange px-4 py-2.5 rounded-xl text-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Icon name={sending ? "Loader" : "Send"} size={15} className={sending ? "animate-spin" : ""} />
                  Отправить
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}