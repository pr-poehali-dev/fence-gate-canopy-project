// Backend API endpoints
export const API = {
  prices:  "https://functions.poehali.dev/5ce688dd-ed6c-4c7d-8e4b-899b4943fcf0",
  auth:    "https://functions.poehali.dev/4c4b6b0c-ac97-4644-94b6-63d724b326a2",
  reviews: "https://functions.poehali.dev/4d424d2e-b164-46ab-ad42-7f4ce291d054",
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
