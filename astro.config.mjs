// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { viewTransitions } from "astro-vtbot/starlight-view-transitions";
import { serviceWorker } from "./integrations/service-worker.mjs";

import tailwindcss from "@tailwindcss/vite";
import config from "./src/config/config.json";
import social from "./src/config/social.json";
import locals from "./src/config/locals.json";
import sidebar from "./src/config/sidebar.json";

import { fileURLToPath } from "url";

const { site } = config;
const { title, logo, logo_darkmode } = site;

export const locales = locals


// https://astro.build/config
export default defineConfig({
  site: "https://wastewaterfieldguide.com",
  // `npm run build:native` builds the app bundle; see scripts/prepare-native.mjs.
  outDir: process.env.NATIVE_BUILD === "1" ? "dist-native" : "dist",
  image: {
    service: { entrypoint: "astro/assets/services/noop" },
  },
  integrations: [
    starlight({
      title,
      ...(logo && logo_darkmode ? { logo: { light: logo, dark: logo_darkmode } } : {}),
      // @ts-ignore
      social: social.main || [],
      favicon: "/favicon.svg",
      head: [
        { tag: "link", attrs: { rel: "icon", href: "/favicon.ico", sizes: "32x32" } },
        { tag: "link", attrs: { rel: "apple-touch-icon", href: "/apple-touch-icon.png" } },
        { tag: "link", attrs: { rel: "manifest", href: "/manifest.webmanifest" } },
        { tag: "meta", attrs: { name: "theme-color", content: "#16847d" } },
        { tag: "meta", attrs: { name: "mobile-web-app-capable", content: "yes" } },
        { tag: "meta", attrs: { name: "apple-web-app-capable", content: "yes" } },
        { tag: "meta", attrs: { name: "apple-mobile-web-app-title", content: "Field Guide" } },
        {
          tag: "meta",
          attrs: { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        },
        {
          tag: "script",
          attrs: {
            type: "module",
            src: "https://static.cloudflareinsights.com/beacon.min.js",
            "data-cf-beacon": '{"token": "dddec9a7972f48eb99407770871093de"}',
          },
        },
      ],
      locales,
      pagination: false,
      sidebar: sidebar.main || [],
      customCss: ["./src/styles/global.css"],
      components: {
        Head: "./src/components/override-components/Head.astro",
        Header: "./src/components/override-components/Header.astro",
        Hero: "./src/components/override-components/Hero.astro",
        ThemeProvider: "./src/components/override-components/ThemeProvider.astro",
        PageFrame: "./src/components/override-components/PageFrame.astro",
        PageSidebar: "./src/components/override-components/PageSidebar.astro",
        TwoColumnContent: "./src/components/override-components/TwoColumnContent.astro",
        ContentPanel: "./src/components/override-components/ContentPanel.astro",
        Pagination: "./src/components/override-components/Pagination.astro",
        Sidebar: "./src/components/override-components/Sidebar.astro",
        
        
      },
      
    }),
    serviceWorker(),
  ],
  vite: {
    plugins: /** @type {any} */ ([tailwindcss(), viewTransitions()]),
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "~": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
