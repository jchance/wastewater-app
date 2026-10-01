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

The repository is private, but the published site is public.

## License

MIT. See [LICENSE](LICENSE).
