import { API } from "./api";
import { erpToken } from "./erp";

const H = (extra: Record<string, string> = {}) => ({
  "X-Erp-Token": erpToken.get(),
  "Content-Type": "application/json",
  ...extra,
});

export type DealStatus =
  | "tz_draft" | "tz_ready" | "measure_assigned" | "measure_done"
  | "contract" | "prepay" | "production" | "ready" | "install"
  | "handover" | "cancelled";

export interface Deal {
  id: number;
  deal_num: string;
  lead_id?: number | null;
  client_name: string;
  client_phone: string;
  client_email?: string;
  client_address?: string;
  city?: string;
  service_type: string;
  status: DealStatus;
  total_rub: number;
  prepay_rub: number;
  paid_rub: number;
  cost_rub?: number;
  margin_rub?: number;
  assigned_to?: number | null;
  surveyor_id?: number | null;
  installer_id?: number | null;
  assigned_name?: string | null;
  install_date?: string | null;
  start_date?: string | null;
  finish_date?: string | null;
  notes?: string;
  meta?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Estimate {
  id: number;
  version: number;
  title: string;
  total_rub: number;
  cost_rub: number;
  is_active: boolean;
  created_at: string;
  params: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
  totals: Record<string, unknown>;
}

export type DocType =
  | "tz"
  | "contract"
  | "invoice_prepay"
  | "invoice_final"
  | "act_start"
  | "act_handover"
  | "scheme"
  | "order_production"
  | "order_measure"
  | "order_install"
  | "estimate_pdf";

export interface DocItem {
  id: number;
  doc_type: DocType;
  doc_num: string;
  title: string;
  status: string;
  pdf_url?: string;
  content?: Record<string, unknown>;
  signed_at?: string | null;
  signed_by?: string;
  created_at: string;
}

export interface DealEvent {
  id: number;
  event_type: string;
  payload: Record<string, unknown>;
  employee_id?: number;
  created_at: string;
}

export interface ErpStats {
  deals_total: number;
  revenue_total: number;
  revenue_won: number;
  deals_active: number;
  pipeline_value: number;
  leads_total: number;
  leads_value: number;
}

async function call<T>(action: string, init?: RequestInit & { params?: Record<string, string | number> }): Promise<T> {
  const qs = new URLSearchParams({ action, ...(init?.params || {}) } as Record<string, string>);
  const r = await fetch(`${API.erpDeals}?${qs.toString()}`, {
    method: init?.method || "GET",
    headers: H(),
    body: init?.body,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "erp_deals_error");
  return j as T;
}

export const listDeals = (q = "", mine = false) =>
  call<{ items: Deal[] }>("deals", { params: q ? { q, mine: mine ? "1" : "0" } : { mine: mine ? "1" : "0" } });

export const createDeal = (data: Partial<Deal>) =>
  call<{ ok: boolean; id: number; deal_num: string }>("deals", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getDeal = (id: number) =>
  call<{ deal: Deal; estimates: Estimate[]; documents: DocItem[]; events: DealEvent[] }>(
    "deal",
    { params: { id } }
  );

export const updateDeal = (id: number, data: Partial<Deal>) =>
  call<{ ok: boolean }>("deal", {
    method: "PATCH",
    params: { id },
    body: JSON.stringify(data),
  });

export const createEstimate = (data: {
  deal_id: number;
  title?: string;
  service_type: string;
  params: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
  totals: Record<string, unknown>;
  total_rub: number;
  cost_rub: number;
  margin_pct?: number;
}) =>
  call<{ ok: boolean; id: number; version: number }>("estimate", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const createDocument = (data: {
  deal_id: number;
  doc_type: DocType;
  estimate_id?: number;
  amount?: number;
  date?: string;
  title?: string;
  tasks?: string[];
  team?: string[];
  scheduled_date?: string;
  start_date?: string;
  handover_date?: string;
  measurements?: Record<string, unknown>;
  notes?: string;
  terms?: string;
  instructions?: string;
  scheme_url?: string;
}) =>
  call<{ ok: boolean; id: number; doc_num: string; content: Record<string, unknown> }>(
    "document",
    { method: "POST", body: JSON.stringify(data) }
  );

export const listDocuments = (dealId: number) =>
  call<{ items: DocItem[] }>("documents", { params: { deal: dealId } });

export const updateDocument = (
  id: number,
  data: { status?: string; signed_by?: string; pdf_url?: string; content?: Record<string, unknown> }
) =>
  call<{ ok: boolean }>("document", {
    method: "PATCH",
    params: { id },
    body: JSON.stringify(data),
  });

export const getStats = () => call<ErpStats>("stats");

export const DEAL_STATUSES: { value: DealStatus; label: string; color: string }[] = [
  { value: "tz_draft", label: "ТЗ черновик", color: "#94a3b8" },
  { value: "tz_ready", label: "ТЗ готово", color: "#3b82f6" },
  { value: "measure_assigned", label: "Замер назначен", color: "#8b5cf6" },
  { value: "measure_done", label: "Замер выполнен", color: "#06b6d4" },
  { value: "contract", label: "Договор подписан", color: "#f59e0b" },
  { value: "prepay", label: "Аванс получен", color: "#fbbf24" },
  { value: "production", label: "В производстве", color: "#ef4444" },
  { value: "ready", label: "Готово к монтажу", color: "#10b981" },
  { value: "install", label: "На монтаже", color: "#f97316" },
  { value: "handover", label: "Сдано клиенту", color: "#22c55e" },
  { value: "cancelled", label: "Отменено", color: "#6b7280" },
];

export const DOC_TYPES: { value: DocType; label: string; icon: string }[] = [
  { value: "tz", label: "Техническое задание", icon: "FileText" },
  { value: "contract", label: "Договор", icon: "FileSignature" },
  { value: "estimate_pdf", label: "Коммерческое предложение", icon: "FileSpreadsheet" },
  { value: "invoice_prepay", label: "Счёт на предоплату", icon: "Banknote" },
  { value: "invoice_final", label: "Счёт на остаток", icon: "Banknote" },
  { value: "act_start", label: "Акт начала работ", icon: "Play" },
  { value: "act_handover", label: "Акт приёма-передачи", icon: "Handshake" },
  { value: "scheme", label: "Схема монтажа", icon: "Map" },
  { value: "order_production", label: "Наряд на производство", icon: "Factory" },
  { value: "order_measure", label: "Наряд на замер", icon: "Ruler" },
  { value: "order_install", label: "Наряд на монтаж", icon: "Wrench" },
];
