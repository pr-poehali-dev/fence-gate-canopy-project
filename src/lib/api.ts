// Backend API endpoints
export const API = {
  prices:  "https://functions.poehali.dev/5ce688dd-ed6c-4c7d-8e4b-899b4943fcf0",
  auth:    "https://functions.poehali.dev/4c4b6b0c-ac97-4644-94b6-63d724b326a2",
  reviews: "https://functions.poehali.dev/4d424d2e-b164-46ab-ad42-7f4ce291d054",
  bot:     "https://functions.poehali.dev/88f39f73-7b49-4be2-9331-cd25cf22e4d6",
  content: "https://functions.poehali.dev/b32babe3-8a20-4ca6-807a-2a27e30e1da9",
  erp:     "https://functions.poehali.dev/ef34ae34-f37a-4ee9-90e9-0cd540fa5b63",
  erpDeals:"https://functions.poehali.dev/b85d9b0c-fb62-401d-9e86-8659e66d3297",
  media:   "https://functions.poehali.dev/fdb7dc55-e1be-4615-a71a-c084ee62dc80",
  menu:    "https://functions.poehali.dev/b3ed1f9c-1452-40d7-9499-2347b1095ab7",
};

export interface PriceItem {
  id: number;
  slug: string;
  title: string;
  price: number;
  unit: string;
  category: string;
  updated_at?: string | null;
}

export interface ReviewItem {
  id: number;
  name: string;
  city: string | null;
  rating: number;
  text: string;
  photo_url: string | null;
  service: string | null;
  is_approved: boolean;
  created_at: string | null;
}

export const adminToken = {
  get: () => localStorage.getItem("sg_admin_token") || "",
  set: (t: string) => localStorage.setItem("sg_admin_token", t),
  clear: () => localStorage.removeItem("sg_admin_token"),
};

export async function fetchPrices(): Promise<PriceItem[]> {
  const r = await fetch(API.prices);
  const d = await r.json();
  return d.items || [];
}

export async function fetchReviews(adminMode = false): Promise<ReviewItem[]> {
  const url = adminMode ? `${API.reviews}?admin=1` : API.reviews;
  const headers: Record<string, string> = {};
  if (adminMode) headers["X-Auth-Token"] = adminToken.get();
  const r = await fetch(url, { headers });
  const d = await r.json();
  return d.items || [];
}

export async function submitReview(payload: {
  name: string; city?: string; rating: number; text: string;
  service?: string; photo_base64?: string;
}) {
  const r = await fetch(API.reviews, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json();
}

export async function loginAdmin(login: string, password: string): Promise<string | null> {
  const r = await fetch(`${API.auth}?action=login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });
  if (!r.ok) return null;
  const d = await r.json();
  if (d.token) { adminToken.set(d.token); return d.token; }
  return null;
}

export async function verifyAdmin(): Promise<boolean> {
  const t = adminToken.get();
  if (!t) return false;
  const r = await fetch(`${API.auth}?action=verify`, { headers: { "X-Auth-Token": t } });
  const d = await r.json();
  return !!d.authorized;
}

export async function updatePrices(items: { slug: string; title: string; price: number }[]) {
  const r = await fetch(API.prices, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Auth-Token": adminToken.get() },
    body: JSON.stringify({ items }),
  });
  return r.json();
}

export async function moderateReview(id: number, is_approved: boolean) {
  return fetch(API.reviews, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Auth-Token": adminToken.get() },
    body: JSON.stringify({ id, is_approved }),
  }).then(r => r.json());
}

export async function deleteReview(id: number) {
  return fetch(`${API.reviews}?id=${id}`, {
    method: "DELETE",
    headers: { "X-Auth-Token": adminToken.get() },
  }).then(r => r.json());
}

// ───────────────── Настройки и заявки ─────────────────
export interface SiteSettings {
  // MAX-бот
  max_bot_token?: string;
  max_bot_token_set?: boolean;
  max_chat_id?: string;
  max_bot_active?: boolean;
  manager_max_chat_id?: string;
  notify_client_via_max?: string;
  client_notify_text?: string;          // шаблон сообщения клиенту в MAX
  manager_max_template?: string;        // шаблон сообщения менеджеру в MAX
  // Email
  notify_email_enabled?: string;
  notify_email_to?: string;
  notify_email_to_set?: boolean;
  manager_emails?: string;              // несколько email через запятую
  manager_emails_set?: boolean;
  smtp_host?: string;
  smtp_port?: string;
  smtp_user?: string;
  smtp_user_set?: boolean;
  smtp_password?: string;
  smtp_password_set?: boolean;
  smtp_from_name?: string;
  client_email_subject?: string;
  client_email_html?: string;
  manager_email_subject?: string;
  // Тогглы каналов уведомлений
  notify_manager_max?: string;
  notify_manager_email?: string;
  notify_client_email?: string;
  notify_client_sms?: string;
  client_sms_template?: string;
  // Компания
  company_phone?: string;
  company_email?: string;
  company_name?: string;
  // CRM webhook
  crm_webhook_enabled?: string;
  crm_webhook_url?: string;
  crm_webhook_url_set?: boolean;
  crm_webhook_type?: string;
  crm_webhook_secret?: string;
  crm_webhook_secret_set?: boolean;
  // SEO и аналитика
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  seo_og_image?: string;
  yandex_metrika_id?: string;
  yandex_verification?: string;
  google_analytics_id?: string;
  google_verification?: string;
}

export async function fetchSettings(adminMode = false): Promise<SiteSettings> {
  const url = adminMode ? `${API.bot}?action=settings&admin=1` : `${API.bot}?action=settings`;
  const headers: Record<string, string> = {};
  if (adminMode) headers["X-Auth-Token"] = adminToken.get();
  const r = await fetch(url, { headers });
  const d = await r.json();
  return d.items || {};
}

export async function saveSettings(items: { key: string; value: string }[]) {
  const r = await fetch(`${API.bot}?action=settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Auth-Token": adminToken.get() },
    body: JSON.stringify({ items }),
  });
  return r.json();
}

export interface LeadPayload {
  order_num?: string;
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  object_type?: string;
  total_rub?: number;
  payload?: Record<string, unknown>;
  pdf_base64?: string;
}

export interface LeadResponse {
  ok: boolean;
  id?: number;
  order_num?: string;
  delivered?: boolean;
  max_info?: string;
  client_notified?: boolean;
  client_info?: string;
  email_sent?: boolean;
  email_info?: string;
  client_email_sent?: boolean;
  client_email_info?: string;
  client_sms_sent?: boolean;
  client_sms_info?: string;
  error?: string;
}

export async function sendLead(p: LeadPayload): Promise<LeadResponse> {
  const r = await fetch(`${API.bot}?action=lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  return r.json();
}

// Тестовое email-сообщение менеджеру (проверка SMTP)
export async function testEmail(to?: string) {
  const r = await fetch(`${API.bot}?action=test_email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": adminToken.get(),
    },
    body: JSON.stringify({ to: to || "" }),
  });
  return r.json();
}

// Тест отправки в MAX (проверка токена/чата)
export async function testMax(chatId?: string) {
  const r = await fetch(`${API.bot}?action=test_max`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": adminToken.get(),
    },
    body: JSON.stringify({ chat_id: chatId || "" }),
  });
  return r.json();
}

// Тест SMS
export async function testSms(phone: string) {
  const r = await fetch(`${API.bot}?action=test_sms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": adminToken.get(),
    },
    body: JSON.stringify({ phone }),
  });
  return r.json();
}

// Поиск клиента в MAX по номеру — проверка перед заявкой
export interface FindMaxUserResp {
  ok: boolean;
  found: boolean;
  phone_normalized?: string;
  chat_id?: string;
  message?: string;
  error?: string;
  test_sent?: boolean;
  test_info?: string;
}

export async function findMaxUser(phone: string, sendTest = false): Promise<FindMaxUserResp> {
  const r = await fetch(`${API.bot}?action=find_max_user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": adminToken.get(),
    },
    body: JSON.stringify({ phone, send_test: sendTest }),
  });
  return r.json();
}

// ───────────────── CMS (контент сайта) ─────────────────
export type ContentBlockType = "text" | "html" | "image" | "url";

export interface ContentBlock {
  id?: number;
  page_slug: string;
  block_key: string;
  block_type: ContentBlockType;
  value: string;
  updated_at?: string | null;
}

/** Публичное чтение блоков страницы — возвращает {key: value}. */
export async function fetchPageContent(pageSlug: string): Promise<Record<string, string>> {
  const r = await fetch(`${API.content}?page=${encodeURIComponent(pageSlug)}`);
  const d = await r.json();
  return (d.items as Record<string, string>) || {};
}

/** Админское чтение блоков страницы. */
export async function fetchPageContentAdmin(pageSlug: string): Promise<ContentBlock[]> {
  const r = await fetch(`${API.content}?page=${encodeURIComponent(pageSlug)}&admin=1`, {
    headers: { "X-Auth-Token": adminToken.get() },
  });
  const d = await r.json();
  return (d.items as ContentBlock[]) || [];
}

/** Список всех страниц с блоками (admin). */
export async function fetchAllContentPages() {
  const r = await fetch(`${API.content}?pages=1`, {
    headers: { "X-Auth-Token": adminToken.get() },
  });
  const d = await r.json();
  return (d.items as { page_slug: string; blocks_count: number; updated_at: string | null }[]) || [];
}

/** Сохранить блоки (admin). */
export async function saveContentBlocks(blocks: ContentBlock[]) {
  const r = await fetch(`${API.content}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": adminToken.get(),
    },
    body: JSON.stringify({ blocks }),
  });
  return r.json();
}

/** Удалить блок (admin). */
export async function deleteContentBlock(id: number) {
  const r = await fetch(`${API.content}?id=${id}`, {
    method: "DELETE",
    headers: { "X-Auth-Token": adminToken.get() },
  });
  return r.json();
}

/** Загрузить картинку в S3 через CMS-бэк. Принимает File. Возвращает CDN URL. */
export async function uploadContentImage(file: File): Promise<string> {
  const b64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const r = await fetch(`${API.content}?action=upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": adminToken.get(),
    },
    body: JSON.stringify({ filename: file.name, base64: b64 }),
  });
  const d = await r.json();
  if (!d?.ok || !d.url) throw new Error(d?.message || "upload failed");
  return d.url as string;
}

// ───────────────── Журнал заявок ─────────────────
export interface LeadItem {
  id: number;
  order_num: string | null;
  name: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  object_type: string | null;
  total_rub: number;
  delivered_to_max: boolean;
  created_at: string | null;
}

export interface LeadsResponse {
  items: LeadItem[];
  stats: { total: number; delivered: number; sum_rub: number };
}

export interface LeadsFilter {
  from?: string;       // YYYY-MM-DD
  to?: string;         // YYYY-MM-DD
  status?: "all" | "delivered" | "failed";
  limit?: number;
}

export async function fetchLeads(f: LeadsFilter = {}): Promise<LeadsResponse> {
  const params = new URLSearchParams({ action: "leads" });
  if (f.from) params.set("from", f.from);
  if (f.to) params.set("to", f.to);
  if (f.status && f.status !== "all") params.set("status", f.status);
  if (f.limit) params.set("limit", String(f.limit));
  const r = await fetch(`${API.bot}?${params}`, {
    headers: { "X-Auth-Token": adminToken.get() },
  });
  const d = await r.json();
  return {
    items: d.items || [],
    stats: d.stats || { total: 0, delivered: 0, sum_rub: 0 },
  };
}

export async function resendLead(id: number) {
  const r = await fetch(`${API.bot}?action=resend`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": adminToken.get() },
    body: JSON.stringify({ id }),
  });
  return r.json();
}

// ───────── Автопоиск chat_id MAX ─────────
export interface MaxChat {
  chat_id: string;
  title: string;
  type: string;
  last_message: string;
  last_user: string;
}

export interface MaxChatsResponse {
  ok: boolean;
  error?: string;
  message?: string;
  bot?: { user_id?: number; name?: string; username?: string };
  items: MaxChat[];
  hint?: string;
}

export async function fetchMaxChats(): Promise<MaxChatsResponse> {
  const r = await fetch(`${API.bot}?action=chats`, {
    headers: { "X-Auth-Token": adminToken.get() },
  });
  return r.json();
}

export async function testMaxChat(chat_id: string) {
  const r = await fetch(`${API.bot}?action=test_max`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": adminToken.get() },
    body: JSON.stringify({ chat_id }),
  });
  return r.json();
}