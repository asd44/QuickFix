import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quickfix.app',
  appName: 'QuickFix',
  webDir: '.next', // Not used in server mode
  server: {
    url: 'https://quick-fix-tau.vercel.app', // Your Vercel deployment URL
    cleartext: true,
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FF5722",
      showSpinner: false
    }
  }
};

export default config;
