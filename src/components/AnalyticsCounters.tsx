import { useEffect } from "react";
import { fetchSettings } from "@/lib/api";

/**
 * Динамически подключает счётчики аналитики на основе настроек из админки:
 *   - yandex_metrika_id     — например "12345678"
 *   - yandex_verification    — код подтверждения для Яндекс.Вебмастера
 *   - google_analytics_id    — например "G-XXXXXX"
 *   - seo_title              — переопределить <title>
 *   - seo_description        — переопределить description
 *   - seo_og_image           — переопределить og:image
 *
 * Скрипты подключаются один раз. Все настройки задаются в /admin → SEO.
 */
export default function AnalyticsCounters() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await fetchSettings(false);
        if (cancelled) return;

        // ── Яндекс.Метрика ────────────────────────────────────
        const ymId = (s as Record<string, unknown>)["yandex_metrika_id"];
        if (ymId && typeof ymId === "string" && /^\d{5,12}$/.test(ymId.trim())) {
          injectYandexMetrika(ymId.trim());
        }

        // ── Подтверждение Яндекс.Вебмастер ────────────────────
        const yv = (s as Record<string, unknown>)["yandex_verification"];
        if (yv && typeof yv === "string" && yv.trim()) {
          upsertMeta("yandex-verification", yv.trim());
        }

        // ── Google Analytics ──────────────────────────────────
        const gaId = (s as Record<string, unknown>)["google_analytics_id"];
        if (gaId && typeof gaId === "string" && /^(G-|UA-)[A-Z0-9-]+$/i.test(gaId.trim())) {
          injectGA(gaId.trim());
        }

        // ── Google Search Console ─────────────────────────────
        const gv = (s as Record<string, unknown>)["google_verification"];
        if (gv && typeof gv === "string" && gv.trim()) {
          upsertMeta("google-site-verification", gv.trim());
        }

        // ── Динамическое переопределение SEO-тегов ────────────
        const title = (s as Record<string, unknown>)["seo_title"];
        if (title && typeof title === "string" && title.trim()) {
          document.title = title.trim();
          upsertMetaProp("og:title", title.trim());
          upsertMetaName("twitter:title", title.trim());
        }
        const desc = (s as Record<string, unknown>)["seo_description"];
        if (desc && typeof desc === "string" && desc.trim()) {
          upsertMetaName("description", desc.trim());
          upsertMetaProp("og:description", desc.trim());
          upsertMetaName("twitter:description", desc.trim());
        }
        const ogImg = (s as Record<string, unknown>)["seo_og_image"];
        if (ogImg && typeof ogImg === "string" && ogImg.trim()) {
          upsertMetaProp("og:image", ogImg.trim());
          upsertMetaName("twitter:image", ogImg.trim());
        }
        const keywords = (s as Record<string, unknown>)["seo_keywords"];
        if (keywords && typeof keywords === "string" && keywords.trim()) {
          upsertMetaName("keywords", keywords.trim());
        }
      } catch {
        // тихо — счётчик опциональный
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return null;
}

function upsertMeta(name: string, content: string) {
  upsertMetaName(name, content);
}
function upsertMetaName(name: string, content: string) {
  let m = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!m) {
    m = document.createElement("meta");
    m.setAttribute("name", name);
    document.head.appendChild(m);
  }
  m.setAttribute("content", content);
}
function upsertMetaProp(prop: string, content: string) {
  let m = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
  if (!m) {
    m = document.createElement("meta");
    m.setAttribute("property", prop);
    document.head.appendChild(m);
  }
  m.setAttribute("content", content);
}

function injectYandexMetrika(id: string) {
  if (document.getElementById(`ym-${id}`)) return;
  const w = window as unknown as Record<string, unknown>;
  const init = document.createElement("script");
  init.id = `ym-${id}`;
  init.type = "text/javascript";
  init.text = `
    (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
    (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
    ym(${id},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true,trackHash:true});
  `;
  document.head.appendChild(init);

  // noscript pixel
  if (!document.getElementById(`ym-ns-${id}`)) {
    const ns = document.createElement("noscript");
    ns.id = `ym-ns-${id}`;
    ns.innerHTML = `<div><img src="https://mc.yandex.ru/watch/${id}" style="position:absolute;left:-9999px;" alt=""/></div>`;
    document.body.appendChild(ns);
  }
  void w;
}

function injectGA(id: string) {
  if (document.getElementById(`ga-${id}`)) return;
  const s = document.createElement("script");
  s.id = `ga-${id}`;
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);

  const init = document.createElement("script");
  init.text = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${id}');
  `;
  document.head.appendChild(init);
}
