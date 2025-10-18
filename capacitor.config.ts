import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: process.env.CAPACITOR_APP_ID || 'com.echoverse.platform',
  appName: process.env.CAPACITOR_APP_NAME || 'EchoVerse',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: process.env.CAPACITOR_HOSTNAME || 'localhost',
    url: process.env.CAPACITOR_SERVER_URL || process.env.PRODUCTION_URL || undefined
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3B82F6',
      showSpinner: false
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  },
  // iOS specific configuration
  ios: {
    contentInset: 'always',
    scheme: 'EchoVerse'
  },
  // Android specific configuration
  android: {
    buildOptions: {
      keystorePath: process.env.ANDROID_KEYSTORE_PATH,
      keystorePassword: process.env.ANDROID_KEYSTORE_PASSWORD,
      keystoreAlias: process.env.ANDROID_KEY_ALIAS,
      keystoreAliasPassword: process.env.ANDROID_KEY_PASSWORD,
      releaseType: 'APK'
    }
  }
};

export default config;
