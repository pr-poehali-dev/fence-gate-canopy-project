import { useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

export default function MaxSetup() {
  useEffect(() => {
    document.title = "Подключение MAX-бота — Инструкция | СтальГрупп";
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white/90">
      {/* TopBar */}
      <header className="border-b border-[#1e2230] bg-[#141720]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="Fence" size={16} className="text-gray-900" />
            </div>
            <div className="font-oswald font-bold text-white text-sm">СТАЛЬГРУПП</div>
          </Link>
          <Link to="/admin" className="text-orange-400 hover:text-orange-300 text-xs flex items-center gap-1">
            <Icon name="ShieldCheck" size={13} /> В админ-панель
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-[#2563eb]/15 border border-[#2563eb]/30 rounded-full px-3 py-1.5 mb-4">
            <Icon name="MessagesSquare" size={14} className="text-[#3b82f6]" />
            <span className="text-[#3b82f6] text-xs font-medium">Мессенджер MAX</span>
          </div>
          <h1 className="font-oswald font-bold text-3xl sm:text-4xl mb-3">
            Подключение <span className="text-orange-400">MAX-бота</span> к сайту
          </h1>
          <p className="text-white/55 text-base leading-relaxed">
            Пошаговая инструкция: как создать бота в мессенджере MAX и подключить его к сайту,
            чтобы все заявки с калькулятора и форм приходили вам в личные сообщения.
          </p>
        </div>

        {/* ШАГ 1 */}
        <Step n="1" title="Создайте бота через @MasterBot">
          <p>
            Откройте в MAX чат с официальным помощником{" "}
            <a className="text-orange-400 hover:underline" href="https://max.ru/MasterBot" target="_blank" rel="noopener noreferrer">@MasterBot</a>.
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-white/70">
            <li>Отправьте команду <Code>/newbot</Code></li>
            <li>Введите название бота — например, «СтальГрупп Заявки»</li>
            <li>Придумайте логин (заканчивается на <Code>_bot</Code>), например <Code>stalgrupp_leads_bot</Code></li>
            <li>MasterBot пришлёт вам <b>access_token</b> — длинная строка вида <Code>HMAC.eyJ...</Code></li>
          </ol>
          <Callout type="warning">
            Сохраните токен в надёжном месте. Он даёт полный доступ к боту.
          </Callout>
        </Step>

        {/* ШАГ 2 */}
        <Step n="2" title="Получите ID чата для уведомлений">
          <p>Заявки могут приходить в личные сообщения, групповой чат или канал. На выбор:</p>

          <Sub title="A. В личные сообщения">
            <ol className="list-decimal pl-5 space-y-1 text-sm text-white/70">
              <li>Найдите свежесозданного бота в MAX по логину</li>
              <li>Нажмите «Старт» / отправьте <Code>/start</Code></li>
              <li>Бот ответит вам — в ответе будет ваш chat_id (или его можно узнать в логах MasterBot)</li>
            </ol>
          </Sub>

          <Sub title="B. В групповой чат">
            <ol className="list-decimal pl-5 space-y-1 text-sm text-white/70">
              <li>Создайте чат «Заявки СтальГрупп», добавьте туда бота</li>
              <li>Назначьте бота администратором (для отправки сообщений)</li>
              <li>Напишите в чат <Code>@yourbot_id</Code> — бот пришлёт chat_id чата</li>
            </ol>
          </Sub>

          <Callout type="info">
            ID личного чата выглядит как обычное число: <Code>9876543210</Code><br />
            ID группы начинается с минуса: <Code>-10012345678901</Code>
          </Callout>
        </Step>

        {/* ШАГ 3 */}
        <Step n="3" title="Вставьте токен и chat_id в админку">
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-white/70">
            <li>
              Откройте <Link to="/admin" className="text-orange-400 hover:underline">админ-панель</Link>{" "}
              → войдите → вкладка <b>«Настройки»</b>
            </li>
            <li>В поле <b>«Токен бота»</b> вставьте <Code>access_token</Code></li>
            <li>В поле <b>«ID чата для уведомлений»</b> вставьте chat_id из шага 2</li>
            <li>Нажмите <b>«Сохранить настройки»</b></li>
            <li>Бейдж должен переключиться с «Не настроен» на <span className="text-green-400 font-bold">«Подключён»</span></li>
          </ol>
        </Step>

        {/* ШАГ 4 */}
        <Step n="4" title="Проверьте отправку заявки">
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-white/70">
            <li>Откройте сайт и нажмите любую кнопку: «Заказать звонок», «Вызвать замерщика», «Получить расчёт» и т.д.</li>
            <li>Заполните имя и телефон, нажмите «Отправить заявку»</li>
            <li>В течение 2–3 секунд в MAX-чате должно появиться сообщение с заявкой</li>
            <li>В сообщении будут две кнопки: <b>📞 Перезвонить</b> и <b>📄 Открыть КП в PDF</b></li>
          </ol>
          <Callout type="success">
            Если заявка пришла — настройка завершена! Все будущие заявки с любых кнопок и форм будут попадать сюда.
          </Callout>
        </Step>

        {/* ШАГ 5 */}
        <Step n="5" title="Что делать, если заявка не пришла">
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <Icon name="AlertTriangle" size={15} className="text-orange-400 flex-shrink-0 mt-0.5" />
              Проверьте, что токен и chat_id скопированы без пробелов и переносов
            </li>
            <li className="flex items-start gap-2">
              <Icon name="AlertTriangle" size={15} className="text-orange-400 flex-shrink-0 mt-0.5" />
              Если используете групповой чат — убедитесь, что бот в нём является администратором
            </li>
            <li className="flex items-start gap-2">
              <Icon name="AlertTriangle" size={15} className="text-orange-400 flex-shrink-0 mt-0.5" />
              Откройте <Link to="/admin/leads" className="text-orange-400 hover:underline">журнал заявок</Link> —
              если статус «Не доставлено», нажмите кнопку <b>«В MAX»</b> для повторной отправки
            </li>
            <li className="flex items-start gap-2">
              <Icon name="AlertTriangle" size={15} className="text-orange-400 flex-shrink-0 mt-0.5" />
              Можно временно отключить бота: очистите поле токена и сохраните — заявки продолжат сохраняться в БД для просмотра в админке
            </li>
          </ul>
        </Step>

        {/* Откуда приходят заявки */}
        <div className="mt-10 bg-[#141720] border border-[#1e2230] rounded-2xl p-6">
          <div className="font-oswald font-bold text-xl text-white mb-4 flex items-center gap-2">
            <Icon name="Inbox" size={20} className="text-orange-400" />
            Откуда приходят заявки в MAX
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              { ico: "MousePointerClick", t: "Шапка — «Заказать звонок»" },
              { ico: "Calculator",        t: "Калькулятор — «Заказать замер»" },
              { ico: "Send",              t: "Калькулятор — «Отправить смету в MAX» (с PDF)" },
              { ico: "Ruler",             t: "Hero на странице услуги — «Вызвать замерщика»" },
              { ico: "FileText",          t: "Lead-форма услуги — «Получить расчёт и прайс»" },
              { ico: "Download",          t: "Услуга — «Получить полный прайс»" },
              { ico: "ArrowRight",        t: "Главная — «Бесплатный расчёт сметы»" },
              { ico: "Mail",              t: "Главная — блок «Контакты» (форма)" },
              { ico: "Footer",            t: "Footer — «Заказать звонок»" },
              { ico: "Star",              t: "Отзывы — отдельно, в «Модерации»" },
            ].map(({ ico, t }) => (
              <div key={t} className="flex items-center gap-2.5 text-white/70 bg-[#0d1017] rounded-xl px-3 py-2.5">
                <Icon name={ico} fallback="ChevronRight" size={15} className="text-orange-400 flex-shrink-0" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link to="/admin" className="btn-orange flex-1 py-3 rounded-xl text-sm text-center">
            <span className="flex items-center gap-2 justify-center">
              <Icon name="Settings" size={16} /> Перейти в Настройки
            </span>
          </Link>
          <Link to="/admin/leads" className="btn-outline-orange flex-1 py-3 rounded-xl text-sm text-center">
            <span className="flex items-center gap-2 justify-center">
              <Icon name="Inbox" size={16} /> Журнал заявок
            </span>
          </Link>
        </div>
      </main>

      <footer className="border-t border-[#1e2230] mt-10 py-5">
        <div className="max-w-4xl mx-auto px-4 text-center text-white/30 text-xs">
          © 2009–2026 ИП Балтаг А. В.
        </div>
      </footer>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-[#0d1017] border border-[#1e2230] text-orange-400 px-1.5 py-0.5 rounded font-mono text-[12px]">
      {children}
    </code>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 bg-[#141720] border border-[#1e2230] rounded-2xl p-6 sm:p-7">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="font-oswald font-bold text-gray-900 text-lg">{n}</span>
        </div>
        <h2 className="font-oswald font-bold text-xl sm:text-2xl text-white pt-1">{title}</h2>
      </div>
      <div className="space-y-3 text-sm text-white/70 leading-relaxed pl-0 sm:pl-14">
        {children}
      </div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0d1017] border border-[#1e2230] rounded-xl p-4 mt-3">
      <div className="font-semibold text-white mb-2 text-sm">{title}</div>
      {children}
    </div>
  );
}

function Callout({ type, children }: { type: "info" | "warning" | "success"; children: React.ReactNode }) {
  const styles = {
    info:    { bg: "bg-blue-500/10",   border: "border-blue-500/30",   color: "text-blue-300",   icon: "Info" },
    warning: { bg: "bg-orange-500/10", border: "border-orange-500/30", color: "text-orange-300", icon: "AlertTriangle" },
    success: { bg: "bg-green-500/10",  border: "border-green-500/30",  color: "text-green-300",  icon: "CheckCircle2" },
  }[type];
  return (
    <div className={`${styles.bg} border ${styles.border} rounded-xl p-4 flex items-start gap-2.5 text-xs mt-3 ${styles.color}`}>
      <Icon name={styles.icon} size={15} className="flex-shrink-0 mt-0.5" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
