import { Stack } from 'expo-router';
import React from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ThemeProvider } from '@/theme/theme';
import { ENV } from '@/lib/config/env';
import { AuthProvider, GuestAuthProvider } from '@/lib/contexts/AuthContext';

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
  const publishableKey = ENV.clerkPublishableKey;
  const tokenCache = createTokenCache();
  
  // Check if we have a valid Clerk publishable key
  const hasValidClerkKey = publishableKey && publishableKey !== 'pk_test_placeholder' && publishableKey.startsWith('pk_');
  
  if (hasValidClerkKey) {
    // Full app with authentication
    return (
      <ClerkProvider 
        publishableKey={publishableKey} 
        tokenCache={tokenCache as any}
      >
        <ThemeProvider>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="surahs/index" options={{ title: "Quran Chapters" }} />
              <Stack.Screen name="read/index" />
              <Stack.Screen name="read/[surah]" options={{ title: "Reading" }} />
              <Stack.Screen name="auth/sign-in" />
              <Stack.Screen name="auth/sign-up" />
              <Stack.Screen name="auth/profile" />
            </Stack>
          </AuthProvider>
        </ThemeProvider>
      </ClerkProvider>
    );
  }
  
  // Guest-only mode when Clerk is not configured
  return (
    <ThemeProvider>
      <GuestAuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="surahs/index" options={{ title: "Quran Chapters" }} />
          <Stack.Screen name="read/index" />
          <Stack.Screen name="read/[surah]" options={{ title: "Reading" }} />
        </Stack>
      </GuestAuthProvider>
    </ThemeProvider>
  );
}