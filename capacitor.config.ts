import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.wastewaterfieldguide.app",
  appName: "Wastewater Field Guide",
  // Produced by `npm run build:native`; see scripts/prepare-native.mjs.
  webDir: "dist-native",
  ios: {
    // Pages fill the screen edge to edge (viewport-fit=cover) and clear the
    // status bar and home indicator with env(safe-area-inset-*) in CSS.
    // "always" would add the status bar height a second time.
    contentInset: "never",
  },
  plugins: {
    SplashScreen: {
      // Hidden by a script prepare-native.mjs adds to every page once the
      // first page paints; the duration is only a fallback.
      launchShowDuration: 10000,
      launchFadeOutDuration: 200,
    },
  },
};

export default config;
