import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { sendLead } from "@/lib/api";
import { COMPANY } from "@/lib/company";

export interface LeadModalProps {
  open: boolean;
  onClose: () => void;
  /** Заголовок модалки, например «Заказать звонок» */
  title?: string;
  /** Подзаголовок / описание */
  subtitle?: string;
  /** Источник заявки — попадёт в MAX-сообщение */
  source?: string;
  /** Подсказка по услуге (например, «Профнастил, h=2 м») */
  serviceHint?: string;
}

function genOrderNum() {
  const base = parseInt(localStorage.getItem("sg_lead_seq") || "0") + 1;
  localStorage.setItem("sg_lead_seq", String(base));
  const yr = new Date().getFullYear();
  return `СГ-${yr}-L${String(base).padStart(4, "0")}`;
}

export default function LeadModal({
  open, onClose, title = "Оставить заявку",
  subtitle = "Перезвоним за 15 минут, бесплатно посчитаем смету.",
  source = "Сайт", serviceHint,
}: LeadModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const closeBtnRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (open) {
      setSent(false);
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) { setError("Укажите телефон"); return; }
    setSending(true);
    setError("");
    try {
      const orderNum = genOrderNum();
      const res = await sendLead({
        order_num:   orderNum,
        name:        name.trim() || "Без имени",
        phone:       phone.trim(),
        city:        city.trim() || "—",
        address:     "",
        object_type: source,
        total_rub:   0,
        payload: {
          source,
          service_hint: serviceHint || "",
          comment: comment.trim(),
          page_url: typeof window !== "undefined" ? window.location.href : "",
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          submitted_at: new Date().toISOString(),
        },
      });
      if (res?.ok) {
        setSent(true);
        setName(""); setPhone(""); setCity(""); setComment("");
        setTimeout(() => { onClose(); setSent(false); }, 2500);
      } else {
        setError("Не удалось отправить. Позвоните " + COMPANY.phone);
      }
    } catch {
      setError("Ошибка отправки. Позвоните " + COMPANY.phone);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
      style={{ background: "rgba(8,10,14,0.85)", backdropFilter: "blur(6px)" }}>
      <div onClick={e => e.stopPropagation()}
        className="bg-[#141720] border-2 border-orange-500/30 rounded-3xl w-full max-w-md shadow-2xl shadow-orange-500/10 relative">
        <button ref={closeBtnRef} onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 bg-[#1a1f2e] hover:bg-orange-500/15 rounded-full flex items-center justify-center text-white/50 hover:text-orange-400 transition-all"
          aria-label="Закрыть">
          <Icon name="X" size={18} />
        </button>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/15 border border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="CheckCircle2" size={32} className="text-green-400" />
            </div>
            <h3 className="font-oswald font-bold text-2xl text-white mb-2">Заявка отправлена!</h3>
            <p className="text-white/60 text-sm">Менеджер свяжется с вами в течение 15 минут.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="p-7">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-orange-400 text-[10px] font-bold uppercase tracking-widest">{source}</span>
            </div>
            <h3 className="font-oswald font-bold text-2xl text-white mb-1">{title}</h3>
            <p className="text-white/50 text-sm mb-5">{subtitle}</p>

            {serviceHint && (
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl px-3 py-2 mb-4 text-xs text-orange-300 flex items-center gap-2">
                <Icon name="Tag" size={13} />
                <span>{serviceHint}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="relative">
                <Icon name="User" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full bg-[#1a1f2e] border border-[#1e2230] focus:border-orange-500/50 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none" />
              </div>
              <div className="relative">
                <Icon name="Phone" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full bg-[#1a1f2e] border border-[#1e2230] focus:border-orange-500/50 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none" />
              </div>
              <div className="relative">
                <Icon name="MapPin" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input type="text" value={city} onChange={e => setCity(e.target.value)}
                  placeholder="Город (Люберцы, Чапаевка...)"
                  className="w-full bg-[#1a1f2e] border border-[#1e2230] focus:border-orange-500/50 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none" />
              </div>
              <textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Комментарий / задача (необязательно)"
                rows={3}
                className="w-full bg-[#1a1f2e] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none resize-none" />

              {error && (
                <div className="text-red-400 text-xs text-center">{error}</div>
              )}

              <button type="submit" disabled={sending}
                className="btn-orange w-full py-3.5 rounded-xl text-base disabled:opacity-60">
                <span className="flex items-center gap-2 justify-center">
                  <Icon name={sending ? "Loader" : "Send"} size={16}
                    className={sending ? "animate-spin" : ""} />
                  {sending ? "Отправка..." : "Отправить заявку"}
                </span>
              </button>

              <div className="flex items-center justify-between gap-2 text-[11px] text-white/35 pt-1">
                <a href={`tel:${COMPANY.phoneE164}`} className="flex items-center gap-1 hover:text-orange-400 transition-colors">
                  <Icon name="Phone" size={11} /> {COMPANY.phone}
                </a>
                <span>Согласие с <button type="button" className="text-orange-400/70 hover:text-orange-400 underline">политикой</button></span>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
