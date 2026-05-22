import { useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import SiteHeader from "@/components/SiteHeader";
import { COMPANY } from "@/lib/company";

export default function Privacy() {
  useEffect(() => {
    document.title = "Политика конфиденциальности — СтальГрупп";
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--dark-bg)" }}>
      <SiteHeader />

      <main className="max-w-3xl mx-auto px-4 py-12 text-white/80">
        <h1 className="font-oswald font-bold text-3xl sm:text-4xl text-white mb-3">
          Политика конфиденциальности
        </h1>
        <p className="text-white/45 text-sm mb-8">
          Дата вступления в силу: 01 января 2026 г.
        </p>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="font-oswald font-bold text-xl text-orange-400 mb-2">1. Общие положения</h2>
            <p>
              Настоящая Политика обработки персональных данных (далее — Политика) разработана
              в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».
              Оператор: <b>ИП Балтаг А. В.</b>, ИНН {COMPANY.inn}, далее — «Компания».
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-xl text-orange-400 mb-2">2. Какие данные мы собираем</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Имя, телефон, email, город — вводите в формах сайта</li>
              <li>Адрес объекта — при заказе замера</li>
              <li>Технические данные (IP, User-Agent, страница входа) — для аналитики</li>
              <li>Cookie-файлы — для работы сайта</li>
            </ul>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-xl text-orange-400 mb-2">3. Цели обработки</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Связь с клиентом для оформления заказа</li>
              <li>Отправка коммерческого предложения и SMS с номером заявки</li>
              <li>Согласование выезда замерщика, доставки и монтажа</li>
              <li>Информирование о статусе заявки</li>
            </ul>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-xl text-orange-400 mb-2">4. Хранение и защита</h2>
            <p>
              Данные хранятся на защищённых серверах в РФ. Передача третьим лицам — только
              привлечённым подрядчикам (доставка, монтаж) в объёме, необходимом для выполнения
              заказа. SMS-уведомления отправляются через сервис sms.ru.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-xl text-orange-400 mb-2">5. Ваши права</h2>
            <p>
              Вы можете запросить удаление своих данных, направив письмо на{" "}
              <a href={`mailto:${COMPANY.email}`} className="text-orange-400 hover:underline">{COMPANY.email}</a>.
              Срок исполнения — 10 рабочих дней.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-xl text-orange-400 mb-2">6. Контакты</h2>
            <div className="bg-[#141720] border border-[#1e2230] rounded-2xl p-5">
              <div className="font-oswald font-bold text-white mb-2">{COMPANY.fullName || "ИП Балтаг А. В."}</div>
              <div className="text-white/60 space-y-1">
                <div>ИНН: {COMPANY.inn}</div>
                <div>Адрес: {COMPANY.legalAddress}</div>
                <div>Телефон: <a href={`tel:${COMPANY.phoneE164}`} className="text-orange-400 hover:underline">{COMPANY.phone}</a></div>
                <div>Email: <a href={`mailto:${COMPANY.email}`} className="text-orange-400 hover:underline">{COMPANY.email}</a></div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10">
          <Link to="/" className="btn-orange px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2">
            <Icon name="ArrowLeft" size={15} />
            Вернуться на главную
          </Link>
        </div>
      </main>
    </div>
  );
}