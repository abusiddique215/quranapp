import { Stack } from 'expo-router';
import React from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ThemeProvider } from '@/theme/theme';
import { ENV } from '@/lib/config/env';

// iOS Simulator-safe token cache implementation
const createTokenCache = () => {
  // Check if we're running on iOS Simulator
  const isIOSSimulator = Platform.OS === 'ios' && !Platform.isPad && Platform.isTV === false;
  
  if (isIOSSimulator) {
    // Use in-memory cache for iOS Simulator to avoid SecureStore issues
    const memoryCache: { [key: string]: string } = {};
    
    return {
      async getToken(key: string) {
        try {
          return memoryCache[key] || null;
        } catch (err) {
          return null;
        }
      },
      async saveToken(key: string, value: string) {
        try {
          memoryCache[key] = value;
        } catch (err) {
          // noop
        }
      },
    };
  }
  
  // Use SecureStore for physical devices and Android
  return {
    async getToken(key: string) {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (err) {
        console.warn('SecureStore error:', err);
        return null;
      }
    },
    async saveToken(key: string, value: string) {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (err) {
        console.warn('SecureStore error:', err);
      }
    },
  };
};

export default function RootLayout() {
  const publishableKey = ENV.clerkPublishableKey || 'pk_test_placeholder';

  // Note: DB initialization deferred until first screen that needs it
  
  // Skip Clerk provider if no valid key (development mode)
  const AppContent = (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="read/index" />
        <Stack.Screen name="auth/sign-in" />
      </Stack>
    </ThemeProvider>
  );

  // Only wrap with Clerk if we have a real key (not placeholder)
  if (publishableKey && publishableKey !== 'pk_test_placeholder') {
    const tokenCache = createTokenCache();
    
    return (
      <ClerkProvider 
        publishableKey={publishableKey} 
        tokenCache={tokenCache as any}
      >
        {AppContent}
      </ClerkProvider>
    );
  }

  return AppContent;
}
