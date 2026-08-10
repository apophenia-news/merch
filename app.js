const FONT_CSS = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700";
const BASE_DPI = 300;

const ART = {
  front: { w: 1200, h: 340 },
  back: { w: 3300, h: 2100 }
};

// [x, y, r, colorIndex] — colorIndex 0 indigo, 1 cyan, 2 core, 3 anomaly ring
const NODES = [
  [430, 380, 30, 0], [1080, 210, 24, 1], [1760, 330, 30, 0], [2480, 250, 26, 3],
  [2890, 720, 30, 0], [2200, 900, 36, 1], [1500, 760, 46, 2], [830, 940, 30, 1],
  [400, 1180, 24, 0], [1980, 1300, 30, 0], [1180, 1320, 26, 1], [2760, 1230, 22, 1]
];

const EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 0],
  [1, 6], [2, 6], [6, 9], [9, 5], [7, 10], [10, 6], [10, 9], [4, 11], [11, 9], [0, 7]
];

const PALETTE = { indigo: "#4f46e5", cyan: "#0ea5e9" };

const el = (id) => document.getElementById(id);
const status = el("status");

const setStatus = (msg, cls = "") => {
  status.textContent = msg;
  status.className = `status ${cls}`;
};

const b64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};

let fontFacePromise = null;

const loadEmbeddedFont = () => {
  fontFacePromise ??= (async () => {
    const css = await fetch(FONT_CSS).then((r) => r.text());
    const blocks = css.split("@font-face").filter((b) => b.includes("U+0000-00FF"));
    const faces = await Promise.all(
      blocks.map(async (block) => {
        const weight = block.match(/font-weight:\s*(\d+)/)?.[1] || "400";
        const url = block.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1];
        if (!url) return "";
        const data = b64(await fetch(url).then((r) => r.arrayBuffer()));
        return `@font-face{font-family:'Space Grotesk';font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${data}) format('woff2');}`;
      })
    );
    return faces.join("");
  })().catch(() => "");
  return fontFacePromise;
};

const theme = (variant) =>
  variant === "dark"
    ? { ink: "#ffffff", edge: "#ffffff", edgeOpacity: ".30", word: "#ffffff", sub: "#8ab4f8" }
    : { ink: "#15151b", edge: "#15151b", edgeOpacity: ".32", word: "#15151b", sub: "#4f46e5" };

const defs = (fontCss) => `
  <defs>
    <linearGradient id="ap-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${PALETTE.indigo}"/>
      <stop offset="100%" stop-color="${PALETTE.cyan}"/>
    </linearGradient>
    <style>${fontCss}</style>
  </defs>`;

const logoMark = (t) => `
  <g>
    <rect x="6" y="6" width="108" height="108" rx="28" fill="none" stroke="url(#ap-grad)" stroke-width="8"/>
    <path d="M36 36L84 84M84 36L36 84M36 36H84M36 84H84" stroke="${t.ink}" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>
    <circle cx="36" cy="36" r="8" fill="${PALETTE.indigo}"/>
    <circle cx="84" cy="36" r="8" fill="${PALETTE.cyan}"/>
    <circle cx="36" cy="84" r="8" fill="${PALETTE.cyan}"/>
    <circle cx="84" cy="84" r="8" fill="${PALETTE.indigo}"/>
    <circle cx="60" cy="60" r="10" fill="${t.ink}"/>
  </g>`;

const constellation = (t) => {
  const lines = EDGES.map(([a, b]) => {
    const [x1, y1] = NODES[a];
    const [x2, y2] = NODES[b];
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${t.edge}" stroke-opacity="${t.edgeOpacity}" stroke-width="7" stroke-linecap="round"/>`;
  }).join("");

  const dots = NODES.map(([x, y, r, c]) => {
    if (c === 3) return `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="url(#ap-grad)" stroke-width="11"/>`;
    if (c === 2) return `<circle cx="${x}" cy="${y}" r="${r}" fill="${t.ink}"/><circle cx="${x}" cy="${y}" r="${r + 22}" fill="none" stroke="${t.edge}" stroke-opacity=".22" stroke-width="6"/>`;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c ? PALETTE.cyan : PALETTE.indigo}"/>`;
  }).join("");

  return `<g>${lines}${dots}</g>`;
};

const wrap = (w, h, body, fontCss, guides) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
${defs(fontCss)}
${guides ? `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="none" stroke="#f43f5e" stroke-opacity=".6" stroke-width="3" stroke-dasharray="18 14"/>` : ""}
${body}
</svg>`;

const buildFront = ({ variant, fontCss, guides }) => {
  const t = theme(variant);
  const { w, h } = ART.front;
  const body = `
  <g transform="translate(14 42) scale(2.1667)">${logoMark(t)}</g>
  <text x="312" y="212" font-family="Space Grotesk" font-weight="700" font-size="112"
        fill="${t.word}" textLength="862" lengthAdjust="spacing">apophenia.news</text>`;
  return wrap(w, h, body, fontCss, guides);
};

const buildBack = ({ variant, fontCss, guides }) => {
  const t = theme(variant);
  const { w, h } = ART.back;
  const body = `
  ${constellation(t)}
  <text x="1650" y="1770" text-anchor="middle" font-family="Space Grotesk" font-weight="500" font-size="180"
        fill="${t.word}" textLength="2800" lengthAdjust="spacing">finding patterns in the noise</text>
  <text x="1650" y="1990" text-anchor="middle" font-family="Space Grotesk" font-weight="700" font-size="88"
        fill="${t.sub}" textLength="780" lengthAdjust="spacing">apophenia.news</text>`;
  return wrap(w, h, body, fontCss, guides);
};

const BUILDERS = { front: buildFront, back: buildBack };

const state = () => ({
  variant: el("variant").value,
  guides: el("guides").checked,
  dpi: +el("dpi").value
});

const render = () => {
  const { variant, guides } = state();
  for (const key of Object.keys(BUILDERS)) {
    const stage = el(`stage-${key}`);
    stage.dataset.bg = variant;
    stage.innerHTML = BUILDERS[key]({ variant, fontCss: "", guides });
  }
};

const svgToBlob = (svg) => new Blob([svg], { type: "image/svg+xml;charset=utf-8" });

const rasterize = async (svg, w, h, scale) => {
  const url = URL.createObjectURL(svgToBlob(svg));
  try {
    const img = new Image();
    img.decoding = "sync";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("SVG rasterization failed"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))), "image/png")
    );
  } finally {
    URL.revokeObjectURL(url);
  }
};

const saveBlob = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const download = async (btn) => {
  const { dl: key, fmt } = btn.dataset;
  const { variant, dpi } = state();
  const { w, h } = ART[key];
  btn.disabled = true;
  setStatus(`Building ${key} ${fmt.toUpperCase()}\u2026`);
  try {
    const fontCss = await loadEmbeddedFont();
    if (!fontCss) setStatus("Font embed unavailable \u2014 text may fall back. Check connection.", "err");
    const svg = BUILDERS[key]({ variant, fontCss, guides: false });
    const stem = `apophenia-${key}-${variant}`;
    if (fmt === "svg") saveBlob(svgToBlob(svg), `${stem}.svg`);
    else saveBlob(await rasterize(svg, w, h, dpi / BASE_DPI), `${stem}-${dpi}dpi.png`);
    if (fontCss) setStatus(`Saved ${stem}.${fmt}`, "ok");
  } catch (err) {
    setStatus(err.message || "Export failed. Try a lower DPI.", "err");
  } finally {
    btn.disabled = false;
  }
};

document.querySelectorAll("[data-dl]").forEach((btn) => btn.addEventListener("click", () => download(btn)));
["variant", "guides", "dpi"].forEach((id) => el(id).addEventListener("change", render));

render();
loadEmbeddedFont().then((css) =>
  setStatus(css ? "Fonts embedded. Ready to export." : "Font embed failed \u2014 exports may use a fallback face.", css ? "ok" : "err")
);
