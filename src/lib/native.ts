// True while building the bundle for the Capacitor apps (`npm run build:native`).
// The website build leaves app-only pages and chrome out entirely.
export const isNativeBuild = process.env.NATIVE_BUILD === "1";
