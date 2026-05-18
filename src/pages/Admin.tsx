import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  fetchPrices, fetchReviews, loginAdmin, verifyAdmin,
  updatePrices, moderateReview, deleteReview, adminToken,
  fetchSettings, saveSettings,
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
        { key: "max_bot_token", value: settings.max_bot_token || "" },
        { key: "max_chat_id",   value: settings.max_chat_id   || "" },
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
                  {settings.max_bot_token && settings.max_chat_id ? (
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
                    placeholder="Например: HMAC.eyJ0eXAiOiJKV1QiLCJh..."
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono" />
                  <div className="text-[11px] text-white/35 mt-1.5 leading-relaxed">
                    Получите токен в боте <a href="https://max.ru/MasterBot" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">@MasterBot</a> мессенджера MAX
                    (команда <code className="text-orange-400/70">/newbot</code>).
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    ID чата для уведомлений
                  </label>
                  <input
                    type="text"
                    value={settings.max_chat_id || ""}
                    onChange={e => onSettingChange("max_chat_id", e.target.value)}
                    placeholder="Например: -10012345678901 или 9876543210"
                    className="w-full bg-[#0d1017] border border-[#1e2230] focus:border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none font-mono" />
                  <div className="text-[11px] text-white/35 mt-1.5 leading-relaxed">
                    Это ID личного чата, группы или канала, куда бот будет отправлять заявки.
                    Чтобы узнать: добавьте бота в чат и напишите ему — ID появится в логах MAX.
                  </div>
                </div>

                <div className="pt-3 flex items-center gap-3">
                  <button onClick={saveSettingsHandler}
                    disabled={!settingsDirty || settingsSaving}
                    className="btn-orange px-6 py-2.5 rounded-xl text-sm disabled:opacity-40">
                    <span className="flex items-center gap-2">
                      <Icon name={settingsSaving ? "Loader" : "Save"} size={15} className={settingsSaving ? "animate-spin" : ""} />
                      {settingsSaving ? "Сохранение..." : "Сохранить настройки"}
                    </span>
                  </button>
                  {settingsSaved && (
                    <span className="text-green-400 text-xs flex items-center gap-1">
                      <Icon name="CheckCircle2" size={14} /> Сохранено
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Инструкция */}
            <div className="bg-[#0d1017] border border-[#1e2230] rounded-2xl p-5 text-sm text-white/55 leading-relaxed">
              <div className="font-bold text-white mb-2 flex items-center gap-2">
                <Icon name="Info" size={16} className="text-orange-400" /> Как настроить MAX-бота
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