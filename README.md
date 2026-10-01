# Wastewater Field Guide

A responsive, static cheatsheet for wastewater treatment operators: reference tables, operator math explainers, and step-by-step calculators. Live at **https://wastewaterfieldguide.com**.

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build), using the MIT-licensed [DocKit theme](https://github.com/themefisher/dockit-astro). The site is fully static; calculators run in the browser with no backend.

> Formulas and default values are provided for convenience. Always verify values against your own plant data, permits, and SOPs.

## What's in it

| Section | Path | Pages |
| --- | --- | --- |
| Operator Reference | `src/content/docs/operator-reference/` | Formulas, conversion factors, abbreviations, pie wheels |
| Operator Math | `src/content/docs/operator-math/` | Davidson pie chart, three names, demand/strength/purity, cost & supply |
| Calculators | `src/content/docs/calculators/` | Chemical dosage, loading & removal, process control, clarifier & tank loading, pipe flow, Stank Index (just for fun) |

## Project layout

- `src/content/docs/` – page routes and metadata (`.mdx`)
- `src/components/calculators/` – calculator UIs (markup, scoped styles, client script)
- `src/components/operator-math/` – operator math page bodies and SVG figures
- `src/lib/` – calculator math and validation (TypeScript, framework-free)
- `src/styles/calculator.css` – shared calculator layout and form styles
- `src/config/` – site title (`config.json`), header menu (`menu.en.json`), sidebar (`sidebar.json`)
- `src/components/override-components/` – Starlight component overrides (header, footer, site title, etc.)
- `public/` – static files copied as-is: favicon, apple touch icon, `CNAME`
- `ios/`, `android/` – Capacitor native app projects (Xcode and Android Studio)
- `capacitor.config.ts`, `scripts/prepare-native.mjs` – native app identity and web bundle preparation

## Local development

Requires Node.js 22.12 or newer (`.nvmrc` pins 22).

```sh
nvm use
npm install
npm run dev                    # http://localhost:4321
npm run dev -- --host 0.0.0.0  # also reachable from phones on your LAN
```

Other commands:

```sh
npm run check    # Astro/TypeScript type check
npm run build    # production build to dist/
npm run preview  # serve the dist/ build locally
```

Changes to `astro.config.mjs` or `src/config/*.json` need a dev server restart.

## Deployment (GitHub Pages)

Deploys are automatic. Every push to `main` runs `.github/workflows/deploy.yml`, which:

1. Installs dependencies with `npm ci` on the Node version from `.nvmrc`
2. Runs `npm run build`
3. Uploads `dist/` and publishes it with `actions/deploy-pages`

You can also run it manually from **Actions → Deploy to GitHub Pages → Run workflow**. Check status with `gh run list`.

### Pages configuration

- **Repository settings → Pages → Source:** GitHub Actions (not "Deploy from a branch")
- **Custom domain:** `wastewaterfieldguide.com`, set in repo settings *and* in `public/CNAME` (keep both in sync)
- **Site URL:** `site` in `astro.config.mjs` is `https://wastewaterfieldguide.com`, used for canonical links and the sitemap. No `base` path is needed because the site is served from the domain root.
- **DNS:** `A` records for the apex pointing at GitHub Pages (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`), plus a `CNAME` for `www` pointing to `jchance.github.io`
- **Legacy domain:** `wastewater.jasonchance.com` is served by a separate repo that redirects to this site, preserving the path. GitHub Pages allows only one repo per custom domain, so the redirect cannot live here.
- **HTTPS:** after DNS resolves and GitHub issues a certificate, enable **Enforce HTTPS** in the Pages settings

The repository and the published site are both public.

## Native apps (Capacitor)

The iOS and Android apps (`com.wastewaterfieldguide.app`) wrap the same Astro build with [Capacitor](https://capacitorjs.com). Requires Xcode for iOS and Android Studio for Android.

```sh
npm run native:sync     # build the app bundle into dist-native/, copy it into ios/ and android/
npm run native:ios      # sync, then open the project in Xcode
npm run native:android  # sync, then open the project in Android Studio
npm run native:assets   # regenerate app icons and splash screens
```

`npm run native:ios` doesn't launch a simulator. Choose one in Xcode and press **Run**.

### Icons and splash screens

`scripts/make-native-assets.mjs` draws the source images in `assets/` from the logo in `public/favicon.svg`. `@capacitor/assets` then generates every iOS and Android size from them. The splash has a light and a dark version that follow the system appearance. To change the artwork, edit the script and run `npm run native:assets`. The generator reformats `android/app/src/main/AndroidManifest.xml` without changing anything, so discard that diff with `git checkout android/app/src/main/AndroidManifest.xml`.

The splash screen stays up until the first page paints. `prepare-native.mjs` adds a script to each page that hides it on load. `launchShowDuration` in `capacitor.config.ts` is only a fallback.

### Navigation

The apps use a bottom tab bar (Home, Calculators, Reference, Math) instead of the website's menu. The tab for the current section stays highlighted on its detail pages. Tapping a section tab opens a list page for that section at `/calculators/`, `/operator-reference/` or `/operator-math/`. Those pages reuse the lists from the home page. The tab bar is in `src/components/app/AppTabBar.astro`, the sections are listed in `src/lib/appSections.ts`, and the list pages come from `src/pages/[section]/index.astro`.

App pages use `viewport-fit=cover` (added by `prepare-native.mjs`), so `env(safe-area-inset-*)` reports the status bar and home indicator. The tab bar uses the bottom inset to stay clear of the iOS home indicator, and the header uses the top inset to stay below the status bar. `contentInset` in `capacitor.config.ts` is `"never"` so iOS doesn't add the status bar height a second time.

The About page (`src/content/docs/about.mdx`) is linked from the header button next to the theme toggle on both the website and the apps, so the tab bar keeps four tabs and no tab is highlighted on About. In the apps it also shows the version (`appVersion` in `src/lib/native.ts`, kept in step with the Xcode and Gradle versions) and the copyright.

### First-launch disclaimer

The apps have no footer. The copyright is on the About page, and the disclaimer appears once, on first launch, in a modal (`src/components/app/DisclaimerNotice.astro`) that only closes with "I understand". Acceptance is stored in `localStorage` under `fg-disclaimer-accepted`. The disclaimer text is in `src/lib/disclaimer.ts`, which the website footer and the About page also use. Bump `disclaimerVersion` there to ask everyone to accept a changed disclaimer.

On iOS you can swipe in from the left edge to go back. On Android the back button goes to the previous page and only leaves the app from the first page.

### Status bar

`prepare-native.mjs` also adds a script that sends each page's header color and current theme to a small native plugin, `FieldGuideChrome`. The plugin is defined in `FieldGuideViewController.swift` on iOS and in `FieldGuideChromePlugin.java` on Android. It fills the strip behind the status bar with the header color and picks light or dark status bar icons. It follows the site's theme toggle, which can differ from the system setting, and updates when the theme changes.

Android builds need JDK 21. The Gradle version in the Capacitor template can't run on the JDK 25 that ships with current Android Studio. Install it with `brew install openjdk@21`, then set **Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK** to that JDK. For command-line builds, export `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`.

`npm run build:native` sets `NATIVE_BUILD=1` (see `src/lib/native.ts`), which builds into `dist-native/` instead of `dist/`. It adds the tab bar and section list pages and drops the website menu. `prepare-native.mjs` then removes website-only pieces: the service worker and its registration script (the app already has its files on the device), the Cloudflare analytics beacon, `CNAME`, and sitemaps. The website build (`npm run build`) has none of these changes. The home page's install card also hides itself when `window.Capacitor` is present.

Every page is served from `some/path/index.html` at the URL `some/path/`. By default, Capacitor serves the root `index.html` for any URL without a file extension, so custom native routers map these URLs to their pages instead: `ios/App/App/FieldGuideViewController.swift` (set as the scene root in `SceneDelegate.swift`) and `android/app/src/main/java/com/wastewaterfieldguide/app/FieldGuideWebViewClient.java`.

Keep the `@capacitor/*` packages on the same version.

## License

Free for operators, students, utilities, and the public. Not available for commercial resale or repackaging into a paid product.

| | License |
|---|---|
| Content — prose, examples, reference and safety text, data tables, wiki | [CC BY-NC-SA 4.0](LICENSE-CONTENT.md) |
| Software — calculator logic, components, styles, build config | [PolyForm Noncommercial 1.0.0](LICENSE-CODE.md) |

Using it at your plant, your district, or your training program is expressly permitted — including at for-profit utilities and tuition-charging schools. See [LICENSE](LICENSE) for the full terms and the author's clarifications, and [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) for upstream components, which remain under their own licenses.

Formulas, constants, and regulatory limits are facts and are not claimed.
