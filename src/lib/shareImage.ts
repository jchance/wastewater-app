// Draws the 1200x630 link preview card for a page. Satori turns the layout and
// the bundled Inter font into an SVG with the text as paths, so the PNG looks
// the same on any machine, then sharp rasterizes it.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import satori from "satori";
import sharp from "sharp";

export const SHARE_IMAGE_WIDTH = 1200;
export const SHARE_IMAGE_HEIGHT = 630;

const TEAL = "#16847d";
const CANVAS = "#f6f9fa";
const INK = "#121e24";
const MUTED = "#3f525b";

const require = createRequire(import.meta.url);
const font = (weight: number) =>
  readFile(require.resolve(`@fontsource/inter/files/inter-latin-${weight}-normal.woff`));

let fonts: Promise<{ name: string; data: Buffer; weight: 500 | 800; style: "normal" }[]>;
const loadFonts = () =>
  (fonts ??= Promise.all([
    font(500).then((data) => ({ name: "Inter", data, weight: 500 as const, style: "normal" as const })),
    font(800).then((data) => ({ name: "Inter", data, weight: 800 as const, style: "normal" as const })),
  ]));

const logo = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="${TEAL}"/><path d="M8 32a24 24 0 0 1 48 0Z" fill="#fff" opacity=".22"/><g fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><circle cx="32" cy="32" r="24"/><path d="M8 32h48M32 32 20.4 52.9M32 32l11.6 20.9"/></g></svg>`
).toString("base64")}`;

type Node = { type: string; props: Record<string, unknown> };
const el = (type: string, style: Record<string, unknown>, children?: unknown, extra = {}): Node => ({
  type,
  props: { style: { display: "flex", ...style }, children, ...extra },
});

export interface ShareCard {
  title: string;
  description?: string;
  kicker?: string;
}

export async function renderShareImage({ title, description, kicker }: ShareCard) {
  const titleSize = title.length > 28 ? 64 : 80;
  const tree = el(
    "div",
    {
      width: "100%",
      height: "100%",
      backgroundColor: CANVAS,
      borderLeft: `24px solid ${TEAL}`,
      padding: "64px 80px 60px 72px",
      flexDirection: "column",
      fontFamily: "Inter",
      color: INK,
    },
    [
      el("div", { alignItems: "center", gap: 22 }, [
        el("img", { width: 72, height: 72 }, undefined, { src: logo, width: 72, height: 72 }),
        el("div", { fontSize: 34, fontWeight: 800 }, "Wastewater Field Guide"),
      ]),
      el("div", { flexDirection: "column", flexGrow: 1, justifyContent: "center", gap: 18 }, [
        kicker
          ? el("div", { fontSize: 28, fontWeight: 800, color: TEAL, letterSpacing: 2, textTransform: "uppercase" }, kicker)
          : null,
        el("div", { fontSize: titleSize, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5 }, title),
        description
          ? el("div", { fontSize: 32, fontWeight: 500, lineHeight: 1.35, color: MUTED, maxWidth: 1000 }, description)
          : null,
      ]),
      el("div", { fontSize: 26, fontWeight: 500, color: TEAL }, "web.wastewaterfieldguide.com"),
    ]
  );

  const svg = await satori(tree as never, {
    width: SHARE_IMAGE_WIDTH,
    height: SHARE_IMAGE_HEIGHT,
    fonts: await loadFonts(),
  });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toBuffer();
}
