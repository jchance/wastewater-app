// True while building the bundle for the Capacitor apps (`npm run build:native`).
// The website build leaves app-only pages and chrome out entirely.
export const isNativeBuild = process.env.NATIVE_BUILD === "1";

// Keep in step with MARKETING_VERSION (ios/App/App.xcodeproj) and versionName
// (android/app/build.gradle).
export const appVersion = "1.0";
