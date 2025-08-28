import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Quran App',
  slug: 'quran-app-fixed',
  scheme: 'quranapp',
  version: '0.2.0',
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
    bundleIdentifier: 'com.quranapp.fixed',
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
      projectId: '00000000-0000-0000-0000-000000000000' 
    },
  },
});