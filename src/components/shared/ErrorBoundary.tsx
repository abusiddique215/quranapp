import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

/**
 * Comprehensive Error Boundary Component
 * 
 * Provides error catching, user-friendly error messages, and retry functionality
 * for React components. Handles both JavaScript errors and render errors.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.children !== this.props.children && resetOnPropsChange) {
      this.resetErrorBoundary();
    }

    if (hasError && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      if (resetKeys.some((resetKey, idx) => prevResetKeys[idx] !== resetKey)) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState({
        retryCount: retryCount + 1,
      });

      // Auto-reset after a short delay
      this.resetTimeoutId = setTimeout(() => {
        this.resetErrorBoundary();
      }, 100);
    }
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, maxRetries = 3 } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <LinearGradient
            colors={['#fff5f5', '#fed7d7']}
            style={styles.gradient}
          >
            <View style={styles.content}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.message}>
                {error.message || 'An unexpected error occurred'}
              </Text>
              
              {retryCount < maxRetries ? (
                <Pressable
                  style={styles.retryButton}
                  onPress={this.handleRetry}
                >
                  <Text style={styles.buttonText}>
                    Try Again {retryCount > 0 && `(${maxRetries - retryCount} left)`}
                  </Text>
                </Pressable>
              ) : (
                <Text style={styles.maxRetriesText}>
                  Maximum retry attempts reached. Please restart the app.
                </Text>
              )}
              
              {__DEV__ && (
                <View style={styles.debugInfo}>
                  <Text style={styles.debugTitle}>Debug Info:</Text>
                  <Text style={styles.debugText}>{error.stack}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>
      );
    }

    return children;
  }
}

/**
 * Hook-based Error Boundary for functional components
 */
export function withErrorBoundary<P extends {}>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * API Error Boundary specifically for handling API failures
 */
interface ApiErrorBoundaryProps extends ErrorBoundaryProps {
  networkErrorFallback?: ReactNode;
  apiErrorFallback?: ReactNode;
}

export function ApiErrorBoundary({ 
  children, 
  networkErrorFallback,
  apiErrorFallback,
  ...props 
}: ApiErrorBoundaryProps) {
  const customFallback = (error: Error, retry: () => void) => {
    const isNetworkError = error.message.includes('Network') || 
                          error.message.includes('fetch') ||
                          error.message.includes('timeout');
    
    if (isNetworkError && networkErrorFallback) {
      return (
        <View style={styles.container}>
          {networkErrorFallback}
          <Pressable style={styles.retryButton} onPress={retry}>
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    
    if (apiErrorFallback) {
      return (
        <View style={styles.container}>
          {apiErrorFallback}
          <Pressable style={styles.retryButton} onPress={retry}>
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    // Fall back to default error UI
    return null;
  };

  return (
    <ErrorBoundary {...props} fallback={customFallback}>
      {children}
    </ErrorBoundary>
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
    maxWidth: 300,
    paddingHorizontal: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e53e3e',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#e53e3e',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  maxRetriesText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
  debugInfo: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    maxWidth: '100%',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  debugText: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
  },
});