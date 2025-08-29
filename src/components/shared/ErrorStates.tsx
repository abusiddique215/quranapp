import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/theme';

interface BaseErrorProps {
  onRetry?: () => void;
  retryText?: string;
  isRetrying?: boolean;
}

interface NetworkErrorProps extends BaseErrorProps {
  title?: string;
  message?: string;
}

interface ApiErrorProps extends BaseErrorProps {
  service?: string;
  fallbackMessage?: string;
}

interface LoadingErrorProps extends BaseErrorProps {
  resource?: string;
  timeout?: boolean;
}

/**
 * Network Error Component
 * Shows when there are network connectivity issues
 */
export function NetworkError({ 
  title = "No Internet Connection",
  message = "Please check your internet connection and try again.",
  onRetry,
  retryText = "Try Again",
  isRetrying = false,
}: NetworkErrorProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.surface || '#f8f9fa']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.networkIcon}>📡</Text>
          <Text style={[styles.title, { color: colors.error || '#e53e3e' }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: colors.text }]}>
            {message}
          </Text>
          
          {onRetry && (
            <Pressable
              style={[styles.retryButton, { backgroundColor: colors.primary || '#2e7d32' }]}
              onPress={onRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>{retryText}</Text>
              )}
            </Pressable>
          )}
          
          <Text style={[styles.helpText, { color: colors.textSecondary || '#666' }]}>
            • Check your WiFi or mobile data connection{'\n'}
            • Try moving to a different location{'\n'}
            • Contact your internet service provider
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

/**
 * API Error Component
 * Shows when API services are unavailable
 */
export function ApiError({
  service = "service",
  fallbackMessage = "The service is temporarily unavailable. Using cached content when possible.",
  onRetry,
  retryText = "Retry",
  isRetrying = false,
}: ApiErrorProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#fff5f5', '#fed7d7']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.apiIcon}>⚠️</Text>
          <Text style={[styles.title, { color: colors.error || '#e53e3e' }]}>
            {service} Unavailable
          </Text>
          <Text style={[styles.message, { color: colors.text }]}>
            {fallbackMessage}
          </Text>
          
          {onRetry && (
            <Pressable
              style={[styles.retryButton, { backgroundColor: colors.primary || '#2e7d32' }]}
              onPress={onRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>{retryText}</Text>
              )}
            </Pressable>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

/**
 * Loading Timeout Error Component
 * Shows when content takes too long to load
 */
export function LoadingError({
  resource = "content",
  timeout = false,
  onRetry,
  retryText = "Try Again",
  isRetrying = false,
}: LoadingErrorProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.loadingIcon}>⏱️</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          {timeout ? `Loading ${resource} is taking longer than expected` : `Failed to load ${resource}`}
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary || '#666' }]}>
          {timeout 
            ? "This might be due to a slow connection or server issues."
            : "There was an error loading the content."
          }
        </Text>
        
        {onRetry && (
          <Pressable
            style={[styles.retryButton, { backgroundColor: colors.primary || '#2e7d32' }]}
            onPress={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.buttonText}>{retryText}</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

/**
 * Inline Error Banner Component
 * Shows error messages within existing UI
 */
interface ErrorBannerProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
  onDismiss?: () => void;
  onRetry?: () => void;
  persistent?: boolean;
}

export function ErrorBanner({
  message,
  type = 'error',
  onDismiss,
  onRetry,
  persistent = false,
}: ErrorBannerProps) {
  const { colors } = useTheme();
  
  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return '#fed7d7';
      case 'warning':
        return '#ffeaa7';
      case 'info':
        return '#bee3f8';
      default:
        return '#fed7d7';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'error':
        return '#e53e3e';
      case 'warning':
        return '#d69e2e';
      case 'info':
        return '#3182ce';
      default:
        return '#e53e3e';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return '⚠️';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '⚠️';
    }
  };

  return (
    <View style={[styles.banner, { backgroundColor: getBackgroundColor() }]}>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerIcon}>{getIcon()}</Text>
        <Text style={[styles.bannerText, { color: getTextColor(), flex: 1 }]}>
          {message}
        </Text>
        
        {onRetry && (
          <Pressable
            style={[styles.smallButton, { backgroundColor: getTextColor() }]}
            onPress={onRetry}
          >
            <Text style={styles.smallButtonText}>Retry</Text>
          </Pressable>
        )}
        
        {onDismiss && !persistent && (
          <Pressable
            style={styles.dismissButton}
            onPress={onDismiss}
          >
            <Text style={[styles.dismissText, { color: getTextColor() }]}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/**
 * Guest Mode Indicator Component
 * Shows when user is in guest mode
 */
export function GuestModeIndicator() {
  const { colors } = useTheme();

  return (
    <View style={[styles.guestBanner, { backgroundColor: colors.surface || '#f8f9fa' }]}>
      <View style={styles.bannerContent}>
        <Text style={styles.guestIcon}>👤</Text>
        <Text style={[styles.guestText, { color: colors.text }]}>
          Guest Mode - Some features may be limited
        </Text>
      </View>
    </View>
  );
}

/**
 * Offline Indicator Component
 * Shows when app is offline
 */
export function OfflineIndicator() {
  return (
    <View style={[styles.banner, { backgroundColor: '#fed7d7' }]}>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerIcon}>📡</Text>
        <Text style={[styles.bannerText, { color: '#e53e3e', flex: 1 }]}>
          You're offline. Using cached content.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
    paddingHorizontal: 20,
  },
  networkIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  apiIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  helpText: {
    fontSize: 14,
    marginTop: 16,
    textAlign: 'left',
    lineHeight: 20,
  },
  retryButton: {
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginBottom: 16,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  smallButton: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 8,
  },
  smallButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  dismissText: {
    fontSize: 16,
    fontWeight: '600',
  },
  guestBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  guestIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  guestText: {
    fontSize: 12,
    fontWeight: '500',
  },
});