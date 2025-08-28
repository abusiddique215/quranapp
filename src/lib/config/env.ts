import Constants from 'expo-constants';

type Extra = {
  clerkPublishableKey?: string;
  apiBaseUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const ENV = {
  clerkPublishableKey: extra.clerkPublishableKey || process.env.CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder',
  apiBaseUrl: extra.apiBaseUrl || process.env.API_BASE_URL || 'https://api.quran.com/api/v4',
};
