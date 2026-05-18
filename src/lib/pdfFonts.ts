// ─────────────────────────────────────────────────────────────────
// Загрузка кириллического шрифта PT Sans для jsPDF.
// Шрифт кэшируется в памяти, чтобы не качать повторно.
// ─────────────────────────────────────────────────────────────────

let _ptSansRegularB64: string | null = null;
let _ptSansBoldB64: string | null = null;

async function _loadFont(url: string): Promise<string> {
  const resp = await fetch(url);
  const buf  = await resp.arrayBuffer();
  let bin = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)) as unknown as number[]
    );
  }
  return btoa(bin);
}

export async function ensureCyrillicFonts(): Promise<{ regular: string; bold: string } | null> {
  if (_ptSansRegularB64 && _ptSansBoldB64) {
    return { regular: _ptSansRegularB64, bold: _ptSansBoldB64 };
  }
  const ttfReg  = "https://fonts.gstatic.com/s/ptsans/v17/jizaRExUiTo99u79D0KExcOPIDU.ttf";
  const ttfBold = "https://fonts.gstatic.com/s/ptsans/v17/jizfRExUiTo99u79B_mh4OmnLD0Z4zM.ttf";
  try {
    const [r, b] = await Promise.all([_loadFont(ttfReg), _loadFont(ttfBold)]);
    _ptSansRegularB64 = r;
    _ptSansBoldB64 = b;
    return { regular: r, bold: b };
  } catch {
    return null;
  }
}
