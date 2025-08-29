import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ENV } from '@/lib/config/env';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * AuthGuard component that prevents access to auth screens when Clerk is not configured
 * 
 * This component ensures that screens using Clerk hooks (useSignIn, useSignUp, etc.) 
 * are only rendered when ClerkProvider is available. When Clerk is not configured,
 * it shows a fallback message instead of attempting to render components that would
 * crash due to missing Clerk context.
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter();
  const publishableKey = ENV.clerkPublishableKey;
  
  // Check if we have a valid Clerk publishable key
  const hasValidClerkKey = publishableKey && 
    publishableKey !== 'pk_test_placeholder' && 
    publishableKey.startsWith('pk_');

  // If Clerk is not configured, show fallback or default message
  if (!hasValidClerkKey) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#f8f9fa', '#e9ecef']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Authentication Unavailable</Text>
            <Text style={styles.subtitle}>
              Sign-in functionality is not configured for this app.
            </Text>
            <Text style={styles.description}>
              You can continue using the app as a guest to access all reading features.
            </Text>
            
            <Pressable
              style={styles.continueButton}
              onPress={() => router.replace('/')}
            >
              <Text style={styles.buttonText}>Continue as Guest</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Clerk is configured, render the protected content
  return <>{children}</>;
}

/**
 * Hook to check if authentication features are available
 * 
 * @returns Object with authentication availability status
 */
export function useAuthAvailability() {
  const publishableKey = ENV.clerkPublishableKey;
  
  const hasValidClerkKey = publishableKey && 
    publishableKey !== 'pk_test_placeholder' && 
    publishableKey.startsWith('pk_');

  return {
    isAuthAvailable: hasValidClerkKey,
    publishableKey,
  };
}

/**
 * Loading component for auth screens
 */
export function AuthLoading() {
  return (
    <View style={[styles.container, styles.centered]}>
      <ActivityIndicator size="large" color="#2e7d32" />
      <Text style={styles.loadingText}>Loading authentication...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  continueButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});