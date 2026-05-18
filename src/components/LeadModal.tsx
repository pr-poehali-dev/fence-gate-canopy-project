import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { sendLead } from "@/lib/api";
import { COMPANY } from "@/lib/company";
import { formatPhoneRU, isPhoneValid, isEmailValid, phoneE164 } from "@/lib/phone";
import { toast } from "sonner";

export interface LeadModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  source?: string;
  serviceHint?: string;
}

function genOrderNum() {
  const base = parseInt(localStorage.getItem("sg_lead_seq") || "0") + 1;
  localStorage.setItem("sg_lead_seq", String(base));
  const yr = new Date().getFullYear();
  return `СГ-${yr}-L${String(base).padStart(4, "0")}`;
}

const LS_NAME  = "sg_lead_name";
const LS_PHONE = "sg_lead_phone";
const LS_CITY  = "sg_lead_city";
const LS_EMAIL = "sg_lead_email";

export default function LeadModal({
  open, onClose, title = "Оставить заявку",
  subtitle = "Перезвоним за 15 минут, бесплатно посчитаем смету.",
  source = "Сайт", serviceHint,
}: LeadModalProps) {
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [email,   setEmail]   = useState("");
  const [city,    setCity]    = useState("");
  const [comment, setComment] = useState("");
  const [agree,   setAgree]   = useState(true);
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");
  const [touched, setTouched] = useState({ phone: false, email: false });
  const [sentOrder,   setSentOrder]   = useState("");
  const [sentChannels, setSentChannels] = useState({
    maxClient: false, emailClient: false, smsClient: false,
  });
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Автозаполнение из localStorage при открытии
  useEffect(() => {
    if (!open) return;
    setSent(false);
    setError("");
    setTouched({ phone: false, email: false });
    try {
      setName(localStorage.getItem(LS_NAME)  || "");
      setPhone(formatPhoneRU(localStorage.getItem(LS_PHONE) || ""));
      setCity(localStorage.getItem(LS_CITY)  || "");
      setEmail(localStorage.getItem(LS_EMAIL) || "");
    } catch { /* ignore */ }
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

  if (!open) return null;

  const phoneOk = isPhoneValid(phone);
  const emailOk = !email.trim() || isEmailValid(email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return; // защита от двойной отправки

    setTouched({ phone: true, email: true });

    if (!phoneOk) {
      setError("Введите корректный телефон в формате +7 (XXX) XXX-XX-XX");
      return;
    }
    if (!emailOk) {
      setError("Email указан некорректно");
      return;
    }
    if (!agree) {
      setError("Нужно согласие на обработку персональных данных");
      return;
    }

    setSending(true);
    setError("");
    try {
      const orderNum = genOrderNum();
      const res = await sendLead({
        order_num:   orderNum,
        name:        name.trim() || "Без имени",
        phone:       phoneE164(phone),
        email:       email.trim(),
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
        // Запоминаем для следующего раза
        try {
          localStorage.setItem(LS_NAME,  name.trim());
          localStorage.setItem(LS_PHONE, phoneE164(phone));
          localStorage.setItem(LS_CITY,  city.trim());
          if (email.trim()) localStorage.setItem(LS_EMAIL, email.trim());
        } catch { /* ignore */ }

        setSent(true);
        setSentOrder(res.order_num || orderNum);
        setSentChannels({
          maxClient:   Boolean(res.client_notified),
          emailClient: Boolean(res.client_email_sent),
          smsClient:   Boolean(res.client_sms_sent),
        });
        toast.success(`Заявка №${res.order_num || orderNum} принята`, {
          description: "Менеджер свяжется в течение 15 минут.",
        });
        // НЕ закрываем сами — пусть клиент сам уйдёт, экран успеха важный
      } else {
        const msg = "Не удалось отправить. Позвоните " + COMPANY.phone;
        setError(msg);
        toast.error("Ошибка отправки", { description: msg });
      }
    } catch {
      const msg = "Ошибка сети. Позвоните " + COMPANY.phone;
      setError(msg);
      toast.error("Ошибка сети", { description: msg });
    } finally {
      setSending(false);
    }
  };

  const inputErrorCls = (bad: boolean) =>
    bad ? "border-red-500/50 focus:border-red-500/70" : "border-[#1e2230] focus:border-orange-500/50";

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
      style={{
        background: "rgba(8,10,14,0.85)",
        backdropFilter: "blur(6px)",
        paddingTop: "max(0.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}>
      <div onClick={e => e.stopPropagation()}
        className="bg-[#141720] border-2 border-orange-500/30 rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl shadow-orange-500/10 relative max-h-[95vh] sm:max-h-[92vh] overflow-y-auto my-auto">
        <button ref={closeBtnRef} onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 bg-[#1a1f2e] hover:bg-orange-500/15 rounded-full flex items-center justify-center text-white/50 hover:text-orange-400 transition-all z-10"
          aria-label="Закрыть">
          <Icon name="X" size={18} />
        </button>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-500/15 border-2 border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-5 animate-in zoom-in-50 duration-300">
              <Icon name="CheckCircle2" size={42} className="text-green-400" />
            </div>
            <h3 className="font-oswald font-bold text-2xl text-white mb-1">Заявка принята!</h3>
            <p className="text-white/55 text-sm mb-5">Спасибо за обращение, мы вас не подведём.</p>

            {sentOrder && (
              <div className="bg-[#0d1017] border border-orange-500/30 rounded-2xl px-5 py-4 mb-5 inline-block">
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5">Номер вашей заявки</div>
                <div className="font-mono font-bold text-orange-400 text-xl">{sentOrder}</div>
              </div>
            )}

            <p className="text-white/70 text-sm mb-4">
              Менеджер свяжется с вами в течение <b className="text-orange-400">15 минут</b>.
            </p>

            <div className="space-y-2 text-left max-w-xs mx-auto mb-5">
              {sentChannels.maxClient && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2 text-xs text-green-300 flex items-center gap-2">
                  <Icon name="MessageCircle" size={14} />
                  <span>Подтверждение пришло в MAX-бот</span>
                </div>
              )}
              {sentChannels.emailClient && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-cyan-300 flex items-center gap-2">
                  <Icon name="Mail" size={14} />
                  <span>Письмо отправлено на ваш email</span>
                </div>
              )}
              {sentChannels.smsClient && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-2 text-xs text-blue-300 flex items-center gap-2">
                  <Icon name="Smartphone" size={14} />
                  <span>SMS отправлена на ваш телефон</span>
                </div>
              )}
              {!sentChannels.maxClient && !sentChannels.emailClient && !sentChannels.smsClient && (
                <div className="text-[11px] text-white/35 text-center">
                  Сохраните номер заявки — он понадобится при звонке
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <a href={`tel:${COMPANY.phoneE164}`}
                className="btn-outline-orange px-4 py-2.5 rounded-xl text-sm inline-flex items-center justify-center gap-2">
                <Icon name="Phone" size={14} /> {COMPANY.phone}
              </a>
              <button onClick={onClose}
                className="btn-orange px-4 py-2.5 rounded-xl text-sm">
                Закрыть
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="p-7" noValidate>
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

              <div>
                <div className="relative">
                  <Icon name="Phone" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type="tel" required inputMode="tel" autoComplete="tel"
                    value={phone}
                    onChange={e => { setPhone(formatPhoneRU(e.target.value)); if (error) setError(""); }}
                    onFocus={() => { if (!phone) setPhone("+7 ("); }}
                    onBlur={() => setTouched(t => ({ ...t, phone: true }))}
                    placeholder="+7 (___) ___-__-__"
                    className={`w-full bg-[#1a1f2e] border rounded-xl pl-11 pr-10 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none ${inputErrorCls(touched.phone && !phoneOk)}`}
                  />
                  {phoneOk && (
                    <Icon name="Check" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
                  )}
                </div>
                {touched.phone && !phoneOk && phone.length > 0 && (
                  <div className="text-red-400 text-[11px] mt-1 ml-1">Введите корректный российский номер</div>
                )}
              </div>

              <div>
                <div className="relative">
                  <Icon name="Mail" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type="email" inputMode="email" autoComplete="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (error) setError(""); }}
                    onBlur={() => setTouched(t => ({ ...t, email: true }))}
                    placeholder="Email (необязательно — пришлём копию заявки)"
                    className={`w-full bg-[#1a1f2e] border rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none ${inputErrorCls(touched.email && !emailOk)}`}
                  />
                </div>
                {touched.email && !emailOk && (
                  <div className="text-red-400 text-[11px] mt-1 ml-1">Email указан некорректно</div>
                )}
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

              <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-orange-500 cursor-pointer" />
                <span className="text-[11px] text-white/55 leading-relaxed">
                  Я согласен на обработку <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">персональных данных</a> и получение
                  уведомлений по моей заявке.
                </span>
              </label>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-300 text-xs text-center">
                  {error}
                </div>
              )}

              <button type="submit" disabled={sending || !agree}
                className="btn-orange w-full py-3.5 rounded-xl text-base disabled:opacity-60 disabled:cursor-not-allowed">
                <span className="flex items-center gap-2 justify-center">
                  <Icon name={sending ? "Loader" : "Send"} size={16}
                    className={sending ? "animate-spin" : ""} />
                  {sending ? "Отправляем..." : "Отправить заявку"}
                </span>
              </button>

              <div className="flex items-center justify-between gap-2 text-[11px] text-white/35 pt-1">
                <a href={`tel:${COMPANY.phoneE164}`} className="flex items-center gap-1 hover:text-orange-400 transition-colors">
                  <Icon name="Phone" size={11} /> {COMPANY.phone}
                </a>
                <span>Перезвоним за <b className="text-orange-400/70">15 минут</b></span>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}