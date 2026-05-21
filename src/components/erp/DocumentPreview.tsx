import { useEffect } from "react";
import Icon from "@/components/ui/icon";
import { DocItem } from "@/lib/erp-deals";

interface Props {
  doc: DocItem;
  onClose: () => void;
}

export default function DocumentPreview({ doc, onClose }: Props) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  const c = (doc.content || {}) as DocContent;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto print:bg-white print:p-0 print:items-start print:relative">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl relative print:rounded-none print:shadow-none print:my-0 print:max-w-full">
        {/* Тулбар (не печатается) */}
        <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-2xl px-5 py-3 flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center">
              <Icon name="FileText" size={18} className="text-white" />
            </div>
            <div>
              <div className="font-oswald font-bold text-gray-900 text-base">{doc.title}</div>
              <div className="text-gray-500 text-xs font-mono">{doc.doc_num}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs flex items-center gap-1.5 font-medium"
            >
              <Icon name="Printer" size={14} /> Печать / PDF
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center">
              <Icon name="X" size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Содержимое документа */}
        <div className="px-8 py-10 text-gray-900 print:px-12 print:py-8">
          <DocHeader content={c} doc={doc} />
          <DocBody docType={doc.doc_type} content={c} />
          <DocFooter content={c} doc={doc} />
        </div>
      </div>
    </div>
  );
}

interface DocContent {
  company?: {
    name?: string; inn?: string; kpp?: string; address?: string;
    phone?: string; email?: string;
    bank?: string; rs?: string; ks?: string; bik?: string;
  };
  client?: { name?: string; phone?: string; address?: string };
  service_type?: string;
  deal_num?: string;
  total_rub?: number;
  prepay_rub?: number;
  remainder_rub?: number;
  amount?: number;
  purpose?: string;
  date?: string;
  warranty_years?: number;
  terms?: string;
  start_date?: string;
  handover_date?: string;
  scheduled_date?: string;
  tasks?: string[];
  team?: string[];
  measurements?: Record<string, unknown>;
  instructions?: string;
  notes?: string;
  scheme_url?: string;
  items?: Array<{
    sku?: string; name?: string; unit?: string;
    qty?: number; pricePerUnit?: number; total?: number;
  }>;
  totals?: {
    material?: number; work?: number; foundation?: number;
    paint?: number; automation?: number; total?: number;
  };
  params?: Record<string, unknown>;
}

function DocHeader({ content, doc }: { content: DocContent; doc: DocItem }) {
  const today = content.date
    ? new Date(content.date).toLocaleDateString("ru-RU")
    : new Date().toLocaleDateString("ru-RU");

  return (
    <div className="border-b-2 border-orange-500 pb-4 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-orange-500 font-oswald font-bold text-2xl uppercase">
            {content.company?.name || "ООО «СтальГрупп»"}
          </div>
          <div className="text-gray-600 text-xs mt-1 leading-relaxed">
            ИНН {content.company?.inn || "—"} · КПП {content.company?.kpp || "—"}<br />
            {content.company?.address || "—"}<br />
            Тел.: {content.company?.phone || "—"} · {content.company?.email || "—"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-gray-500 text-xs uppercase tracking-wider">№ документа</div>
          <div className="text-gray-900 font-oswald font-bold text-lg">{doc.doc_num}</div>
          <div className="text-gray-500 text-xs mt-1">от {today}</div>
        </div>
      </div>
      <h1 className="font-oswald font-bold text-gray-900 text-2xl mt-5 uppercase">{doc.title}</h1>
      {content.deal_num && (
        <div className="text-gray-500 text-xs mt-1">по сделке № {content.deal_num}</div>
      )}
    </div>
  );
}

function DocBody({ docType, content }: { docType: string; content: DocContent }) {
  if (docType === "tz") return <TzBody c={content} />;
  if (docType === "contract") return <ContractBody c={content} />;
  if (docType === "estimate_pdf") return <EstimateBody c={content} />;
  if (docType === "invoice_prepay" || docType === "invoice_final") return <InvoiceBody c={content} />;
  if (docType === "act_start") return <ActStartBody c={content} />;
  if (docType === "act_handover") return <ActHandoverBody c={content} />;
  if (docType === "scheme") return <SchemeBody c={content} />;
  if (docType.startsWith("order_")) return <OrderBody c={content} docType={docType} />;
  return <pre className="text-xs">{JSON.stringify(content, null, 2)}</pre>;
}

function ClientBlock({ c }: { c: DocContent }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 my-5">
      <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Заказчик</div>
      <div className="text-gray-900 font-semibold">{c.client?.name || "—"}</div>
      <div className="text-gray-700 text-sm">{c.client?.phone || "—"}</div>
      {c.client?.address && (
        <div className="text-gray-700 text-sm mt-1">📍 {c.client.address}</div>
      )}
    </div>
  );
}

function TzBody({ c }: { c: DocContent }) {
  return (
    <div>
      <ClientBlock c={c} />
      <H2>Объект и задача</H2>
      <p className="text-gray-700 text-sm leading-relaxed">
        Тип услуги: <b>{c.service_type}</b>. Замерщик выезжает на объект, выполняет
        обмер, согласовывает технические решения с Заказчиком, заполняет приложение
        к настоящему ТЗ с фактическими размерами и фотографиями.
      </p>

      <H2>Технические требования</H2>
      <ul className="text-sm text-gray-700 space-y-1.5 list-disc pl-5">
        <li>Все материалы — заводское качество, ГОСТ 30245-2003 (профтруба), ГОСТ Р 52146-2003 (профлист).</li>
        <li>Сварка — полуавтоматическая в защитной среде CO₂, ГОСТ 14771-76.</li>
        <li>Покрытие — двухкомпонентный антикор-грунт + декоративная окраска.</li>
        <li>Фундамент — по факту грунта на месте, нагрузка по СП 22.13330.2016.</li>
        <li>Гарантия — 3 года по договору.</li>
      </ul>

      {c.tasks && c.tasks.length > 0 && (
        <>
          <H2>Список работ</H2>
          <ul className="text-sm text-gray-700 space-y-1 list-decimal pl-5">
            {c.tasks.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </>
      )}

      <H2>Заполняется замерщиком на объекте</H2>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          "Фактическая длина / периметр, м",
          "Высота, м",
          "Тип грунта (по визуальной оценке)",
          "Уровень грунтовых вод",
          "Препятствия (деревья, трубы, кабели)",
          "Точки крепления, особенности участка",
          "Доступ техники (минибетон, манипулятор)",
          "Согласованный цвет RAL",
        ].map((l) => (
          <div key={l} className="border-b border-dashed border-gray-300 pb-3">
            <div className="text-gray-500 text-[11px] uppercase tracking-wider">{l}</div>
            <div className="h-5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ContractBody({ c }: { c: DocContent }) {
  return (
    <div>
      <ClientBlock c={c} />
      <p className="text-sm text-gray-700 leading-relaxed">
        <b>{c.company?.name || "ООО «СтальГрупп»"}</b>, именуемое в дальнейшем «Исполнитель»,
        в лице Генерального директора, действующего на основании Устава, с одной стороны, и{" "}
        <b>{c.client?.name}</b>, именуемое в дальнейшем «Заказчик», с другой стороны,
        заключили настоящий Договор о нижеследующем.
      </p>

      <H2>1. Предмет договора</H2>
      <p className="text-sm text-gray-700">
        Исполнитель обязуется выполнить работы по услуге «<b>{c.service_type}</b>» по адресу:{" "}
        <i>{c.client?.address || "—"}</i> в соответствии с утверждённой сметой,
        а Заказчик обязуется принять и оплатить выполненные работы.
      </p>

      <H2>2. Стоимость и порядок расчётов</H2>
      <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
        <li>Общая стоимость работ: <b>{(c.total_rub || 0).toLocaleString("ru-RU")} ₽</b>.</li>
        <li>Предоплата: 50% — <b>{Math.round((c.total_rub || 0) * 0.5).toLocaleString("ru-RU")} ₽</b> в течение 3 рабочих дней с момента подписания.</li>
        <li>Остаток: 50% — по факту подписания акта приёма-передачи.</li>
        <li>Все платежи производятся в рублях.</li>
      </ul>

      <H2>3. Сроки выполнения</H2>
      <p className="text-sm text-gray-700">
        Срок выполнения работ — от 10 до 21 рабочего дня с момента поступления аванса.
        Конкретная дата монтажа согласуется отдельно.
      </p>

      <H2>4. Гарантийные обязательства</H2>
      <p className="text-sm text-gray-700">
        Исполнитель предоставляет гарантию <b>3 года</b> на конструкцию, монтаж и покрытие
        по договору. Гарантия не распространяется на ущерб от стихии (упавшие деревья,
        наезд автотранспорта), вмешательства третьих лиц, несоблюдения правил эксплуатации.
      </p>

      <H2>5. Заключительные положения</H2>
      <p className="text-sm text-gray-700">
        Договор составлен в 2 экземплярах, имеющих равную юридическую силу.
        Все споры решаются путём переговоров, при невозможности — в суде по месту нахождения Исполнителя.
      </p>

      <SignBlock c={c} role1="Исполнитель" role2="Заказчик" />
    </div>
  );
}

function EstimateBody({ c }: { c: DocContent }) {
  return (
    <div>
      <ClientBlock c={c} />
      <H2>Коммерческое предложение</H2>
      <p className="text-sm text-gray-700 mb-4">
        Услуга: <b>{c.service_type}</b>. Цены актуальны на 2026 год. Включены материалы, доставка по МО и монтаж.
      </p>

      {c.items && c.items.length > 0 && (
        <table className="w-full text-xs my-4 border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase tracking-wider text-[10px]">
              <th className="text-left p-2 border border-gray-200">№</th>
              <th className="text-left p-2 border border-gray-200">Наименование</th>
              <th className="text-center p-2 border border-gray-200">Кол-во</th>
              <th className="text-center p-2 border border-gray-200">Ед.</th>
              <th className="text-right p-2 border border-gray-200">Цена</th>
              <th className="text-right p-2 border border-gray-200">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {c.items.map((i, idx) => (
              <tr key={idx}>
                <td className="p-2 border border-gray-200">{idx + 1}</td>
                <td className="p-2 border border-gray-200">{i.name}</td>
                <td className="p-2 border border-gray-200 text-center">{i.qty}</td>
                <td className="p-2 border border-gray-200 text-center">{i.unit}</td>
                <td className="p-2 border border-gray-200 text-right">{Math.round(i.pricePerUnit || 0).toLocaleString("ru-RU")}</td>
                <td className="p-2 border border-gray-200 text-right">{Math.round(i.total || 0).toLocaleString("ru-RU")}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-orange-50">
              <td colSpan={5} className="p-2 border border-gray-200 text-right font-semibold">Итого:</td>
              <td className="p-2 border border-gray-200 text-right font-oswald font-bold text-base text-orange-600">
                {(c.total_rub || 0).toLocaleString("ru-RU")} ₽
              </td>
            </tr>
          </tfoot>
        </table>
      )}
      <p className="text-xs text-gray-500 mt-3">
        Предложение действительно 14 дней. Гарантия 3 года по договору. НДС не облагается (УСН).
      </p>
    </div>
  );
}

function InvoiceBody({ c }: { c: DocContent }) {
  const amount = c.amount || 0;
  const amountWords = "Согласно реквизитам";
  return (
    <div>
      <H2>Платёжные реквизиты</H2>
      <table className="w-full text-xs my-4 border-collapse">
        <tbody>
          {[
            ["Получатель", c.company?.name],
            ["ИНН / КПП", `${c.company?.inn} / ${c.company?.kpp}`],
            ["Расчётный счёт", c.company?.rs],
            ["Банк", c.company?.bank],
            ["БИК", c.company?.bik],
            ["Корр. счёт", c.company?.ks],
          ].map((r) => (
            <tr key={r[0]}>
              <td className="p-2 border border-gray-200 text-gray-600 w-1/3">{r[0]}</td>
              <td className="p-2 border border-gray-200 font-mono">{r[1] || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <H2>Назначение платежа</H2>
      <p className="text-sm text-gray-700 mb-4">{c.purpose}</p>

      <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-5 text-center my-6">
        <div className="text-gray-600 text-xs uppercase tracking-wider mb-1">Сумма к оплате</div>
        <div className="font-oswald font-bold text-orange-600 text-4xl">
          {amount.toLocaleString("ru-RU")} ₽
        </div>
        <div className="text-gray-500 text-xs mt-1">{amountWords}</div>
      </div>
      <p className="text-xs text-gray-500">
        Внимание! Оплата по данному счёту означает согласие с условиями договора.
      </p>
    </div>
  );
}

function ActStartBody({ c }: { c: DocContent }) {
  return (
    <div>
      <ClientBlock c={c} />
      <p className="text-sm text-gray-700">
        Настоящий акт составлен о том, что{" "}
        {c.start_date ? new Date(c.start_date).toLocaleDateString("ru-RU") : "сегодня"}{" "}
        бригадой Исполнителя начаты работы по услуге «<b>{c.service_type}</b>» на объекте
        Заказчика по адресу: <i>{c.client?.address || "—"}</i>.
      </p>
      <H2>Состав бригады</H2>
      {c.team && c.team.length > 0 ? (
        <ul className="text-sm text-gray-700 list-disc pl-5">
          {c.team.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 italic">Заполняется на объекте</p>
      )}
      <H2>Подтверждено</H2>
      <p className="text-sm text-gray-700">
        Заказчик подтверждает фактическое начало работ, обеспечил доступ к объекту,
        подключение электроэнергии для электроинструмента.
      </p>
      <SignBlock c={c} role1="От Исполнителя (бригадир)" role2="От Заказчика" />
    </div>
  );
}

function ActHandoverBody({ c }: { c: DocContent }) {
  return (
    <div>
      <ClientBlock c={c} />
      <p className="text-sm text-gray-700">
        Настоящий акт составлен о том, что Исполнитель сдал, а Заказчик принял
        выполненные работы по услуге «<b>{c.service_type}</b>» на объекте по адресу:{" "}
        <i>{c.client?.address || "—"}</i>.
      </p>
      <H2>Финансовые расчёты</H2>
      <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
        <li>Общая стоимость работ: <b>{(c.total_rub || 0).toLocaleString("ru-RU")} ₽</b></li>
        <li>Получено аванс: {(c.prepay_rub || 0).toLocaleString("ru-RU")} ₽</li>
        <li>К доплате: <b>{(c.remainder_rub || 0).toLocaleString("ru-RU")} ₽</b></li>
      </ul>
      <H2>Гарантийные обязательства</H2>
      <p className="text-sm text-gray-700">
        Исполнитель предоставляет гарантию <b>3 года</b> на конструкцию и покрытие
        с даты подписания настоящего акта.
      </p>
      <H2>Претензий по качеству</H2>
      <p className="text-sm text-gray-700">Стороны взаимных претензий не имеют.</p>
      <SignBlock c={c} role1="Сдал (Исполнитель)" role2="Принял (Заказчик)" />
    </div>
  );
}

function SchemeBody({ c }: { c: DocContent }) {
  return (
    <div>
      <ClientBlock c={c} />
      <H2>Схема монтажа</H2>
      {c.scheme_url ? (
        <img src={c.scheme_url} alt="Схема" className="w-full rounded-lg border border-gray-200 my-3" />
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-10 text-center text-gray-500 text-sm">
          Схема будет нарисована замерщиком на объекте<br />
          (привязка к существующим строениям, столбам, деревьям)
        </div>
      )}
      {c.notes && <><H2>Примечания</H2><p className="text-sm text-gray-700">{c.notes}</p></>}
    </div>
  );
}

function OrderBody({ c, docType }: { c: DocContent; docType: string }) {
  const isProd = docType === "order_production";
  const isInstall = docType === "order_install";
  return (
    <div>
      <ClientBlock c={c} />
      <H2>Задание {isProd ? "цеху" : isInstall ? "монтажной бригаде" : "замерщику"}</H2>
      <p className="text-sm text-gray-700">
        Услуга: <b>{c.service_type}</b>.<br />
        Срок: {c.scheduled_date ? new Date(c.scheduled_date).toLocaleDateString("ru-RU") : "согласовать"}.
      </p>
      {c.team && c.team.length > 0 && (
        <>
          <H2>Состав бригады</H2>
          <ul className="text-sm text-gray-700 list-disc pl-5">
            {c.team.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </>
      )}
      {c.instructions && (<><H2>Инструкции</H2><p className="text-sm text-gray-700 whitespace-pre-line">{c.instructions}</p></>)}
      {c.items && c.items.length > 0 && (
        <>
          <H2>Материалы / комплектация</H2>
          <table className="w-full text-xs my-3 border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase tracking-wider text-[10px]">
                <th className="text-left p-2 border border-gray-200">Наименование</th>
                <th className="text-center p-2 border border-gray-200">Кол-во</th>
                <th className="text-center p-2 border border-gray-200">Ед.</th>
              </tr>
            </thead>
            <tbody>
              {c.items.map((i, idx) => (
                <tr key={idx}>
                  <td className="p-2 border border-gray-200">{i.name}</td>
                  <td className="p-2 border border-gray-200 text-center">{i.qty}</td>
                  <td className="p-2 border border-gray-200 text-center">{i.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-oswald font-bold text-gray-900 text-base uppercase tracking-wide mt-6 mb-2 border-l-4 border-orange-500 pl-3">
      {children}
    </h2>
  );
}

function SignBlock({ c, role1, role2 }: { c: DocContent; role1: string; role2: string }) {
  return (
    <div className="grid grid-cols-2 gap-8 mt-10">
      <div>
        <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">{role1}</div>
        <div className="border-b border-gray-400 pb-1 mb-1 text-sm">{c.company?.name || "ООО «СтальГрупп»"}</div>
        <div className="text-gray-500 text-xs">подпись / печать</div>
        <div className="h-12 border-b border-gray-300 my-3" />
        <div className="text-gray-500 text-xs">М.П.</div>
      </div>
      <div>
        <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">{role2}</div>
        <div className="border-b border-gray-400 pb-1 mb-1 text-sm">{c.client?.name || "—"}</div>
        <div className="text-gray-500 text-xs">подпись</div>
        <div className="h-12 border-b border-gray-300 my-3" />
        <div className="text-gray-500 text-xs">«___» __________ 2026 г.</div>
      </div>
    </div>
  );
}

function DocFooter({ content, doc }: { content: DocContent; doc: DocItem }) {
  return (
    <div className="mt-8 pt-4 border-t border-gray-200 text-[10px] text-gray-400 flex justify-between">
      <span>{doc.doc_num} · {new Date(doc.created_at).toLocaleDateString("ru-RU")}</span>
      <span>{content.company?.phone || ""}</span>
    </div>
  );
}
