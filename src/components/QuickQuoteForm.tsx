import { useState } from "react";
import Icon from "@/components/ui/icon";
import { sendLead } from "@/lib/api";
import { useCompany } from "@/hooks/useCompany";
import { isPhoneValid, phoneE164 } from "@/lib/phone";
import PhoneInput from "@/components/ui/phone-input";
import { toast } from "sonner";

interface Props {
  source?: string;
  /** Подсказка по услуге, если форма прилеплена к конкретной услуге */
  serviceHint?: string;
  /** Заголовок над формой; "" — без заголовка */
  title?: string;
  /** Компактный вариант — 2 поля в ряд */
  compact?: boolean;
}

/**
 * Универсальная мини-форма «Бесплатный замер»: имя + телефон + кнопка.
 * Можно встраивать в любую секцию сайта. Отправляет лид без открытия модалки.
 */
export default function QuickQuoteForm({
  source = "Сайт: Быстрый замер",
  serviceHint,
  title = "Бесплатный замер за 1 день",
  compact = false,
}: Props) {
  const company = useCompany();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [order, setOrder] = useState("");

  const phoneOk = isPhoneValid(phone);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (!phoneOk) { setErr("Введите корректный телефон"); return; }
    if (!agree) { setErr("Нужно согласие на обработку данных"); return; }

    setSending(true);
    setErr("");
    try {
      const orderNum = `СГ-${new Date().getFullYear()}-Q${Date.now().toString().slice(-6)}`;
      const res = await sendLead({
        order_num: orderNum,
        name: name.trim() || "Гость",
        phone: phoneE164(phone),
        city: "",
        address: "",
        object_type: source,
        total_rub: 0,
        payload: {
          source,
          service_hint: serviceHint || "",
          page_url: typeof window !== "undefined" ? window.location.href : "",
          submitted_at: new Date().toISOString(),
        },
      });
      if (res?.ok) {
        setSent(true);
        setOrder(res.order_num || orderNum);
        toast.success(`Заявка №${res.order_num || orderNum} принята`, {
          description: "Менеджер свяжется в течение 15 минут.",
        });
      } else {
        const msg = "Не удалось отправить. Позвоните " + company.phone;
        setErr(msg);
        toast.error("Ошибка отправки", { description: msg });
      }
    } catch {
      const msg = "Ошибка сети. Позвоните " + company.phone;
      setErr(msg);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-[#141720]/95 backdrop-blur border border-green-500/40 rounded-2xl p-6 text-center shadow-2xl">
        <div className="w-14 h-14 bg-green-500/15 border-2 border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-3">
          <Icon name="CheckCircle2" size={28} className="text-green-400" />
        </div>
        <div className="font-oswald font-bold text-xl text-white mb-1">Заявка принята</div>
        <div className="text-white/60 text-sm mb-2">№ {order}</div>
        <div className="text-white/70 text-sm">
          Менеджер позвонит в течение <b className="text-orange-400">15 минут</b>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="bg-[#141720]/95 backdrop-blur border border-orange-500/30 rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xl w-full max-w-full"
    >
      {title && (
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 bg-orange-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon name="Ruler" size={18} className="text-orange-400" />
          </div>
          <div>
            <div className="font-oswald font-bold text-white text-base sm:text-lg leading-tight">{title}</div>
            <div className="text-white/45 text-[11px]">Замер, проект и смета — 0 ₽</div>
          </div>
        </div>
      )}

      <div className={compact ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5" : "space-y-2.5"}>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ваше имя"
          className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none"
        />
        <PhoneInput
          required
          value={phone}
          onChange={(v) => { setPhone(v); if (err) setErr(""); }}
          className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none"
        />
      </div>

      <label className="flex items-start gap-2 mt-3 cursor-pointer select-none">
        <input
          type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0"
        />
        <span className="text-[10.5px] text-white/45 leading-snug">
          Согласен на обработку{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">персональных данных</a>
        </span>
      </label>

      {err && (
        <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-red-300 text-xs">
          {err}
        </div>
      )}

      <button
        type="submit"
        disabled={sending || !agree}
        className="btn-orange w-full mt-3 py-3.5 rounded-xl text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-2 justify-center">
          <Icon name={sending ? "Loader" : "Send"} size={16} className={sending ? "animate-spin" : ""} />
          {sending ? "Отправляем…" : "Заказать бесплатный замер"}
        </span>
      </button>

      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10.5px] text-white/40">
        <span className="flex items-center gap-1"><Icon name="Clock" size={11} className="text-orange-400" /> Перезвоним за 15 мин.</span>
        <span className="flex items-center gap-1"><Icon name="ShieldCheck" size={11} className="text-orange-400" /> Гарантия 5 лет</span>
        <span className="flex items-center gap-1"><Icon name="Gift" size={11} className="text-orange-400" /> Скидка 5%</span>
      </div>
    </form>
  );
}