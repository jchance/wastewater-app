// Renders the source images that `@capacitor/assets` turns into every
// iOS/Android icon and splash size. The artwork is the site logo
// (public/favicon.svg); run `npm run native:assets` after changing it.
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const TEAL = "#16847d";
const LIGHT_CANVAS = "#f6f9fa";
const DARK_CANVAS = "#121e24";

const glyph = (scale) => `
  <g transform="translate(32 32) scale(${scale}) translate(-32 -32)">
    <path d="M8 32a24 24 0 0 1 48 0Z" fill="#fff" opacity=".22"/>
    <g fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round">
      <circle cx="32" cy="32" r="24"/>
      <path d="M8 32h48M32 32 20.4 52.9M32 32l11.6 20.9"/>
    </g>
  </g>`;

const svg = (body, background = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${background}${body}</svg>`;

// Splash: the rounded logo tile centered on the site's page color.
const splash = (canvas) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732">
    <rect width="2732" height="2732" fill="${canvas}"/>
    <svg x="1066" y="1066" width="600" height="600" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="15" fill="${TEAL}"/>${glyph(1)}
    </svg>
  </svg>`;

const outputs = {
  // iOS masks the corners itself, so the icon is a full-bleed square.
  "icon-only.png": [svg(glyph(0.75), `<rect width="64" height="64" fill="${TEAL}"/>`), 1024],
  // Android adaptive icons crop to a shape; keep the glyph inside the safe zone.
  "icon-foreground.png": [svg(glyph(0.62)), 1024],
  "icon-background.png": [svg("", `<rect width="64" height="64" fill="${TEAL}"/>`), 1024],
  "splash.png": [splash(LIGHT_CANVAS), 2732],
  "splash-dark.png": [splash(DARK_CANVAS), 2732],
};

await mkdir("assets", { recursive: true });
for (const [name, [markup, size]] of Object.entries(outputs)) {
  const density = name.startsWith("splash") ? 72 : 72 * (size / 64);
  await sharp(Buffer.from(markup), { density }).resize(size, size).png().toFile(`assets/${name}`);
  console.log(`assets/${name}`);
}
