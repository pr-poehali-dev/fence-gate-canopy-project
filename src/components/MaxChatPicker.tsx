import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { fetchMaxChats, testMaxChat, MaxChat } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (chatId: string) => void;
}

export default function MaxChatPicker({ open, onClose, onPick }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<MaxChat[]>([]);
  const [bot, setBot] = useState<{ name?: string; username?: string } | null>(null);
  const [hint, setHint] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testedOk, setTestedOk] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    setTestedOk(null);
    try {
      const r = await fetchMaxChats();
      if (!r.ok) {
        setError(r.message || "Не удалось получить список чатов");
        setItems([]);
        setBot(null);
        return;
      }
      setItems(r.items || []);
      setBot(r.bot || null);
      setHint(r.hint || "");
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
     
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const doTest = async (chat: MaxChat) => {
    setTestingId(chat.chat_id);
    setTestedOk(null);
    try {
      const r = await testMaxChat(chat.chat_id);
      if (r?.ok) setTestedOk(chat.chat_id);
      else alert("Не удалось отправить тест. Возможно, бот не состоит в этом чате или нет прав отправлять сообщения.");
    } finally {
      setTestingId(null);
    }
  };

  const doPick = (chat: MaxChat) => {
    onPick(chat.chat_id);
    onClose();
  };

  const typeBadge = (type: string) => {
    if (type === "dialog") return { label: "Личка", color: "bg-blue-500/15 text-blue-300 border-blue-500/30" };
    if (type === "channel") return { label: "Канал", color: "bg-purple-500/15 text-purple-300 border-purple-500/30" };
    return { label: "Группа", color: "bg-green-500/15 text-green-300 border-green-500/30" };
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      onClick={onClose}
      style={{ background: "rgba(8,10,14,0.85)", backdropFilter: "blur(6px)" }}>
      <div onClick={e => e.stopPropagation()}
        className="bg-[#141720] border-2 border-orange-500/30 rounded-3xl w-full max-w-2xl shadow-2xl shadow-orange-500/10 relative max-h-[88vh] flex flex-col">
        <button onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 bg-[#1a1f2e] hover:bg-orange-500/15 rounded-full flex items-center justify-center text-white/50 hover:text-orange-400 transition-all z-10">
          <Icon name="X" size={18} />
        </button>

        {/* HEAD */}
        <div className="p-6 sm:p-7 border-b border-[#1e2230]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-orange-400 text-[10px] font-bold uppercase tracking-widest">Подключение MAX</span>
          </div>
          <h3 className="font-oswald font-bold text-2xl text-white mb-1">Автопоиск chat_id</h3>
          <p className="text-white/50 text-sm">
            Бот покажет все чаты, где он состоит, и людей, которые ему писали.
            Выберите нужный и нажмите «Использовать».
          </p>
          {bot && (
            <div className="mt-3 bg-[#0d1017] border border-green-500/30 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
              <Icon name="Bot" size={14} className="text-green-400" />
              <span className="text-green-300">Бот «{bot.name || "MAX-бот"}»{bot.username ? ` · @${bot.username}` : ""} активен</span>
            </div>
          )}
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7">
          {loading ? (
            <div className="text-center text-white/40 py-12">
              <Icon name="Loader" size={28} className="mx-auto mb-3 animate-spin text-orange-400" />
              Опрашиваем MAX...
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-300">
              <div className="flex items-start gap-2 mb-2">
                <Icon name="AlertTriangle" size={16} className="flex-shrink-0 mt-0.5" />
                <span><b>Ошибка:</b> {error}</span>
              </div>
              <div className="text-white/40 text-xs">
                Проверьте, что в поле «Токен бота» вставлен правильный access_token, и сохраните настройки.
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10">
              <Icon name="Inbox" size={40} className="mx-auto mb-4 text-white/20" />
              <div className="text-white/60 font-medium mb-2">Чатов пока нет</div>
              <div className="text-white/40 text-sm leading-relaxed max-w-md mx-auto">
                {hint || "Напишите боту /start в личные сообщения или добавьте его в группу и отправьте любое сообщение, затем нажмите «Обновить»."}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map(chat => {
                const b = typeBadge(chat.type);
                const isOkTested = testedOk === chat.chat_id;
                return (
                  <div key={chat.chat_id}
                    className="bg-[#0d1017] border border-[#1e2230] hover:border-orange-500/40 rounded-xl p-4 transition-all">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-white font-semibold text-sm">{chat.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${b.color}`}>
                            {b.label}
                          </span>
                          {isOkTested && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/40 text-green-400 font-bold uppercase tracking-wider flex items-center gap-1">
                              <Icon name="Check" size={10} /> тест ок
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-orange-400/70 mb-1">
                          chat_id: <span className="text-orange-400">{chat.chat_id}</span>
                        </div>
                        {chat.last_user && (
                          <div className="text-white/40 text-[11px]">От: {chat.last_user}</div>
                        )}
                        {chat.last_message && (
                          <div className="text-white/35 text-[11px] truncate mt-0.5">
                            «{chat.last_message}»
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => doTest(chat)}
                        disabled={testingId === chat.chat_id}
                        className="text-xs px-3 py-2 bg-[#1a1f2e] hover:bg-blue-500/10 hover:text-blue-300 text-white/55 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50">
                        <Icon name={testingId === chat.chat_id ? "Loader" : "Send"} size={12}
                          className={testingId === chat.chat_id ? "animate-spin" : ""} />
                        {testingId === chat.chat_id ? "..." : "Тест"}
                      </button>
                      <button onClick={() => doPick(chat)}
                        className="text-xs px-3 py-2 bg-orange-500 hover:bg-orange-400 text-gray-900 font-bold rounded-lg transition-all flex items-center gap-1.5 ml-auto">
                        <Icon name="Check" size={12} />
                        Использовать
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOT */}
        <div className="p-5 border-t border-[#1e2230] bg-[#0d1017]/40 rounded-b-3xl flex items-center justify-between gap-3">
          <button onClick={load} disabled={loading}
            className="text-xs px-3 py-2 border border-[#1e2230] hover:border-orange-500/40 text-white/55 hover:text-orange-400 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50">
            <Icon name={loading ? "Loader" : "RotateCw"} size={12}
              className={loading ? "animate-spin" : ""} />
            Обновить
          </button>
          <div className="text-[11px] text-white/35">
            Не нашли свой чат? Напишите боту /start или добавьте в группу
          </div>
        </div>
      </div>
    </div>
  );
}
