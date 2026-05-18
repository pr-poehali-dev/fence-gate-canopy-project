import { useState } from "react";
import Icon from "@/components/ui/icon";
import PhoneInput from "@/components/ui/phone-input";
import { findMaxUser, type FindMaxUserResp } from "@/lib/api";
import { isPhoneValid, phoneE164 } from "@/lib/phone";
import { toast } from "sonner";

/**
 * Виджет в админке: проверяет, найдёт ли MAX-бот клиента по номеру.
 * Опционально может отправить ему тестовое сообщение в личку.
 */
export default function MaxPhoneFinder() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FindMaxUserResp | null>(null);
  const [sendTest, setSendTest] = useState(false);

  const phoneOk = isPhoneValid(phone);

  const run = async () => {
    if (!phoneOk) {
      toast.error("Введите корректный номер РФ");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await findMaxUser(phoneE164(phone), sendTest);
      setResult(res);
      if (res.ok && res.found) {
        toast.success("Клиент найден в MAX", { description: res.message });
      } else {
        toast.warning("Не найден в MAX", { description: res.message || res.error || "" });
      }
    } catch (e) {
      toast.error("Ошибка проверки", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0d1017] border border-[#1e2230] rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 bg-orange-500/15 rounded-xl flex items-center justify-center">
          <Icon name="Search" size={18} className="text-orange-400" />
        </div>
        <div>
          <div className="font-oswald font-bold text-white text-base">Тест поиска в MAX по номеру</div>
          <div className="text-white/45 text-xs">
            Проверьте, найдёт ли бот клиента в MAX до того, как тот оформит заявку
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 mb-3">
        <PhoneInput value={phone} onChange={setPhone} />
        <button
          type="button"
          onClick={run}
          disabled={loading || !phoneOk}
          className="btn-orange px-5 py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-2 justify-center">
            <Icon name={loading ? "Loader" : "Search"} size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Ищем…" : "Проверить"}
          </span>
        </button>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none mb-3">
        <input
          type="checkbox"
          checked={sendTest}
          onChange={(e) => setSendTest(e.target.checked)}
          className="w-4 h-4 accent-orange-500"
        />
        <span className="text-xs text-white/60">
          Отправить найденному пользователю тестовое сообщение в MAX
        </span>
      </label>

      {result && (
        <div
          className={`rounded-xl border p-3.5 text-sm ${
            result.found
              ? "bg-green-500/10 border-green-500/30 text-green-200"
              : "bg-orange-500/10 border-orange-500/30 text-orange-200"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <Icon
              name={result.found ? "CheckCircle2" : "AlertCircle"}
              size={18}
              className={result.found ? "text-green-400 mt-0.5" : "text-orange-400 mt-0.5"}
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold mb-1">
                {result.found ? "Клиент найден в MAX" : "Клиент не найден в MAX"}
              </div>
              {result.message && (
                <div className="text-xs opacity-85 leading-relaxed">{result.message}</div>
              )}
              {result.phone_normalized && (
                <div className="text-[11px] mt-2 opacity-70">
                  Номер: <span className="font-mono">{result.phone_normalized}</span>
                </div>
              )}
              {result.chat_id && (
                <div className="text-[11px] opacity-70">
                  chat_id: <span className="font-mono">{result.chat_id}</span>
                </div>
              )}
              {sendTest && result.test_sent !== undefined && (
                <div className="mt-2 text-[11px]">
                  {result.test_sent
                    ? "✅ Тестовое сообщение отправлено в MAX"
                    : `❌ Не удалось отправить: ${result.test_info || "ошибка"}`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 text-[11px] text-white/35 leading-relaxed">
        Поиск идёт через эндпоинты MAX Bot API: <code className="text-white/55">/users/by_phone</code>,{" "}
        <code className="text-white/55">/users/search</code>,{" "}
        <code className="text-white/55">/contacts/by_phone</code>, создание диалога{" "}
        <code className="text-white/55">POST /chats</code>. Если ни один эндпоинт не вернул пользователя —
        номер ещё не зарегистрирован в MAX или скрыт в настройках приватности.
      </div>
    </div>
  );
}
