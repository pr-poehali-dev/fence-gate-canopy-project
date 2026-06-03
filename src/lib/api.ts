// Backend API endpoints
export const API = {
  prices:  "https://functions.poehali.dev/28ffb3c5-48d8-4d7f-8fcb-73bf365b5742",
  auth:    "https://functions.poehali.dev/2246078f-ff3b-42c7-87d3-1e87b861b83d",
  reviews: "https://functions.poehali.dev/38075237-04b7-4c96-ba87-52c22e3a9681",
  bot:     "https://functions.poehali.dev/809fa147-084f-45cd-85bd-b12cdf8a001f",
  content: "https://functions.poehali.dev/a1c505b5-65c0-452c-ae02-91f63dbdfbe4",
  media:   "https://functions.poehali.dev/cf4a4be5-20fe-4155-a938-e1638ded5fc9",
  menu:    "https://functions.poehali.dev/0c22aa85-bb9a-4e7e-815a-76ae25252353",
  builder: "https://functions.poehali.dev/064ff0e6-b48d-4f62-9858-d47bbe6df074",
  onec:    "https://functions.poehali.dev/2780474d-2df2-4d35-a3c7-d58ad2b7fea1",
  aiCaption: "https://functions.poehali.dev/56d28ba3-2cfa-49ff-adee-853ac05bb1b8",
  orders: "https://functions.poehali.dev/dde49cf0-5b3a-419e-abc9-3dddc926b15f",
};

/**
 * Генерация подписи и alt-текста для фото по чёрновым данным (GigaChat).
 * Возвращает { caption, alt } или null при ошибке.
 */
export async function generatePhotoCaption(
  rawInput: string,
  serviceLabel?: string
): Promise<{ caption: string; alt: string } | null> {
  try {
    const r = await fetch(API.aiCaption, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: rawInput, service: serviceLabel || "" }),
      signal: AbortSignal.timeout(45000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    if (!d.caption && !d.alt) return null;
    return {
      caption: String(d.caption || "").trim(),
      alt: String(d.alt || "").trim(),
    };
  } catch {
    return null;
  }
}

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
  try {
    const r = await fetch(`${API.auth}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.token) { adminToken.set(d.token); return d.token; }
    return null;
  } catch {
    return null;
  }
}

export async function verifyAdmin(): Promise<boolean> {
  const t = adminToken.get();
  if (!t) return false;
  try {
    const r = await fetch(`${API.auth}?action=verify`, {
      headers: { "X-Auth-Token": t },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return false;
    const d = await r.json();
    return !!d.authorized;
  } catch {
    return false;
  }
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
  // Компания — контакты
  company_phone?: string;
  company_email?: string;
  company_name?: string;
  company_address?: string;
  work_hours?: string;
  region?: string;
  // Компания — юр. реквизиты
  legal_name?: string;
  inn?: string;
  ogrn?: string;
  legal_address?: string;
  // Компания — мессенджеры и соцсети
  whatsapp?: string;
  telegram?: string;
  vk?: string;
  max_link?: string;
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

// ───────────────── Диалоги с MAX-ботом ─────────────────
export interface BotDialog {
  id: number;
  chat_id: string;
  client_name: string;
  client_phone: string;
  last_message: string;
  last_at: string | null;
  unread: number;
  needs_manager: boolean;
  assigned_manager?: string;
  client_city?: string;
}

export interface BotMessage {
  direction: "in" | "out";
  sender: "client" | "bot" | "manager";
  text: string;
  created_at: string | null;
}

export async function fetchBotDialogs(): Promise<BotDialog[]> {
  const r = await fetch(`${API.bot}?action=dialogs`, {
    headers: { "X-Auth-Token": adminToken.get() },
  });
  const d = await r.json();
  return d.items || [];
}

export async function fetchBotMessages(chatId: string): Promise<BotMessage[]> {
  const r = await fetch(`${API.bot}?action=messages&chat_id=${encodeURIComponent(chatId)}`, {
    headers: { "X-Auth-Token": adminToken.get() },
  });
  const d = await r.json();
  return d.items || [];
}

export async function replyToBotDialog(chatId: string, text: string) {
  const r = await fetch(`${API.bot}?action=reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": adminToken.get() },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  return r.json();
}

/** Адрес webhook нашего бота (куда MAX шлёт сообщения). */
export const MAX_WEBHOOK_URL = `${API.bot}?action=webhook`;

export async function setMaxWebhook(url: string): Promise<{ ok: boolean; message?: string }> {
  const r = await fetch(`${API.bot}?action=set_webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": adminToken.get() },
    body: JSON.stringify({ url }),
  });
  return r.json();
}

// ───────────────── CRM Заказы ─────────────────
export type OrderStatus =
  | "new" | "measure" | "contract" | "production" | "montage" | "done" | "archive" | "cancelled";

export interface Order {
  id: number;
  order_num: string;
  client_name: string;
  client_phone: string;
  address: string;
  object_type: string;
  source: string;
  status: OrderStatus;
  montage_date: string | null;
  total_rub: number;
  materials_cost: number;
  fot: number;
  profit: number;
  paid_rub: number;
  comment: string;
  items_json?: unknown[];
  lead_id?: number | null;
  created_at?: string | null;
}

const ordersHeaders = () => ({
  "Content-Type": "application/json",
  "X-Auth-Token": adminToken.get(),
});

export async function fetchOrders(status = "all"): Promise<Order[]> {
  const r = await fetch(`${API.orders}?action=list&status=${status}`, { headers: ordersHeaders() });
  const d = await r.json();
  return d.items || [];
}

export interface OrdersStats {
  by_status: Record<string, { count: number; sum: number; profit: number }>;
  active_count: number;
  active_sum: number;
  active_profit: number;
}

export async function fetchOrdersStats(): Promise<OrdersStats> {
  const r = await fetch(`${API.orders}?action=stats`, { headers: ordersHeaders() });
  return r.json();
}

export interface BoardDay { date: string; orders: Order[]; count: number; }
export async function fetchOrdersBoard(): Promise<{ days: BoardDay[]; no_date: Order[] }> {
  const r = await fetch(`${API.orders}?action=board`, { headers: ordersHeaders() });
  return r.json();
}

export async function upsertOrder(order: Partial<Order>) {
  const r = await fetch(`${API.orders}?action=upsert`, {
    method: "POST", headers: ordersHeaders(), body: JSON.stringify(order),
  });
  return r.json();
}

export async function setOrderStatus(id: number, status: OrderStatus) {
  const r = await fetch(`${API.orders}?action=status`, {
    method: "POST", headers: ordersHeaders(), body: JSON.stringify({ id, status }),
  });
  return r.json();
}

export async function orderFromLead(leadId: number) {
  const r = await fetch(`${API.orders}?action=from_lead`, {
    method: "POST", headers: ordersHeaders(), body: JSON.stringify({ lead_id: leadId }),
  });
  return r.json();
}

export async function deleteOrder(id: number) {
  const r = await fetch(`${API.orders}?id=${id}`, { method: "DELETE", headers: ordersHeaders() });
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