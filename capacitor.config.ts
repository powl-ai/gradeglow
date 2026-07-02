const env = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env;

const config = {
  appId: "app.gradeglow.mobile",
  appName: "GradeGlow",
  webDir: "out",
  bundledWebRuntime: false,
  ios: {
    contentInset: "automatic",
    scrollEnabled: false,
  },
  android: {
    backgroundColor: "#fbf7ff",
    allowMixedContent: false,
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      backgroundColor: "#fbf7ff",
      showSpinner: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
    },
    Keyboard: {
      resize: "body",
      style: "light",
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#fbf7ff",
      overlaysWebView: false,
    },
  },
  server: env?.CAPACITOR_SERVER_URL
    ? {
        url: env.CAPACITOR_SERVER_URL,
        cleartext: false,
      }
    : undefined,
};

export default config;
