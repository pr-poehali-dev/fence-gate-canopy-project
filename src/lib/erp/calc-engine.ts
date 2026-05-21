/**
 * Универсальный движок расчёта смет для всех услуг СтальГрупп.
 * Одно ядро правил, разные конфигурации под услугу.
 *
 * Использование:
 *   const result = calculate({ service: "profnastil", params: { length: 50, height: 2.0, ... } });
 *   → { items: [...], totals: { material, work, total, cost, margin }, meta }
 */

export type ServiceKey =
  | "profnastil"
  | "shtaketnik"
  | "mesh3d"
  | "rabitsa"
  | "kovka"
  | "otkatnye"
  | "raspashnye"
  | "kalitki"
  | "navesy"
  | "besedki"
  | "fundamenty"
  | "ploshadki"
  | "zaezd";

export type SoilType = "sand" | "loam" | "clay" | "peat" | "slope";
export type PaintLevel = "base" | "middle" | "premium";
export type FoundationType =
  | "buti"
  | "concrete"
  | "tape"
  | "pile_86"
  | "pile_108";

export interface CalcParams {
  length?: number;          // м.п. (заборы, лента)
  area?: number;            // м² (площадки, навесы)
  height?: number;          // м (высота забора/ворот)
  width?: number;           // м (ширина проёма/полотна)
  soil?: SoilType;          // тип грунта
  paint?: PaintLevel;       // уровень покраски
  foundation?: FoundationType; // тип фундамента (override)
  windRegion?: 1 | 2 | 3;   // ветровой район
  snowRegion?: 1 | 2 | 3 | 4 | 5; // снеговой район
  withAutomation?: boolean; // ворота с автоматикой
  pipeDiameter?: 300 | 400 | 500; // диаметр трубы заезда, мм
  extras?: Record<string, number>; // ключ → количество
  marginPct?: number;       // наценка %, по умолчанию 25
}

export interface CalcItem {
  sku: string;
  name: string;
  unit: string;
  qty: number;
  pricePerUnit: number;
  total: number;
  cost: number;
  group: "material" | "work" | "foundation" | "paint" | "extras" | "automation";
}

export interface CalcResult {
  items: CalcItem[];
  totals: {
    material: number;
    work: number;
    foundation: number;
    paint: number;
    extras: number;
    automation: number;
    cost: number;       // себестоимость
    subtotal: number;   // без наценки
    margin: number;     // прибыль
    total: number;      // итого для клиента
    marginPct: number;
  };
  meta: {
    service: ServiceKey;
    postsCount?: number;
    pilesCount?: number;
    postStep?: number;
    foundation: string;
    windLoad?: number;
    snowLoad?: number;
    notes: string[];
  };
}

// ───────────────── ВСПОМОГАТЕЛЬНЫЕ ─────────────────

const SOIL_FOUNDATION_MATRIX: Record<
  SoilType,
  Record<"light" | "medium" | "heavy", FoundationType>
> = {
  sand:  { light: "buti",     medium: "concrete", heavy: "concrete" },
  loam:  { light: "concrete", medium: "concrete", heavy: "tape"      },
  clay:  { light: "concrete", medium: "concrete", heavy: "tape"      },
  peat:  { light: "pile_86",  medium: "pile_108", heavy: "pile_108"  },
  slope: { light: "pile_86",  medium: "pile_108", heavy: "pile_108"  },
};

const FOUNDATION_NAMES: Record<FoundationType, string> = {
  buti: "Бутование щебнем",
  concrete: "Бетонирование Ø250 на 1.4 м",
  tape: "Ленточно-ростверковый 200×400",
  pile_86: "Винтовые сваи Ø86×2000",
  pile_108: "Винтовые сваи Ø108×2500",
};

const FOUNDATION_PRICE: Record<FoundationType, { cost: number; sell: number; unit: "post" | "meter" }> = {
  buti:     { cost: 480,  sell: 650,  unit: "post" },
  concrete: { cost: 980,  sell: 1400, unit: "post" },
  tape:     { cost: 2200, sell: 3200, unit: "meter" },
  pile_86:  { cost: 2200, sell: 2950, unit: "post" },
  pile_108: { cost: 3500, sell: 4500, unit: "post" },
};

const PAINT_OPTIONS: Record<
  PaintLevel,
  { name: string; multiplier: number; lifeYears: number }
> = {
  base:    { name: "Алкидная эмаль / молотковая", multiplier: 0.75, lifeYears: 5 },
  middle:  { name: "Hammerite 3-в-1",              multiplier: 1.0,  lifeYears: 10 },
  premium: { name: "Порошковая полимерная",        multiplier: 1.4,  lifeYears: 25 },
};

const loadCategory = (service: ServiceKey, h: number): "light" | "medium" | "heavy" => {
  if (["rabitsa", "mesh3d"].includes(service)) return "light";
  if (["kovka", "otkatnye"].includes(service)) return "heavy";
  if (service === "raspashnye" && h >= 2) return "heavy";
  if (h >= 2.2) return "heavy";
  if (h >= 1.8) return "medium";
  return "light";
};

// ───────────────── РАСЧЁТЫ ПО УСЛУГАМ ─────────────────

function calcFence(p: CalcParams, service: ServiceKey): CalcResult {
  const length = Math.max(1, p.length || 50);
  const height = p.height || 2.0;
  const soil: SoilType = p.soil || "loam";
  const paint: PaintLevel = p.paint || "middle";
  const load = loadCategory(service, height);
  const foundation: FoundationType =
    p.foundation || SOIL_FOUNDATION_MATRIX[soil][load];

  const postStep = height >= 2.2 ? 2.0 : 2.5;
  const postsCount = Math.ceil(length / postStep) + 1;
  const items: CalcItem[] = [];
  const notes: string[] = [];

  // 1) Заполнение секции
  if (service === "profnastil") {
    const area = length * height;
    items.push({
      sku: "PROF-C8-05",
      name: "Профлист С8 0.5 мм с полимерным покрытием RAL",
      unit: "м²",
      qty: area,
      pricePerUnit: 690,
      total: area * 690,
      cost: area * 480,
      group: "material",
    });
    items.push({
      sku: "SCREW-48-35",
      name: "Саморез кровельный 4.8×35 EPDM",
      unit: "шт",
      qty: Math.ceil(area * 8),
      pricePerUnit: 6,
      total: Math.ceil(area * 8) * 6,
      cost: Math.ceil(area * 8) * 3.5,
      group: "material",
    });
  } else if (service === "shtaketnik") {
    const shtPerMeter = 11; // штакетин на 1 п.м. (шахматка)
    const totalSht = Math.ceil(length * shtPerMeter);
    items.push({
      sku: "PROF-SHT-05",
      name: "Евроштакетник М-образный двусторонний 0.5 мм",
      unit: "шт",
      qty: totalSht,
      pricePerUnit: 95,
      total: totalSht * 95,
      cost: totalSht * 62,
      group: "material",
    });
    items.push({
      sku: "RIVET-48-19",
      name: "Заклёпка в цвет RAL",
      unit: "шт",
      qty: totalSht * 4,
      pricePerUnit: 8,
      total: totalSht * 4 * 8,
      cost: totalSht * 4 * 4,
      group: "material",
    });
  } else if (service === "mesh3d") {
    const sections = Math.ceil(length / 2.5);
    items.push({
      sku: "MESH-3D-2517",
      name: "3D-сетка секция 2.5×1.7 м с полимерным покрытием",
      unit: "шт",
      qty: sections,
      pricePerUnit: 2400,
      total: sections * 2400,
      cost: sections * 1650,
      group: "material",
    });
    items.push({
      sku: "MESH-BRKT",
      name: "Антивандальное крепление секции",
      unit: "шт",
      qty: sections * 4,
      pricePerUnit: 95,
      total: sections * 4 * 95,
      cost: sections * 4 * 45,
      group: "material",
    });
  } else if (service === "rabitsa") {
    items.push({
      sku: "RAB-OC-2",
      name: "Сетка-рабица оцинкованная Ø2 мм 50×50",
      unit: "м",
      qty: length,
      pricePerUnit: 450,
      total: length * 450,
      cost: length * 290,
      group: "material",
    });
    items.push({
      sku: "WIRE-3",
      name: "Проволока натяжная Ø3 мм",
      unit: "м",
      qty: length * 2,
      pricePerUnit: 35,
      total: length * 2 * 35,
      cost: length * 2 * 22,
      group: "material",
    });
  } else if (service === "kovka") {
    const sections = Math.ceil(length / 2.5);
    items.push({
      sku: "KOVKA-SECT-25",
      name: "Кованая секция 2.5 м с ручной ковкой",
      unit: "шт",
      qty: sections,
      pricePerUnit: 11500,
      total: sections * 11500,
      cost: sections * 7800,
      group: "material",
    });
  }

  // 2) Каркас (столбы + лаги)
  const pipePost = height >= 2.0 ? "PIPE-60-60-3" : "PIPE-60-60-2";
  const pipePostPrice = height >= 2.0 ? 380 : 290;
  const pipePostCost = height >= 2.0 ? 290 : 220;
  const postHeight = height + 1.0; // надземная часть + подземная
  items.push({
    sku: pipePost,
    name: `Столб ${height >= 2.0 ? "60×60×3" : "60×60×2"} мм с заглушкой`,
    unit: "м",
    qty: postsCount * postHeight,
    pricePerUnit: pipePostPrice,
    total: postsCount * postHeight * pipePostPrice,
    cost: postsCount * postHeight * pipePostCost,
    group: "material",
  });

  if (service !== "mesh3d") {
    const lagRows = height >= 2.0 ? 3 : 2;
    items.push({
      sku: "PIPE-40-20-2",
      name: `Лага 40×20×2 (${lagRows} ряда)`,
      unit: "м",
      qty: length * lagRows,
      pricePerUnit: 135,
      total: length * lagRows * 135,
      cost: length * lagRows * 95,
      group: "material",
    });
  }

  // 3) Покраска
  const surfaceArea = length * height * (paint === "premium" ? 1 : 0.8);
  const paintOpt = PAINT_OPTIONS[paint];
  items.push({
    sku: `PAINT-${paint.toUpperCase()}`,
    name: paintOpt.name,
    unit: "м²",
    qty: surfaceArea,
    pricePerUnit: 380 * paintOpt.multiplier,
    total: surfaceArea * 380 * paintOpt.multiplier,
    cost: surfaceArea * 260 * paintOpt.multiplier,
    group: "paint",
  });
  notes.push(`Покрытие: ${paintOpt.name}. Срок службы ${paintOpt.lifeYears} лет.`);

  // 4) Фундамент
  const fcfg = FOUNDATION_PRICE[foundation];
  const fundQty = fcfg.unit === "meter" ? length : postsCount;
  items.push({
    sku: `FOUND-${foundation.toUpperCase()}`,
    name: FOUNDATION_NAMES[foundation],
    unit: fcfg.unit === "meter" ? "м.п." : "шт",
    qty: fundQty,
    pricePerUnit: fcfg.sell,
    total: fundQty * fcfg.sell,
    cost: fundQty * fcfg.cost,
    group: "foundation",
  });
  notes.push(
    `Фундамент: ${FOUNDATION_NAMES[foundation]} — подобран под ${soilLabel(soil)}.`
  );

  // 5) Монтажные работы
  items.push({
    sku: "WORK-MONTAGE",
    name: "Монтаж забора под ключ",
    unit: "м.п.",
    qty: length,
    pricePerUnit: 450,
    total: length * 450,
    cost: length * 280,
    group: "work",
  });

  // 6) Доп. расходники
  items.push({
    sku: "CAP-60-60",
    name: "Заглушка пластиковая на столб",
    unit: "шт",
    qty: postsCount,
    pricePerUnit: 28,
    total: postsCount * 28,
    cost: postsCount * 15,
    group: "material",
  });

  return finalize(items, p, {
    service,
    postsCount,
    postStep,
    foundation: FOUNDATION_NAMES[foundation],
    windLoad: 23,
    notes,
  });
}

function calcGate(p: CalcParams, service: ServiceKey): CalcResult {
  const width = p.width || 4.0;
  const height = p.height || 2.0;
  const paint: PaintLevel = p.paint || "middle";
  const items: CalcItem[] = [];
  const notes: string[] = [];

  if (service === "otkatnye") {
    const counterweight = width * 0.5;
    const beamLen = width + counterweight + 0.5;
    items.push({
      sku: "BEAM-ALU-95",
      name: `Балка несущая Alutech 95×88×5 длина ${Math.ceil(beamLen)} м`,
      unit: "шт",
      qty: 1,
      pricePerUnit: 14500 + Math.ceil(beamLen) * 1200,
      total: 14500 + Math.ceil(beamLen) * 1200,
      cost: 9800 + Math.ceil(beamLen) * 850,
      group: "material",
    });
    items.push({
      sku: "ROLL-COMBI",
      name: "Роликовая тележка Combi Arialdo (2 шт)",
      unit: "компл",
      qty: 1,
      pricePerUnit: 12500,
      total: 12500,
      cost: 8400,
      group: "material",
    });
    items.push({
      sku: "CATCH-UP-LOW",
      name: "Улавливатель верхний + нижний с роликом",
      unit: "компл",
      qty: 1,
      pricePerUnit: 4800,
      total: 4800,
      cost: 3200,
      group: "material",
    });
    items.push({
      sku: "PIPE-80-80-3",
      name: "Каркас полотна (профтруба 80×80×3 + 40×20×2)",
      unit: "м",
      qty: (width + height) * 2 + width,
      pricePerUnit: 580,
      total: ((width + height) * 2 + width) * 580,
      cost: ((width + height) * 2 + width) * 430,
      group: "material",
    });
    // Свая под противовес — обязательно
    items.push({
      sku: "PILE-108-2500",
      name: "Свая Ø108×2500 под противовес (2 шт)",
      unit: "шт",
      qty: 2,
      pricePerUnit: 4500,
      total: 2 * 4500,
      cost: 2 * 3500,
      group: "foundation",
    });
    notes.push(
      `Противовес ${counterweight.toFixed(1)} м (50% от проёма). Свая Ø108×2500 — обязательна.`
    );

    if (p.withAutomation) {
      items.push({
        sku: "AUTO-BX-708",
        name: "Автоматика Came BX-708 (Италия) до 800 кг",
        unit: "компл",
        qty: 1,
        pricePerUnit: 42000,
        total: 42000,
        cost: 31000,
        group: "automation",
      });
      items.push({
        sku: "RACK-GEAR-4",
        name: "Зубчатая рейка 4 м + крепёж",
        unit: "компл",
        qty: 1,
        pricePerUnit: 3800,
        total: 3800,
        cost: 2400,
        group: "automation",
      });
    }
  } else if (service === "raspashnye") {
    items.push({
      sku: "PIPE-40-40-3",
      name: "Каркас 2 створок (профтруба 40×40×3)",
      unit: "м",
      qty: (width / 2 + height) * 4,
      pricePerUnit: 320,
      total: (width / 2 + height) * 4 * 320,
      cost: (width / 2 + height) * 4 * 230,
      group: "material",
    });
    items.push({
      sku: "PIPE-100-100-3",
      name: "Столбы 100×100×3 (2 шт)",
      unit: "м",
      qty: (height + 1.5) * 2,
      pricePerUnit: 720,
      total: (height + 1.5) * 2 * 720,
      cost: (height + 1.5) * 2 * 540,
      group: "material",
    });
    items.push({
      sku: "HINGE-BISON",
      name: "Петли BISON 30/170 с подшипниками (4 шт)",
      unit: "шт",
      qty: 4,
      pricePerUnit: 1850,
      total: 4 * 1850,
      cost: 4 * 1200,
      group: "material",
    });
    items.push({
      sku: "BOLT-LOCK",
      name: "Засов-упор + замок",
      unit: "компл",
      qty: 1,
      pricePerUnit: 2400,
      total: 2400,
      cost: 1500,
      group: "material",
    });
    if (p.withAutomation) {
      items.push({
        sku: "AUTO-WINGO",
        name: "Автоматика Nice WINGO (для распашных)",
        unit: "компл",
        qty: 1,
        pricePerUnit: 32000,
        total: 32000,
        cost: 23000,
        group: "automation",
      });
    }
  }

  // Обшивка наполнением (профлист по умолчанию)
  const fillArea = width * height;
  items.push({
    sku: "PROF-C20-05",
    name: "Обшивка профлист С20 0.5 мм",
    unit: "м²",
    qty: fillArea,
    pricePerUnit: 690,
    total: fillArea * 690,
    cost: fillArea * 510,
    group: "material",
  });

  // Покраска
  const paintOpt = PAINT_OPTIONS[paint];
  items.push({
    sku: `PAINT-${paint.toUpperCase()}`,
    name: paintOpt.name,
    unit: "м²",
    qty: fillArea * 2 + 10,
    pricePerUnit: 380 * paintOpt.multiplier,
    total: (fillArea * 2 + 10) * 380 * paintOpt.multiplier,
    cost: (fillArea * 2 + 10) * 260 * paintOpt.multiplier,
    group: "paint",
  });

  // Монтаж
  items.push({
    sku: "WORK-GATE",
    name: `Монтаж ${service === "otkatnye" ? "откатных" : "распашных"} ворот под ключ`,
    unit: "компл",
    qty: 1,
    pricePerUnit: service === "otkatnye" ? 18500 : 14500,
    total: service === "otkatnye" ? 18500 : 14500,
    cost: service === "otkatnye" ? 11000 : 8500,
    group: "work",
  });

  return finalize(items, p, {
    service,
    foundation:
      service === "otkatnye"
        ? "Сваи Ø108×2500 под противовес"
        : "Бетонирование 1.5 м",
    notes,
  });
}

function calcNaves(p: CalcParams): CalcResult {
  const area = Math.max(6, p.area || 24); // м²
  const paint: PaintLevel = p.paint || "middle";
  const items: CalcItem[] = [];

  // Каркас (стойки + фермы)
  items.push({
    sku: "PIPE-80-80-3",
    name: "Стойки опорные 80×80×3 мм",
    unit: "м",
    qty: Math.ceil(area / 6) * 4 + 16, // 4 стойки на 6 м² + высота 2.5 м × 4 + дополн.
    pricePerUnit: 580,
    total: (Math.ceil(area / 6) * 4 + 16) * 580,
    cost: (Math.ceil(area / 6) * 4 + 16) * 430,
    group: "material",
  });
  items.push({
    sku: "PIPE-60-40-2",
    name: "Стропильные фермы 60×40×3",
    unit: "м",
    qty: area * 1.4,
    pricePerUnit: 280,
    total: area * 1.4 * 280,
    cost: area * 1.4 * 195,
    group: "material",
  });
  items.push({
    sku: "PIPE-40-20-2-OBR",
    name: "Обрешётка 40×20×2",
    unit: "м",
    qty: area * 1.8,
    pricePerUnit: 135,
    total: area * 1.8 * 135,
    cost: area * 1.8 * 95,
    group: "material",
  });

  // Кровля — поликарбонат 8 мм
  items.push({
    sku: "POLY-8",
    name: "Сотовый поликарбонат 8 мм с УФ-защитой",
    unit: "м²",
    qty: area * 1.1,
    pricePerUnit: 750,
    total: area * 1.1 * 750,
    cost: area * 1.1 * 520,
    group: "material",
  });
  items.push({
    sku: "POLY-WASHER",
    name: "Термошайба Ø25 с EPDM",
    unit: "шт",
    qty: Math.ceil(area * 4),
    pricePerUnit: 22,
    total: Math.ceil(area * 4) * 22,
    cost: Math.ceil(area * 4) * 13,
    group: "material",
  });

  // Фундамент под навес — бетон
  const stoek = Math.max(4, Math.ceil(area / 6) * 2);
  items.push({
    sku: "FOUND-CONC-NAVES",
    name: "Бетонирование стоек Ø250 на 1.0 м",
    unit: "шт",
    qty: stoek,
    pricePerUnit: 1100,
    total: stoek * 1100,
    cost: stoek * 750,
    group: "foundation",
  });

  // Покраска каркаса
  const paintOpt = PAINT_OPTIONS[paint];
  items.push({
    sku: `PAINT-${paint.toUpperCase()}`,
    name: paintOpt.name + " (каркас)",
    unit: "м²",
    qty: area * 0.8,
    pricePerUnit: 380 * paintOpt.multiplier,
    total: area * 0.8 * 380 * paintOpt.multiplier,
    cost: area * 0.8 * 260 * paintOpt.multiplier,
    group: "paint",
  });

  // Монтаж
  items.push({
    sku: "WORK-NAVES",
    name: "Монтаж навеса под ключ",
    unit: "м²",
    qty: area,
    pricePerUnit: 850,
    total: area * 850,
    cost: area * 540,
    group: "work",
  });

  return finalize(items, p, {
    service: "navesy",
    foundation: "Бетонирование стоек",
    snowLoad: 180,
    windLoad: 23,
    notes: [
      "Расчётная снеговая нагрузка для МО (III район): 180 кгс/м².",
      "Запас прочности 1.3×.",
    ],
  });
}

function calcPloshadka(p: CalcParams): CalcResult {
  const area = Math.max(4, p.area || 24);
  const items: CalcItem[] = [];

  // Пирог: геотекстиль, щебень, песок, плёнка, сетка, бетон
  items.push({
    sku: "GEOTEX-200",
    name: "Геотекстиль 200 г/м² (разделитель)",
    unit: "м²",
    qty: area * 1.1,
    pricePerUnit: 75,
    total: area * 1.1 * 75,
    cost: area * 1.1 * 48,
    group: "material",
  });
  items.push({
    sku: "GRAVEL-2040",
    name: "Щебень фр. 20-40 (подушка 200 мм)",
    unit: "т",
    qty: area * 0.34,
    pricePerUnit: 2850,
    total: area * 0.34 * 2850,
    cost: area * 0.34 * 2400,
    group: "material",
  });
  items.push({
    sku: "SAND-RIVER",
    name: "Песок речной (подушка 100 мм)",
    unit: "т",
    qty: area * 0.17,
    pricePerUnit: 1450,
    total: area * 0.17 * 1450,
    cost: area * 0.17 * 1200,
    group: "material",
  });
  items.push({
    sku: "PE-FILM",
    name: "Плёнка ПЭ 150 мкм",
    unit: "м²",
    qty: area * 1.15,
    pricePerUnit: 45,
    total: area * 1.15 * 45,
    cost: area * 1.15 * 28,
    group: "material",
  });
  items.push({
    sku: "MESH-100-100-4",
    name: "Армосетка ВР-1 100×100×4",
    unit: "м²",
    qty: area * 1.05,
    pricePerUnit: 320,
    total: area * 1.05 * 320,
    cost: area * 1.05 * 240,
    group: "material",
  });
  items.push({
    sku: "BETON-M300",
    name: "Бетон М300 F150 W6 (плита 120 мм)",
    unit: "м³",
    qty: area * 0.12,
    pricePerUnit: 5800,
    total: area * 0.12 * 5800,
    cost: area * 0.12 * 4900,
    group: "material",
  });

  // Работа
  items.push({
    sku: "WORK-PLOSHADKA",
    name: "Заливка площадки под ключ (выемка, армирование, заливка, затирка)",
    unit: "м²",
    qty: area,
    pricePerUnit: 950,
    total: area * 950,
    cost: area * 580,
    group: "work",
  });

  return finalize(items, p, {
    service: "ploshadki",
    foundation: "Пирог 420 мм по ГОСТ 26633-2015",
    notes: [
      "Бетон М300 F150 W6 — морозостойкость 150 циклов.",
      "Армирование сеткой 100×100×4.",
      "Компенсационные швы шагом 3×3 м (нарезка алмазным диском).",
    ],
  });
}

function calcZaezd(p: CalcParams): CalcResult {
  const d = p.pipeDiameter || 400;
  const len = p.length || 6;
  const items: CalcItem[] = [];

  const pipePrice = d === 300 ? 1850 : d === 400 ? 2750 : 3950;
  const pipeCost = d === 300 ? 1350 : d === 400 ? 2050 : 2950;
  items.push({
    sku: `PIPE-PND-${d}`,
    name: `Труба ПНД гофрированная двухстенная Ø${d} мм SN8`,
    unit: "м",
    qty: len,
    pricePerUnit: pipePrice,
    total: len * pipePrice,
    cost: len * pipeCost,
    group: "material",
  });
  items.push({
    sku: "JBI-OGOLOVOK",
    name: "Оголовки ЖБИ (2 шт — вход/выход)",
    unit: "компл",
    qty: 1,
    pricePerUnit: 8500,
    total: 8500,
    cost: 5800,
    group: "material",
  });
  items.push({
    sku: "GRAVEL-2040",
    name: "Щебень обсыпки фр. 20-40",
    unit: "т",
    qty: 4,
    pricePerUnit: 2850,
    total: 4 * 2850,
    cost: 4 * 2400,
    group: "material",
  });
  items.push({
    sku: "GEOTEX-200",
    name: "Геотекстиль 200 г/м² (обёртка трубы)",
    unit: "м²",
    qty: 18,
    pricePerUnit: 75,
    total: 18 * 75,
    cost: 18 * 48,
    group: "material",
  });
  items.push({
    sku: "BETON-M300-Z",
    name: "Бетон М300 покрытия (120 мм)",
    unit: "м³",
    qty: len * 3 * 0.12,
    pricePerUnit: 5800,
    total: len * 3 * 0.12 * 5800,
    cost: len * 3 * 0.12 * 4900,
    group: "material",
  });
  items.push({
    sku: "MESH-100-100-4",
    name: "Армосетка покрытия",
    unit: "м²",
    qty: len * 3.2,
    pricePerUnit: 320,
    total: len * 3.2 * 320,
    cost: len * 3.2 * 240,
    group: "material",
  });
  items.push({
    sku: "WORK-ZAEZD",
    name: "Земляные работы + укладка трубы + бетонирование",
    unit: "компл",
    qty: 1,
    pricePerUnit: 18500,
    total: 18500,
    cost: 11500,
    group: "work",
  });

  return finalize(items, p, {
    service: "zaezd",
    foundation: `Труба ПНД Ø${d} SN8 + ЖБИ-оголовки`,
    notes: [
      `Диаметр трубы Ø${d} мм рассчитан по СП 32.13330.2018.`,
      "Срок службы трубы ПНД SN8 — 50+ лет.",
    ],
  });
}

// ───────────────── ОБЩЕЕ ─────────────────

function finalize(items: CalcItem[], p: CalcParams, meta: CalcResult["meta"]): CalcResult {
  const sum = (group: CalcItem["group"]) =>
    items.filter((i) => i.group === group).reduce((s, i) => s + i.total, 0);
  const material = sum("material");
  const work = sum("work");
  const foundation = sum("foundation");
  const paint = sum("paint");
  const extras = sum("extras");
  const automation = sum("automation");
  const cost = items.reduce((s, i) => s + i.cost, 0);
  const subtotal = material + work + foundation + paint + extras + automation;
  const marginPct = p.marginPct ?? 25;
  const total = Math.round(subtotal);
  const margin = total - cost;

  return {
    items: items.map((i) => ({
      ...i,
      qty: round2(i.qty),
      total: round2(i.total),
      cost: round2(i.cost),
    })),
    totals: {
      material: round2(material),
      work: round2(work),
      foundation: round2(foundation),
      paint: round2(paint),
      extras: round2(extras),
      automation: round2(automation),
      cost: round2(cost),
      subtotal: round2(subtotal),
      margin: round2(margin),
      total: total,
      marginPct,
    },
    meta,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function soilLabel(s: SoilType): string {
  return {
    sand: "сухой песок",
    loam: "суглинок МО (стандарт)",
    clay: "глина плотная",
    peat: "торф / обводнённый грунт",
    slope: "склон с перепадом высот",
  }[s];
}

// ───────────────── ТОЧКА ВХОДА ─────────────────

export function calculate(args: {
  service: ServiceKey;
  params: CalcParams;
}): CalcResult {
  const { service, params } = args;
  switch (service) {
    case "profnastil":
    case "shtaketnik":
    case "mesh3d":
    case "rabitsa":
    case "kovka":
      return calcFence(params, service);
    case "otkatnye":
    case "raspashnye":
      return calcGate(params, service);
    case "navesy":
    case "besedki":
      return calcNaves(params);
    case "ploshadki":
      return calcPloshadka(params);
    case "zaezd":
      return calcZaezd(params);
    case "kalitki":
      // Калитка = упрощённая распашка 1×2 м
      return calcGate({ ...params, width: 1.0, height: 2.0 }, "raspashnye");
    case "fundamenty":
      // Просто рассчитать стоимость фундамента
      return calcFence({ ...params }, "profnastil");
    default:
      return finalize([], params, {
        service,
        foundation: "—",
        notes: ["Услуга не поддерживается калькулятором"],
      });
  }
}

export const SERVICE_LABELS: Record<ServiceKey, string> = {
  profnastil: "Забор из профнастила",
  shtaketnik: "Забор из евроштакетника",
  mesh3d: "Забор 3D-сетка",
  rabitsa: "Забор-рабица",
  kovka: "Кованый забор",
  otkatnye: "Откатные ворота",
  raspashnye: "Распашные ворота",
  kalitki: "Калитка",
  navesy: "Навес",
  besedki: "Беседка",
  fundamenty: "Фундамент под забор",
  ploshadki: "Бетонная площадка",
  zaezd: "Заезд на участок",
};
