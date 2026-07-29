import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "studio.superbrain.app",
  appName: "超脑 Studio",
  webDir: "mobile-dist",
  server: {
    url: "https://superbrain-studio.cn/",
    cleartext: false,
    allowNavigation: [
      "superbrain-studio.cn",
      "*.superbrain-studio.cn",
      "api.superbrain-studio.cn",
      "cdn.superbrain-studio.cn",
    ],
  },
  ios: {
    scheme: "SuperbrainStudio",
    allowsLinkPreview: true,
    scrollEnabled: true,
    contentInset: "always",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0F172A",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
    },
  },
};

export default config;
