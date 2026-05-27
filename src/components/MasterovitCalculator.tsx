import { useState, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { sendLead } from "@/lib/api";
import { toast } from "sonner";

/* ─────────────── Конфиг калькулятора в стиле Мастеровит ───────────────
   4 шага: тип забора → высота → длина и опции → контакты + итог */

interface FenceType {
  id: string;
  label: string;
  icon: string;
  emoji: string;
  pricePerMeter: number;  // ₽/м.п., базовая высота 1.8 м, полимер
  desc: string;
}

const TYPES: FenceType[] = [
  { id: "profnastil",  label: "Профнастил",     icon: "Square",       emoji: "🏠", pricePerMeter: 1450, desc: "Глухой, антивандальный" },
  { id: "shtaketnik",  label: "Евроштакетник",  icon: "AlignJustify", emoji: "🌳", pricePerMeter: 1850, desc: "Полупрозрачный, дышит" },
  { id: "3d-setka",    label: "3D-сетка",       icon: "Grid",         emoji: "🌐", pricePerMeter: 1200, desc: "Эконом, прочный" },
  { id: "rabitsa",     label: "Рабица",         icon: "Network",      emoji: "📐", pricePerMeter: 650,  desc: "Для дачи" },
  { id: "kovka",       label: "Ковка",          icon: "Crown",        emoji: "👑", pricePerMeter: 4800, desc: "Премиум" },
];

const HEIGHTS = [
  { id: 1.5, label: "1.5 м", multiplier: 0.85 },
  { id: 1.8, label: "1.8 м", multiplier: 1.00 },
  { id: 2.0, label: "2.0 м", multiplier: 1.15 },
  { id: 2.5, label: "2.5 м", multiplier: 1.40 },
];

const FOUNDATIONS = [
  { id: "but",      label: "Бутование щебнем",      pricePerPost: 800,  desc: "Сухой грунт" },
  { id: "beton",    label: "Бетонирование",          pricePerPost: 1400, desc: "Универсал", recommend: true },
  { id: "rostverk", label: "Ростверк ленточный",     pricePerPost: 2200, desc: "Под кирпич" },
  { id: "svai",     label: "Винтовые сваи",          pricePerPost: 2400, desc: "Болото, торф" },
];

const EXTRAS = [
  { id: "kalitka",   label: "Калитка",           price: 7500,  icon: "DoorOpen" },
  { id: "raspashka", label: "Распашные ворота",   price: 28000, icon: "PanelTop" },
  { id: "otkat",     label: "Откатные ворота",    price: 45000, icon: "MoveHorizontal" },
  { id: "auto",      label: "Автоматика DoorHan", price: 22000, icon: "Zap" },
  { id: "demont",    label: "Демонтаж старого",    price: 200,   icon: "Trash2", perMeter: true },
];

export default function MasterovitCalculator() {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<FenceType>(TYPES[0]);
  const [height, setHeight] = useState(HEIGHTS[1]);
  const [length, setLength] = useState(40);
  const [foundation, setFoundation] = useState(FOUNDATIONS[1]);
  const [extras, setExtras] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const total = useMemo(() => {
    const postStep = 2.7; // средний шаг столбов
    const posts = Math.ceil(length / postStep) + 1;
    const fencePrice = Math.round(type.pricePerMeter * height.multiplier * length);
    const foundationPrice = foundation.pricePerPost * posts;
    let extrasPrice = 0;
    extras.forEach(eid => {
      const e = EXTRAS.find(x => x.id === eid);
      if (!e) return;
      extrasPrice += e.perMeter ? e.price * length : e.price;
    });
    return {
      fence: fencePrice,
      foundation: foundationPrice,
      extras: extrasPrice,
      posts,
      total: fencePrice + foundationPrice + extrasPrice,
    };
  }, [type, height, length, foundation, extras]);

  const next = () => setStep(s => Math.min(s + 1, 4));
  const prev = () => setStep(s => Math.max(s - 1, 1));

  const toggleExtra = (id: string) => {
    setExtras(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const submit = async () => {
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      toast.error("Введите корректный телефон");
      return;
    }
    setSending(true);
    const message = [
      `Калькулятор:`,
      `• Тип: ${type.label}`,
      `• Высота: ${height.label}`,
      `• Длина: ${length} м`,
      `• Фундамент: ${foundation.label}`,
      `• Доп.: ${extras.size ? [...extras].map(id => EXTRAS.find(e => e.id === id)?.label).filter(Boolean).join(", ") : "нет"}`,
      `• ИТОГО: ${total.total.toLocaleString("ru-RU")} ₽`,
    ].join("\n");
    try {
      await sendLead({ name: name || "Клиент", phone, message, source: "calculator" });
      setSent(true);
      toast.success("Заявка отправлена! Перезвоним через 15 минут");
    } catch {
      toast.error("Не удалось отправить");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-w-5xl mx-auto">
      {/* Прогресс */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 sm:p-6 text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-oswald font-bold text-xl sm:text-2xl">КАЛЬКУЛЯТОР СТОИМОСТИ</h3>
          <span className="text-sm font-semibold opacity-90">Шаг {step} из 4</span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map(n => (
            <div
              key={n}
              className={`h-1.5 flex-1 rounded-full transition-all ${n <= step ? "bg-white" : "bg-white/30"}`}
            />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3 text-[11px] sm:text-xs font-semibold opacity-90">
          <div className={step >= 1 ? "" : "opacity-50"}>1. Тип</div>
          <div className={step >= 2 ? "" : "opacity-50"}>2. Высота</div>
          <div className={step >= 3 ? "" : "opacity-50"}>3. Длина и опции</div>
          <div className={step >= 4 ? "" : "opacity-50"}>4. Итог</div>
        </div>
      </div>

      <div className="p-5 sm:p-8">
        {/* ШАГ 1: ТИП */}
        {step === 1 && (
          <div>
            <h4 className="font-oswald font-bold text-xl text-gray-900 mb-1">Какой забор вам нужен?</h4>
            <p className="text-gray-500 text-sm mb-5">Выберите материал для забора</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {TYPES.map(t => {
                const isActive = t.id === type.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setType(t)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isActive
                        ? "border-orange-500 bg-orange-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-orange-300"
                    }`}
                  >
                    <div className="text-3xl mb-2">{t.emoji}</div>
                    <div className="font-bold text-gray-900 text-sm">{t.label}</div>
                    <div className="text-[11px] text-gray-500 mt-1">{t.desc}</div>
                    <div className="text-orange-600 font-bold text-sm mt-2">
                      от {t.pricePerMeter.toLocaleString("ru-RU")} ₽/м
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ШАГ 2: ВЫСОТА */}
        {step === 2 && (
          <div>
            <h4 className="font-oswald font-bold text-xl text-gray-900 mb-1">Какая высота забора?</h4>
            <p className="text-gray-500 text-sm mb-5">Стандарт — 1.8 м, для максимальной приватности — 2.0 м</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {HEIGHTS.map(h => {
                const isActive = h.id === height.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => setHeight(h)}
                    className={`p-5 rounded-xl border-2 text-center transition-all ${
                      isActive
                        ? "border-orange-500 bg-orange-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-orange-300"
                    }`}
                  >
                    <div className="font-oswald font-bold text-2xl text-gray-900">{h.label}</div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      ×{h.multiplier} к цене
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ШАГ 3: ДЛИНА + ФУНДАМЕНТ + ОПЦИИ */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h4 className="font-oswald font-bold text-xl text-gray-900 mb-1">Длина забора</h4>
              <p className="text-gray-500 text-sm mb-4">Передвиньте ползунок или введите вручную</p>
              <div className="flex items-center gap-4 mb-3">
                <input
                  type="range"
                  min={5}
                  max={300}
                  step={1}
                  value={length}
                  onChange={e => setLength(+e.target.value)}
                  className="flex-1 accent-orange-500"
                />
                <div className="flex items-center gap-2 bg-orange-50 border-2 border-orange-500 rounded-lg px-4 py-2">
                  <input
                    type="number"
                    value={length}
                    min={5}
                    max={500}
                    onChange={e => setLength(Math.max(5, Math.min(500, +e.target.value || 5)))}
                    className="w-16 text-center font-oswald font-bold text-xl text-gray-900 bg-transparent focus:outline-none"
                  />
                  <span className="text-gray-700 font-semibold">м</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-oswald font-bold text-xl text-gray-900 mb-1">Тип фундамента</h4>
              <p className="text-gray-500 text-sm mb-4">Подбираем по типу грунта на участке</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FOUNDATIONS.map(f => {
                  const isActive = f.id === foundation.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFoundation(f)}
                      className={`p-3 rounded-xl border-2 text-left relative transition-all ${
                        isActive
                          ? "border-orange-500 bg-orange-50 shadow-md"
                          : "border-gray-200 bg-white hover:border-orange-300"
                      }`}
                    >
                      {f.recommend && (
                        <span className="absolute -top-2 left-2 text-[9px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">
                          СОВЕТУЕМ
                        </span>
                      )}
                      <div className="font-bold text-gray-900 text-sm">{f.label}</div>
                      <div className="text-[11px] text-gray-500 mt-1">{f.desc}</div>
                      <div className="text-orange-600 text-xs font-bold mt-1">
                        +{f.pricePerPost} ₽/столб
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="font-oswald font-bold text-xl text-gray-900 mb-1">Дополнительно</h4>
              <p className="text-gray-500 text-sm mb-4">Опционально — можно выбрать несколько</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {EXTRAS.map(e => {
                  const isActive = extras.has(e.id);
                  return (
                    <button
                      key={e.id}
                      onClick={() => toggleExtra(e.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        isActive
                          ? "border-orange-500 bg-orange-50 shadow-md"
                          : "border-gray-200 bg-white hover:border-orange-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon name={e.icon} size={16} className="text-orange-500" />
                        {isActive && <Icon name="CheckCircle" size={14} className="text-orange-500 ml-auto" />}
                      </div>
                      <div className="font-bold text-gray-900 text-xs">{e.label}</div>
                      <div className="text-orange-600 text-xs font-bold mt-0.5">
                        +{e.price.toLocaleString("ru-RU")} {e.perMeter ? "₽/м" : "₽"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ШАГ 4: ИТОГ + КОНТАКТЫ */}
        {step === 4 && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-oswald font-bold text-xl text-gray-900 mb-3">Ваш расчёт</h4>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Забор {type.label} {height.label}</span>
                  <span className="font-bold text-gray-900">{total.fence.toLocaleString("ru-RU")} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Фундамент ({total.posts} столбов)</span>
                  <span className="font-bold text-gray-900">{total.foundation.toLocaleString("ru-RU")} ₽</span>
                </div>
                {total.extras > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Дополнительно</span>
                    <span className="font-bold text-gray-900">{total.extras.toLocaleString("ru-RU")} ₽</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-gray-300">
                  <span className="font-oswald font-bold text-lg text-gray-900">ИТОГО</span>
                  <span className="font-oswald font-bold text-2xl text-orange-600">
                    {total.total.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-3">
                * Цена ориентировочная. Точная стоимость — после бесплатного замера на участке.
              </p>
            </div>

            <div>
              <h4 className="font-oswald font-bold text-xl text-gray-900 mb-3">
                Получите точный расчёт за 15 минут
              </h4>
              {!sent ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Как к вам обращаться"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="+7 (___) ___-__-__"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                  <button
                    onClick={submit}
                    disabled={sending}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 shadow-md"
                  >
                    {sending ? (
                      <><Icon name="Loader" size={16} className="animate-spin" /> Отправка…</>
                    ) : (
                      <><Icon name="Phone" size={16} /> Получить расчёт</>
                    )}
                  </button>
                  <p className="text-[11px] text-gray-500 text-center">
                    Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 text-center">
                  <Icon name="CheckCircle" size={48} className="text-green-600 mx-auto mb-3" />
                  <div className="font-oswald font-bold text-xl text-gray-900 mb-1">Заявка принята!</div>
                  <div className="text-gray-600 text-sm">Перезвоним в течение 15 минут</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Навигация шагов */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={prev}
            disabled={step === 1}
            className="px-5 py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-400 flex items-center gap-2"
          >
            <Icon name="ChevronLeft" size={16} /> Назад
          </button>
          <div className="text-center hidden sm:block">
            <div className="text-xs text-gray-500">Предварительная цена</div>
            <div className="font-oswald font-bold text-xl text-orange-600">
              {total.total.toLocaleString("ru-RU")} ₽
            </div>
          </div>
          {step < 4 ? (
            <button
              onClick={next}
              className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center gap-2 shadow-md"
            >
              Далее <Icon name="ChevronRight" size={16} />
            </button>
          ) : (
            <div className="w-[100px]" />
          )}
        </div>
      </div>
    </div>
  );
}
