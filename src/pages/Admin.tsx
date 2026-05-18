import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import MaxChatPicker from "@/components/MaxChatPicker";
import {
  fetchPrices, fetchReviews, loginAdmin, verifyAdmin,
  updatePrices, moderateReview, deleteReview, adminToken,
  fetchSettings, saveSettings, testEmail,
  PriceItem, ReviewItem, SiteSettings,
} from "@/lib/api";

type Tab = "prices" | "reviews" | "settings";

export default function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<Tab>("prices");

  // Prices state
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [dirty, setDirty] = useState<Record<string, { price: number; title: string }>>({});
  const [saving, setSaving] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  // Settings state
  const [settings, setSettings] = useState<SiteSettings>({});
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [chatPickerOpen, setChatPickerOpen] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState("");

  useEffect(() => {
    document.title = "Админ-панель — СтальГрупп";
    verifyAdmin().then(ok => setAuthed(ok));
  }, []);

  useEffect(() => {
    if (authed) {
      loadPrices();
      loadReviews();
      loadSettings();
    }
  }, [authed]);

  const loadPrices   = async () => setPrices(await fetchPrices());
  const loadReviews  = async () => setReviews(await fetchReviews(true));
  const loadSettings = async () => setSettings(await fetchSettings(true));

  const onSettingChange = (key: keyof SiteSettings, value: string) => {
    setSettings(s => ({ ...s, [key]: value }));
    setSettingsDirty(true);
    setSettingsSaved(false);
  };

  const saveSettingsHandler = async () => {
    setSettingsSaving(true);
    try {
      const items = [
        // MAX-бот
        { key: "max_bot_token",         value: settings.max_bot_token || "" },
        { key: "max_chat_id",           value: settings.max_chat_id   || "" },
        { key: "notify_client_via_max", value: settings.notify_client_via_max || "true" },
        { key: "client_notify_text",    value: settings.client_notify_text || "" },
        // Email
        { key: "notify_email_enabled",  value: settings.notify_email_enabled || "false" },
        { key: "notify_email_to",       value: settings.notify_email_to || "" },
        { key: "smtp_host",             value: settings.smtp_host || "" },
        { key: "smtp_port",             value: settings.smtp_port || "465" },
        { key: "smtp_user",             value: settings.smtp_user || "" },
        { key: "smtp_password",         value: settings.smtp_password || "" },
        { key: "smtp_from_name",        value: settings.smtp_from_name || "" },
        // Компания
        { key: "company_phone",         value: settings.company_phone || "" },
        { key: "company_email",         value: settings.company_email || "" },
        { key: "company_name",          value: settings.company_name || "" },
      ];
      await saveSettings(items);
      setSettingsDirty(false);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 4000);
      await loadSettings();
    } finally {
      setSettingsSaving(false);
    }
  };

  const doTestEmail = async () => {
    setEmailTesting(true);
    setEmailTestResult("");
    try {
      // Сначала сохраним текущие настройки, иначе тест пойдёт со старыми
      await saveSettingsHandler();
      const r = await testEmail();
      setEmailTestResult(r?.ok
        ? "✅ Письмо отправлено! Проверьте почту."
        : `❌ ${r?.info || "Не удалось отправить"}`);
      setTimeout(() => setEmailTestResult(""), 10000);
    } catch {
      setEmailTestResult("❌ Ошибка сети");
    } finally {
      setEmailTesting(false);
    }
  };

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const token = await loginAdmin(login, password);
    if (token) setAuthed(true);
    else setLoginError("Неверный логин или пароль");
  };

  const doLogout = () => {
    adminToken.clear();
    setAuthed(false);
    setLogin(""); setPassword("");
  };

  const onPriceChange = (slug: string, field: "price" | "title", value: string) => {
    setDirty(d => ({
      ...d,
      [slug]: {
        ...d[slug],
        price: field === "price" ? parseFloat(value) || 0 : (d[slug]?.price ?? prices.find(p => p.slug === slug)!.price),
        title: field === "title" ? value : (d[slug]?.title ?? prices.find(p => p.slug === slug)!.title),
      }
    }));
  };

  const savePrices = async () => {
    const items = Object.entries(dirty).map(([slug, v]) => ({ slug, ...v }));
    if (!items.length) return;
    setSaving(true);
    try {
      await updatePrices(items);
      setDirty({});
      await loadPrices();
    } finally {
      setSaving(false);
    }
  };

  const toggleApprove = async (r: ReviewItem) => {
    await moderateReview(r.id, !r.is_approved);
    await loadReviews();
  };

  const removeReview = async (id: number) => {
    if (!confirm("Удалить отзыв?")) return;
    await deleteReview(id);
    await loadReviews();
  };

  // ──────────────────── LOGIN ────────────────────
  if (authed === null) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0d0f14] text-white/40">Проверка авторизации...</div>;
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0f14] p-4">
        <form onSubmit={doLogin}
          className="w-full max-w-md bg-[#141720] border border-[#1e2230] rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="ShieldCheck" size={26} className="text-orange-400" />
            </div>
            <h1 className="font-oswald font-bold text-2xl text-white mb-1">Админ-панель</h1>
            <p className="text-white/40 text-sm">СтальГрупп · вход</p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Icon name="User" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="text" required value={login} onChange={e => setLogin(e.target.value)}
                placeholder="Логин"
                className="w-full bg-[#1a1f2e] border border-[#1e2230] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50" />
            </div>
            <div className="relative">
              <Icon name="Lock" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Пароль"
                className="w-full bg-[#1a1f2e] border border-[#1e2230] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50" />
            </div>
            {loginError && (
              <div className="text-red-400 text-xs text-center">{loginError}</div>
            )}
            <button type="submit" className="btn-orange w-full py-3 rounded-xl text-sm">
              Войти
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ──────────────────── DASHBOARD ────────────────────
  const dirtyCount = Object.keys(dirty).length;
  const pending = reviews.filter(r => !r.is_approved);

  return (
    <div className="min-h-screen bg-[#0d0f14]">
      {/* TopBar */}
      <header className="border-b border-[#1e2230] bg-[#141720] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Icon name="ShieldCheck" size={16} className="text-gray-900" />
            </div>
            <div>
              <div className="font-oswald font-bold text-white text-sm">АДМИН-ПАНЕЛЬ</div>
              <div className="text-white/40 text-[10px]">СтальГрупп · ИП Балтаг А. В.</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/leads" className="text-orange-400/90 hover:text-orange-400 text-xs flex items-center gap-1 px-2.5 py-1 border border-orange-500/30 hover:border-orange-500/60 rounded-lg transition-all">
              <Icon name="Inbox" size={13} /> Заявки
            </Link>
            <Link to="/" className="text-white/40 hover:text-orange-400 text-xs flex items-center gap-1">
              <Icon name="ExternalLink" size={13} /> Сайт
            </Link>
            <button onClick={doLogout}
              className="text-white/40 hover:text-red-400 text-xs flex items-center gap-1">
              <Icon name="LogOut" size={13} /> Выйти
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 -mb-px overflow-x-auto">
          {([
            ["prices",   "Цены",      prices.length],
            ["reviews",  "Отзывы",    pending.length],
            ["settings", "Настройки", 0],
          ] as [Tab, string, number][]).map(([k, label, badge]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-4 py-2.5 text-sm border-b-2 transition-all flex items-center gap-2 ${
                tab === k
                  ? "border-orange-500 text-orange-400"
                  : "border-transparent text-white/40 hover:text-white"
              }`}>
              {label}
              {badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === k ? "bg-orange-500 text-gray-900" : "bg-[#1e2230] text-white/60"
                }`}>{badge}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {tab === "prices" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-oswald font-bold text-2xl text-white mb-1">Редактирование цен</h2>
                <p className="text-white/40 text-sm">Изменения публикуются на сайте сразу после сохранения.</p>
              </div>
              <button onClick={savePrices} disabled={dirtyCount === 0 || saving}
                className="btn-orange px-6 py-2.5 rounded-xl text-sm disabled:opacity-40">
                <span className="flex items-center gap-2">
                  <Icon name={saving ? "Loader" : "Save"} size={15} className={saving ? "animate-spin" : ""} />
                  {saving ? "Сохранение..." : `Сохранить (${dirtyCount})`}
                </span>
              </button>
            </div>

            <div className="bg-[#141720] border border-[#1e2230] rounded-2xl overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#1e2230]">
                    <th className="text-left py-3 px-4 text-white/40 text-xs uppercase">Категория</th>
                    <th className="text-left py-3 px-4 text-white/40 text-xs uppercase">Название</th>
                    <th className="text-right py-3 px-4 text-white/40 text-xs uppercase">Цена</th>
                    <th className="text-left py-3 px-4 text-white/40 text-xs uppercase">Ед.</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map(p => {
                    const editTitle = dirty[p.slug]?.title ?? p.title;
                    const editPrice = dirty[p.slug]?.price ?? p.price;
                    const changed = !!dirty[p.slug];
                    return (
                      <tr key={p.slug} className={`border-b border-[#1a1f2e] hover:bg-[#1a1f2e]/40 ${changed ? "bg-orange-500/5" : ""}`}>
                        <td className="py-2.5 px-4">
                          <span className="text-[10px] text-orange-400/80 uppercase tracking-wider">{p.category}</span>
                        </td>
                        <td className="py-2.5 px-4">
                          <input type="text" value={editTitle}
                            onChange={e => onPriceChange(p.slug, "title", e.target.value)}
                            className="w-full bg-transparent border border-transparent focus:border-orange-500/40 hover:border-[#2a3040] rounded px-2 py-1 text-white text-sm focus:outline-none transition-colors" />
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <input type="number" value={editPrice} step="50"
                            onChange={e => onPriceChange(p.slug, "price", e.target.value)}
                            className="w-32 bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-lg px-3 py-1.5 text-orange-400 font-oswald font-bold text-right focus:outline-none" />
                        </td>
                        <td className="py-2.5 px-4 text-white/40 text-xs">{p.unit}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "reviews" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-oswald font-bold text-2xl text-white mb-1">Модерация отзывов</h2>
                <p className="text-white/40 text-sm">Одобрено: {reviews.filter(r => r.is_approved).length} · Ожидает: {pending.length}</p>
              </div>
              <button onClick={loadReviews}
                className="text-white/40 hover:text-orange-400 text-sm flex items-center gap-1">
                <Icon name="RotateCw" size={14} /> Обновить
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map(r => (
                <div key={r.id}
                  className={`bg-[#141720] border rounded-2xl p-5 ${
                    r.is_approved ? "border-[#1e2230]" : "border-orange-500/30 bg-orange-500/5"
                  }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium text-white text-sm">{r.name}</div>
                      <div className="text-white/40 text-xs">
                        {r.city && <>{r.city} · </>}
                        {r.service && <>{r.service} · </>}
                        {r.created_at && new Date(r.created_at).toLocaleDateString("ru-RU")}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Icon key={i} name="Star" size={12}
                          className={i <= r.rating ? "text-orange-400 fill-orange-400" : "text-white/15"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed mb-3">{r.text}</p>
                  {r.photo_url && (
                    <a href={r.photo_url} target="_blank" rel="noopener noreferrer">
                      <img src={r.photo_url} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
                    </a>
                  )}
                  <div className="flex items-center gap-2 pt-3 border-t border-[#1e2230]">
                    <button onClick={() => toggleApprove(r)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        r.is_approved
                          ? "bg-[#1a1f2e] text-white/60 hover:text-white"
                          : "bg-green-500/15 text-green-400 hover:bg-green-500/25"
                      }`}>
                      <span className="flex items-center justify-center gap-1.5">
                        <Icon name={r.is_approved ? "EyeOff" : "Check"} size={13} />
                        {r.is_approved ? "Снять с публикации" : "Одобрить"}
                      </span>
                    </button>
                    <button onClick={() => removeReview(r.id)}
                      className="px-3 py-2 rounded-lg bg-[#1a1f2e] text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-oswald font-bold text-2xl text-white mb-1">Настройки сайта</h2>
                <p className="text-white/40 text-sm">Подключение мессенджера MAX для приёма заявок.</p>
              </div>
            </div>

            {/* MAX-бот */}
            <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-6 mb-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-[#2563eb]/15 border border-[#2563eb]/30 rounded-xl flex items-center justify-center">
                  <Icon name="MessagesSquare" size={20} className="text-[#2563eb]" />
                </div>
                <div>
                  <div className="font-oswald font-bold text-white text-lg">MAX мессенджер</div>
                  <div className="text-white/40 text-xs">Заявки из калькулятора будут приходить в указанный чат</div>
                </div>
                <div className="ml-auto">
                  {(settings.max_bot_token_set || settings.max_bot_token) && settings.max_chat_id ? (
                    <span className="text-[10px] uppercase tracking-wider bg-green-500/15 text-green-400 px-2 py-1 rounded">Подключён</span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider bg-orange-500/15 text-orange-400 px-2 py-1 rounded">Не настроен</span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    Токен бота (access_token)
                  </label>
                  <input
                    type="text"
                    value={settings.max_bot_token || ""}
                    onChange={e => onSettingChange("max_bot_token", e.target.value)}
                    placeholder={settings.max_bot_token_set
                      ? "•••••• токен сохранён, введите новый чтобы заменить"
                      : "Например: HMAC.eyJ0eXAiOiJKV1QiLCJh..."}
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono" />
                  <div className="text-[11px] text-white/35 mt-1.5 leading-relaxed">
                    Получите токен в боте <a href="https://max.ru/MasterBot" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">@MasterBot</a> мессенджера MAX
                    (команда <code className="text-orange-400/70">/newbot</code>).
                  </div>
                </div>

                <div>
                  <div className="flex items-end justify-between gap-3 mb-2">
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider">
                      ID чата для уведомлений
                    </label>
                    <button type="button" onClick={() => setChatPickerOpen(true)}
                      disabled={!settings.max_bot_token && !(settings as Record<string, unknown>).max_bot_active}
                      className="text-[11px] px-2.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:border-orange-500/50 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={!settings.max_bot_token ? "Сначала введите токен и сохраните" : "Открыть список чатов"}>
                      <Icon name="Wand2" size={12} />
                      Автопоиск chat_id
                    </button>
                  </div>
                  <input
                    type="text"
                    value={settings.max_chat_id || ""}
                    onChange={e => onSettingChange("max_chat_id", e.target.value)}
                    placeholder="Например: -10012345678901 или 9876543210"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono" />
                  <div className="text-[11px] text-white/35 mt-1.5 leading-relaxed">
                    Это ID личного чата, группы или канала, куда бот будет отправлять заявки.
                    Нажмите <b className="text-orange-400/70">«Автопоиск chat_id»</b> — бот покажет все чаты, где он состоит.
                  </div>
                </div>

                <MaxChatPicker
                  open={chatPickerOpen}
                  onClose={() => setChatPickerOpen(false)}
                  onPick={(cid) => {
                    onSettingChange("max_chat_id", cid);
                  }}
                />

              </div>
            </div>

            {/* Уведомление клиенту в MAX */}
            <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-6 mb-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-purple-500/15 border border-purple-500/30 rounded-xl flex items-center justify-center">
                  <Icon name="MessageCircle" size={20} className="text-purple-400" />
                </div>
                <div>
                  <div className="font-oswald font-bold text-white text-lg">Уведомление клиенту в MAX</div>
                  <div className="text-white/40 text-xs">Если клиент уже писал боту — пришлём ему номер заявки в личку</div>
                </div>
                <div className="ml-auto">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                    <input type="checkbox"
                      checked={(settings.notify_client_via_max || "true") === "true"}
                      onChange={e => onSettingChange("notify_client_via_max", e.target.checked ? "true" : "false")}
                      className="w-4 h-4 accent-orange-500" />
                    <span className="text-white/60">Включено</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Шаблон сообщения клиенту
                </label>
                <textarea
                  value={settings.client_notify_text || ""}
                  onChange={e => onSettingChange("client_notify_text", e.target.value)}
                  rows={4}
                  placeholder="СтальГрупп: ваша заявка №{order_num} принята! ..."
                  className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono resize-none" />
                <div className="text-[11px] text-white/35 mt-1.5 leading-relaxed">
                  Подстановки: <code className="text-orange-400/80">{"{order_num}"}</code> — номер заявки,{" "}
                  <code className="text-orange-400/80">{"{company_phone}"}</code> — телефон,{" "}
                  <code className="text-orange-400/80">{"{company_name}"}</code> — название,{" "}
                  <code className="text-orange-400/80">{"{name}"}</code> — имя клиента
                </div>
              </div>
            </div>

            {/* Email-уведомления */}
            <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-6 mb-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-cyan-500/15 border border-cyan-500/30 rounded-xl flex items-center justify-center">
                  <Icon name="Mail" size={20} className="text-cyan-400" />
                </div>
                <div>
                  <div className="font-oswald font-bold text-white text-lg">Дубль на email менеджеру</div>
                  <div className="text-white/40 text-xs">Каждая заявка приходит письмом — на случай если MAX-бот спит</div>
                </div>
                <div className="ml-auto">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                    <input type="checkbox"
                      checked={(settings.notify_email_enabled || "false") === "true"}
                      onChange={e => onSettingChange("notify_email_enabled", e.target.checked ? "true" : "false")}
                      className="w-4 h-4 accent-orange-500" />
                    <span className="text-white/60">Включено</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    Email получателя (куда слать заявки)
                  </label>
                  <input type="email"
                    value={settings.notify_email_to || ""}
                    onChange={e => onSettingChange("notify_email_to", e.target.value)}
                    placeholder={settings.notify_email_to_set ? "•••••• email сохранён" : "manager@stalgrupp.ru"}
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">SMTP-сервер</label>
                    <input type="text"
                      value={settings.smtp_host || ""}
                      onChange={e => onSettingChange("smtp_host", e.target.value)}
                      placeholder="smtp.yandex.ru"
                      className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Порт</label>
                    <input type="text"
                      value={settings.smtp_port || ""}
                      onChange={e => onSettingChange("smtp_port", e.target.value)}
                      placeholder="465"
                      className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    SMTP-логин (обычно email)
                  </label>
                  <input type="text"
                    value={settings.smtp_user || ""}
                    onChange={e => onSettingChange("smtp_user", e.target.value)}
                    placeholder={settings.smtp_user_set ? "•••••• логин сохранён" : "noreply@stalgrupp.ru"}
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    SMTP-пароль (или пароль приложения)
                  </label>
                  <input type="password"
                    value={settings.smtp_password || ""}
                    onChange={e => onSettingChange("smtp_password", e.target.value)}
                    placeholder={settings.smtp_password_set ? "•••••• пароль сохранён, введите новый чтобы заменить" : "Введите пароль"}
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono" />
                  <div className="text-[11px] text-white/35 mt-1.5">
                    Для Yandex/Mail.ru/Gmail используйте <b>пароль приложения</b> (не основной).
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    Имя отправителя
                  </label>
                  <input type="text"
                    value={settings.smtp_from_name || ""}
                    onChange={e => onSettingChange("smtp_from_name", e.target.value)}
                    placeholder="СтальГрупп — заявки с сайта"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none" />
                </div>

                <div className="pt-2 flex items-center gap-3 flex-wrap">
                  <button type="button" onClick={doTestEmail}
                    disabled={emailTesting}
                    className="text-xs px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-40">
                    <Icon name={emailTesting ? "Loader" : "Send"} size={13} className={emailTesting ? "animate-spin" : ""} />
                    {emailTesting ? "Отправляем..." : "Отправить тестовое письмо"}
                  </button>
                  {emailTestResult && (
                    <span className={`text-xs ${emailTestResult.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
                      {emailTestResult}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Реквизиты компании */}
            <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-6 mb-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-orange-500/15 border border-orange-500/30 rounded-xl flex items-center justify-center">
                  <Icon name="Building2" size={20} className="text-orange-400" />
                </div>
                <div>
                  <div className="font-oswald font-bold text-white text-lg">Реквизиты компании</div>
                  <div className="text-white/40 text-xs">Подставляются в SMS, email, шаблоны уведомлений</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Название</label>
                  <input type="text"
                    value={settings.company_name || ""}
                    onChange={e => onSettingChange("company_name", e.target.value)}
                    placeholder="СтальГрупп"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Телефон</label>
                  <input type="tel"
                    value={settings.company_phone || ""}
                    onChange={e => onSettingChange("company_phone", e.target.value)}
                    placeholder="8 800 123-45-67"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Email компании</label>
                  <input type="email"
                    value={settings.company_email || ""}
                    onChange={e => onSettingChange("company_email", e.target.value)}
                    placeholder="info@stalgrupp.ru"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none" />
                </div>
              </div>
            </div>

            {/* Глобальная кнопка сохранения */}
            <div className="bg-[#141720] border border-orange-500/30 rounded-2xl p-5 mb-5 flex items-center gap-4 flex-wrap sticky bottom-4 z-10 shadow-xl shadow-orange-500/10">
              <button onClick={saveSettingsHandler}
                disabled={!settingsDirty || settingsSaving}
                className="btn-orange px-6 py-2.5 rounded-xl text-sm disabled:opacity-40">
                <span className="flex items-center gap-2">
                  <Icon name={settingsSaving ? "Loader" : "Save"} size={15} className={settingsSaving ? "animate-spin" : ""} />
                  {settingsSaving ? "Сохранение..." : "Сохранить все настройки"}
                </span>
              </button>
              {settingsSaved && (
                <span className="text-green-400 text-xs flex items-center gap-1">
                  <Icon name="CheckCircle2" size={14} /> Сохранено
                </span>
              )}
              {settingsDirty && !settingsSaved && (
                <span className="text-orange-400/70 text-xs">Есть несохранённые изменения</span>
              )}
            </div>

            {/* Инструкция */}
            <div className="bg-[#0d1017] border border-[#1e2230] rounded-2xl p-5 text-sm text-white/55 leading-relaxed">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <Icon name="Info" size={16} className="text-orange-400" /> Как настроить MAX-бота
                </div>
                <Link to="/help/max" target="_blank" rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 text-xs flex items-center gap-1">
                  Подробная инструкция <Icon name="ExternalLink" size={11} />
                </Link>
              </div>
              <ol className="space-y-1.5 ml-5 list-decimal text-xs">
                <li>Откройте мессенджер MAX → найдите <b>@MasterBot</b></li>
                <li>Команда <code className="text-orange-400/70">/newbot</code> → задайте имя и логин</li>
                <li>Скопируйте полученный <b>access_token</b> и вставьте сюда</li>
                <li>Добавьте бота в нужный чат / напишите ему лично</li>
                <li>Узнайте <b>chat_id</b> и вставьте во второе поле</li>
                <li>Нажмите «Сохранить» — заявки начнут приходить автоматически</li>
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}