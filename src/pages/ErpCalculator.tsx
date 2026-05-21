import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { erpMe, erpToken } from "@/lib/erp";
import {
  calculate,
  CalcParams,
  CalcResult,
  ServiceKey,
  SERVICE_LABELS,
  PaintLevel,
  SoilType,
} from "@/lib/erp/calc-engine";
import { createDeal, createEstimate, createDocument } from "@/lib/erp-deals";

const SERVICES: ServiceKey[] = [
  "profnastil", "shtaketnik", "mesh3d", "rabitsa", "kovka",
  "otkatnye", "raspashnye", "kalitki",
  "navesy", "besedki", "ploshadki", "zaezd", "fundamenty",
];

const SOILS: { value: SoilType; label: string }[] = [
  { value: "sand", label: "Песок / супесь" },
  { value: "loam", label: "Суглинок (стандарт МО)" },
  { value: "clay", label: "Глина плотная" },
  { value: "peat", label: "Торф / обводнённый" },
  { value: "slope", label: "Склон / перепад" },
];

const PAINTS: { value: PaintLevel; label: string }[] = [
  { value: "base", label: "Эмаль / молотковая (базовый)" },
  { value: "middle", label: "Hammerite 3-в-1 (средний)" },
  { value: "premium", label: "Порошковая (премиум)" },
];

export default function ErpCalculator() {
  const nav = useNavigate();
  const [meReady, setMeReady] = useState(false);
  const [service, setService] = useState<ServiceKey>("profnastil");
  const [params, setParams] = useState<CalcParams>({
    length: 50,
    height: 2.0,
    soil: "loam",
    paint: "middle",
    marginPct: 25,
  });
  const [result, setResult] = useState<CalcResult | null>(null);

  // Клиент
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [city, setCity] = useState("");

  const [saving, setSaving] = useState(false);
  const [savedDeal, setSavedDeal] = useState<{ id: number; deal_num: string } | null>(null);

  useEffect(() => {
    if (!erpToken.get()) { nav("/erp/login"); return; }
    erpMe().then(() => setMeReady(true)).catch(() => nav("/erp/login"));
  }, [nav]);

  useEffect(() => {
    setResult(calculate({ service, params }));
  }, [service, params]);

  const isFence = ["profnastil","shtaketnik","mesh3d","rabitsa","kovka","fundamenty"].includes(service);
  const isGate = ["otkatnye","raspashnye","kalitki"].includes(service);
  const isAreaBased = ["navesy","besedki","ploshadki"].includes(service);
  const isZaezd = service === "zaezd";

  const update = (k: keyof CalcParams, v: unknown) => setParams((p) => ({ ...p, [k]: v }));

  const saveDeal = async () => {
    if (!clientName.trim()) { alert("Укажите имя клиента"); return; }
    if (!result) return;
    setSaving(true);
    try {
      const d = await createDeal({
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        client_address: clientAddress.trim(),
        city: city.trim(),
        service_type: service,
        notes: "Создано из калькулятора ERP",
      });
      await createEstimate({
        deal_id: d.id,
        service_type: service,
        title: `Смета ${SERVICE_LABELS[service]} от ${new Date().toLocaleDateString("ru-RU")}`,
        params: params as Record<string, unknown>,
        items: result.items as unknown as Record<string, unknown>[],
        totals: result.totals as unknown as Record<string, unknown>,
        total_rub: result.totals.total,
        cost_rub: result.totals.cost,
        margin_pct: params.marginPct || 25,
      });
      setSavedDeal({ id: d.id, deal_num: d.deal_num });
    } catch (e) {
      const err = e as Error;
      alert("Ошибка: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const oneClickDocs = async (kind: "tz" | "contract" | "invoice_prepay" | "estimate_pdf") => {
    if (!savedDeal || !result) return;
    try {
      await createDocument({
        deal_id: savedDeal.id,
        doc_type: kind,
        amount: kind === "invoice_prepay" ? Math.round(result.totals.total * 0.5) : undefined,
      });
      alert(`Документ создан. Откройте сделку ${savedDeal.deal_num} в карточке сделки.`);
    } catch (e) {
      const err = e as Error;
      alert("Ошибка: " + err.message);
    }
  };

  if (!meReady) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--dark-bg)" }}>
      {/* Шапка */}
      <header className="border-b border-[#1e2230] bg-[#0a0c10] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/erp" className="text-white/50 hover:text-orange-400 transition-colors">
              <Icon name="ArrowLeft" size={18} />
            </Link>
            <Icon name="Calculator" size={22} className="text-orange-400" />
            <div>
              <div className="font-oswald font-bold text-white text-lg leading-none">Калькулятор смет</div>
              <div className="text-white/40 text-[11px] mt-0.5">Расчёт по нормативам · сохранение в ERP</div>
            </div>
          </div>
          <Link to="/erp" className="text-white/55 hover:text-white text-sm flex items-center gap-1.5">
            <Icon name="LayoutDashboard" size={15} /> К сделкам
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Параметры */}
          <div className="lg:col-span-2 space-y-5">
            {/* Услуга */}
            <Section title="Тип услуги" icon="LayoutGrid">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {SERVICES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setService(s)}
                    className={`text-left px-3 py-2 rounded-xl border-2 text-xs transition-all ${
                      service === s
                        ? "border-orange-500 bg-orange-500/10 text-white"
                        : "border-[#1e2230] bg-[#141720] text-white/65 hover:border-orange-500/40"
                    }`}
                  >
                    {SERVICE_LABELS[s]}
                  </button>
                ))}
              </div>
            </Section>

            {/* Параметры объекта */}
            <Section title="Параметры объекта" icon="Ruler">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isFence && (
                  <>
                    <NumInput label="Длина забора, м" value={params.length || 50} min={5} max={1000} step={1}
                      onChange={(v) => update("length", v)} />
                    <NumInput label="Высота забора, м" value={params.height || 2} min={1.2} max={3.0} step={0.1}
                      onChange={(v) => update("height", v)} />
                  </>
                )}
                {isGate && (
                  <>
                    <NumInput label="Ширина проёма, м" value={params.width || 4} min={1} max={9} step={0.5}
                      onChange={(v) => update("width", v)} />
                    <NumInput label="Высота полотна, м" value={params.height || 2} min={1.5} max={2.5} step={0.1}
                      onChange={(v) => update("height", v)} />
                  </>
                )}
                {isAreaBased && (
                  <NumInput label="Площадь, м²" value={params.area || 24} min={4} max={500} step={1}
                    onChange={(v) => update("area", v)} />
                )}
                {isZaezd && (
                  <>
                    <NumInput label="Длина заезда, м" value={params.length || 6} min={4} max={12} step={1}
                      onChange={(v) => update("length", v)} />
                    <SelectInput label="Диаметр трубы" value={String(params.pipeDiameter || 400)}
                      options={[
                        { value: "300", label: "Ø 300 мм (дренаж)" },
                        { value: "400", label: "Ø 400 мм (ливневая)" },
                        { value: "500", label: "Ø 500 мм (магистраль)" },
                      ]}
                      onChange={(v) => update("pipeDiameter", Number(v) as 300 | 400 | 500)} />
                  </>
                )}
              </div>
            </Section>

            {/* Фундамент и грунт */}
            {(isFence || isGate) && (
              <Section title="Грунт и фундамент" icon="Layers">
                <SelectInput label="Тип грунта на участке" value={params.soil || "loam"}
                  options={SOILS.map((s) => ({ value: s.value, label: s.label }))}
                  onChange={(v) => update("soil", v as SoilType)} />
              </Section>
            )}

            {/* Покраска */}
            {(isFence || isGate || isAreaBased) && (
              <Section title="Защитное покрытие" icon="Palette">
                <SelectInput label="Тип покраски" value={params.paint || "middle"}
                  options={PAINTS.map((p) => ({ value: p.value, label: p.label }))}
                  onChange={(v) => update("paint", v as PaintLevel)} />
              </Section>
            )}

            {/* Автоматика */}
            {isGate && service !== "kalitki" && (
              <Section title="Автоматика" icon="Cpu">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-[#141720] border border-[#1e2230] cursor-pointer hover:border-orange-500/40">
                  <input
                    type="checkbox"
                    checked={!!params.withAutomation}
                    onChange={(e) => update("withAutomation", e.target.checked)}
                    className="accent-orange-500 w-5 h-5"
                  />
                  <div>
                    <div className="text-white font-oswald text-sm">С автоматикой</div>
                    <div className="text-white/40 text-[11px]">Came BX-708 / Nice WINGO + пульты, фотоэлементы</div>
                  </div>
                </label>
              </Section>
            )}

            {/* Клиент и сохранение */}
            <Section title="Клиент (для создания сделки)" icon="User">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextInput label="Имя клиента *" value={clientName} onChange={setClientName} />
                <TextInput label="Телефон" value={clientPhone} onChange={setClientPhone} />
                <TextInput label="Город" value={city} onChange={setCity} />
                <TextInput label="Адрес объекта" value={clientAddress} onChange={setClientAddress} />
              </div>
              {!savedDeal ? (
                <button
                  onClick={saveDeal}
                  disabled={saving || !clientName.trim()}
                  className="mt-4 btn-orange px-5 py-2.5 rounded-xl text-sm disabled:opacity-40 flex items-center gap-2"
                >
                  <Icon name="Save" size={16} />
                  {saving ? "Сохраняем…" : "Создать сделку и сохранить смету"}
                </button>
              ) : (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="CheckCircle2" size={18} className="text-green-400" />
                    <div className="text-white font-oswald">Сделка {savedDeal.deal_num} создана</div>
                  </div>
                  <div className="text-white/55 text-xs mb-3">Создать документы в один клик:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <DocBtn icon="FileText" label="ТЗ" onClick={() => oneClickDocs("tz")} />
                    <DocBtn icon="FileSpreadsheet" label="КП" onClick={() => oneClickDocs("estimate_pdf")} />
                    <DocBtn icon="FileSignature" label="Договор" onClick={() => oneClickDocs("contract")} />
                    <DocBtn icon="Banknote" label="Счёт-аванс 50%" onClick={() => oneClickDocs("invoice_prepay")} />
                  </div>
                  <Link
                    to={`/erp/deals/${savedDeal.id}`}
                    className="mt-3 inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 text-xs"
                  >
                    Открыть карточку сделки <Icon name="ArrowRight" size={13} />
                  </Link>
                </div>
              )}
            </Section>
          </div>

          {/* Результат */}
          <div className="space-y-5">
            <ResultPanel result={result} />
          </div>
        </div>

        {/* Полный состав сметы */}
        {result && (
          <div className="mt-6 bg-[#141720] border border-[#1e2230] rounded-3xl p-5 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-oswald font-bold text-white text-lg flex items-center gap-2">
                <Icon name="ListChecks" size={18} className="text-orange-400" />
                Состав сметы
              </h3>
              <div className="text-xs text-white/45">{result.items.length} позиций</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[640px]">
                <thead>
                  <tr className="border-b border-[#1e2230] text-white/40 uppercase tracking-wider text-[10px]">
                    <th className="text-left py-2 px-2">SKU</th>
                    <th className="text-left py-2 px-2">Наименование</th>
                    <th className="text-center py-2 px-2">Кол-во</th>
                    <th className="text-center py-2 px-2">Ед.</th>
                    <th className="text-right py-2 px-2">Цена</th>
                    <th className="text-right py-2 px-2">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((i, idx) => (
                    <tr key={idx} className="border-b border-[#1a1f2e] hover:bg-[#0a0c10]/40">
                      <td className="py-2 px-2 text-white/40 font-mono text-[10px]">{i.sku}</td>
                      <td className="py-2 px-2 text-white">{i.name}</td>
                      <td className="py-2 px-2 text-center text-white/70">{i.qty}</td>
                      <td className="py-2 px-2 text-center text-white/50">{i.unit}</td>
                      <td className="py-2 px-2 text-right text-white/70 font-oswald">
                        {i.pricePerUnit.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
                      </td>
                      <td className="py-2 px-2 text-right text-orange-400 font-oswald font-bold">
                        {i.total.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-orange-500/30">
                    <td colSpan={5} className="py-3 px-2 text-right text-white/65 uppercase tracking-wider text-[11px]">
                      Итого
                    </td>
                    <td className="py-3 px-2 text-right text-orange-400 font-oswald font-bold text-base">
                      {result.totals.total.toLocaleString("ru-RU")} ₽
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────── Подкомпоненты ───────────
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#141720] border border-[#1e2230] rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon name={icon} size={18} className="text-orange-400" />
        <div className="font-oswald font-bold text-white text-base">{title}</div>
      </div>
      {children}
    </div>
  );
}

function NumInput({
  label, value, min, max, step, onChange,
}: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="text-white/45 text-[10px] uppercase tracking-wider mb-1">{label}</div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-[#0a0c10] border border-[#1e2230] rounded-xl px-3 py-2.5 text-white text-sm focus:border-orange-500 outline-none"
      />
    </div>
  );
}

function TextInput({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-white/45 text-[10px] uppercase tracking-wider mb-1">{label}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0a0c10] border border-[#1e2230] rounded-xl px-3 py-2.5 text-white text-sm focus:border-orange-500 outline-none"
      />
    </div>
  );
}

function SelectInput({
  label, value, options, onChange,
}: {
  label: string; value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-white/45 text-[10px] uppercase tracking-wider mb-1">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0a0c10] border border-[#1e2230] rounded-xl px-3 py-2.5 text-white text-sm focus:border-orange-500 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function DocBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-[#141720] border border-[#1e2230] hover:border-orange-500/40 rounded-xl p-2.5 text-left flex items-center gap-2 transition-colors"
    >
      <Icon name={icon} size={14} className="text-orange-400 flex-shrink-0" />
      <span className="text-white text-xs truncate">{label}</span>
    </button>
  );
}

function ResultPanel({ result }: { result: CalcResult | null }) {
  const stats = useMemo(() => {
    if (!result) return [];
    return [
      { label: "Материалы", value: result.totals.material, icon: "Package" },
      { label: "Фундамент", value: result.totals.foundation, icon: "Layers" },
      { label: "Покраска", value: result.totals.paint, icon: "Palette" },
      { label: "Автоматика", value: result.totals.automation, icon: "Cpu" },
      { label: "Монтаж", value: result.totals.work, icon: "Wrench" },
    ].filter((s) => s.value > 0);
  }, [result]);

  if (!result) return null;

  return (
    <div className="bg-gradient-to-br from-[#141720] to-[#0a0c10] border border-orange-500/30 rounded-3xl p-5 sticky top-20">
      <div className="text-white/45 text-[10px] uppercase tracking-wider">Итог расчёта</div>
      <div className="font-oswald font-bold text-orange-400 text-4xl mt-1 leading-none">
        {result.totals.total.toLocaleString("ru-RU")} ₽
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#0a0c10] rounded-lg px-3 py-2">
          <div className="text-white/40 text-[10px]">Себестоимость</div>
          <div className="text-white font-oswald">{result.totals.cost.toLocaleString("ru-RU")} ₽</div>
        </div>
        <div className="bg-[#0a0c10] rounded-lg px-3 py-2">
          <div className="text-white/40 text-[10px]">Прибыль</div>
          <div className="text-green-400 font-oswald">+{result.totals.margin.toLocaleString("ru-RU")} ₽</div>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between text-xs">
            <span className="text-white/55 flex items-center gap-1.5">
              <Icon name={s.icon} size={12} className="text-orange-400/70" />
              {s.label}
            </span>
            <span className="text-white/85 font-oswald">{s.value.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-orange-500/20 space-y-1.5 text-[11px] text-white/55">
        {result.meta.postsCount && (
          <div className="flex justify-between"><span>Столбов</span><span className="text-white/75">{result.meta.postsCount} шт</span></div>
        )}
        {result.meta.postStep && (
          <div className="flex justify-between"><span>Шаг</span><span className="text-white/75">{result.meta.postStep} м</span></div>
        )}
        <div className="flex justify-between"><span>Фундамент</span><span className="text-white/75 text-right">{result.meta.foundation}</span></div>
        {result.meta.windLoad && (
          <div className="flex justify-between"><span>Ветер</span><span className="text-white/75">{result.meta.windLoad} кгс/м²</span></div>
        )}
        {result.meta.snowLoad && (
          <div className="flex justify-between"><span>Снег</span><span className="text-white/75">{result.meta.snowLoad} кгс/м²</span></div>
        )}
      </div>

      {result.meta.notes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#1e2230] text-[10px] text-white/45 space-y-1">
          {result.meta.notes.map((n, i) => (
            <div key={i} className="flex items-start gap-1">
              <Icon name="Info" size={10} className="text-orange-400/70 mt-0.5 flex-shrink-0" />
              <span>{n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
