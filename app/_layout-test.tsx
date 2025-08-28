import { Stack } from 'expo-router';
import React from 'react';
import { ThemeProvider } from '@/theme/theme';

// TEMPORARY TEST LAYOUT - No Clerk Provider
// This will test if the crash is caused by ClerkProvider + expo-secure-store

export default function RootLayoutTest() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="read/index" />
        <Stack.Screen name="auth/sign-in" />
      </Stack>
    </ThemeProvider>
  );
}