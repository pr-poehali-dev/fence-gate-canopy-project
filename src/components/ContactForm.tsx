import { useState } from "react";
import Icon from "@/components/ui/icon";
import { sendLead } from "@/lib/api";
import { COMPANY } from "@/lib/company";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [task, setTask] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [sentOrder, setSentOrder] = useState("");
  const [sentNotified, setSentNotified] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) { setErr("Укажите телефон"); return; }
    setSending(true); setErr("");
    try {
      const orderNum = `СГ-${new Date().getFullYear()}-C${Date.now().toString().slice(-6)}`;
      const res = await sendLead({
        order_num:   orderNum,
        name:        name.trim() || "—",
        phone:       phone.trim(),
        city:        "",
        address:     "",
        object_type: "Форма контактов",
        total_rub:   0,
        payload:     { email, task, source: "Главная: блок Контакты" },
      });
      if (res?.ok) {
        setSent(true);
        setSentOrder(res.order_num || orderNum);
        setSentNotified(Boolean(res.client_notified));
        setName(""); setPhone(""); setEmail(""); setTask("");
      } else {
        setErr("Не удалось отправить. Позвоните " + COMPANY.phone);
      }
    } catch {
      setErr("Ошибка отправки. Позвоните " + COMPANY.phone);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-[#141720] border border-green-500/30 rounded-3xl p-8 text-center">
        <div className="w-16 h-16 bg-green-500/15 border border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="CheckCircle2" size={32} className="text-green-400" />
        </div>
        <div className="font-oswald font-bold text-2xl text-white mb-2">Заявка принята!</div>
        {sentOrder && (
          <div className="bg-[#0d1017] border border-orange-500/30 rounded-xl px-4 py-3 mb-4 inline-block">
            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Номер заявки</div>
            <div className="font-mono font-bold text-orange-400 text-base">{sentOrder}</div>
          </div>
        )}
        <p className="text-white/55 text-sm mb-3">Менеджер свяжется в течение 15 минут.</p>
        {sentNotified ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2 text-xs text-green-300 inline-flex items-center gap-1.5">
            <Icon name="MessageCircle" size={13} />
            Подтверждение отправлено вам в MAX-боте
          </div>
        ) : (
          <div className="text-[11px] text-white/35">
            Сохраните номер заявки — он понадобится при звонке
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-[#141720] border border-[#1e2230] rounded-3xl p-8">
      <div className="font-oswald font-bold text-xl text-white mb-6">Оставить заявку</div>
      <div className="space-y-4">
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Ваше имя" className="select-field" />
        <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="Телефон" className="select-field" />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="Email" className="select-field" />
        <textarea value={task} onChange={e => setTask(e.target.value)}
          placeholder="Опишите задачу: тип ограждения, размеры, пожелания"
          rows={4} className="select-field resize-none" />
        {err && <div className="text-red-400 text-xs text-center">{err}</div>}
        <button type="submit" disabled={sending}
          className="btn-orange w-full py-4 rounded-xl text-base disabled:opacity-60">
          <span className="flex items-center gap-2 justify-center">
            <Icon name={sending ? "Loader" : "Send"} size={16}
              className={sending ? "animate-spin" : ""} />
            {sending ? "Отправка..." : "Отправить заявку"}
          </span>
        </button>
        <p className="text-white/25 text-xs text-center">
          Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
        </p>
      </div>
    </form>
  );
}