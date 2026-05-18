import { API } from "./api";

// ─────────── Хранилище токена ERP ───────────
const TOKEN_KEY = "sg_erp_token";

export const erpToken = {
  get: () => (typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) || "" : ""),
  set: (t: string) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
};

const H = (extra: Record<string, string> = {}) => ({
  "X-Erp-Token": erpToken.get(),
  "Content-Type": "application/json",
  ...extra,
});

// ─────────── Типы ───────────
export interface ErpRole {
  id: number;
  slug: string;
  title: string;
  is_owner?: boolean;
}

export interface ErpEmployee {
  id: number;
  login: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  is_active: boolean;
  notes: string;
  created_at: string | null;
  role_slug: string | null;
  role_title: string | null;
}

export interface ErpMe {
  id: number;
  login: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  role: {
    slug: string;
    title: string;
    is_owner: boolean;
    permissions: Record<string, unknown>;
  };
}

export interface ErpStage {
  id: number;
  slug: string;
  title: string;
  color: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
}

export interface ErpFunnel {
  funnel: { id: number; slug: string; title: string };
  stages: ErpStage[];
}

export interface ErpLead {
  id: number;
  order_num: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  object_type: string;
  total_rub: number;
  assigned_to: number | null;
  stage_id: number | null;
  created_at: string | null;
  updated_at: string | null;
  erp_notes: string;
  assigned_name?: string;
  assigned_avatar?: string;
}

// ─────────── Auth ───────────
export async function erpLogin(login: string, password: string) {
  const r = await fetch(`${API.erp}?action=login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });
  const d = await r.json();
  if (d?.ok && d.token) {
    erpToken.set(d.token);
    return d as { ok: true; token: string; employee: { id: number; full_name: string; role: string; is_owner: boolean } };
  }
  return null;
}

export async function erpLogout() {
  try {
    await fetch(`${API.erp}?action=logout`, { method: "POST", headers: H() });
  } catch { /* ignore */ }
  erpToken.clear();
}

export async function erpMe(): Promise<ErpMe | null> {
  if (!erpToken.get()) return null;
  const r = await fetch(`${API.erp}?action=me`, { headers: H() });
  if (!r.ok) return null;
  return r.json();
}

// ─────────── Roles & Employees ───────────
export async function erpRoles(): Promise<ErpRole[]> {
  const r = await fetch(`${API.erp}?action=roles`, { headers: H() });
  const d = await r.json();
  return d.items || [];
}

export async function erpEmployees(): Promise<ErpEmployee[]> {
  const r = await fetch(`${API.erp}?action=employees`, { headers: H() });
  const d = await r.json();
  return d.items || [];
}

export interface ErpEmployeeInput {
  login: string;
  full_name: string;
  role_id: number;
  email?: string;
  phone?: string;
  avatar_url?: string;
  notes?: string;
  password?: string; // если не указан — сгенерируется
}

export async function erpCreateEmployee(p: ErpEmployeeInput) {
  const r = await fetch(`${API.erp}?action=employees`, {
    method: "POST", headers: H(),
    body: JSON.stringify(p),
  });
  return r.json() as Promise<{ ok: boolean; id?: number; login?: string; password?: string; error?: string }>;
}

export async function erpUpdateEmployee(id: number, p: Partial<ErpEmployeeInput> & { is_active?: boolean }) {
  const r = await fetch(`${API.erp}?action=employees&id=${id}`, {
    method: "PUT", headers: H(),
    body: JSON.stringify(p),
  });
  return r.json();
}

export async function erpResetPassword(id: number) {
  const r = await fetch(`${API.erp}?action=employees&id=${id}&pwd=1`, {
    method: "POST", headers: H(),
  });
  return r.json() as Promise<{ ok: boolean; new_password?: string }>;
}

// ─────────── Funnel & Board ───────────
export async function erpFunnel(slug = "sales"): Promise<ErpFunnel | null> {
  const r = await fetch(`${API.erp}?action=funnel&slug=${slug}`, { headers: H() });
  if (!r.ok) return null;
  return r.json();
}

export async function erpBoard(funnel = "sales", mine = false): Promise<ErpLead[]> {
  const r = await fetch(`${API.erp}?action=board&funnel=${funnel}${mine ? "&mine=1" : ""}`, { headers: H() });
  const d = await r.json();
  return d.items || [];
}

export async function erpUpdateLead(id: number, p: { stage_id?: number; assigned_to?: number | null; erp_notes?: string }) {
  const r = await fetch(`${API.erp}?action=lead&id=${id}`, {
    method: "PATCH", headers: H(),
    body: JSON.stringify(p),
  });
  return r.json();
}

export async function erpAddNote(leadId: number, text: string) {
  const r = await fetch(`${API.erp}?action=lead_note&id=${leadId}`, {
    method: "POST", headers: H(),
    body: JSON.stringify({ text }),
  });
  return r.json();
}

export async function erpLeadEvents(leadId: number) {
  const r = await fetch(`${API.erp}?action=lead_events&id=${leadId}`, { headers: H() });
  const d = await r.json();
  return (d.items || []) as { id: number; type: string; payload: Record<string, unknown>; created_at: string | null; author: string | null }[];
}
