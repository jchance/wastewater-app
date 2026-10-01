import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.wastewaterfieldguide.app",
  appName: "Wastewater Field Guide",
  // Produced by `npm run build:native`; see scripts/prepare-native.mjs.
  webDir: "dist-native",
  ios: {
    // Keep the site's fixed header below the status bar and notch.
    contentInset: "always",
  },
};

export default config;
