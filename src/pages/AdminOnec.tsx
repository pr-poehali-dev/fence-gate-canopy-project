import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API, adminToken } from "@/lib/api";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";

interface OnecSettings {
  base_url: string;
  username: string;
  password: string;
  webhook_secret: string;
  auto_sync_leads: boolean;
  auto_sync_prices: boolean;
  last_sync_at?: string | null;
}

interface SyncStatus {
  configured: boolean;
  last_sync_at?: string | null;
  unsent_leads: number;
  ok_24h: number;
  errors_24h: number;
}

interface LogItem {
  id: number;
  direction: string;
  entity_type: string;
  entity_id: string;
  status: string;
  error: string;
  created_at: string;
}

export default function AdminOnec() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<OnecSettings>({
    base_url: "", username: "", password: "", webhook_secret: "",
    auto_sync_leads: true, auto_sync_prices: false,
  });
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [log, setLog] = useState<LogItem[]>([]);
  const [tab, setTab] = useState<"settings" | "log" | "guide">("settings");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [pushing, setPushing] = useState(false);

  useEffect(() => {
    if (!adminToken.get()) { navigate("/admin"); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    const hdr = { "X-Auth-Token": adminToken.get() };
    const [s, st, lg] = await Promise.all([
      fetch(`${API.onec}?settings=1`, { headers: hdr }).then(r => r.json()),
      fetch(`${API.onec}?status=1`, { headers: hdr }).then(r => r.json()),
      fetch(`${API.onec}?log=1`, { headers: hdr }).then(r => r.json()),
    ]);
    if (s.settings) setSettings({ ...settings, ...s.settings });
    if (st && !st.error) setStatus(st);
    if (lg.items) setLog(lg.items);
  };

  const saveSettings = async () => {
    setSaving(true);
    const r = await fetch(`${API.onec}?action=save_settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": adminToken.get() },
      body: JSON.stringify(settings),
    });
    const j = await r.json();
    setSaving(false);
    if (j.ok) { toast.success("Настройки сохранены"); await loadAll(); }
    else toast.error(j.error || "Ошибка");
  };

  const testConnection = async () => {
    setTesting(true);
    const r = await fetch(`${API.onec}?action=test_connection`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": adminToken.get() },
      body: "{}",
    });
    const j = await r.json();
    setTesting(false);
    if (j.ok) toast.success("Соединение с 1С успешно");
    else toast.error("Не удалось: " + JSON.stringify(j.response).slice(0, 100));
    await loadAll();
  };

  const pushAllLeads = async () => {
    if (!confirm("Отправить все неотправленные заявки в 1С?")) return;
    setPushing(true);
    const r = await fetch(`${API.onec}?action=push_all_leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": adminToken.get() },
      body: "{}",
    });
    const j = await r.json();
    setPushing(false);
    if (j.ok) toast.success(`Отправлено: ${j.sent}, ошибок: ${j.failed}`);
    else toast.error(j.error || "Ошибка");
    await loadAll();
  };

  const webhookUrl = API.onec + "?action=webhook";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
              <Icon name="ArrowLeft" size={16} />
            </Link>
            <div>
              <h1 className="font-oswald font-bold text-gray-900 text-lg">Интеграция с 1С</h1>
              <p className="text-xs text-gray-500">Передача заявок и обмен данными</p>
            </div>
          </div>
          {status && (
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${status.configured ? "bg-green-500" : "bg-gray-300"}`} />
              <span className="text-gray-600">{status.configured ? "Подключено" : "Не настроено"}</span>
            </div>
          )}
        </div>
      </header>

      {/* Сводка */}
      {status && (
        <div className="max-w-6xl mx-auto px-4 pt-4 grid sm:grid-cols-4 gap-3">
          <Stat label="Не отправлено" value={status.unsent_leads} icon="Inbox" color="bg-orange-100 text-orange-700" />
          <Stat label="Успешно за 24ч" value={status.ok_24h} icon="CheckCircle2" color="bg-green-100 text-green-700" />
          <Stat label="Ошибок за 24ч" value={status.errors_24h} icon="AlertTriangle" color="bg-red-100 text-red-700" />
          <Stat label="Последняя синхр." value={status.last_sync_at ? new Date(status.last_sync_at).toLocaleString("ru-RU") : "—"} icon="Clock" color="bg-blue-100 text-blue-700" small />
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Вкладки */}
        <div className="flex gap-1 mb-4 border-b border-gray-200">
          {[
            { id: "settings", label: "Настройки", icon: "Settings" },
            { id: "log",      label: "Журнал",    icon: "List" },
            { id: "guide",    label: "Инструкция", icon: "BookOpen" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as "settings" | "log" | "guide")}
              className={`px-4 py-2.5 text-sm font-bold flex items-center gap-2 border-b-2 ${tab === t.id ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "settings" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 max-w-2xl">
            <h2 className="font-oswald font-bold text-lg text-gray-900 mb-4">Подключение к 1С</h2>
            <div className="space-y-4">
              <Input label="URL 1С HTTP-сервиса" placeholder="https://1c.example.ru/base" value={settings.base_url} onChange={v => setSettings({ ...settings, base_url: v })} />
              <div className="grid sm:grid-cols-2 gap-3">
                <Input label="Логин 1С" value={settings.username} onChange={v => setSettings({ ...settings, username: v })} />
                <Input label="Пароль 1С" type="password" value={settings.password} onChange={v => setSettings({ ...settings, password: v })} />
              </div>
              <Input label="Webhook-секрет (для входящих от 1С)" value={settings.webhook_secret} onChange={v => setSettings({ ...settings, webhook_secret: v })} />

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.auto_sync_leads} onChange={e => setSettings({ ...settings, auto_sync_leads: e.target.checked })} className="w-4 h-4 accent-orange-500" />
                <span className="text-sm text-gray-700">Автоматически отправлять новые заявки в 1С</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.auto_sync_prices} onChange={e => setSettings({ ...settings, auto_sync_prices: e.target.checked })} className="w-4 h-4 accent-orange-500" />
                <span className="text-sm text-gray-700">Получать цены из 1С (раз в сутки)</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-2 mt-6">
              <button onClick={saveSettings} disabled={saving} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-lg flex items-center gap-2">
                {saving ? <><Icon name="Loader" size={14} className="animate-spin" />Сохранение</> : <><Icon name="Save" size={14} />Сохранить настройки</>}
              </button>
              <button onClick={testConnection} disabled={testing || !settings.base_url} className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-bold px-5 py-2.5 rounded-lg flex items-center gap-2">
                {testing ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Plug" size={14} />}
                Проверить связь
              </button>
              <button onClick={pushAllLeads} disabled={pushing || !settings.base_url} className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-lg flex items-center gap-2">
                {pushing ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
                Отправить все заявки
              </button>
            </div>
          </div>
        )}

        {tab === "log" && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-oswald font-bold text-lg text-gray-900">Журнал синхронизации</h2>
              <button onClick={loadAll} className="text-sm text-gray-500 hover:text-orange-500 flex items-center gap-1">
                <Icon name="RefreshCw" size={14} /> Обновить
              </button>
            </div>
            {log.length === 0 ? (
              <div className="p-8 text-center text-gray-400">Журнал пуст</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {log.map(l => (
                  <div key={l.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                    <Icon name={l.direction === "in" ? "ArrowDownToLine" : "ArrowUpFromLine"} size={14} className="text-gray-400" />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${l.status === "ok" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {l.status}
                    </span>
                    <span className="font-bold text-gray-900">{l.entity_type}</span>
                    {l.entity_id && <span className="text-gray-500">#{l.entity_id}</span>}
                    {l.error && <span className="text-red-500 text-xs truncate flex-1">{l.error}</span>}
                    <span className="text-xs text-gray-400 ml-auto">{new Date(l.created_at).toLocaleString("ru-RU")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "guide" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-3xl space-y-5 text-sm text-gray-700 leading-relaxed">
            <div>
              <h2 className="font-oswald font-bold text-xl text-gray-900 mb-2">Как подключить 1С</h2>
              <p>Сайт умеет:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Автоматически отправлять каждую заявку с сайта в 1С</li>
                <li>Принимать webhook от 1С (например, смена статуса сделки)</li>
                <li>Опционально импортировать цены из 1С</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">1. Создать HTTP-сервис в 1С</h3>
              <p>В вашей конфигурации создайте HTTP-сервис с корневым URL <code className="bg-gray-100 px-1 py-0.5 rounded">/hs/site</code> и шаблонами:</p>
              <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded-lg mt-2 overflow-x-auto">{`POST  /hs/site/lead   — приём заявки
POST  /hs/site/ping   — проверка связи`}</pre>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">2. Указать настройки выше</h3>
              <p>URL базы 1С + логин/пароль пользователя с доступом к HTTP-сервису.</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">3. Webhook от 1С — на этот URL</h3>
              <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-between gap-2">
                <code className="text-xs break-all">{webhookUrl}</code>
                <button onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("Скопировано"); }} className="shrink-0 text-orange-500 hover:text-orange-600">
                  <Icon name="Copy" size={14} />
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Подписывайте каждый запрос HMAC-SHA256 от тела с ключом «Webhook-секрет», заголовок <code>X-Onec-Signature</code>.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">4. Формат payload заявки</h3>
              <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded-lg overflow-x-auto">{`{
  "site_lead_id": 123,
  "name": "Иван",
  "phone": "+7...",
  "message": "...",
  "source": "calculator",
  "city": "Москва",
  "object_type": "...",
  "total_rub": 152000
}`}</pre>
              <p className="mt-2 text-xs text-gray-500">1С должна вернуть JSON <code className="bg-gray-100 px-1">{"{\"id\":\"...\"}"}</code> — идентификатор сделки.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon, color, small }: { label: string; value: number | string; icon: string; color: string; small?: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon name={icon} size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
        <div className={`font-bold text-gray-900 ${small ? "text-sm truncate" : "text-lg"}`}>{value}</div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-gray-500 mb-1">{label}</span>
      <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-orange-500 outline-none" />
    </label>
  );
}