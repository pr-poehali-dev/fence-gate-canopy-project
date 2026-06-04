import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import { useCalcPricing } from "@/hooks/useCalcPricing";
import { generateKpPDF } from "@/lib/kpPdf";
import { useCompany } from "@/hooks/useCompany";
import {
  calculate, fmtRub, DEFAULT_CALC,
  OBJECT_LABELS, POST_OPTIONS, LAG_OPTIONS, PROFLIST_OPTIONS, SHTAK_OPTIONS,
  COATING_OPTIONS, FOUND_OPTIONS, GATE_OPTIONS, WICKET_OPTIONS,
  CANOPY_TYPES, CANOPY_COVER,
  type CalcInput, type ObjectType, type CalcLine,
} from "@/lib/calcCatalog";

// Редактируемая строка сметы
interface EditLine {
  label: string;
  qty: string;
  value: number;
}

export interface ManagerCalcResult {
  total: number;
  materials: number;
  fot: number;
  profit: number;
  object_type: string;
  lines: EditLine[];
  order_num: string;
}

const num = (v: string) => parseFloat(v.replace(",", ".")) || 0;

export default function ManagerCalculator({
  orderNum, clientName, address,
  onApply, onClose,
}: {
  orderNum: string;
  clientName: string;
  clientPhone?: string;
  address: string;
  onApply: (r: ManagerCalcResult) => void;
  onClose: () => void;
}) {
  useCalcPricing();
  const company = useCompany();
  const [calc, setCalc] = useState<CalcInput>({ ...DEFAULT_CALC });
  // ручные правки сметы: менеджер может изменить строки
  const [manualLines, setManualLines] = useState<EditLine[] | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const result = useMemo(() => calculate(calc), [calc]);
  const isCanopy = calc.objectType === "canopy";

  // Базовые строки из расчёта
  const baseLines: EditLine[] = useMemo(
    () => result.lineItems.map((l: CalcLine) => ({
      label: l.label, qty: l.qty || "", value: l.value,
    })),
    [result]
  );

  const lines = manualLines ?? baseLines;

  // Итог пересчитывается по текущим строкам сметы (с учётом ручных правок)
  const total = useMemo(() => lines.reduce((s, l) => s + (l.value || 0), 0), [lines]);

  const set = (p: Partial<CalcInput>) => {
    setCalc(c => ({ ...c, ...p }));
    setManualLines(null); // сброс ручных правок при изменении параметров
  };

  const editLine = (i: number, field: keyof EditLine, v: string) => {
    const next = lines.map((l, idx) =>
      idx === i ? { ...l, [field]: field === "value" ? num(v) : v } : l
    );
    setManualLines(next);
  };
  const addLine = () => setManualLines([...lines, { label: "Доп. работа", qty: "1", value: 0 }]);
  const removeLine = (i: number) => setManualLines(lines.filter((_, idx) => idx !== i));

  const buildResult = (): ManagerCalcResult => {
    const ratio = result.total > 0 ? total / result.total : 1;
    return {
      total,
      materials: Math.round(result.econ.materialsCost * ratio),
      fot: Math.round(result.econ.fot * ratio),
      profit: Math.round(total - result.econ.materialsCost * ratio - result.econ.fot * ratio),
      object_type: OBJECT_LABELS[calc.objectType],
      lines,
      order_num: orderNum,
    };
  };

  const apply = () => {
    onApply(buildResult());
    toast.success("Смета перенесена в заказ");
  };

  const makePdf = async () => {
    setPdfBusy(true);
    try {
      const kpParams: Record<string, string> = {
        "Объект": OBJECT_LABELS[calc.objectType],
        ...(isCanopy
          ? { "Размер": `${calc.canopyLength}×${calc.canopyWidth} м` }
          : { "Длина": `${calc.fenceLength} м`, "Высота": `${calc.fenceHeight} м` }),
        ...(clientName ? { "Клиент": clientName } : {}),
        ...(address ? { "Адрес": address } : {}),
      };
      await generateKpPDF(
        orderNum,
        lines.map(l => ({ label: l.label, value: l.value, qty: l.qty })),
        total,
        kpParams,
        {
          company: {
            brand: company.name, legalName: company.legalName, shortName: company.legalName,
            inn: company.inn, ogrnip: company.ogrn, legalAddress: company.legalAddress,
            phone: company.phone, email: company.email, site: company.site,
          },
        }
      );
      toast.success("КП в PDF сформировано");
    } catch {
      toast.error("Не удалось сформировать КП");
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-[#141720] border border-[#1e2230] rounded-2xl w-full max-w-3xl p-5 my-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-oswald font-bold text-xl flex items-center gap-2">
            <Icon name="Calculator" size={20} className="text-orange-400" /> Детальный расчёт
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><Icon name="X" size={20} /></button>
        </div>

        {/* Параметры */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
          <Sel label="Тип объекта" value={calc.objectType}
            onChange={v => set({ objectType: v as ObjectType })}
            opts={Object.entries(OBJECT_LABELS).map(([id, l]) => ({ id, label: l }))} />

          {isCanopy ? (
            <>
              <Sel label="Кровля навеса" value={calc.canopyType}
                onChange={v => set({ canopyType: v })}
                opts={CANOPY_TYPES.map(o => ({ id: o.id, label: o.label }))} />
              <Sel label="Покрытие навеса" value={calc.canopyCoverId}
                onChange={v => set({ canopyCoverId: v })}
                opts={CANOPY_COVER.map(o => ({ id: o.id, label: o.label }))} />
              <Num label="Длина, м" value={calc.canopyLength} onChange={v => set({ canopyLength: v })} />
              <Num label="Ширина, м" value={calc.canopyWidth} onChange={v => set({ canopyWidth: v })} />
            </>
          ) : (
            <>
              <Num label="Длина забора, м" value={calc.fenceLength} onChange={v => set({ fenceLength: v })} />
              <Num label="Высота, м" value={calc.fenceHeight} onChange={v => set({ fenceHeight: v })} />
              <Sel label="Столбы" value={calc.postId} onChange={v => set({ postId: v })}
                opts={POST_OPTIONS.map(o => ({ id: o.id, label: o.label }))} />
              <Sel label="Лаги" value={calc.lagId} onChange={v => set({ lagId: v })}
                opts={LAG_OPTIONS.map(o => ({ id: o.id, label: o.label }))} />
              <Sel label="Рядов лаг" value={String(calc.lagRows)} onChange={v => set({ lagRows: num(v) })}
                opts={[2, 3, 4].map(n => ({ id: String(n), label: `${n} ряда` }))} />
              {calc.objectType === "profnastil" && (
                <Sel label="Профлист" value={calc.proflistId} onChange={v => set({ proflistId: v })}
                  opts={PROFLIST_OPTIONS.map(o => ({ id: o.id, label: o.label }))} />
              )}
              {calc.objectType === "shtak" && (
                <Sel label="Штакетник" value={calc.shtakId} onChange={v => set({ shtakId: v })}
                  opts={SHTAK_OPTIONS.map(o => ({ id: o.id, label: o.label }))} />
              )}
              {(calc.objectType === "profnastil" || calc.objectType === "shtak") && (
                <Sel label="Покрытие" value={calc.coatingId} onChange={v => set({ coatingId: v })}
                  opts={COATING_OPTIONS.map(o => ({ id: o.id, label: o.label }))} />
              )}
              <Sel label="Фундамент" value={calc.foundId} onChange={v => set({ foundId: v })}
                opts={FOUND_OPTIONS.map(o => ({ id: o.id, label: o.label }))} />
              <Sel label="Ворота" value={calc.gateId} onChange={v => set({ gateId: v })}
                opts={GATE_OPTIONS.map(o => ({ id: o.id, label: o.label }))} />
              {calc.gateId !== "none" && (
                <Num label="Ширина ворот, м" value={calc.gateWidth} onChange={v => set({ gateWidth: v })} />
              )}
              <Sel label="Калитка" value={calc.wicketId} onChange={v => set({ wicketId: v })}
                opts={WICKET_OPTIONS.map(o => ({ id: o.id, label: o.label }))} />
              {calc.objectType === "shtak" && (
                <>
                  <Num label="Зазор планок, мм" value={calc.shtakGap} onChange={v => set({ shtakGap: v })} />
                  <Sel label="Зашивка" value={calc.chess ? "1" : "0"} onChange={v => set({ chess: v === "1" })}
                    opts={[{ id: "0", label: "Обычная" }, { id: "1", label: "Шахматка" }]} />
                </>
              )}
              {(calc.objectType === "profnastil" || calc.objectType === "shtak") && (
                <Sel label="Окрас металла" value={calc.paintBoth ? "1" : "0"} onChange={v => set({ paintBoth: v === "1" })}
                  opts={[{ id: "0", label: "Односторонний" }, { id: "1", label: "Двусторонний" }]} />
              )}
              <Sel label="Сложность участка" value={calc.complexHard ? "1" : "0"} onChange={v => set({ complexHard: v === "1" })}
                opts={[{ id: "0", label: "Простой" }, { id: "1", label: "Сложный (уклон)" }]} />
            </>
          )}
          <Num label="Доставка, км от МКАД" value={calc.distanceKm || 0} onChange={v => set({ distanceKm: v })} />
        </div>

        {/* Редактируемая смета */}
        <div className="bg-[#0a0c10] border border-[#1e2230] rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Смета (можно править)</span>
            <button onClick={addLine} className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              <Icon name="Plus" size={12} /> Строка
            </button>
          </div>
          <div className="space-y-1.5 max-h-[34vh] overflow-y-auto pr-1">
            {lines.map((l, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input value={l.label} onChange={e => editLine(i, "label", e.target.value)}
                  className="flex-1 min-w-0 bg-[#141720] border border-[#1e2230] focus:border-orange-500 rounded-lg px-2 py-1.5 text-xs text-white outline-none" />
                <input value={l.qty} onChange={e => editLine(i, "qty", e.target.value)} placeholder="кол-во"
                  className="w-16 bg-[#141720] border border-[#1e2230] focus:border-orange-500 rounded-lg px-2 py-1.5 text-xs text-white/70 text-center outline-none" />
                <input type="number" value={l.value} onChange={e => editLine(i, "value", e.target.value)}
                  className="w-24 bg-[#141720] border border-[#1e2230] focus:border-orange-500 rounded-lg px-2 py-1.5 text-xs text-white text-right outline-none" />
                <button onClick={() => removeLine(i)} className="text-white/30 hover:text-red-400 p-1"><Icon name="Trash2" size={13} /></button>
              </div>
            ))}
          </div>
          {manualLines && (
            <button onClick={() => setManualLines(null)} className="mt-2 text-[11px] text-white/40 hover:text-white flex items-center gap-1">
              <Icon name="RotateCcw" size={11} /> Сбросить правки к расчёту
            </button>
          )}
        </div>

        {/* Итог */}
        <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3 mb-4">
          <div>
            <div className="text-[11px] text-white/50">Итого по смете (предварительно)</div>
            <div className="font-oswald font-bold text-2xl text-orange-400">{fmtRub(total)}</div>
          </div>
          <div className="text-right text-[11px] text-white/45">
            <div>Себест.: {fmtRub(result.econ.materialsCost)}</div>
            <div>ФОТ: {fmtRub(result.econ.fot)}</div>
            <div className="text-emerald-400">Выгода ≈ {fmtRub(buildResult().profit)}</div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={makePdf} disabled={pdfBusy}
            className="px-4 py-2 rounded-lg text-sm border border-[#1e2230] text-white/70 hover:text-white disabled:opacity-50 flex items-center gap-1.5">
            <Icon name={pdfBusy ? "Loader" : "FileText"} size={15} className={pdfBusy ? "animate-spin" : ""} /> Скачать КП (PDF)
          </button>
          <button onClick={apply} className="btn-orange px-5 py-2 rounded-lg text-sm flex items-center gap-1.5">
            <Icon name="Check" size={15} /> Перенести в заказ
          </button>
        </div>
      </div>
    </div>
  );
}

function Sel({ label, value, onChange, opts }: {
  label: string; value: string; onChange: (v: string) => void;
  opts: { id: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[10px] text-white/45 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-[#0a0c10] border border-[#1e2230] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500">
        {opts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-[10px] text-white/45 mb-1">{label}</label>
      <input type="number" value={value} onChange={e => onChange(num(e.target.value))}
        className="w-full bg-[#0a0c10] border border-[#1e2230] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500" />
    </div>
  );
}