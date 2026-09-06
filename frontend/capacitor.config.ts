import type { CapacitorConfig } from "@capacitor/cli";

// Android app identity. Change appId before a real Play Store release —
// it must be globally unique and, once published, can never change.
const config: CapacitorConfig = {
  appId: "com.trapshift.app",
  appName: "TrapShift",
  webDir: "dist/public",
  backgroundColor: "#020814",
  android: {
    backgroundColor: "#020814",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#020814",
      showSpinner: false,
      androidSplashResourceName: "splash",
    },
  },
};

export default config;
