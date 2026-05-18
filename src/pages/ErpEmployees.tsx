import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  ErpMe, ErpRole, ErpEmployee,
  erpMe, erpRoles, erpEmployees, erpCreateEmployee, erpUpdateEmployee, erpResetPassword,
} from "@/lib/erp";
import { toast } from "sonner";

export default function ErpEmployees() {
  const navigate = useNavigate();
  const [me, setMe] = useState<ErpMe | null>(null);
  const [roles, setRoles] = useState<ErpRole[]>([]);
  const [employees, setEmployees] = useState<ErpEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [credentials, setCredentials] = useState<{ login: string; password: string; name: string } | null>(null);
  const [editing, setEditing] = useState<ErpEmployee | null>(null);

  useEffect(() => {
    (async () => {
      const m = await erpMe();
      if (!m) { navigate("/erp/login"); return; }
      if (!m.role.is_owner) { navigate("/erp"); return; }
      setMe(m);
      const [r, e] = await Promise.all([erpRoles(), erpEmployees()]);
      setRoles(r);
      setEmployees(e);
      setLoading(false);
    })();
  }, [navigate]);

  const reload = async () => {
    const e = await erpEmployees();
    setEmployees(e);
  };

  const handleResetPwd = async (emp: ErpEmployee) => {
    if (!confirm(`Сбросить пароль для "${emp.full_name}"? Будет сгенерирован новый.`)) return;
    const r = await erpResetPassword(emp.id);
    if (r.ok && r.new_password) {
      setCredentials({ login: emp.login, password: r.new_password, name: emp.full_name });
    }
  };

  const handleToggleActive = async (emp: ErpEmployee) => {
    const action = emp.is_active ? "деактивировать" : "активировать";
    if (!confirm(`Точно ${action} сотрудника "${emp.full_name}"?`)) return;
    await erpUpdateEmployee(emp.id, { is_active: !emp.is_active });
    toast.success(emp.is_active ? "Сотрудник деактивирован" : "Сотрудник активирован");
    reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]">
        <Icon name="Loader" size={32} className="animate-spin text-orange-400" />
      </div>
    );
  }
  if (!me) return null;

  return (
    <div className="min-h-screen bg-[#0d0f14]">
      <header className="bg-[#0a0c11] border-b border-[#1e2230] px-4 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link to="/erp" className="text-white/55 hover:text-orange-400 text-sm flex items-center gap-1.5">
              <Icon name="ArrowLeft" size={16} /> Рабочее место
            </Link>
            <div className="w-px h-5 bg-[#1e2230]" />
            <div className="font-oswald font-bold text-white tracking-wider">
              ERP · <span className="text-orange-400">Сотрудники</span>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="btn-orange px-5 py-2 rounded-lg text-sm">
            <span className="flex items-center gap-2">
              <Icon name="UserPlus" size={14} /> Добавить сотрудника
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(emp => (
            <EmployeeCard key={emp.id} emp={emp}
              onEdit={() => setEditing(emp)}
              onResetPwd={() => handleResetPwd(emp)}
              onToggle={() => handleToggleActive(emp)} />
          ))}
        </div>
        {employees.length === 0 && (
          <div className="text-center py-20 text-white/40">
            <Icon name="Users" size={48} className="mx-auto mb-3 opacity-40" />
            <div>Пока нет сотрудников</div>
          </div>
        )}
      </main>

      {showCreate && (
        <CreateEmployeeModal roles={roles}
          onClose={() => setShowCreate(false)}
          onCreated={(creds) => {
            setShowCreate(false);
            setCredentials(creds);
            reload();
          }} />
      )}
      {editing && (
        <EditEmployeeModal emp={editing} roles={roles}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }} />
      )}
      {credentials && (
        <CredentialsModal data={credentials} onClose={() => setCredentials(null)} />
      )}
    </div>
  );
}

// ─────────── Карточка сотрудника ───────────
function EmployeeCard({ emp, onEdit, onResetPwd, onToggle }:
  { emp: ErpEmployee; onEdit: () => void; onResetPwd: () => void; onToggle: () => void }) {
  const roleColor: Record<string, string> = {
    ceo: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    production: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    manager: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    surveyor: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    installer: "bg-green-500/15 text-green-300 border-green-500/30",
    accountant: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  };
  const rc = roleColor[emp.role_slug || ""] || "bg-gray-500/15 text-gray-300 border-gray-500/30";
  const initials = emp.full_name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={`bg-[#141720] border ${emp.is_active ? "border-[#1e2230]" : "border-red-500/20 opacity-60"} rounded-2xl p-5 hover:border-orange-500/30 transition-colors`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
          {emp.avatar_url
            ? <img src={emp.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
            : <span className="text-lg">{initials}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-white truncate">{emp.full_name}</div>
          <div className="text-xs text-white/40 font-mono truncate">@{emp.login}</div>
          <span className={`inline-block mt-1.5 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${rc}`}>
            {emp.role_title || "—"}
          </span>
        </div>
      </div>

      <div className="space-y-1 text-xs text-white/55 mb-4">
        {emp.email && <div className="flex items-center gap-2"><Icon name="Mail" size={12} /> {emp.email}</div>}
        {emp.phone && <div className="flex items-center gap-2"><Icon name="Phone" size={12} /> {emp.phone}</div>}
        {!emp.is_active && (
          <div className="text-red-400 flex items-center gap-1.5 mt-2">
            <Icon name="UserX" size={12} /> Деактивирован
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-3 border-t border-[#1e2230]">
        <button onClick={onEdit}
          className="flex-1 text-xs px-3 py-2 bg-[#1a1f2e] hover:bg-orange-500/10 hover:text-orange-300 text-white/70 rounded-lg transition-colors flex items-center justify-center gap-1">
          <Icon name="Pencil" size={12} /> Изменить
        </button>
        <button onClick={onResetPwd} title="Сбросить пароль"
          className="text-xs px-3 py-2 bg-[#1a1f2e] hover:bg-blue-500/10 hover:text-blue-300 text-white/70 rounded-lg transition-colors">
          <Icon name="Key" size={12} />
        </button>
        <button onClick={onToggle} title={emp.is_active ? "Деактивировать" : "Активировать"}
          className={`text-xs px-3 py-2 bg-[#1a1f2e] hover:bg-red-500/10 hover:text-red-300 ${emp.is_active ? "text-white/70" : "text-green-400"} rounded-lg transition-colors`}>
          <Icon name={emp.is_active ? "UserX" : "UserCheck"} size={12} />
        </button>
      </div>
    </div>
  );
}

// ─────────── Модалка создания ───────────
function CreateEmployeeModal({ roles, onClose, onCreated }:
  { roles: ErpRole[]; onClose: () => void; onCreated: (c: { login: string; password: string; name: string }) => void }) {
  const [form, setForm] = useState({
    login: "", full_name: "", role_id: roles.find(r => r.slug === "manager")?.id || roles[0]?.id || 0,
    email: "", phone: "", password: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.login.trim() || !form.full_name.trim() || !form.role_id) {
      toast.error("Заполните логин, ФИО и роль");
      return;
    }
    setSaving(true);
    try {
      const r = await erpCreateEmployee({
        login: form.login.toLowerCase().trim(),
        full_name: form.full_name.trim(),
        role_id: Number(form.role_id),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password.trim() || undefined,
      });
      if (r.ok && r.login && r.password) {
        toast.success("Сотрудник создан");
        onCreated({ login: r.login, password: r.password, name: form.full_name.trim() });
      } else {
        toast.error(r.error === "duplicate_or_invalid" ? "Логин уже занят" : "Не удалось создать");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Новый сотрудник" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Логин (только латиница, цифры, _)" required>
          <input type="text" required value={form.login}
            onChange={e => setForm({ ...form, login: e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase() })}
            placeholder="ivanov_petr" className="erp-input font-mono" />
        </Field>
        <Field label="ФИО" required>
          <input type="text" required value={form.full_name}
            onChange={e => setForm({ ...form, full_name: e.target.value })}
            placeholder="Иванов Пётр Сергеевич" className="erp-input" />
        </Field>
        <Field label="Роль / должность" required>
          <select value={form.role_id} onChange={e => setForm({ ...form, role_id: Number(e.target.value) })}
            className="erp-input" required>
            {roles.map(r => <option key={r.id} value={r.id}>{r.title}{r.is_owner ? " (полный доступ)" : ""}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <input type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="email@firma.ru" className="erp-input" />
          </Field>
          <Field label="Телефон">
            <input type="tel" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+7..." className="erp-input" />
          </Field>
        </div>
        <Field label="Пароль (если не указан — сгенерируется)">
          <input type="text" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="оставьте пустым для авто-генерации" className="erp-input font-mono" />
        </Field>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-[#1a1f2e] hover:bg-white/5 text-white/70 text-sm">
            Отмена
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 btn-orange py-2.5 rounded-lg text-sm disabled:opacity-60">
            <span className="flex items-center gap-2 justify-center">
              <Icon name={saving ? "Loader" : "UserPlus"} size={14} className={saving ? "animate-spin" : ""} />
              {saving ? "Создаём..." : "Создать и выдать доступ"}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────── Модалка редактирования ───────────
function EditEmployeeModal({ emp, roles, onClose, onSaved }:
  { emp: ErpEmployee; roles: ErpRole[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    full_name: emp.full_name,
    role_id: roles.find(r => r.slug === emp.role_slug)?.id || roles[0]?.id || 0,
    email: emp.email, phone: emp.phone, notes: emp.notes,
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await erpUpdateEmployee(emp.id, form);
      toast.success("Изменения сохранены");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Редактировать: ${emp.full_name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="bg-[#0d1017] border border-[#1e2230] rounded-lg px-3 py-2 text-xs">
          <span className="text-white/40">Логин:</span>{" "}
          <span className="font-mono text-orange-300">@{emp.login}</span>
        </div>
        <Field label="ФИО">
          <input type="text" value={form.full_name}
            onChange={e => setForm({ ...form, full_name: e.target.value })}
            className="erp-input" />
        </Field>
        <Field label="Роль">
          <select value={form.role_id} onChange={e => setForm({ ...form, role_id: Number(e.target.value) })}
            className="erp-input">
            {roles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <input type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="erp-input" />
          </Field>
          <Field label="Телефон">
            <input type="tel" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="erp-input" />
          </Field>
        </div>
        <Field label="Заметки">
          <textarea value={form.notes} rows={3}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            className="erp-input resize-none" />
        </Field>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-[#1a1f2e] hover:bg-white/5 text-white/70 text-sm">
            Отмена
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 btn-orange py-2.5 rounded-lg text-sm disabled:opacity-60">
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────── Модалка выдачи логина/пароля ───────────
function CredentialsModal({ data, onClose }: { data: { login: string; password: string; name: string }; onClose: () => void }) {
  const text = `Здравствуйте, ${data.name}!\n\nВаш доступ в ERP-систему СтальГрупп:\nЛогин: ${data.login}\nПароль: ${data.password}\n\nВходите на странице: ${window.location.origin}/erp/login`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Скопировано в буфер обмена");
    } catch {
      toast.error("Не удалось скопировать");
    }
  };
  return (
    <Modal title="Доступ создан!" onClose={onClose}>
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center mb-3">
            <Icon name="KeyRound" size={32} className="text-green-400" />
          </div>
          <p className="text-white/70 text-sm">
            Передайте эти данные сотруднику. <b className="text-orange-300">Пароль больше не будет показан</b> —
            при необходимости его можно сбросить.
          </p>
        </div>
        <div className="bg-[#0d1017] border border-orange-500/30 rounded-xl p-4 space-y-2">
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Логин</div>
            <div className="font-mono text-orange-300 text-base">{data.login}</div>
          </div>
          <div className="pt-2 border-t border-[#1e2230]">
            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Пароль</div>
            <div className="font-mono text-orange-300 text-base select-all">{data.password}</div>
          </div>
        </div>
        <button onClick={copy} className="w-full btn-orange py-2.5 rounded-lg text-sm">
          <span className="flex items-center gap-2 justify-center">
            <Icon name="Copy" size={14} /> Скопировать данные для отправки
          </span>
        </button>
        <button onClick={onClose} className="w-full py-2 text-white/55 hover:text-white text-sm">
          Понятно, закрыть
        </button>
      </div>
    </Modal>
  );
}

// ─────────── Утилитарные компоненты ───────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(8,10,14,0.85)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="bg-[#141720] border border-orange-500/30 rounded-3xl w-full max-w-md shadow-2xl shadow-orange-500/10 max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#141720] border-b border-[#1e2230] px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="font-oswald font-bold text-white text-lg">{title}</div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/5 text-white/55 hover:text-white flex items-center justify-center">
            <Icon name="X" size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-white/55 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-orange-400">*</span>}
      </label>
      {children}
    </div>
  );
}
