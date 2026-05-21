import { useEffect, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { erpMe, erpToken } from "@/lib/erp";
import {
  getDeal, updateDeal, createDocument,
  Deal, Estimate, DocItem, DealEvent,
  DEAL_STATUSES, DOC_TYPES, DocType,
} from "@/lib/erp-deals";
import { SERVICE_LABELS, ServiceKey } from "@/lib/erp/calc-engine";
import DocumentPreview from "@/components/erp/DocumentPreview";

export default function ErpDealCard() {
  const { id } = useParams();
  const nav = useNavigate();
  const dealId = Number(id);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [events, setEvents] = useState<DealEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDocPreview, setShowDocPreview] = useState<DocItem | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getDeal(dealId);
      setDeal(r.deal);
      setEstimates(r.estimates || []);
      setDocuments(r.documents || []);
      setEvents(r.events || []);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    if (!erpToken.get()) { nav("/erp/login"); return; }
    erpMe().then(() => reload()).catch(() => nav("/erp/login"));
  }, [nav, reload]);

  const changeStatus = async (s: string) => {
    if (!deal) return;
    await updateDeal(deal.id, { status: s as Deal["status"] });
    await reload();
  };

  const oneClickDoc = async (docType: DocType) => {
    if (!deal) return;
    const activeEst = estimates.find((e) => e.is_active);
    try {
      const r = await createDocument({
        deal_id: deal.id,
        doc_type: docType,
        estimate_id: activeEst?.id,
        amount: docType === "invoice_prepay" ? Math.round(deal.total_rub * 0.5) :
                docType === "invoice_final" ? Math.round(deal.total_rub - (deal.prepay_rub || 0)) : undefined,
      });
      await reload();
      // Сразу открываем превью
      setShowDocPreview({
        id: r.id,
        doc_type: docType,
        doc_num: r.doc_num,
        title: DOC_TYPES.find(d => d.value === docType)?.label || "",
        status: "draft",
        content: r.content,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      alert("Ошибка: " + (e as Error).message);
    }
  };

  if (loading || !deal) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--dark-bg)" }}>
        <Icon name="Loader2" size={28} className="text-orange-400 animate-spin" />
      </div>
    );
  }

  const status = DEAL_STATUSES.find((s) => s.value === deal.status);

  return (
    <div className="min-h-screen" style={{ background: "var(--dark-bg)" }}>
      {showDocPreview && (
        <DocumentPreview doc={showDocPreview} onClose={() => setShowDocPreview(null)} />
      )}

      <header className="border-b border-[#1e2230] bg-[#0a0c10] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/erp" className="text-white/50 hover:text-orange-400">
              <Icon name="ArrowLeft" size={18} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-oswald font-bold text-white text-lg leading-none">{deal.deal_num}</div>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: status?.color + "20", color: status?.color }}
                >
                  {status?.label}
                </span>
              </div>
              <div className="text-white/40 text-xs truncate mt-0.5">{deal.client_name} · {deal.client_phone}</div>
            </div>
          </div>
          <Link to="/erp/calc" className="text-orange-400 hover:text-orange-300 text-sm flex items-center gap-1.5">
            <Icon name="Calculator" size={15} /> Калькулятор
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Левая колонка — данные сделки */}
        <div className="lg:col-span-2 space-y-5">
          <Section title="Клиент и объект" icon="User">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <Row label="Клиент" value={deal.client_name} />
              <Row label="Телефон" value={deal.client_phone || "—"} />
              <Row label="Email" value={deal.client_email || "—"} />
              <Row label="Город" value={deal.city || "—"} />
              <Row label="Адрес объекта" value={deal.client_address || "—"} full />
              <Row label="Услуга" value={SERVICE_LABELS[deal.service_type as ServiceKey] || deal.service_type} />
              <Row label="Создана" value={new Date(deal.created_at).toLocaleString("ru-RU")} />
            </div>
          </Section>

          {/* Воронка / Статус */}
          <Section title="Этап сделки" icon="GitMerge">
            <div className="flex flex-wrap gap-2">
              {DEAL_STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => changeStatus(s.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    deal.status === s.value
                      ? "text-gray-900 ring-2 ring-offset-2 ring-offset-[#141720]"
                      : "text-white/55 bg-[#0a0c10] hover:text-white"
                  }`}
                  style={{
                    background: deal.status === s.value ? s.color : "",
                    ...(deal.status === s.value ? {} : { borderColor: s.color + "50" }),
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Сметы */}
          <Section
            title="Сметы"
            icon="FileSpreadsheet"
            action={
              <Link
                to={`/erp/calc?deal=${deal.id}`}
                className="text-orange-400 text-xs hover:text-orange-300 flex items-center gap-1"
              >
                <Icon name="Plus" size={12} /> Новая
              </Link>
            }
          >
            {estimates.length === 0 ? (
              <Empty text="Смет ещё нет. Создайте через калькулятор." />
            ) : (
              <div className="space-y-2">
                {estimates.map((e) => (
                  <div
                    key={e.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                      e.is_active
                        ? "bg-orange-500/5 border-orange-500/30"
                        : "bg-[#0a0c10] border-[#1e2230]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon name="FileSpreadsheet" size={16} className="text-orange-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-white text-sm font-oswald truncate">
                          {e.title || `Смета v${e.version}`}
                        </div>
                        <div className="text-white/40 text-[11px]">v{e.version} · {new Date(e.created_at).toLocaleDateString("ru-RU")}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-orange-400 font-oswald font-bold">
                        {e.total_rub.toLocaleString("ru-RU")} ₽
                      </div>
                      {e.is_active && (
                        <div className="text-[10px] text-orange-400/70 uppercase tracking-wider">Активная</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Документы 1-в-клик */}
          <Section title="Документы в 1 клик" icon="FilePlus2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {DOC_TYPES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => oneClickDoc(d.value)}
                  className="bg-[#0a0c10] border border-[#1e2230] hover:border-orange-500/40 rounded-xl p-3 text-left transition-colors group"
                >
                  <Icon name={d.icon} size={18} className="text-orange-400 mb-1.5" />
                  <div className="text-white text-xs font-oswald leading-tight">{d.label}</div>
                </button>
              ))}
            </div>

            {/* Список созданных документов */}
            {documents.length > 0 && (
              <div className="space-y-1.5 mt-4">
                <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Созданные ({documents.length})</div>
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setShowDocPreview(doc)}
                    className="w-full flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#0a0c10] border border-[#1e2230] hover:border-orange-500/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        name={DOC_TYPES.find((d) => d.value === doc.doc_type)?.icon || "File"}
                        size={14}
                        className="text-orange-400 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-white text-xs truncate">{doc.title}</div>
                        <div className="text-white/40 text-[10px] font-mono">{doc.doc_num}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                        doc.status === "signed"
                          ? "bg-green-500/20 text-green-400"
                          : doc.status === "sent"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-white/10 text-white/55"
                      }`}>
                        {doc.status === "signed" ? "Подписан" : doc.status === "sent" ? "Отправлен" : "Черновик"}
                      </span>
                      <Icon name="ChevronRight" size={12} className="text-white/30" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Правая колонка */}
        <div className="space-y-5">
          {/* Финансы */}
          <Section title="Финансы" icon="Wallet">
            <FinRow label="Сумма сделки" value={deal.total_rub} accent />
            <FinRow label="Аванс" value={deal.prepay_rub || 0} />
            <FinRow label="Получено" value={deal.paid_rub || 0} />
            <div className="border-t border-[#1e2230] my-2.5" />
            <FinRow label="К доплате" value={(deal.total_rub - (deal.paid_rub || 0))} highlight />
            {deal.cost_rub && deal.cost_rub > 0 && (
              <>
                <div className="border-t border-[#1e2230] my-2.5" />
                <FinRow label="Себестоимость" value={deal.cost_rub} muted />
                <FinRow label="Прибыль" value={deal.margin_rub || (deal.total_rub - (deal.cost_rub || 0))} green />
              </>
            )}
          </Section>

          {/* События */}
          <Section title="История событий" icon="History">
            {events.length === 0 ? (
              <Empty text="Событий пока нет." />
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {events.map((e) => (
                  <div key={e.id} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-white/75">{eventLabel(e.event_type)}</div>
                      <div className="text-white/35 text-[10px] mt-0.5">
                        {new Date(e.created_at).toLocaleString("ru-RU")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

// ─────────── Подкомпоненты ───────────
function Section({
  title, icon, action, children,
}: { title: string; icon: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#141720] border border-[#1e2230] rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name={icon} size={18} className="text-orange-400" />
          <div className="font-oswald font-bold text-white text-base">{title}</div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="text-white/40 text-[10px] uppercase tracking-wider">{label}</div>
      <div className="text-white text-sm mt-0.5">{value}</div>
    </div>
  );
}

function FinRow({
  label, value, accent, highlight, green, muted,
}: { label: string; value: number; accent?: boolean; highlight?: boolean; green?: boolean; muted?: boolean }) {
  return (
    <div className="flex justify-between items-baseline text-sm py-1">
      <span className={muted ? "text-white/35 text-xs" : "text-white/55"}>{label}</span>
      <span
        className={`font-oswald font-bold ${
          green ? "text-green-400" : highlight ? "text-orange-400 text-lg" : accent ? "text-white text-lg" : muted ? "text-white/45" : "text-white"
        }`}
      >
        {value.toLocaleString("ru-RU")} ₽
      </span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="text-center py-6 text-white/35 text-xs">{text}</div>
  );
}

function eventLabel(t: string): string {
  return {
    deal_created: "Сделка создана",
    deal_updated: "Сделка обновлена",
    estimate_created: "Создана смета",
    doc_created: "Создан документ",
    status_changed: "Изменён статус",
  }[t] || t;
}
