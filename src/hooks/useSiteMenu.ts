import { useEffect, useState } from "react";
import { API } from "@/lib/api";

export interface MenuItem {
  id: number;
  parent_id: number | null;
  label: string;
  href: string;
  icon: string;
  badge: string;
  description: string;
  position: number;
  is_hidden: boolean;
}

export interface MenuCategory extends MenuItem {
  items: MenuItem[];
}

/**
 * Фолбэк-меню — то же что и было в коде до перехода на CMS.
 * Используем когда API не ответил, чтобы шапка не пустовала.
 */
export const FALLBACK_MENU: MenuCategory[] = [
  {
    id: -1, parent_id: null, label: "Заборы", href: "", icon: "Fence", badge: "", description: "", position: 1, is_hidden: false,
    items: [
      { id: -101, parent_id: -1, label: "Из профнастила",    href: "/services/profnastil",     icon: "", badge: "",         description: "От 1 450 ₽/м.п.", position: 1, is_hidden: false },
      { id: -102, parent_id: -1, label: "Евроштакетник",     href: "/services/shtaketnik",     icon: "", badge: "",         description: "От 1 850 ₽/м.п.", position: 2, is_hidden: false },
      { id: -103, parent_id: -1, label: "3D-сетка",          href: "/services/3d-setka",       icon: "", badge: "",         description: "От 1 200 ₽/м.п.", position: 3, is_hidden: false },
      { id: -104, parent_id: -1, label: "Ковка",             href: "/services/kovka",          icon: "", badge: "Премиум",  description: "От 4 800 ₽/м.п.", position: 4, is_hidden: false },
      { id: -105, parent_id: -1, label: "Сетка-рабица",      href: "/services/setka-rabitsa",  icon: "", badge: "",         description: "От 650 ₽/м.п.",   position: 5, is_hidden: false },
    ],
  },
  {
    id: -2, parent_id: null, label: "Ворота и калитки", href: "", icon: "DoorOpen", badge: "", description: "", position: 2, is_hidden: false,
    items: [
      { id: -201, parent_id: -2, label: "Откатные ворота",   href: "/services/otkatnye-vorota",    icon: "", badge: "", description: "От 45 000 ₽", position: 1, is_hidden: false },
      { id: -202, parent_id: -2, label: "Распашные ворота",  href: "/services/raspashnye-vorota",  icon: "", badge: "", description: "От 28 000 ₽", position: 2, is_hidden: false },
      { id: -203, parent_id: -2, label: "Калитки",           href: "/services/kalitki",            icon: "", badge: "", description: "От 7 500 ₽",  position: 3, is_hidden: false },
    ],
  },
  {
    id: -3, parent_id: null, label: "Навесы и беседки", href: "", icon: "Home", badge: "", description: "", position: 3, is_hidden: false,
    items: [
      { id: -301, parent_id: -3, label: "Навесы для авто", href: "/services/navesy",   icon: "", badge: "", description: "От 18 000 ₽/м²", position: 1, is_hidden: false },
      { id: -302, parent_id: -3, label: "Беседки",         href: "/services/besedki",  icon: "", badge: "", description: "От 65 000 ₽",    position: 2, is_hidden: false },
    ],
  },
  {
    id: -4, parent_id: null, label: "Фундаменты", href: "/services/fundamenty", icon: "Layers", badge: "", description: "", position: 4, is_hidden: false,
    items: [
      { id: -401, parent_id: -4, label: "Бетонирование",     href: "/services/fundamenty#tab-betonirovanie", icon: "", badge: "Рекомендуем", description: "Универсал · М300 · 1.2 м", position: 1, is_hidden: false },
      { id: -402, parent_id: -4, label: "Бутование щебнем",  href: "/services/fundamenty#tab-butovanie",     icon: "", badge: "",            description: "Лёгкие заборы · сухие грунты", position: 2, is_hidden: false },
      { id: -403, parent_id: -4, label: "Винтовые сваи",     href: "/services/fundamenty#tab-svai",          icon: "", badge: "",            description: "Торф · болото · круглый год",  position: 3, is_hidden: false },
      { id: -404, parent_id: -4, label: "Ленточный ростверк",href: "/services/fundamenty#tab-rostverk",      icon: "", badge: "Премиум",     description: "Тяжёлые заборы · 50+ лет",     position: 4, is_hidden: false },
    ],
  },
  {
    id: -5, parent_id: null, label: "Столбы", href: "/uslugi/stolby", icon: "Building", badge: "", description: "", position: 5, is_hidden: false,
    items: [
      { id: -501, parent_id: -5, label: "Из профильной трубы", href: "/uslugi/stolby#tab-proftruba", icon: "", badge: "",        description: "От 1 200 ₽", position: 1, is_hidden: false },
      { id: -502, parent_id: -5, label: "Кирпичные",            href: "/uslugi/stolby#tab-kirpich",   icon: "", badge: "Премиум", description: "От 8 500 ₽/м.п.", position: 2, is_hidden: false },
      { id: -503, parent_id: -5, label: "Из блоков",            href: "/uslugi/stolby#tab-bloki",     icon: "", badge: "",        description: "От 6 500 ₽/м.п.", position: 3, is_hidden: false },
    ],
  },
  {
    id: -6, parent_id: null, label: "Благоустройство", href: "", icon: "Trees", badge: "", description: "", position: 6, is_hidden: false,
    items: [
      { id: -601, parent_id: -6, label: "Бетонные площадки", href: "/services/betonnye-ploschadki", icon: "", badge: "", description: "От 2 200 ₽/м²",  position: 1, is_hidden: false },
      { id: -602, parent_id: -6, label: "Заезд на участок",  href: "/services/zaezd-na-uchastok",   icon: "", badge: "", description: "От 18 000 ₽",    position: 2, is_hidden: false },
    ],
  },
  {
    id: -7, parent_id: null, label: "Информация", href: "", icon: "FileText", badge: "", description: "", position: 7, is_hidden: false,
    items: [
      { id: -701, parent_id: -7, label: "Схемы и чертежи", href: "/shemy-chertezi", icon: "", badge: "", description: "Каталог технических узлов", position: 1, is_hidden: false },
      { id: -702, parent_id: -7, label: "Отзывы клиентов", href: "/reviews",        icon: "", badge: "", description: "Отзывы и оценки работ",     position: 2, is_hidden: false },
    ],
  },
];

let _cache: MenuCategory[] | null = null;
let _inFlight: Promise<MenuCategory[]> | null = null;

async function fetchMenu(): Promise<MenuCategory[]> {
  if (_cache) return _cache;
  if (_inFlight) return _inFlight;
  _inFlight = (async () => {
    try {
      const r = await fetch(`${API.menu}?t=${Date.now()}`);
      if (!r.ok) throw new Error(`status ${r.status}`);
      const j = await r.json();
      const list: MenuCategory[] = Array.isArray(j?.menu) ? j.menu : [];
      if (list.length > 0) {
        _cache = list;
        return list;
      }
      return FALLBACK_MENU;
    } catch {
      return FALLBACK_MENU;
    } finally {
      _inFlight = null;
    }
  })();
  return _inFlight;
}

/** Хук с публичным меню сайта (категории + пункты). */
export function useSiteMenu(): MenuCategory[] {
  const [menu, setMenu] = useState<MenuCategory[]>(_cache || FALLBACK_MENU);

  useEffect(() => {
    let alive = true;
    fetchMenu().then(list => { if (alive) setMenu(list); });

    // живое обновление, когда админ сохранил меню
    const onInvalidate = () => {
      _cache = null;
      fetchMenu().then(list => { if (alive) setMenu(list); });
    };
    window.addEventListener("menu:invalidate", onInvalidate);
    return () => {
      alive = false;
      window.removeEventListener("menu:invalidate", onInvalidate);
    };
  }, []);

  return menu;
}

/** Сбросить кэш меню (вызывать после сохранения в админке). */
export function invalidateMenu() {
  _cache = null;
  window.dispatchEvent(new CustomEvent("menu:invalidate"));
}
