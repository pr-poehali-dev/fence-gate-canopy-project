import { useEffect, useState } from "react";
import { fetchCalcPricing, type CalcPriceItem } from "@/lib/api";
import { applyCalcPricing } from "@/lib/calcCatalog";

// Кэш в памяти модуля — прайс грузим один раз на всё приложение.
let _loaded = false;                              // прайс уже применён?
let _inflight: Promise<CalcPriceItem[]> | null = null;

function load(force = false): Promise<void> {
  if (!force && _loaded) return Promise.resolve();
  const promise = (!force && _inflight)
    || fetchCalcPricing().then(items => { _inflight = null; return items; });
  _inflight = promise;
  return promise
    .then(items => {
      applyCalcPricing(items);
      _loaded = true;
    })
    .catch(() => {
      // API недоступен — тихо используем дефолтные цены из calcCatalog.
      _loaded = true;
    });
}

/**
 * Подгружает прайс калькулятора из БД и применяет его к справочникам
 * (calcCatalog). Вызовите хук в компоненте калькулятора:
 *
 *   const { ready } = useCalcPricing();
 *   if (!ready) return <Spinner />;   // или рендерить сразу с дефолтами
 *
 * Особенности:
 *  - грузится один раз (кэш в модульной переменной);
 *  - при ошибке API остаются дефолтные цены, ready = true;
 *  - слушает window-событие 'cms:invalidate' для перезагрузки прайса
 *    (например, после сохранения цен в админке).
 */
export function useCalcPricing(): { ready: boolean } {
  const [ready, setReady] = useState<boolean>(_loaded);

  useEffect(() => {
    let alive = true;
    load().finally(() => { if (alive) setReady(true); });

    const handler = () => {
      _loaded = false;
      _inflight = null;
      load(true).finally(() => { if (alive) setReady(true); });
    };
    window.addEventListener("cms:invalidate", handler);
    return () => {
      alive = false;
      window.removeEventListener("cms:invalidate", handler);
    };
  }, []);

  return { ready };
}

export default useCalcPricing;
