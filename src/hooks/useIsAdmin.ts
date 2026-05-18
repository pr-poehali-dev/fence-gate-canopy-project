import { useEffect, useState } from "react";
import { verifyAdmin } from "@/lib/api";

// Кэш сессии — чтобы не дёргать verify на каждом монтировании компонента
let _cached: boolean | null = null;
let _inflight: Promise<boolean> | null = null;

/**
 * Возвращает true, если текущий пользователь — авторизованный админ.
 * Используется для показа кнопок inline-редактирования прямо на сайте.
 */
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState<boolean>(_cached ?? false);

  useEffect(() => {
    if (_cached !== null) {
      setIsAdmin(_cached);
      return;
    }
    if (!_inflight) {
      _inflight = verifyAdmin()
        .then(ok => { _cached = ok; return ok; })
        .catch(() => { _cached = false; return false; });
    }
    let alive = true;
    _inflight.then(ok => { if (alive) setIsAdmin(ok); });
    return () => { alive = false; };
  }, []);

  return isAdmin;
}

export function resetAdminCache() {
  _cached = null;
  _inflight = null;
}
