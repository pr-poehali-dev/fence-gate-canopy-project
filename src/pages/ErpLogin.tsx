import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { erpLogin, erpMe } from "@/lib/erp";
import { toast } from "sonner";

export default function ErpLogin() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    erpMe().then(me => { if (me) navigate("/erp"); });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setErr("");
    try {
      const r = await erpLogin(login.trim(), password);
      if (r?.ok) {
        toast.success(`Добро пожаловать, ${r.employee.full_name}`);
        navigate("/erp");
      } else {
        setErr("Неверный логин или пароль");
      }
    } catch {
      setErr("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d0f14] via-[#141720] to-[#0d0f14] p-4">
      <div className="absolute top-4 left-4">
        <Link to="/" className="text-white/40 hover:text-orange-400 text-sm flex items-center gap-1.5 transition-colors">
          <Icon name="ArrowLeft" size={14} /> На сайт
        </Link>
      </div>

      <form onSubmit={submit}
        className="w-full max-w-md bg-[#141720] border border-orange-500/20 rounded-3xl p-8 shadow-2xl shadow-orange-500/5">
        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
            <Icon name="Building2" size={30} className="text-white" />
          </div>
          <h1 className="font-oswald font-bold text-3xl text-white mb-1">ERP-система</h1>
          <p className="text-white/45 text-sm">СтальГрупп · вход для сотрудников</p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Icon name="User" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="text" required value={login} onChange={e => setLogin(e.target.value)}
              placeholder="Логин"
              autoFocus
              className="w-full bg-[#1a1f2e] border border-[#1e2230] rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 font-mono" />
          </div>
          <div className="relative">
            <Icon name="Lock" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input type={showPwd ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Пароль"
              className="w-full bg-[#1a1f2e] border border-[#1e2230] rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 font-mono" />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-orange-400">
              <Icon name={showPwd ? "EyeOff" : "Eye"} size={16} />
            </button>
          </div>
          {err && <div className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/30 rounded-lg py-2">{err}</div>}
          <button type="submit" disabled={loading}
            className="btn-orange w-full py-3.5 rounded-xl text-base disabled:opacity-60">
            <span className="flex items-center gap-2 justify-center">
              <Icon name={loading ? "Loader" : "LogIn"} size={16} className={loading ? "animate-spin" : ""} />
              {loading ? "Вход..." : "Войти в систему"}
            </span>
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-[#1e2230] text-center text-[11px] text-white/35">
          Логин и пароль выдаёт Генеральный директор.<br/>
          Забыли пароль? Обратитесь к руководству.
        </div>
      </form>
    </div>
  );
}
