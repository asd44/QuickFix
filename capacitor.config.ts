import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quickfix.app',
  appName: 'QuickFix',
  webDir: 'out',
  bundledWebRuntime: false,
  // server: {
  //   url: 'http://10.0.2.2:3000', // Use this only for local dev with live reload
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 300,
      backgroundColor: "#FF5722",
      showSpinner: false
    }
  }
};

export default config;
