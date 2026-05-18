import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useIsAdmin } from "@/hooks/useIsAdmin";

/**
 * Плавающая панель админа: видна только авторизованным.
 * Показывает «режим редактирования» и быстрые ссылки в админку.
 */
export default function AdminEditBar() {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;
  return (
    <div
      className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-[90] flex items-center gap-1.5 sm:gap-2 bg-slate-900/95 backdrop-blur text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-full shadow-2xl border border-orange-500/40"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="hidden sm:flex items-center gap-2 px-2">
        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
        <span className="text-xs font-semibold">Режим редактирования</span>
      </div>
      <Link
        to="/admin/content"
        title="Открыть редактор CMS"
        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-500 hover:bg-orange-600 text-xs font-bold"
      >
        <Icon name="LayoutGrid" size={14} /> CMS
      </Link>
      <Link
        to="/admin"
        title="Админка"
        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold"
      >
        <Icon name="Settings" size={14} />
      </Link>
    </div>
  );
}