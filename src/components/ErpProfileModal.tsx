import { useState } from "react";
import Icon from "@/components/ui/icon";
import { ErpMe, erpUpdateProfile } from "@/lib/erp";
import { toast } from "sonner";

interface Props {
  me: ErpMe;
  onClose: () => void;
  onSaved: () => void;
}

export default function ErpProfileModal({ me, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<"profile" | "credentials">("profile");

  // Профиль
  const [fullName, setFullName] = useState(me.full_name);
  const [email,    setEmail]    = useState(me.email);
  const [phone,    setPhone]    = useState(me.phone);

  // Логин/пароль
  const [currentPwd, setCurrentPwd] = useState("");
  const [newLogin,   setNewLogin]   = useState("");
  const [newPwd,     setNewPwd]     = useState("");
  const [newPwd2,    setNewPwd2]    = useState("");
  const [showPwd,    setShowPwd]    = useState(false);

  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const r = await erpUpdateProfile({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      if (r.ok) {
        toast.success("Профиль обновлён");
        onSaved();
      } else {
        toast.error(r.message || "Не удалось сохранить");
      }
    } finally {
      setSaving(false);
    }
  };

  const saveCredentials = async () => {
    if (saving) return;
    if (!newLogin.trim() && !newPwd.trim()) {
      toast.error("Заполните новый логин или новый пароль");
      return;
    }
    if (!currentPwd.trim()) {
      toast.error("Введите текущий пароль для подтверждения");
      return;
    }
    if (newPwd && newPwd !== newPwd2) {
      toast.error("Пароли не совпадают");
      return;
    }
    if (newPwd && newPwd.length < 5) {
      toast.error("Пароль должен быть минимум 5 символов");
      return;
    }
    if (newLogin && !/^[a-z0-9_]{3,}$/i.test(newLogin)) {
      toast.error("Логин: только латиница/цифры/_, минимум 3 символа");
      return;
    }

    setSaving(true);
    try {
      const r = await erpUpdateProfile({
        current_password: currentPwd,
        new_login: newLogin.trim().toLowerCase() || undefined,
        new_password: newPwd || undefined,
      });
      if (r.ok) {
        const parts = [];
        if (r.login_changed) parts.push("логин");
        if (r.password_changed) parts.push("пароль");
        toast.success(`Изменено: ${parts.join(" и ")}`, {
          description: r.password_changed ? "Все другие сессии завершены" : "",
        });
        setCurrentPwd(""); setNewLogin(""); setNewPwd(""); setNewPwd2("");
        onSaved();
      } else if (r.error === "wrong_current_password") {
        toast.error("Текущий пароль неверный");
      } else {
        toast.error(r.message || r.error || "Не удалось сохранить");
      }
    } finally {
      setSaving(false);
    }
  };

  const tabBtn = (id: typeof tab, label: string, icon: string) => (
    <button onClick={() => setTab(id)}
      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${
        tab === id ? "border-orange-500 text-orange-300" : "border-transparent text-white/55 hover:text-white"
      }`}>
      <Icon name={icon} size={15} /> {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(8,10,14,0.85)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="bg-[#141720] border border-orange-500/30 rounded-3xl w-full max-w-md shadow-2xl shadow-orange-500/10 max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#141720] border-b border-[#1e2230] z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <div className="font-oswald font-bold text-white text-lg">Мой профиль</div>
              <div className="text-white/40 text-xs">{me.role.title} · @{me.login}</div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/5 text-white/55 hover:text-white flex items-center justify-center">
              <Icon name="X" size={16} />
            </button>
          </div>
          <div className="flex border-t border-[#1e2230]">
            {tabBtn("profile",     "Данные",        "User")}
            {tabBtn("credentials", "Логин и пароль","KeyRound")}
          </div>
        </div>

        <div className="p-6">
          {tab === "profile" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/55 uppercase tracking-wider mb-1.5">ФИО</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="erp-input" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/55 uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="ivan@firma.ru" className="erp-input" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/55 uppercase tracking-wider mb-1.5">Телефон</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+7..." className="erp-input" />
              </div>
              <button onClick={saveProfile} disabled={saving}
                className="w-full btn-orange py-2.5 rounded-lg text-sm disabled:opacity-60 mt-2">
                <span className="flex items-center gap-2 justify-center">
                  <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} />
                  {saving ? "Сохраняем..." : "Сохранить данные"}
                </span>
              </button>
            </div>
          )}

          {tab === "credentials" && (
            <div className="space-y-4">
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-200/80 flex items-start gap-2">
                <Icon name="ShieldAlert" size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  Для смены логина или пароля нужно подтвердить <b>текущий пароль</b>.
                  После смены пароля все другие сессии будут разлогинены.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/55 uppercase tracking-wider mb-1.5">
                  Текущий пароль <span className="text-orange-400">*</span>
                </label>
                <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
                  placeholder="ваш текущий пароль" className="erp-input font-mono" autoComplete="current-password" />
              </div>

              <div className="pt-3 border-t border-[#1e2230]">
                <div className="text-xs font-bold text-orange-400/80 uppercase tracking-wider mb-3">Новый логин (необязательно)</div>
                <input type="text" value={newLogin}
                  onChange={e => setNewLogin(e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase())}
                  placeholder={`оставьте пустым чтобы сохранить @${me.login}`}
                  className="erp-input font-mono" autoComplete="off" />
                <div className="text-[11px] text-white/35 mt-1">Только латиница, цифры, _ — минимум 3 символа</div>
              </div>

              <div className="pt-3 border-t border-[#1e2230]">
                <div className="text-xs font-bold text-orange-400/80 uppercase tracking-wider mb-3">Новый пароль (необязательно)</div>
                <div className="relative">
                  <input type={showPwd ? "text" : "password"} value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    placeholder="минимум 5 символов"
                    className="erp-input font-mono pr-10" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-orange-400">
                    <Icon name={showPwd ? "EyeOff" : "Eye"} size={14} />
                  </button>
                </div>
                {newPwd && (
                  <input type={showPwd ? "text" : "password"} value={newPwd2}
                    onChange={e => setNewPwd2(e.target.value)}
                    placeholder="повторите новый пароль"
                    className={`erp-input font-mono mt-2 ${newPwd2 && newPwd !== newPwd2 ? "border-red-500/50" : ""}`}
                    autoComplete="new-password" />
                )}
              </div>

              <button onClick={saveCredentials} disabled={saving}
                className="w-full btn-orange py-2.5 rounded-lg text-sm disabled:opacity-60 mt-2">
                <span className="flex items-center gap-2 justify-center">
                  <Icon name={saving ? "Loader" : "KeyRound"} size={14} className={saving ? "animate-spin" : ""} />
                  {saving ? "Сохраняем..." : "Сменить логин / пароль"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
