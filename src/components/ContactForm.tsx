import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { sendLead } from "@/lib/api";
import { useCompany } from "@/hooks/useCompany";
import { formatPhoneRU, isPhoneValid, isEmailValid, phoneE164 } from "@/lib/phone";
import PhoneInput from "@/components/ui/phone-input";
import { toast } from "sonner";

const LS_NAME  = "sg_lead_name";
const LS_PHONE = "sg_lead_phone";
const LS_EMAIL = "sg_lead_email";

export default function ContactForm() {
  const company = useCompany();
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [email,   setEmail]   = useState("");
  const [task,    setTask]    = useState("");
  const [agree,   setAgree]   = useState(true);
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [err,     setErr]     = useState("");
  const [touched, setTouched] = useState({ phone: false, email: false });
  const [sentOrder, setSentOrder] = useState("");
  const [sentChannels, setSentChannels] = useState({
    maxClient: false, emailClient: false, smsClient: false,
  });

  useEffect(() => {
    try {
      setName(localStorage.getItem(LS_NAME)  || "");
      setPhone(formatPhoneRU(localStorage.getItem(LS_PHONE) || ""));
      setEmail(localStorage.getItem(LS_EMAIL) || "");
    } catch { /* ignore */ }
  }, []);

  const phoneOk = isPhoneValid(phone);
  const emailOk = !email.trim() || isEmailValid(email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;

    setTouched({ phone: true, email: true });
    if (!phoneOk) { setErr("Введите корректный телефон"); return; }
    if (!emailOk) { setErr("Email указан некорректно"); return; }
    if (!agree)   { setErr("Нужно согласие на обработку данных"); return; }

    setSending(true); setErr("");
    try {
      const orderNum = `СГ-${new Date().getFullYear()}-C${Date.now().toString().slice(-6)}`;
      const res = await sendLead({
        order_num:   orderNum,
        name:        name.trim() || "—",
        phone:       phoneE164(phone),
        email:       email.trim(),
        city:        "",
        address:     "",
        object_type: "Форма контактов",
        total_rub:   0,
        payload:     { email, task, source: "Главная: блок Контакты" },
      });
      if (res?.ok) {
        try {
          localStorage.setItem(LS_NAME,  name.trim());
          localStorage.setItem(LS_PHONE, phoneE164(phone));
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
        setTask("");
      } else {
        const msg = "Не удалось отправить. Позвоните " + company.phone;
        setErr(msg);
        toast.error("Ошибка отправки", { description: msg });
      }
    } catch {
      const msg = "Ошибка сети. Позвоните " + company.phone;
      setErr(msg);
      toast.error("Ошибка сети", { description: msg });
    } finally {
      setSending(false);
    }
  };

  const inputErrorCls = (bad: boolean) =>
    bad ? "border-red-500/50 focus:border-red-500/70" : "";

  if (sent) {
    return (
      <div className="bg-[#141720] border border-green-500/30 rounded-3xl p-8 text-center">
        <div className="w-20 h-20 bg-green-500/15 border-2 border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-5 animate-in zoom-in-50 duration-300">
          <Icon name="CheckCircle2" size={42} className="text-green-400" />
        </div>
        <div className="font-oswald font-bold text-2xl text-white mb-1">Заявка принята!</div>
        <p className="text-white/55 text-sm mb-5">Спасибо за обращение, мы вас не подведём.</p>
        {sentOrder && (
          <div className="bg-[#0d1017] border border-orange-500/30 rounded-2xl px-5 py-4 mb-5 inline-block">
            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5">Номер заявки</div>
            <div className="font-mono font-bold text-orange-400 text-xl">{sentOrder}</div>
          </div>
        )}
        <p className="text-white/70 text-sm mb-4">
          Менеджер свяжется в течение <b className="text-orange-400">15 минут</b>.
        </p>
        <div className="space-y-2 max-w-xs mx-auto">
          {sentChannels.maxClient && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2 text-xs text-green-300 flex items-center gap-2">
              <Icon name="MessageCircle" size={14} /><span>Подтверждение пришло в MAX-бот</span>
            </div>
          )}
          {sentChannels.emailClient && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-cyan-300 flex items-center gap-2">
              <Icon name="Mail" size={14} /><span>Копия отправлена на email</span>
            </div>
          )}
          {sentChannels.smsClient && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-2 text-xs text-blue-300 flex items-center gap-2">
              <Icon name="Smartphone" size={14} /><span>SMS отправлена</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-[#141720] border border-[#1e2230] rounded-3xl p-8" noValidate>
      <div className="font-oswald font-bold text-xl text-white mb-6">Оставить заявку</div>
      <div className="space-y-4">
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Ваше имя" className="select-field" />

        <div>
          <PhoneInput
            required
            value={phone}
            hasError={touched.phone && !phoneOk}
            onChange={(v) => { setPhone(v); if (err) setErr(""); }}
            onBlur={() => setTouched(t => ({ ...t, phone: true }))}
            className={`select-field ${inputErrorCls(touched.phone && !phoneOk)}`}
          />
          {touched.phone && !phoneOk && phone.length > 0 && (
            <div className="text-red-400 text-[11px] mt-1 ml-1">Введите корректный российский номер</div>
          )}
        </div>

        <div>
          <input type="email" inputMode="email" autoComplete="email"
            value={email} onChange={e => setEmail(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, email: true }))}
            placeholder="Email (необязательно — пришлём копию заявки)"
            className={`select-field ${inputErrorCls(touched.email && !emailOk)}`} />
          {touched.email && !emailOk && (
            <div className="text-red-400 text-[11px] mt-1 ml-1">Email указан некорректно</div>
          )}
        </div>

        <textarea value={task} onChange={e => setTask(e.target.value)}
          placeholder="Опишите задачу: тип ограждения, размеры, пожелания"
          rows={4} className="select-field resize-none" />

        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-orange-500 cursor-pointer" />
          <span className="text-[11px] text-white/55 leading-relaxed">
            Я согласен на обработку <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">персональных данных</a> и получение
            уведомлений по моей заявке.
          </span>
        </label>

        {err && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-300 text-xs text-center">
            {err}
          </div>
        )}

        <button type="submit" disabled={sending || !agree}
          className="btn-orange w-full py-4 rounded-xl text-base disabled:opacity-60 disabled:cursor-not-allowed">
          <span className="flex items-center gap-2 justify-center">
            <Icon name={sending ? "Loader" : "Send"} size={16}
              className={sending ? "animate-spin" : ""} />
            {sending ? "Отправляем..." : "Отправить заявку"}
          </span>
        </button>
        <p className="text-white/25 text-xs text-center">
          Перезвоним за 15 минут или звоните: <a href={`tel:${company.phoneE164}`} className="text-orange-400/70 hover:text-orange-400">{company.phone}</a>
        </p>
      </div>
    </form>
  );
}