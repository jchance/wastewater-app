# Wastewater Field Guide

A responsive, static reference site for wastewater and water-treatment operator math. Built with Astro and the [MIT-licensed DocKit theme](https://github.com/themefisher/dockit-astro), on top of Astro Starlight.

## Local development

Use Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

Astro prints the local URL when the development server starts (normally `http://localhost:4321`).

## Useful commands

```sh
npm run check
npm run build
npm run preview
```

Knowledge pages live in `src/content/docs/`. The navigation structure is configured in `src/config/sidebar.json`.

The first reference page, **The Davidson pie chart**, explains how to calculate chemical feed rate, dose, and flow from the three operator-math slides.
