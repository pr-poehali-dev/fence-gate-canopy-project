import { useEffect } from "react";
import { usePageContent } from "@/hooks/usePageContent";

/**
 * Динамически подменяет favicon в &lt;head&gt;, если в CMS задан blocked favicon_url
 * (страница "global", ключ "favicon_url"). При смене картинки favicon обновится
 * без перезагрузки.
 */
export default function DynamicFavicon() {
  const c = usePageContent("global");
  const url = c("favicon_url");

  useEffect(() => {
    if (!url) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    // определяем тип по расширению
    const lower = url.toLowerCase();
    if (lower.endsWith(".svg")) link.type = "image/svg+xml";
    else if (lower.endsWith(".png")) link.type = "image/png";
    else if (lower.endsWith(".ico")) link.type = "image/x-icon";
    else link.type = "image/png";
    link.href = url;
  }, [url]);

  return null;
}
