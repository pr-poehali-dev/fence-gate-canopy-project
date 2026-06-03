import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { COMPANY } from "@/lib/company";
import { sendLead } from "@/lib/api";
import { isPhoneValid, isEmailValid, phoneE164 } from "@/lib/phone";
import PhoneInput from "@/components/ui/phone-input";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";
import {
  CANOPY_TYPES, CANOPY_COVER,
  COATING_OPTIONS, FOUND_OPTIONS,
  GATE_OPTIONS, WICKET_OPTIONS,
  LAG_OPTIONS, POST_OPTIONS,
  PROFLIST_OPTIONS, SHTAK_OPTIONS,
  OBJECT_LABELS, OBJECT_ICONS,
  type ObjectType,
  type CalcInput,
  DEFAULT_CALC,
  calculate, fmtRub,
} from "@/lib/calcCatalog";
import { generateKpPDF } from "@/lib/kpPdf";

// ── Номер заказа ──────────────────────────────────────────────────
let _orderSeq = parseInt(localStorage.getItem("sg_order_seq") || "1000");
function nextOrderNumber() {
  _orderSeq += 1;
  localStorage.setItem("sg_order_seq", String(_orderSeq));
  return `СГ-${new Date().getFullYear()}-${String(_orderSeq).padStart(4, "0")}`;
}

// ── Шаги ────────────────────────────────────────────────────────
type FenceStep =
  | "object"      // 0: выбор объекта
  | "size"        // 1: периметр + высота
  | "post"        // 2: столбы
  | "lag"         // 3: лаги
  | "filling"     // 4: наполнение (профлист/штакетник/...)
  | "coating"     // 5: покрытие (только проф/штак)
  | "foundation"  // 6: фундамент
  | "gates"       // 7: ворота
  | "wickets"     // 8: калитка
  | "extras"      // 9: допработы
  | "contacts";   // 10: контакты

type CanopyStep =
  | "object"
  | "canopyType"
  | "canopySize"
  | "canopyCover"
  | "extras"
  | "contacts";

// Подписи шагов
const FENCE_STEPS: { id: FenceStep; label: string; icon: string }[] = [
  { id: "object",     label: "Тип объекта",  icon: "Layers" },
  { id: "size",       label: "Размеры",      icon: "Ruler" },
  { id: "post",       label: "Столбы",       icon: "AlignVerticalJustifyCenter" },
  { id: "lag",        label: "Лаги",         icon: "Minus" },
  { id: "filling",    label: "Наполнение",   icon: "LayoutGrid" },
  { id: "coating",    label: "Покрытие",     icon: "Palette" },
  { id: "foundation", label: "Фундамент",    icon: "Hammer" },
  { id: "gates",      label: "Ворота",       icon: "DoorOpen" },
  { id: "wickets",    label: "Калитка",      icon: "DoorClosed" },
  { id: "extras",     label: "Доп. работы",  icon: "Wrench" },
  { id: "contacts",   label: "Контакты",     icon: "User" },
];

const CANOPY_STEPS: { id: CanopyStep; label: string; icon: string }[] = [
  { id: "object",      label: "Тип объекта",  icon: "Layers" },
  { id: "canopyType",  label: "Форма кровли", icon: "Home" },
  { id: "canopySize",  label: "Размеры",      icon: "Ruler" },
  { id: "canopyCover", label: "Покрытие",     icon: "Palette" },
  { id: "extras",      label: "Доп. работы",  icon: "Wrench" },
  { id: "contacts",    label: "Контакты",     icon: "User" },
];

// ── Компонент ─────────────────────────────────────────────────────
export default function CalculatorWizard() {
  const [calc, setCalc] = useState<CalcInput>(DEFAULT_CALC);
  const [stepIdx, setStepIdx] = useState(0);
  const [orderNum] = useState(() => nextOrderNumber());

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCity, setClientCity] = useState("Москва");
  const [agree, setAgree] = useState(true);

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<null | {
    orderNum: string;
    channels: { maxManager: boolean; maxClient: boolean; emailManager: boolean; emailClient: boolean };
    maxLink: string;
  }>(null);
  const [err, setErr] = useState("");

  const isCanopy = calc.objectType === "canopy";
  const steps = isCanopy ? CANOPY_STEPS : FENCE_STEPS;
  const currentStep = steps[Math.min(stepIdx, steps.length - 1)].id;

  const set = (p: Partial<CalcInput>) => setCalc(c => ({ ...c, ...p }));
  const result = useMemo(() => calculate(calc), [calc]);

  // ── Навигация ───────────────────────────────────────────────────
  const goNext = () => setStepIdx(i => Math.min(i + 1, steps.length - 1));
  const goBack = () => setStepIdx(i => Math.max(i - 1, 0));
  const goTo = (id: string) => {
    const i = steps.findIndex(s => s.id === id);
    if (i >= 0) setStepIdx(i);
  };

  // При смене типа объекта — возврат на 2-й шаг и сброс ненужного состояния
  const handleObjectChange = (type: ObjectType) => {
    set({ objectType: type });
    setStepIdx(1);
  };

  // ── Отправка заявки + PDF ───────────────────────────────────────
  const handleSubmit = async () => {
    setErr("");
    const phoneOk = isPhoneValid(clientPhone);
    const emailOk = !clientEmail.trim() || isEmailValid(clientEmail);
    if (!phoneOk) { setErr("Введите корректный телефон в формате +7 (XXX) XXX-XX-XX"); return; }
    if (!emailOk) { setErr("Email указан некорректно"); return; }
    if (!agree)   { setErr("Нужно согласие на обработку персональных данных"); return; }

    setSending(true);
    try {
      // 1) Генерируем PDF КП
      let pdfBase64 = "";
      try {
        const dataUri = await generateKpPDF(
          orderNum,
          result.lineItems,
          result.total,
          result.kpParams,
          { returnBase64: true }
        );
        if (typeof dataUri === "string") pdfBase64 = dataUri;
      } catch (e) {
        console.warn("PDF не сгенерирован, отправим заявку без него", e);
      }

      // 2) Отправляем на бэкенд: он сам найдёт клиента в MAX по номеру
      //    и отправит КП ему + менеджеру в MAX + копии на email
      const res = await sendLead({
        order_num:   orderNum,
        name:        clientName.trim() || "—",
        phone:       phoneE164(clientPhone),
        email:       clientEmail.trim(),
        city:        clientCity.trim(),
        address:     "",
        object_type: OBJECT_LABELS[calc.objectType],
        total_rub:   Math.round(result.total),
        payload: {
          source: "Калькулятор (wizard)",
          object_type: OBJECT_LABELS[calc.objectType],
          params: result.kpParams,
          items: result.lineItems,
          economics: result.econ,
          delivery_cost: result.deliveryCost,
          discount: result.discount,
          submitted_at: new Date().toISOString(),
        },
        pdf_base64: pdfBase64,
      });

      if (res?.ok) {
        setSent({
          orderNum: res.order_num || orderNum,
          channels: {
            maxManager:   Boolean(res.delivered),
            maxClient:    Boolean(res.client_notified),
            emailManager: Boolean(res.email_sent),
            emailClient:  Boolean(res.client_email_sent),
          },
          maxLink: (res as { max_link?: string }).max_link || "",
        });
        toast.success(`Заявка №${res.order_num || orderNum} принята`, {
          description: "Менеджер свяжется в течение 15 минут",
        });
      } else {
        setErr(`Не удалось отправить. Позвоните: ${COMPANY.phone}`);
      }
    } catch {
      setErr(`Ошибка сети. Позвоните: ${COMPANY.phone}`);
    } finally {
      setSending(false);
    }
  };

  // ── ЭКРАН УСПЕХА ────────────────────────────────────────────────
  if (sent) {
    return (
      <div className="text-center py-8 sm:py-12 px-4 max-w-2xl mx-auto">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-500/15 border-2 border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-5 animate-in zoom-in-50 duration-500">
          <Icon name="CheckCircle2" size={48} className="text-green-400" />
        </div>
        <h3 className="font-oswald font-bold text-2xl sm:text-3xl text-white mb-2">
          Заявка оформлена!
        </h3>
        <p className="text-white/60 mb-6">
          Спасибо, мы вас не подведём — менеджер свяжется в течение 15 минут.
        </p>

        <div className="inline-block bg-[#0d1017] border-2 border-orange-500/30 rounded-2xl px-6 py-4 mb-6">
          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Номер заявки</div>
          <div className="font-mono font-bold text-orange-400 text-2xl">{sent.orderNum}</div>
          <div className="text-white/40 text-xs mt-1">Сумма по КП: <b className="text-white">{fmtRub(result.total)}</b></div>
        </div>

        <div className="bg-[#0d1017] border border-[#1e2230] rounded-2xl p-4 sm:p-5 max-w-md mx-auto mb-6 text-left space-y-2.5">
          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Куда отправлено</div>

          {/* Клиенту — MAX приоритетнее, email — резерв */}
          {sent.channels.maxClient ? (
            <Channel ok label="КП отправлено вам в MAX" icon="MessageCircle" />
          ) : sent.channels.emailClient ? (
            <Channel ok label="КП отправлено на ваш email (вы не зарегистрированы в MAX)" icon="Mail" />
          ) : (
            <Channel ok={false} label="Менеджер пришлёт КП при звонке" icon="PhoneCall" />
          )}

          {/* Менеджеру — параллельно в MAX и на email */}
          <Channel ok={sent.channels.maxManager}   label="Заявка передана менеджеру в MAX" icon="UserCheck" />
          <Channel ok={sent.channels.emailManager} label="Email менеджеру с КП в PDF"      icon="Send" />
        </div>

        {/* Если КП не доставлено в MAX — даём клиенту ссылку на бота */}
        {!sent.channels.maxClient && sent.maxLink && (
          <a
            href={`${sent.maxLink}${sent.maxLink.includes("?") ? "&" : "?"}start=${encodeURIComponent("КП-" + sent.orderNum)}`}
            target="_blank" rel="noopener noreferrer"
            className="block bg-orange-500/10 border border-orange-500/40 hover:bg-orange-500/20 rounded-xl px-5 py-4 mb-5 max-w-md mx-auto transition-colors"
          >
            <div className="flex items-center justify-center gap-2 text-orange-300 font-medium">
              <Icon name="MessageCircle" size={18} />
              Получить КП в MAX
            </div>
            <div className="text-[11px] text-orange-300/60 mt-1">
              Нажмите — откроется чат с ботом, и он сразу пришлёт ваше КП в PDF
            </div>
          </a>
        )}

        <button
          onClick={() => {
            setSent(null);
            setStepIdx(0);
            setCalc(DEFAULT_CALC);
            setClientName(""); setClientPhone(""); setClientEmail("");
          }}
          className="btn-outline-orange px-6 py-3 rounded-xl text-sm"
        >
          Новый расчёт
        </button>
      </div>
    );
  }

  // ── ОСНОВНОЙ UI ─────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
      {/* ── Левая колонка: шаги + контент ── */}
      <div className="lg:col-span-3">
        {/* Индикатор прогресса */}
        <Progress steps={steps as readonly { id: string; label: string; icon: string }[]} currentIdx={stepIdx} onJump={goTo} />

        {/* Контент шага */}
        <div className="bg-[#0d1017] border border-[#1e2230] rounded-2xl p-4 sm:p-6 mt-4 min-h-[280px]">
          {currentStep === "object" && (
            <StepObject value={calc.objectType} onChange={handleObjectChange} />
          )}

          {/* ── ЗАБОР ── */}
          {!isCanopy && currentStep === "size" && (
            <StepSize calc={calc} set={set} />
          )}
          {!isCanopy && currentStep === "post" && (
            <StepPost value={calc.postId} onChange={v => set({ postId: v })} />
          )}
          {!isCanopy && currentStep === "lag" && (
            <StepLag calc={calc} set={set} />
          )}
          {!isCanopy && currentStep === "filling" && (
            <StepFilling calc={calc} set={set} />
          )}
          {!isCanopy && currentStep === "coating" && (
            <StepCoating calc={calc} set={set} />
          )}
          {!isCanopy && currentStep === "foundation" && (
            <StepFoundation value={calc.foundId} onChange={v => set({ foundId: v })} />
          )}
          {!isCanopy && currentStep === "gates" && (
            <StepGates calc={calc} set={set} />
          )}
          {!isCanopy && currentStep === "wickets" && (
            <StepWickets calc={calc} set={set} />
          )}

          {/* ── НАВЕС ── */}
          {isCanopy && currentStep === "canopyType" && (
            <StepCanopyType value={calc.canopyType} onChange={v => set({ canopyType: v })} />
          )}
          {isCanopy && currentStep === "canopySize" && (
            <StepCanopySize calc={calc} set={set} area={result.canopyArea} />
          )}
          {isCanopy && currentStep === "canopyCover" && (
            <StepCanopyCover value={calc.canopyCoverId} onChange={v => set({ canopyCoverId: v })} />
          )}

          {/* ── ОБЩЕЕ ── */}
          {currentStep === "extras" && (
            <StepExtras calc={calc} set={set} matSum={result.matSum} fenceArea={result.fenceArea} />
          )}
          {currentStep === "contacts" && (
            <StepContacts
              name={clientName} phone={clientPhone} email={clientEmail} city={clientCity}
              agree={agree}
              setName={setClientName} setPhone={setClientPhone} setEmail={setClientEmail} setCity={setClientCity}
              setAgree={setAgree}
              err={err}
              calc={calc} set={set}
            />
          )}
        </div>

        {/* Навигация */}
        <div className="flex items-center justify-between gap-3 mt-4">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIdx === 0}
            className="px-4 sm:px-5 py-3 rounded-xl border border-[#1e2230] text-white/70 hover:text-white hover:border-orange-500/40 disabled:opacity-30 disabled:cursor-not-allowed text-sm flex items-center gap-2"
          >
            <Icon name="ChevronLeft" size={16} /> Назад
          </button>

          {currentStep !== "contacts" ? (
            <button
              type="button"
              onClick={goNext}
              className="btn-orange flex-1 sm:flex-none px-6 sm:px-8 py-3 rounded-xl text-sm"
            >
              <span className="flex items-center gap-2 justify-center">
                Далее <Icon name="ChevronRight" size={16} />
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={sending}
              className="btn-orange flex-1 sm:flex-none px-6 sm:px-8 py-3 rounded-xl text-sm disabled:opacity-60"
            >
              <span className="flex items-center gap-2 justify-center">
                <Icon name={sending ? "Loader" : "Send"} size={16} className={sending ? "animate-spin" : ""} />
                {sending ? "Отправляем…" : "Отправить заявку с КП"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Правая колонка: предварительный итог ── */}
      <div className="lg:col-span-2">
        <SummaryPanel
          calc={calc}
          orderNum={orderNum}
          result={result}
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
//  Подкомпоненты UI
// ────────────────────────────────────────────────────────────────────

function Progress({
  steps, currentIdx, onJump,
}: {
  steps: readonly { id: string; label: string; icon: string }[];
  currentIdx: number;
  onJump: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto -mx-2 px-2 pb-2 scrollbar-thin">
      <div className="flex items-center gap-1.5 min-w-max">
        {steps.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => i <= currentIdx && onJump(s.id)}
              disabled={i > currentIdx}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all ${
                active
                  ? "bg-orange-500 text-gray-900 shadow-md shadow-orange-500/30"
                  : done
                    ? "bg-orange-500/15 text-orange-300 hover:bg-orange-500/25"
                    : "bg-[#1a1f2e] text-white/35"
              }`}
            >
              <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold ${
                active ? "bg-gray-900 text-orange-400" : done ? "bg-orange-500 text-gray-900" : "bg-white/10"
              }`}>
                {done ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepHeader({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-9 h-9 bg-orange-500/15 rounded-xl flex items-center justify-center">
          <Icon name={icon} size={18} className="text-orange-400" />
        </div>
        <h3 className="font-oswald font-bold text-lg sm:text-xl text-white">{title}</h3>
      </div>
      {hint && <p className="text-white/45 text-xs sm:text-sm">{hint}</p>}
    </div>
  );
}

// Карточка выбора (универсальная)
function ChoiceCard({
  active, title, desc, badge, onClick, icon,
}: {
  active: boolean;
  title: string;
  desc?: string;
  badge?: string;
  icon?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all ${
        active
          ? "border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10"
          : "border-[#1e2230] bg-[#0a0c10] hover:border-orange-500/50 hover:bg-orange-500/5"
      }`}
    >
      {badge && (
        <div className="absolute -top-2 right-3 bg-orange-500 text-gray-900 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
          {badge}
        </div>
      )}
      <div className="flex items-start gap-2.5">
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            active ? "bg-orange-500 text-gray-900" : "bg-orange-500/15 text-orange-400"
          }`}>
            <Icon name={icon} size={16} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm ${active ? "text-white" : "text-white/85"}`}>{title}</div>
          {desc && <div className="text-white/45 text-[11px] sm:text-xs mt-0.5 leading-snug">{desc}</div>}
        </div>
        {active && <Icon name="Check" size={16} className="text-orange-400 flex-shrink-0 mt-1" />}
      </div>
    </button>
  );
}

// Слайдер с подписями
function RangeRow({
  label, value, min, max, step = 1, unit = "м", onChange,
}: {
  label: string;
  value: number;
  min: number; max: number; step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="bg-[#0a0c10] border border-[#1e2230] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-white/80 font-medium">{label}</div>
        <div className="bg-orange-500/15 border border-orange-500/30 px-3 py-1 rounded-lg text-orange-400 font-bold text-sm">
          {value} {unit}
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-orange-500 cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-white/30 mt-1">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

// ── ШАГИ ─────────────────────────────────────────────────────────

function StepObject({ value, onChange }: { value: ObjectType; onChange: (v: ObjectType) => void }) {
  return (
    <div>
      <StepHeader icon="Layers" title="Что считаем?" hint="Выберите тип объекта — мы покажем только нужные поля" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {(Object.keys(OBJECT_LABELS) as ObjectType[]).map(k => (
          <ChoiceCard
            key={k}
            active={value === k}
            title={OBJECT_LABELS[k]}
            icon={OBJECT_ICONS[k]}
            badge={k === "profnastil" ? "Популярно" : undefined}
            onClick={() => onChange(k)}
          />
        ))}
      </div>
    </div>
  );
}

function StepSize({ calc, set }: { calc: CalcInput; set: (p: Partial<CalcInput>) => void }) {
  return (
    <div>
      <StepHeader icon="Ruler" title="Размеры забора" hint="Укажите периметр участка и желаемую высоту забора" />
      <div className="space-y-3">
        <RangeRow label="Периметр (длина забора)" value={calc.fenceLength} min={5} max={300} unit="м"
          onChange={v => set({ fenceLength: v })} />
        <RangeRow label="Высота забора" value={calc.fenceHeight} min={1} max={3} step={0.1} unit="м"
          onChange={v => set({ fenceHeight: parseFloat(v.toFixed(1)) })} />
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg px-3 py-2 text-xs text-orange-300/80">
          <Icon name="Info" size={12} className="inline mr-1" />
          Если будут ворота/калитки — их ширина автоматически вычтется из периметра на следующих шагах.
        </div>
      </div>
    </div>
  );
}

function StepPost({ value, onChange }: { value: CalcInput["postId"]; onChange: (v: CalcInput["postId"]) => void }) {
  return (
    <div>
      <StepHeader icon="AlignVerticalJustifyCenter" title="Столбы (профтруба)" hint="Сечение опор. Влияет на ветровую нагрузку и срок службы." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {POST_OPTIONS.map(p => (
          <ChoiceCard key={p.id} active={value === p.id} title={p.label} desc={p.desc} onClick={() => onChange(p.id)} />
        ))}
      </div>
    </div>
  );
}

function StepLag({ calc, set }: { calc: CalcInput; set: (p: Partial<CalcInput>) => void }) {
  return (
    <div>
      <StepHeader icon="Minus" title="Лаги (поперечины)" hint="Тип лаги и количество рядов между столбами" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
        {LAG_OPTIONS.map(l => (
          <ChoiceCard key={l.id} active={calc.lagId === l.id} title={l.label} desc={l.desc} onClick={() => set({ lagId: l.id })} />
        ))}
      </div>
      <div className="text-xs text-white/50 mb-2 uppercase tracking-wider">Количество рядов</div>
      <div className="grid grid-cols-3 gap-2">
        {[2, 3, 4].map(n => (
          <button key={n} type="button" onClick={() => set({ lagRows: n })}
            className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
              calc.lagRows === n
                ? "border-orange-500 bg-orange-500/10 text-white"
                : "border-[#1e2230] bg-[#0a0c10] text-white/60 hover:border-orange-500/40"
            }`}>
            {n} ряда
          </button>
        ))}
      </div>
    </div>
  );
}

function StepFilling({ calc, set }: { calc: CalcInput; set: (p: Partial<CalcInput>) => void }) {
  const isProf = calc.objectType === "profnastil";
  const isShtak = calc.objectType === "shtak";

  if (isProf) {
    return (
      <div>
        <StepHeader icon="LayoutGrid" title="Марка профлиста" hint="С8/С10 — для забора, С20/НС35 — для жёстких конструкций" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PROFLIST_OPTIONS.map(p => (
            <ChoiceCard key={p.id} active={calc.proflistId === p.id}
              title={p.label} desc={`${p.desc} · ${p.priceM2} ₽/м²`}
              badge={p.id === "C10" ? "Топ" : undefined}
              onClick={() => set({ proflistId: p.id })} />
          ))}
        </div>
      </div>
    );
  }
  if (isShtak) {
    return (
      <div>
        <StepHeader icon="LayoutGrid" title="Тип штакетника + зазор" hint="Форма планки и расстояние между ними" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
          {SHTAK_OPTIONS.map(s => (
            <ChoiceCard key={s.id} active={calc.shtakId === s.id}
              title={s.label} desc={`${s.desc} · ${s.pricePerM} ₽/м`}
              onClick={() => set({ shtakId: s.id })} />
          ))}
        </div>
        <RangeRow label="Зазор между планками"
          value={calc.shtakGap} min={0} max={100} unit="мм"
          onChange={v => set({ shtakGap: Math.round(v) })} />
      </div>
    );
  }
  // Остальные типы (3d, kovka, setka) — нечего выбирать в наполнении, цена фиксированная
  const FIXED: Record<string, { name: string; price: string; desc: string }> = {
    "3d":    { name: "3D-сетка сварная",       price: "1 600 ₽/м²", desc: "Прутки 4–5 мм, оцинковка + порошок" },
    kovka:   { name: "Ковка художественная",   price: "4 500 ₽/м²", desc: "Ручная работа, эксклюзивный рисунок" },
    setka:   { name: "Сетка-рабица",           price: "550 ₽/м²",   desc: "Оцинкованная, ячейка 50×50 мм" },
  };
  const f = FIXED[calc.objectType];
  if (!f) return null;
  return (
    <div>
      <StepHeader icon="LayoutGrid" title="Наполнение" hint="Для этого типа используется фиксированный материал" />
      <div className="bg-orange-500/10 border-2 border-orange-500/30 rounded-2xl p-5">
        <div className="font-oswald font-bold text-xl text-white mb-1">{f.name}</div>
        <div className="text-orange-400 font-bold text-lg mb-2">{f.price}</div>
        <div className="text-white/55 text-sm">{f.desc}</div>
      </div>
    </div>
  );
}

function StepCoating({ calc, set }: { calc: CalcInput; set: (p: Partial<CalcInput>) => void }) {
  // Покрытие имеет смысл только для проф/штакетника
  if (calc.objectType !== "profnastil" && calc.objectType !== "shtak") {
    return (
      <div>
        <StepHeader icon="Palette" title="Покрытие" hint="Для этого типа покрытие выбирается на этапе материала" />
        <div className="bg-[#0a0c10] border border-[#1e2230] rounded-xl p-5 text-center text-white/50 text-sm">
          Нажмите «Далее», чтобы перейти к фундаменту.
        </div>
      </div>
    );
  }
  return (
    <div>
      <StepHeader icon="Palette" title="Тип покрытия" hint="От качества покрытия зависит срок службы (15–30+ лет)" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {COATING_OPTIONS.map(c => (
          <ChoiceCard key={c.id} active={calc.coatingId === c.id}
            title={c.label} desc={c.desc}
            onClick={() => set({ coatingId: c.id })} />
        ))}
      </div>
    </div>
  );
}

function StepFoundation({ value, onChange }: { value: CalcInput["foundId"]; onChange: (v: CalcInput["foundId"]) => void }) {
  return (
    <div>
      <StepHeader icon="Hammer" title="Фундамент / монтаж столбов" hint="Бутование — оптимально по цене/качеству, бетонирование — для тяжёлых заборов" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {FOUND_OPTIONS.map(f => (
          <ChoiceCard key={f.id} active={value === f.id}
            title={f.label} desc={f.desc}
            badge={f.gift ? "В подарок" : undefined}
            onClick={() => onChange(f.id)} />
        ))}
      </div>
    </div>
  );
}

function StepGates({ calc, set }: { calc: CalcInput; set: (p: Partial<CalcInput>) => void }) {
  const has = calc.gateId !== "none";
  return (
    <div>
      <StepHeader icon="DoorOpen" title="Ворота" hint="Тип, ширина и количество ворот в периметре" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
        {GATE_OPTIONS.map(g => (
          <ChoiceCard key={g.id} active={calc.gateId === g.id}
            title={g.label} desc={g.desc || (g.id === "none" ? "Без ворот в периметре" : undefined)}
            onClick={() => set({ gateId: g.id })} />
        ))}
      </div>
      {has && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <RangeRow label="Ширина одних ворот"
            value={calc.gateWidth} min={2} max={10} step={0.5}
            onChange={v => set({ gateWidth: v })} />
          <RangeRow label="Количество ворот"
            value={calc.gateCount} min={1} max={4} unit="шт."
            onChange={v => set({ gateCount: Math.round(v) })} />
        </div>
      )}
    </div>
  );
}

function StepWickets({ calc, set }: { calc: CalcInput; set: (p: Partial<CalcInput>) => void }) {
  const has = calc.wicketId !== "none";
  return (
    <div>
      <StepHeader icon="DoorClosed" title="Калитка" hint="Количество и тип калиток в периметре" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
        {WICKET_OPTIONS.map(w => (
          <ChoiceCard key={w.id} active={calc.wicketId === w.id}
            title={w.label} desc={w.desc || (w.id === "none" ? "Без калитки" : undefined)}
            onClick={() => set({ wicketId: w.id })} />
        ))}
      </div>
      {has && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <RangeRow label="Ширина калитки"
            value={calc.wicketWidth} min={0.8} max={2} step={0.1}
            onChange={v => set({ wicketWidth: parseFloat(v.toFixed(1)) })} />
          <RangeRow label="Количество калиток"
            value={calc.wicketCount} min={1} max={4} unit="шт."
            onChange={v => set({ wicketCount: Math.round(v) })} />
        </div>
      )}
    </div>
  );
}

// ── Навес ────────────────────────────────────────────────────────
function StepCanopyType({ value, onChange }: { value: CalcInput["canopyType"]; onChange: (v: CalcInput["canopyType"]) => void }) {
  return (
    <div>
      <StepHeader icon="Home" title="Форма кровли" hint="Выберите тип конструкции навеса" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {CANOPY_TYPES.map(c => (
          <ChoiceCard key={c.id} active={value === c.id}
            title={c.label} desc={`${c.desc} · ${c.priceM2} ₽/м²`}
            onClick={() => onChange(c.id)} />
        ))}
      </div>
    </div>
  );
}

function StepCanopySize({
  calc, set, area,
}: { calc: CalcInput; set: (p: Partial<CalcInput>) => void; area: number }) {
  return (
    <div>
      <StepHeader icon="Ruler" title="Размеры навеса" hint="Укажите длину и ширину — площадь посчитается автоматически" />
      <div className="space-y-3">
        <RangeRow label="Длина навеса" value={calc.canopyLength} min={2} max={20} step={0.5}
          onChange={v => set({ canopyLength: v })} />
        <RangeRow label="Ширина навеса" value={calc.canopyWidth} min={2} max={12} step={0.5}
          onChange={v => set({ canopyWidth: v })} />
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Icon name="Calculator" size={16} className="text-orange-400" />
            Площадь навеса
          </div>
          <div className="font-oswald font-bold text-2xl text-orange-400">
            {area.toFixed(1)} м²
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCanopyCover({ value, onChange }: { value: CalcInput["canopyCoverId"]; onChange: (v: CalcInput["canopyCoverId"]) => void }) {
  return (
    <div>
      <StepHeader icon="Palette" title="Покрытие кровли" hint="Материал, которым покроется навес сверху" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {CANOPY_COVER.map(c => (
          <ChoiceCard key={c.id} active={value === c.id}
            title={c.label} desc={`+${c.priceM2} ₽/м²`}
            onClick={() => onChange(c.id)} />
        ))}
      </div>
    </div>
  );
}

function StepExtras({ calc, set, matSum, fenceArea }: { calc: CalcInput; set: (p: Partial<CalcInput>) => void; matSum: number; fenceArea: number }) {
  const isCanopy = calc.objectType === "canopy";
  const items = [
    { key: "installation" as const, label: "Монтаж под ключ",     desc: `35% от суммы материалов — ${fmtRub(matSum * 0.35)}`, hide: false },
    { key: "painting"     as const, label: "Порошковая покраска", desc: `280 ₽/м², RAL любой цвет — ${fmtRub(fenceArea * 280)}`, hide: isCanopy },
    { key: "automation"   as const, label: "Автоматика ворот",    desc: calc.gateId !== "none" ? "Привод DoorHan/Nice — 22 000 ₽" : "Сначала выберите ворота на предыдущих шагах", disabled: calc.gateId === "none", hide: isCanopy },
  ].filter(i => !i.hide);

  return (
    <div>
      <StepHeader icon="Wrench" title="Дополнительные работы" hint="Можно выбрать несколько опций" />
      <div className="space-y-2">
        {items.map(({ key, label, desc, disabled }) => {
          const active = Boolean(calc[key]);
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => set({ [key]: !calc[key] } as Partial<CalcInput>)}
              className={`w-full text-left flex items-start gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                disabled ? "opacity-40 cursor-not-allowed" : ""
              } ${active
                ? "border-orange-500 bg-orange-500/10"
                : "border-[#1e2230] bg-[#0a0c10] hover:border-orange-500/40"
              }`}
            >
              <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 ${
                active ? "bg-orange-500 border-orange-500" : "border-[#2a3040]"
              }`}>
                {active && <Icon name="Check" size={14} className="text-gray-900" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{label}</div>
                <div className="text-xs text-white/45 mt-0.5">{desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepContacts({
  name, phone, email, city, agree,
  setName, setPhone, setEmail, setCity, setAgree, err,
  calc, set,
}: {
  name: string; phone: string; email: string; city: string;
  agree: boolean;
  setName: (v: string) => void;
  setPhone: (v: string) => void;
  setEmail: (v: string) => void;
  setCity: (v: string) => void;
  setAgree: (v: boolean) => void;
  err: string;
  calc: CalcInput;
  set: (p: Partial<CalcInput>) => void;
}) {
  return (
    <div>
      <StepHeader icon="User" title="Ваши контакты" hint="Отправим КП в PDF на ваш MAX и email. Менеджер свяжется за 15 минут." />

      {/* Логистика и финансы */}
      <div className="bg-[#0a0c10] border border-[#1e2230] rounded-xl p-3 mb-4 space-y-2.5">
        <div className="text-[11px] text-orange-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Icon name="Truck" size={12} /> Логистика и финансы
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[10px] text-white/45">Расстояние, км</span>
            <input type="number" min={0} value={calc.distanceKm || 0}
              onChange={e => set({ distanceKm: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-full bg-[#141720] border border-[#1e2230] focus:border-orange-500/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
          </label>
          <label className="block">
            <span className="text-[10px] text-white/45">Скидка клиенту, %</span>
            <input type="number" min={0} max={50} value={calc.discountPct || 0}
              onChange={e => set({ discountPct: Math.min(50, Math.max(0, parseInt(e.target.value) || 0)) })}
              className="w-full bg-[#141720] border border-[#1e2230] focus:border-orange-500/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
          </label>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={!!calc.oversize}
            onChange={e => set({ oversize: e.target.checked })}
            className="w-4 h-4 accent-orange-500 cursor-pointer" />
          <span className="text-xs text-white/65">Негабаритный груз (+20% к доставке)</span>
        </label>
      </div>

      <div className="space-y-3">
        <input type="text" placeholder="Ваше имя" value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-[#0a0c10] border-2 border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none" />
        <PhoneInput value={phone} onChange={setPhone} />
        <input type="email" inputMode="email" autoComplete="email"
          placeholder="Email — пришлём КП в PDF (необязательно)"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-[#0a0c10] border-2 border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none" />
        <input type="text" placeholder="Город (Люберцы, Истра…)"
          value={city}
          onChange={e => setCity(e.target.value)}
          className="w-full bg-[#0a0c10] border-2 border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none" />

        <label className="flex items-start gap-2 cursor-pointer select-none pt-1">
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-orange-500 cursor-pointer flex-shrink-0" />
          <span className="text-[11px] text-white/55 leading-relaxed">
            Согласен с обработкой <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">персональных данных</a>
          </span>
        </label>

        {err && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-red-300 text-xs text-center">
            {err}
          </div>
        )}

        <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 text-[11px] text-white/55 flex items-start gap-2">
          <Icon name="ShieldCheck" size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
          <span>
            После отправки заявки мы найдём вас по номеру в MAX и пришлём <b className="text-orange-300">КП в PDF</b> прямо в личку,
            копия — на email. Менеджер также получит вашу заявку в MAX.
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Канал доставки ────────────────────────────────────────────────
function Channel({ ok, label, icon }: { ok: boolean; label: string; icon: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
      ok
        ? "bg-green-500/10 border-green-500/30 text-green-300"
        : "bg-[#1a1f2e] border-[#1e2230] text-white/35"
    }`}>
      <Icon name={ok ? "CheckCircle2" : icon} size={14} className={ok ? "text-green-400" : "text-white/30"} />
      <span className="flex-1 truncate">{label}</span>
    </div>
  );
}

// ── Строка внутренней экономики ──────────────────────────────────
function EconRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-white/50">{label}</span>
      <span className={accent ? "text-amber-400 font-bold" : "text-white/80 font-medium"}>{value}</span>
    </div>
  );
}

// ── Боковая панель с итогом ──────────────────────────────────────
function SummaryPanel({
  calc, orderNum, result,
}: {
  calc: CalcInput;
  orderNum: string;
  result: ReturnType<typeof calculate>;
}) {
  const isAdmin = useIsAdmin();
  return (
    <div className="bg-[#0a0c10] border-2 border-orange-500/30 rounded-2xl p-5 lg:sticky lg:top-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="section-tag mb-0">Предварительный расчёт</div>
          <div className="text-xs text-white/30">Точная цена ±5–15% после замера</div>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-2.5 py-1.5 text-right">
          <div className="text-[9px] text-white/40 uppercase">КП</div>
          <div className="font-mono font-bold text-orange-400 text-[11px]">{orderNum}</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 mb-4 text-gray-900">
        <div className="text-[10px] uppercase tracking-widest opacity-70 mb-1">Итоговая стоимость</div>
        <div className="font-oswald font-bold text-3xl sm:text-4xl leading-none">{fmtRub(result.total)}</div>
        <div className="text-[11px] mt-1.5 opacity-75">{OBJECT_LABELS[calc.objectType]}</div>
      </div>

      {/* Внутренняя экономика — только для менеджера (админа) */}
      {isAdmin && (
        <div className="bg-[#141720] border border-amber-500/30 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-2">
            <Icon name="Lock" size={11} /> Экономика (видит только менеджер)
          </div>
          <div className="space-y-1 text-[11px]">
            <EconRow label="Себестоимость материалов" value={fmtRub(result.econ.materialsCost)} />
            <EconRow label="ФОТ бригады (50%)" value={fmtRub(result.econ.fot)} />
            <EconRow label="Стоимость работ" value={fmtRub(result.econ.workTotal)} />
            {result.deliveryCost > 0 && <EconRow label="Доставка" value={fmtRub(result.deliveryCost)} />}
            {result.discount > 0 && <EconRow label="Скидка клиенту" value={"−" + fmtRub(result.discount)} />}
            {result.econ.minTopUp > 0 && <EconRow label="Доплата до минималки" value={fmtRub(result.econ.minTopUp)} />}
            <div className="border-t border-[#1e2230] my-1.5" />
            <EconRow label="Выгода производства" value={fmtRub(result.econ.profit)} accent />
            <EconRow label="Маржа" value={result.econ.marginPct + "%"} accent />
          </div>
        </div>
      )}

      <div className="space-y-2 mb-4 max-h-[260px] overflow-y-auto pr-1">
        {result.lineItems.map((it, i) => (
          <div key={i} className="flex items-start justify-between gap-2 py-2 border-b border-[#1e2230] last:border-0">
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm text-white/80 leading-snug">{it.label}</div>
              {it.qty && <div className="text-[10px] text-white/35 mt-0.5">{it.qty}</div>}
            </div>
            <div className={`text-xs sm:text-sm font-bold whitespace-nowrap ${
              it.isGift || it.value === 0 ? "text-orange-400" : "text-white"
            }`}>
              {it.isGift || it.value === 0 ? "🎁" : fmtRub(it.value)}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] text-white/45 pt-3 border-t border-[#1e2230]">
        <div>
          <Icon name="Clock" size={12} className="text-orange-400 mx-auto mb-1" />
          15 мин звонок
        </div>
        <div>
          <Icon name="Truck" size={12} className="text-orange-400 mx-auto mb-1" />
          Доставка РФ
        </div>
        <div>
          <Icon name="ShieldCheck" size={12} className="text-orange-400 mx-auto mb-1" />
          Гарантия 5 лет
        </div>
      </div>
    </div>
  );
}