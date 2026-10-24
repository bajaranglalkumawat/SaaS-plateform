import type { CapacitorConfig } from '@capacitor/cli';

/**
 * BillFlow Android shell.
 * Production: set CAPACITOR_SERVER_URL to your live Next.js URL (e.g. https://app.billflow.in)
 * Local test: leave as http://10.0.2.2:3000 (Android emulator → host machine localhost)
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://10.0.2.2:3000';

const config: CapacitorConfig = {
  appId: 'com.billflow.saas',
  appName: 'BillFlow',
  webDir: 'android-www',
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://'),
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#020617',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#020617',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#020617',
    },
  },
};

export default config;
