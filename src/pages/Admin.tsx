import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import MaxChatPicker from "@/components/MaxChatPicker";
import MaxPhoneFinder from "@/components/admin/MaxPhoneFinder";
import MediaPickerModal from "@/components/MediaPickerModal";
import {
  fetchPrices, fetchReviews, loginAdmin, verifyAdmin,
  updatePrices, moderateReview, deleteReview, adminToken,
  fetchSettings, saveSettings, testEmail,
  PriceItem, ReviewItem, SiteSettings,
} from "@/lib/api";

type Tab = "prices" | "reviews" | "settings" | "seo";

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
  const [mediaPicker, setMediaPicker] = useState<{ field: keyof SiteSettings } | null>(null);
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
        { key: "notify_manager_max",    value: settings.notify_manager_max || "true" },
        { key: "notify_client_via_max", value: settings.notify_client_via_max || "true" },
        { key: "manager_max_template",  value: settings.manager_max_template || "" },
        { key: "client_notify_text",    value: settings.client_notify_text || "" },
        // Email
        { key: "notify_manager_email",  value: settings.notify_manager_email || "true" },
        { key: "notify_client_email",   value: settings.notify_client_email || "true" },
        { key: "notify_email_enabled",  value: settings.notify_email_enabled || "false" },
        { key: "notify_email_to",       value: settings.notify_email_to || "" },
        { key: "manager_emails",        value: settings.manager_emails || "" },
        { key: "smtp_host",             value: settings.smtp_host || "" },
        { key: "smtp_port",             value: settings.smtp_port || "465" },
        { key: "smtp_user",             value: settings.smtp_user || "" },
        { key: "smtp_password",         value: settings.smtp_password || "" },
        { key: "smtp_from_name",        value: settings.smtp_from_name || "" },
        { key: "manager_email_subject", value: settings.manager_email_subject || "" },
        { key: "client_email_subject",  value: settings.client_email_subject || "" },
        { key: "client_email_html",     value: settings.client_email_html || "" },
        // SMS
        { key: "notify_client_sms",     value: settings.notify_client_sms || "false" },
        { key: "client_sms_template",   value: settings.client_sms_template || "" },
        // Компания — контакты
        { key: "company_phone",         value: settings.company_phone || "" },
        { key: "company_email",         value: settings.company_email || "" },
        { key: "company_name",          value: settings.company_name || "" },
        { key: "company_address",       value: settings.company_address || "" },
        { key: "work_hours",            value: settings.work_hours || "" },
        { key: "region",                value: settings.region || "" },
        // Компания — юр. реквизиты
        { key: "legal_name",            value: settings.legal_name || "" },
        { key: "inn",                   value: settings.inn || "" },
        { key: "ogrn",                  value: settings.ogrn || "" },
        { key: "legal_address",         value: settings.legal_address || "" },
        // Компания — мессенджеры и соцсети
        { key: "whatsapp",              value: settings.whatsapp || "" },
        { key: "telegram",              value: settings.telegram || "" },
        { key: "vk",                    value: settings.vk || "" },
        { key: "max_link",              value: settings.max_link || "" },
        // CRM webhook
        { key: "crm_webhook_enabled",   value: settings.crm_webhook_enabled || "false" },
        { key: "crm_webhook_type",      value: settings.crm_webhook_type || "generic" },
        { key: "crm_webhook_url",       value: settings.crm_webhook_url || "" },
        { key: "crm_webhook_secret",    value: settings.crm_webhook_secret || "" },
        // SEO и аналитика
        { key: "seo_title",             value: settings.seo_title || "" },
        { key: "seo_description",       value: settings.seo_description || "" },
        { key: "seo_keywords",          value: settings.seo_keywords || "" },
        { key: "seo_og_image",          value: settings.seo_og_image || "" },
        { key: "yandex_metrika_id",     value: settings.yandex_metrika_id || "" },
        { key: "yandex_verification",   value: settings.yandex_verification || "" },
        { key: "google_analytics_id",   value: settings.google_analytics_id || "" },
        { key: "google_verification",   value: settings.google_verification || "" },
      ];
      await saveSettings(items);
      setSettingsDirty(false);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 4000);
      await loadSettings();
      // Обновить реквизиты по всему сайту без перезагрузки
      window.dispatchEvent(new Event("cms:invalidate"));
    } finally {
      setSettingsSaving(false);
    }
  };

  const doTestEmail = async (customTo?: string) => {
    setEmailTesting(true);
    setEmailTestResult("");
    try {
      if (settingsDirty) await saveSettingsHandler();
      const r = await testEmail(customTo);
      setEmailTestResult(r?.ok
        ? `✅ Письмо отправлено${r.recipients ? " (" + r.recipients.join(", ") + ")" : ""}`
        : `❌ ${r?.message || r?.info || "Не удалось отправить"}`);
      setTimeout(() => setEmailTestResult(""), 15000);
    } catch {
      setEmailTestResult("❌ Ошибка сети");
    } finally {
      setEmailTesting(false);
    }
  };

  const [maxTesting, setMaxTesting] = useState(false);
  const [maxTestResult, setMaxTestResult] = useState("");
  const doTestMax = async () => {
    setMaxTesting(true);
    setMaxTestResult("");
    try {
      if (settingsDirty) await saveSettingsHandler();
      const { testMax } = await import("@/lib/api");
      const r = await testMax();
      setMaxTestResult(r?.ok
        ? "✅ Тестовое сообщение отправлено в MAX!"
        : `❌ ${r?.info || r?.error || "Не удалось отправить"}`);
      setTimeout(() => setMaxTestResult(""), 15000);
    } catch {
      setMaxTestResult("❌ Ошибка сети");
    } finally {
      setMaxTesting(false);
    }
  };

  const [smsTesting, setSmsTesting] = useState(false);
  const [smsTestResult, setSmsTestResult] = useState("");
  const [smsTestPhone, setSmsTestPhone] = useState("");
  const doTestSms = async () => {
    if (!smsTestPhone.trim()) { setSmsTestResult("Укажите телефон"); return; }
    setSmsTesting(true); setSmsTestResult("");
    try {
      const { testSms } = await import("@/lib/api");
      const r = await testSms(smsTestPhone.trim());
      setSmsTestResult(r?.ok
        ? "✅ SMS отправлена! Проверьте телефон"
        : `❌ ${r?.info || "Не удалось отправить (проверьте SMSRU_API_ID)"}`);
      setTimeout(() => setSmsTestResult(""), 15000);
    } catch {
      setSmsTestResult("❌ Ошибка сети");
    } finally {
      setSmsTesting(false);
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
            <Link to="/admin/content" className="text-purple-300/90 hover:text-purple-300 text-xs flex items-center gap-1 px-2.5 py-1 border border-purple-500/30 hover:border-purple-500/60 rounded-lg transition-all">
              <Icon name="FileEdit" size={13} /> Контент
            </Link>
            <Link to="/admin/media" className="text-green-300/90 hover:text-green-300 text-xs flex items-center gap-1 px-2.5 py-1 border border-green-500/30 hover:border-green-500/60 rounded-lg transition-all">
              <Icon name="Image" size={13} /> Медиа
            </Link>
            <Link to="/admin/menu" className="text-sky-300/90 hover:text-sky-300 text-xs flex items-center gap-1 px-2.5 py-1 border border-sky-500/30 hover:border-sky-500/60 rounded-lg transition-all">
              <Icon name="Menu" size={13} /> Меню сайта
            </Link>
            <Link to="/admin/prices" className="text-amber-300/90 hover:text-amber-300 text-xs flex items-center gap-1 px-2.5 py-1 border border-amber-500/30 hover:border-amber-500/60 rounded-lg transition-all">
              <Icon name="DollarSign" size={13} /> Цены услуг
            </Link>
            <Link to="/admin/builder" className="text-pink-300/90 hover:text-pink-300 text-xs flex items-center gap-1 px-2.5 py-1 border border-pink-500/30 hover:border-pink-500/60 rounded-lg transition-all">
              <Icon name="LayoutPanelTop" size={13} /> Конструктор
            </Link>
            <Link to="/admin/onec" className="text-cyan-300/90 hover:text-cyan-300 text-xs flex items-center gap-1 px-2.5 py-1 border border-cyan-500/30 hover:border-cyan-500/60 rounded-lg transition-all">
              <Icon name="Database" size={13} /> 1С
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
            ["seo",      "SEO и счётчики", 0],
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

                {/* Кнопка теста отправки в MAX */}
                <div className="pt-2 flex items-center gap-3 flex-wrap">
                  <button type="button" onClick={doTestMax}
                    disabled={maxTesting || (!settings.max_bot_token && !settings.max_bot_token_set)}
                    className="text-xs px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:border-blue-500/50 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Icon name={maxTesting ? "Loader" : "Send"} size={13} className={maxTesting ? "animate-spin" : ""} />
                    {maxTesting ? "Отправляем..." : "Отправить тест в MAX"}
                  </button>
                  {maxTestResult && (
                    <span className={`text-xs ${maxTestResult.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
                      {maxTestResult}
                    </span>
                  )}
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

            {/* ТЕСТ ПОИСКА КЛИЕНТА В MAX ПО НОМЕРУ */}
            <div className="mb-5">
              <MaxPhoneFinder />
            </div>

            {/* КАНАЛЫ УВЕДОМЛЕНИЙ — общий переключатель */}
            <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-6 mb-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-indigo-500/15 border border-indigo-500/30 rounded-xl flex items-center justify-center">
                  <Icon name="Bell" size={20} className="text-indigo-400" />
                </div>
                <div>
                  <div className="font-oswald font-bold text-white text-lg">Каналы уведомлений</div>
                  <div className="text-white/40 text-xs">Что и куда отправлять при каждой заявке</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { k: "notify_manager_max",   t: "MAX менеджеру",  d: "Заявка в чат бота", def: "true" },
                  { k: "notify_manager_email", t: "Email менеджеру", d: "Дубль на почту",   def: "true" },
                  { k: "notify_client_via_max", t: "MAX клиенту",   d: "Подтверждение в MAX, если есть чат", def: "true" },
                  { k: "notify_client_email",  t: "Email клиенту",  d: "Письмо, если email указан в форме", def: "true" },
                  { k: "notify_client_sms",    t: "SMS клиенту",    d: "Через sms.ru — нужен API-ключ", def: "false" },
                ].map(ch => (
                  <label key={ch.k} className="flex items-start gap-3 bg-[#0d1017] border border-[#1e2230] rounded-xl px-4 py-3 cursor-pointer hover:border-orange-500/30 transition-colors">
                    <input type="checkbox"
                      checked={((settings as Record<string, string | undefined>)[ch.k] || ch.def) === "true"}
                      onChange={e => onSettingChange(ch.k as keyof typeof settings, e.target.checked ? "true" : "false")}
                      className="mt-0.5 w-4 h-4 accent-orange-500" />
                    <div>
                      <div className="text-white text-sm font-semibold">{ch.t}</div>
                      <div className="text-white/40 text-[11px]">{ch.d}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Шаблоны MAX-сообщений */}
            <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-6 mb-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-purple-500/15 border border-purple-500/30 rounded-xl flex items-center justify-center">
                  <Icon name="MessageCircle" size={20} className="text-purple-400" />
                </div>
                <div>
                  <div className="font-oswald font-bold text-white text-lg">Шаблоны сообщений в MAX</div>
                  <div className="text-white/40 text-xs">Markdown, переменные в фигурных скобках</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    Шаблон сообщения МЕНЕДЖЕРУ
                  </label>
                  <textarea
                    value={settings.manager_max_template || ""}
                    onChange={e => onSettingChange("manager_max_template", e.target.value)}
                    rows={9}
                    placeholder="🔔 *НОВАЯ ЗАЯВКА — {company_name}*&#10;..."
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    Шаблон сообщения КЛИЕНТУ
                  </label>
                  <textarea
                    value={settings.client_notify_text || ""}
                    onChange={e => onSettingChange("client_notify_text", e.target.value)}
                    rows={5}
                    placeholder="🟧 *{company_name}*&#10;Ваша заявка *№{order_num}* принята!"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono resize-none" />
                </div>

                <div className="text-[11px] text-white/40 leading-relaxed bg-[#0d1017] border border-[#1e2230] rounded-lg px-3 py-2">
                  <b className="text-orange-400/80">Переменные:</b>{" "}
                  <code className="text-orange-400/80">{"{order_num}"}</code>,{" "}
                  <code className="text-orange-400/80">{"{name}"}</code>,{" "}
                  <code className="text-orange-400/80">{"{phone}"}</code>,{" "}
                  <code className="text-orange-400/80">{"{email}"}</code>,{" "}
                  <code className="text-orange-400/80">{"{city}"}</code>,{" "}
                  <code className="text-orange-400/80">{"{address}"}</code>,{" "}
                  <code className="text-orange-400/80">{"{object_type}"}</code>,{" "}
                  <code className="text-orange-400/80">{"{total}"}</code>,{" "}
                  <code className="text-orange-400/80">{"{company_name}"}</code>,{" "}
                  <code className="text-orange-400/80">{"{company_phone}"}</code>,{" "}
                  <code className="text-orange-400/80">{"{company_email}"}</code>
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
                    Email менеджеров (несколько через запятую)
                  </label>
                  <input type="text"
                    value={settings.manager_emails || ""}
                    onChange={e => onSettingChange("manager_emails", e.target.value)}
                    placeholder={settings.manager_emails_set
                      ? "•••••• email сохранены, введите чтобы заменить"
                      : "manager1@firma.ru, manager2@firma.ru"}
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none" />
                  <div className="text-[11px] text-white/35 mt-1.5">
                    Заявки придут на все указанные адреса одним письмом. Через запятую, точку с запятой или с новой строки.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    Резервный email (legacy)
                  </label>
                  <input type="email"
                    value={settings.notify_email_to || ""}
                    onChange={e => onSettingChange("notify_email_to", e.target.value)}
                    placeholder={settings.notify_email_to_set ? "•••••• email сохранён" : "Оставьте пустым, если используете «Email менеджеров»"}
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none" />
                </div>

                {/* Авто-пресеты SMTP популярных провайдеров */}
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    Быстрая настройка по провайдеру
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Яндекс", host: "smtp.yandex.ru",   port: "465", url: "https://id.yandex.ru/security/app-passwords" },
                      { label: "Mail.ru", host: "smtp.mail.ru",    port: "465", url: "https://account.mail.ru/user/2-step-auth/passwords/" },
                      { label: "Gmail",  host: "smtp.gmail.com",   port: "465", url: "https://myaccount.google.com/apppasswords" },
                      { label: "Rambler",host: "smtp.rambler.ru",  port: "465" },
                      { label: "Outlook",host: "smtp-mail.outlook.com", port: "587" },
                    ].map(p => (
                      <button key={p.host} type="button"
                        onClick={() => {
                          onSettingChange("smtp_host", p.host);
                          onSettingChange("smtp_port", p.port);
                        }}
                        className="text-xs px-3 py-1.5 bg-[#0d1017] hover:bg-orange-500/10 border border-[#1e2230] hover:border-orange-500/40 text-white/70 hover:text-orange-300 rounded-lg transition-colors flex items-center gap-1.5">
                        <Icon name="Zap" size={11} /> {p.label}
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noopener noreferrer"
                            onClick={ev => ev.stopPropagation()}
                            className="text-white/40 hover:text-orange-300" title="Получить пароль приложения">
                            <Icon name="ExternalLink" size={10} />
                          </a>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] text-white/35 mt-1.5">
                    Жмите кнопку — заполнятся сервер и порт. Иконка <Icon name="ExternalLink" size={10} className="inline" /> ведёт на страницу создания «пароля приложения».
                  </div>
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

                {/* Шаблоны писем */}
                <div className="pt-3 mt-2 border-t border-[#1e2230]">
                  <div className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3">Шаблоны писем</div>

                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                      Тема письма МЕНЕДЖЕРУ
                    </label>
                    <input type="text"
                      value={settings.manager_email_subject || ""}
                      onChange={e => onSettingChange("manager_email_subject", e.target.value)}
                      placeholder="[Заявка №{order_num}] {object_type}"
                      className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono" />
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                      Тема письма КЛИЕНТУ
                    </label>
                    <input type="text"
                      value={settings.client_email_subject || ""}
                      onChange={e => onSettingChange("client_email_subject", e.target.value)}
                      placeholder="Ваша заявка №{order_num} принята — {company_name}"
                      className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono" />
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                      HTML-шаблон письма КЛИЕНТУ
                    </label>
                    <textarea
                      value={settings.client_email_html || ""}
                      onChange={e => onSettingChange("client_email_html", e.target.value)}
                      rows={10}
                      placeholder="<div>...HTML с переменными {name}, {order_num}, {company_phone}...</div>"
                      className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/25 focus:outline-none font-mono resize-y" />
                    <div className="text-[11px] text-white/35 mt-1.5">
                      Используйте те же переменные что и в MAX-шаблонах.
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center gap-2 flex-wrap border-t border-[#1e2230]">
                  <button type="button" onClick={() => doTestEmail()}
                    disabled={emailTesting}
                    className="text-xs px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-40">
                    <Icon name={emailTesting ? "Loader" : "Send"} size={13} className={emailTesting ? "animate-spin" : ""} />
                    {emailTesting ? "Отправляем..." : "Тест письма менеджеру"}
                  </button>
                  {emailTestResult && (
                    <span className={`text-xs ${emailTestResult.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
                      {emailTestResult}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SMS клиенту */}
            <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-6 mb-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-blue-500/15 border border-blue-500/30 rounded-xl flex items-center justify-center">
                  <Icon name="Smartphone" size={20} className="text-blue-400" />
                </div>
                <div>
                  <div className="font-oswald font-bold text-white text-lg">SMS клиенту (sms.ru)</div>
                  <div className="text-white/40 text-xs">
                    Включается в блоке «Каналы». Требует секрет <code className="text-orange-400/80">SMSRU_API_ID</code>.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Шаблон SMS
                </label>
                <textarea
                  value={settings.client_sms_template || ""}
                  onChange={e => onSettingChange("client_sms_template", e.target.value)}
                  rows={3}
                  placeholder="{company_name}: заявка №{order_num} принята. Срочно? {company_phone}"
                  className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono resize-none" />
                <div className="text-[11px] text-white/35 mt-1.5">
                  Используйте короткий текст — длинные SMS считаются как несколько и стоят дороже.
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1e2230] flex items-center gap-2 flex-wrap">
                <input type="tel" value={smsTestPhone}
                  onChange={e => setSmsTestPhone(e.target.value)}
                  placeholder="+7 999 123-45-67"
                  className="flex-1 min-w-[180px] bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono" />
                <button type="button" onClick={doTestSms}
                  disabled={smsTesting}
                  className="text-xs px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:border-blue-500/50 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-40">
                  <Icon name={smsTesting ? "Loader" : "Send"} size={13} className={smsTesting ? "animate-spin" : ""} />
                  {smsTesting ? "Отправляем..." : "Тест SMS"}
                </button>
                {smsTestResult && (
                  <span className={`text-xs basis-full sm:basis-auto ${smsTestResult.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
                    {smsTestResult}
                  </span>
                )}
              </div>
            </div>

            {/* CRM-интеграция */}
            <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-6 mb-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                  <Icon name="Zap" size={20} className="text-emerald-400" />
                </div>
                <div>
                  <div className="font-oswald font-bold text-white text-lg">Интеграция с CRM</div>
                  <div className="text-white/40 text-xs">Дублирование заявок в amoCRM, Bitrix24 или любой webhook</div>
                </div>
                <div className="ml-auto">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                    <input type="checkbox"
                      checked={(settings.crm_webhook_enabled || "false") === "true"}
                      onChange={e => onSettingChange("crm_webhook_enabled", e.target.checked ? "true" : "false")}
                      className="w-4 h-4 accent-orange-500" />
                    <span className="text-white/60">Включено</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    Тип CRM
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: "generic",  t: "Любая (JSON)", d: "Произвольный webhook" },
                      { v: "amocrm",   t: "amoCRM",       d: "Leads API" },
                      { v: "bitrix24", t: "Bitrix24",     d: "crm.lead.add" },
                    ].map(opt => (
                      <button key={opt.v} type="button"
                        onClick={() => onSettingChange("crm_webhook_type", opt.v)}
                        className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                          (settings.crm_webhook_type || "generic") === opt.v
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
                            : "bg-[#0d1017] border-[#1e2230] text-white/70 hover:border-emerald-500/30"
                        }`}>
                        <div className="font-semibold">{opt.t}</div>
                        <div className="text-[11px] text-white/40">{opt.d}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    Webhook URL
                  </label>
                  <input type="text"
                    value={settings.crm_webhook_url || ""}
                    onChange={e => onSettingChange("crm_webhook_url", e.target.value)}
                    placeholder={settings.crm_webhook_url_set
                      ? "•••••• URL сохранён, введите чтобы заменить"
                      : "https://your-crm.com/webhook/leads"}
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono" />
                  <div className="text-[11px] text-white/35 mt-1.5">
                    {(settings.crm_webhook_type || "generic") === "amocrm" &&
                      <>amoCRM: <code className="text-orange-400/80">https://your-domain.amocrm.ru/api/v4/leads</code> + Bearer-токен через секретное поле ниже.</>}
                    {(settings.crm_webhook_type || "generic") === "bitrix24" &&
                      <>Bitrix24: входящий webhook вида <code className="text-orange-400/80">https://your-portal.bitrix24.ru/rest/USER_ID/CODE/crm.lead.add.json</code></>}
                    {(settings.crm_webhook_type || "generic") === "generic" &&
                      <>Любой URL — заявка отправится POST-запросом с JSON-телом.</>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    Секретный заголовок (опционально)
                  </label>
                  <input type="text"
                    value={settings.crm_webhook_secret || ""}
                    onChange={e => onSettingChange("crm_webhook_secret", e.target.value)}
                    placeholder={settings.crm_webhook_secret_set ? "•••••• секрет сохранён" : "Bearer abc123 или любой токен"}
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono" />
                  <div className="text-[11px] text-white/35 mt-1.5">
                    Будет отправлен как <code>X-Webhook-Secret</code> — ваша CRM сможет проверять подлинность.
                  </div>
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
                  <div className="text-white/40 text-xs">Обновляются автоматически везде на сайте: шапка, футер, контакты, формы, уведомления</div>
                </div>
              </div>

              {/* Контакты */}
              <div className="text-orange-400/80 text-[11px] font-semibold uppercase tracking-wider mb-3">Контакты</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Название (бренд)</label>
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
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Email</label>
                  <input type="email"
                    value={settings.company_email || ""}
                    onChange={e => onSettingChange("company_email", e.target.value)}
                    placeholder="info@stalgrupp.ru"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Часы работы</label>
                  <input type="text"
                    value={settings.work_hours || ""}
                    onChange={e => onSettingChange("work_hours", e.target.value)}
                    placeholder="Пн-Вс 9:00–21:00"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Регион</label>
                  <input type="text"
                    value={settings.region || ""}
                    onChange={e => onSettingChange("region", e.target.value)}
                    placeholder="Москва и МО"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Адрес офиса</label>
                  <input type="text"
                    value={settings.company_address || ""}
                    onChange={e => onSettingChange("company_address", e.target.value)}
                    placeholder="г. Люберцы, ул. Котельническая, 18"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none" />
                </div>
              </div>

              {/* Юр. реквизиты */}
              <div className="text-orange-400/80 text-[11px] font-semibold uppercase tracking-wider mb-3">Юридические реквизиты</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Юр. название</label>
                  <input type="text"
                    value={settings.legal_name || ""}
                    onChange={e => onSettingChange("legal_name", e.target.value)}
                    placeholder="ИП Балтаг Алексей Васильевич"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">ИНН</label>
                  <input type="text"
                    value={settings.inn || ""}
                    onChange={e => onSettingChange("inn", e.target.value)}
                    placeholder="503612345678"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">ОГРН / ОГРНИП</label>
                  <input type="text"
                    value={settings.ogrn || ""}
                    onChange={e => onSettingChange("ogrn", e.target.value)}
                    placeholder="320507600012345"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Юр. адрес</label>
                  <input type="text"
                    value={settings.legal_address || ""}
                    onChange={e => onSettingChange("legal_address", e.target.value)}
                    placeholder="140000, МО, г. Люберцы, ул. Котельническая, д. 18"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none" />
                </div>
              </div>

              {/* Мессенджеры и соцсети */}
              <div className="text-orange-400/80 text-[11px] font-semibold uppercase tracking-wider mb-3">Мессенджеры и соцсети</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">WhatsApp</label>
                  <input type="text"
                    value={settings.whatsapp || ""}
                    onChange={e => onSettingChange("whatsapp", e.target.value)}
                    placeholder="https://wa.me/79991234567"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Telegram</label>
                  <input type="text"
                    value={settings.telegram || ""}
                    onChange={e => onSettingChange("telegram", e.target.value)}
                    placeholder="https://t.me/stalgrupp"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">ВКонтакте</label>
                  <input type="text"
                    value={settings.vk || ""}
                    onChange={e => onSettingChange("vk", e.target.value)}
                    placeholder="https://vk.com/stalgrupp"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">MAX</label>
                  <input type="text"
                    value={settings.max_link || ""}
                    onChange={e => onSettingChange("max_link", e.target.value)}
                    placeholder="https://max.ru/stalgrupp"
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

        {/* ───────── ВКЛАДКА: SEO и счётчики ───────── */}
        {tab === "seo" && (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-oswald font-bold text-2xl text-white mb-1">SEO и счётчики аналитики</h2>
                <p className="text-white/40 text-sm">Настройка для поисковиков (Яндекс, Google), счётчики, метаданные</p>
              </div>
            </div>

            {/* Основные SEO-теги */}
            <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-6 mb-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-blue-500/15 border border-blue-500/30 rounded-xl flex items-center justify-center">
                  <Icon name="Search" size={20} className="text-blue-400" />
                </div>
                <div>
                  <div className="font-oswald font-bold text-white text-lg">Метаданные сайта</div>
                  <div className="text-white/40 text-xs">То, что увидят Яндекс, Google и соцсети</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-white/70 text-xs font-medium mb-1.5 block">
                    Заголовок (Title) — для вкладки браузера и поиска
                  </label>
                  <input
                    type="text" maxLength={120}
                    value={settings.seo_title || ""}
                    onChange={e => onSettingChange("seo_title", e.target.value)}
                    placeholder="СтальГрупп — заборы, ворота, навесы под ключ в Москве и МО"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none"
                  />
                  <div className="text-white/30 text-[10px] mt-1">{(settings.seo_title || "").length} / 70 рекомендуется</div>
                </div>
                <div>
                  <label className="text-white/70 text-xs font-medium mb-1.5 block">
                    Описание (Description) — показывается под ссылкой в поиске
                  </label>
                  <textarea
                    maxLength={300} rows={3}
                    value={settings.seo_description || ""}
                    onChange={e => onSettingChange("seo_description", e.target.value)}
                    placeholder="Производство и монтаж заборов, ворот, навесов и ковки. Бесплатный замер, гарантия 5 лет, цены от 1 450 ₽/м.п."
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none resize-none"
                  />
                  <div className="text-white/30 text-[10px] mt-1">{(settings.seo_description || "").length} / 160 рекомендуется</div>
                </div>
                <div>
                  <label className="text-white/70 text-xs font-medium mb-1.5 block">
                    Ключевые слова (через запятую)
                  </label>
                  <input
                    type="text" maxLength={500}
                    value={settings.seo_keywords || ""}
                    onChange={e => onSettingChange("seo_keywords", e.target.value)}
                    placeholder="забор под ключ, ворота откатные, навесы для авто, евроштакетник Москва"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-xs font-medium mb-1.5 block">
                    Картинка для соцсетей (URL) — что покажется при шаринге ссылки в WhatsApp, Telegram, VK
                  </label>
                  <div className="flex items-stretch gap-2">
                    <input
                      type="text"
                      value={settings.seo_og_image || ""}
                      onChange={e => onSettingChange("seo_og_image", e.target.value)}
                      placeholder="https://cdn.poehali.dev/.../my-image.jpg"
                      className="flex-1 bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaPicker({ field: "seo_og_image" })}
                      className="px-4 py-2 bg-[#0d1017] hover:bg-orange-500/10 text-white/70 hover:text-orange-300 border border-[#1e2230] hover:border-orange-500/50 rounded-xl transition-all flex items-center gap-1.5 text-xs whitespace-nowrap"
                      title="Выбрать фото из медиа-библиотеки"
                    >
                      <Icon name="ImagePlus" size={14} />
                      Из библиотеки
                    </button>
                  </div>
                  {settings.seo_og_image && (
                    <img src={settings.seo_og_image} alt="" className="mt-2 max-h-32 rounded-lg border border-[#1e2230]" />
                  )}
                </div>
              </div>
            </div>

            {/* Яндекс */}
            <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-6 mb-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center justify-center">
                  <Icon name="BarChart3" size={20} className="text-red-400" />
                </div>
                <div>
                  <div className="font-oswald font-bold text-white text-lg">Яндекс.Метрика и Вебмастер</div>
                  <div className="text-white/40 text-xs">Чтобы видеть посетителей и быстрее попасть в поиск Яндекса</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-white/70 text-xs font-medium mb-1.5 block">
                    ID счётчика Яндекс.Метрики
                  </label>
                  <input
                    type="text" inputMode="numeric"
                    value={settings.yandex_metrika_id || ""}
                    onChange={e => onSettingChange("yandex_metrika_id", e.target.value.replace(/\D/g, ""))}
                    placeholder="например: 12345678"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono"
                  />
                  <a href="https://metrika.yandex.ru/" target="_blank" rel="noopener noreferrer"
                    className="text-orange-400 hover:text-orange-300 text-xs flex items-center gap-1 mt-1.5">
                    Создать счётчик в Метрике <Icon name="ExternalLink" size={11} />
                  </a>
                </div>
                <div>
                  <label className="text-white/70 text-xs font-medium mb-1.5 block">
                    Код подтверждения для Яндекс.Вебмастера
                  </label>
                  <input
                    type="text"
                    value={settings.yandex_verification || ""}
                    onChange={e => onSettingChange("yandex_verification", e.target.value)}
                    placeholder="например: a1b2c3d4e5f6g7h8"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono"
                  />
                  <a href="https://webmaster.yandex.ru/" target="_blank" rel="noopener noreferrer"
                    className="text-orange-400 hover:text-orange-300 text-xs flex items-center gap-1 mt-1.5">
                    Открыть Яндекс.Вебмастер <Icon name="ExternalLink" size={11} />
                  </a>
                </div>
              </div>
            </div>

            {/* Google */}
            <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-6 mb-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-green-500/15 border border-green-500/30 rounded-xl flex items-center justify-center">
                  <Icon name="LineChart" size={20} className="text-green-400" />
                </div>
                <div>
                  <div className="font-oswald font-bold text-white text-lg">Google Analytics и Search Console</div>
                  <div className="text-white/40 text-xs">Опционально, для англоязычной / международной аудитории</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-white/70 text-xs font-medium mb-1.5 block">
                    ID Google Analytics
                  </label>
                  <input
                    type="text"
                    value={settings.google_analytics_id || ""}
                    onChange={e => onSettingChange("google_analytics_id", e.target.value)}
                    placeholder="например: G-XXXXXXXXXX"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-xs font-medium mb-1.5 block">
                    Код подтверждения Google Search Console
                  </label>
                  <input
                    type="text"
                    value={settings.google_verification || ""}
                    onChange={e => onSettingChange("google_verification", e.target.value)}
                    placeholder="строка из meta-тега"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Кнопка сохранения */}
            <div className="bg-[#141720] border border-orange-500/30 rounded-2xl p-5 sticky bottom-4 flex items-center justify-between">
              <button
                onClick={saveSettingsHandler}
                disabled={!settingsDirty || settingsSaving}
                className="bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/30 disabled:cursor-not-allowed text-gray-900 px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
              >
                {settingsSaving
                  ? <><Icon name="Loader2" size={16} className="animate-spin" /> Сохранение…</>
                  : settingsSaved
                    ? <><Icon name="Check" size={16} /> Сохранено</>
                    : <><Icon name="Save" size={16} /> Сохранить</>}
              </button>
              {settingsDirty && !settingsSaving && (
                <span className="text-orange-400/70 text-xs">Есть несохранённые изменения</span>
              )}
            </div>

            {/* Инструкция SEO */}
            <div className="bg-[#0d1017] border border-[#1e2230] rounded-2xl p-5 mt-5 text-sm text-white/55 leading-relaxed">
              <div className="font-bold text-white mb-2 flex items-center gap-2">
                <Icon name="Info" size={16} className="text-orange-400" /> Как подключить Яндекс быстро
              </div>
              <ol className="space-y-1.5 ml-5 list-decimal text-xs">
                <li>Зайдите на <a href="https://metrika.yandex.ru/" target="_blank" rel="noopener noreferrer" className="text-orange-400">metrika.yandex.ru</a> → «Добавить счётчик»</li>
                <li>Введите адрес сайта, согласитесь с условиями → получите номер счётчика</li>
                <li>Вставьте номер в поле «ID счётчика Яндекс.Метрики» выше и нажмите «Сохранить»</li>
                <li>Перейдите на <a href="https://webmaster.yandex.ru/" target="_blank" rel="noopener noreferrer" className="text-orange-400">webmaster.yandex.ru</a> → «Добавить сайт»</li>
                <li>Выберите способ «Мета-тег», скопируйте значение `content="..."` — вставьте в «Код подтверждения»</li>
                <li>Сохраните → в Вебмастере нажмите «Проверить» → готово, сайт виден Яндексу</li>
              </ol>
            </div>
          </div>
        )}
      </main>

      {/* Глобальный пикер фото из медиа-библиотеки для image-полей настроек */}
      <MediaPickerModal
        open={!!mediaPicker}
        mode="pick"
        currentUrl={mediaPicker ? (settings[mediaPicker.field] || "") : ""}
        onClose={() => setMediaPicker(null)}
        onPicked={(url) => {
          if (mediaPicker) onSettingChange(mediaPicker.field, url);
          setMediaPicker(null);
        }}
      />
    </div>
  );
}