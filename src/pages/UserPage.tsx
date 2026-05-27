import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API } from "@/lib/api";
import SiteHeader from "@/components/SiteHeader";
import BlockRenderer, { PageBlock } from "@/components/builder/BlockRenderer";
import Icon from "@/components/ui/icon";

interface PageData {
  id: number;
  slug: string;
  title: string;
  seo_description: string;
  blocks: PageBlock[];
}

export default function UserPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`${API.builder}?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(j => {
        if (j.error) {
          setErr(j.error);
        } else {
          setPage(j);
          document.title = `${j.title || slug} — СтальГрупп`;
          if (j.seo_description) {
            let m = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
            if (!m) {
              m = document.createElement("meta");
              m.name = "description";
              document.head.appendChild(m);
            }
            m.content = j.seo_description;
          }
        }
      })
      .catch(e => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader />
        <div className="flex items-center justify-center py-32 text-gray-400">
          <Icon name="Loader" size={32} className="animate-spin" />
        </div>
      </div>
    );
  }

  if (err || !page) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader />
        <div className="max-w-md mx-auto py-32 text-center">
          <Icon name="FileX" size={48} className="text-gray-300 mx-auto mb-3" />
          <h1 className="font-oswald font-bold text-2xl text-gray-900 mb-2">Страница не найдена</h1>
          <p className="text-gray-500">Возможно, она была удалена или ещё не опубликована.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      {page.blocks.length === 0 ? (
        <div className="py-32 text-center text-gray-400">Пустая страница</div>
      ) : (
        page.blocks.map((b, i) => <BlockRenderer key={b.id ?? i} block={b} />)
      )}
    </div>
  );
}
