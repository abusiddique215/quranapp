import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Quran Reader',
  slug: 'quran-reader-app',
  scheme: 'quranapp',
  version: '1.0.0',
  sdkVersion: '53.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.abusiddique.quranreader',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#f7f8f3',
      foregroundImage: './assets/adaptive-icon.png',
    },
    package: 'com.quranapp.fixed',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png'
  },
  plugins: [
    'expo-router',
    'expo-secure-store'
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder',
    apiBaseUrl: process.env.API_BASE_URL || 'https://api.quran.com/api/v4',
    router: {
      origin: false,
    },
    eas: {
      projectId: 'fd47a706-db4f-4e1a-9328-78fbaf662022'
    },
  },
});