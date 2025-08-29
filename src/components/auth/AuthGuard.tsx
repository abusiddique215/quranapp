import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ENV } from '@/lib/config/env';
import { IslamicButton } from '@/components/shared/IslamicButton';
import { useTheme } from '@/theme/theme';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Hook to check if authentication is available
export function useAuthAvailability() {
  const publishableKey = ENV.clerkPublishableKey;
  const hasValidClerkKey = publishableKey && 
    publishableKey !== 'pk_test_placeholder' && 
    publishableKey.startsWith('pk_');
  
  return {
    isAuthAvailable: hasValidClerkKey,
    isGuestOnly: !hasValidClerkKey
  };
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { isAuthAvailable } = useAuthAvailability();

  // If authentication is not available, show guest-only message
  if (!isAuthAvailable) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.messageCard, { 
          backgroundColor: colors.cardWarm,
          borderColor: colors.paperBorder 
        }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            🕌 Guest Mode
          </Text>
          
          <Text style={[styles.message, { color: colors.textMuted }]}>
            Authentication is not configured for this app. You can continue reading the Quran as a guest.
          </Text>
          
          <Text style={[styles.note, { color: colors.textMuted }]}>
            Reading progress and bookmarks will not be saved across sessions.
          </Text>
          
          <IslamicButton
            title="Continue Reading"
            onPress={() => router.push('/read')}
            variant="primary"
            size="lg"
          />
          
          <IslamicButton
            title="Back to Home"
            onPress={() => router.push('/')}
            variant="secondary"
            size="md"
          />
        </View>
      </View>
    );
  }

  // Authentication is available, render protected content
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 400,
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  note: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
});