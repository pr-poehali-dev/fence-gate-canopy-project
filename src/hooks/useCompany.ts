import { useEffect, useState } from "react";
import { fetchSettings, type SiteSettings } from "@/lib/api";
import { COMPANY } from "@/lib/company";

// Кэш в памяти, чтобы не дёргать API на каждом рендере
let _cache: SiteSettings | null = null;
let _inflight: Promise<SiteSettings> | null = null;

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return COMPANY.phoneE164;
  let d = digits;
  if (d.length === 11 && d.startsWith("8")) d = "7" + d.slice(1);
  if (d.length === 10) d = "7" + d;
  return "+" + d;
}

/**
 * Единый источник реквизитов компании.
 * Берёт значения из настроек админки, а если поле пустое — из COMPANY (дефолт).
 * Обновляется автоматически по всему сайту при сохранении в админке.
 *
 * Пример:
 *   const company = useCompany();
 *   <a href={`tel:${company.phoneE164}`}>{company.phone}</a>
 */
export function useCompany() {
  const [s, setS] = useState<SiteSettings>(() => _cache || {});

  useEffect(() => {
    let alive = true;
    const load = (force = false) => {
      if (!force && _cache) {
        setS(_cache);
        return;
      }
      const promise = (!force && _inflight)
        || fetchSettings().then(d => { _cache = d; return d; });
      _inflight = promise;
      promise
        .then(d => { if (alive) setS(d); })
        .catch(() => {})
        .finally(() => { _inflight = null; });
    };
    load();
    const handler = () => { _cache = null; load(true); };
    window.addEventListener("cms:invalidate", handler);
    return () => {
      alive = false;
      window.removeEventListener("cms:invalidate", handler);
    };
  }, []);

  const phone = (s.company_phone && s.company_phone.trim()) || COMPANY.phone;
  const val = (v?: string, fallback = "") => (v && v.trim()) || fallback;

  return {
    // Контакты
    name: val(s.company_name, COMPANY.brand),
    phone,
    phoneE164: toE164(phone),
    email: val(s.company_email, COMPANY.email),
    address: val(s.company_address, COMPANY.legalAddress),
    schedule: val(s.work_hours, COMPANY.schedule),
    region: val(s.region, "Москва и МО"),
    site: COMPANY.site,
    // Юр. реквизиты
    legalName: val(s.legal_name, COMPANY.legalName),
    inn: val(s.inn, COMPANY.inn),
    ogrn: val(s.ogrn, COMPANY.ogrnip),
    legalAddress: val(s.legal_address, COMPANY.legalAddress),
    // Мессенджеры и соцсети (пустые = не показывать)
    whatsapp: val(s.whatsapp),
    telegram: val(s.telegram),
    vk: val(s.vk),
    maxLink: val(s.max_link, COMPANY.maxLink),
  };
}