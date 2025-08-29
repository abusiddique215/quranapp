import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { User, UserPreferences } from '../storage/models';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  hasValidSession: boolean;
  user: any; // Clerk user object
  
  // Database sync
  dbUser: User | null;
  preferences: UserPreferences | null;
  syncError: string | null;
  
  // Error states
  networkError: boolean;
  apiError: string | null;
  criticalError: string | null;
  retryCount: number;
  
  // Actions
  syncUserToDatabase: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  refreshUserData: () => Promise<void>;
  retrySync: () => Promise<void>;
  clearErrors: () => void;
  
  // Guest mode
  isGuestMode: boolean;
  enableGuestMode: () => void;
  disableGuestMode: () => void;
  
  // Connection status
  isOnline: boolean;
  hasClerkAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Network status hook
function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // For now, assume online. In a real app, you'd use NetInfo
    // import { NetInfo } from '@react-native-async-storage/async-storage';
    setIsOnline(true);
  }, []);

  return isOnline;
}

// Guest-only auth state for when Clerk is not available
function createGuestAuthState(): AuthContextType {
  const isOnline = useNetworkStatus();
  const [errorState, setErrorState] = useState({
    networkError: false,
    apiError: null,
    criticalError: null,
    retryCount: 0,
  });

  return {
    // Authentication state
    isAuthenticated: false,
    isLoading: false,
    hasValidSession: true, // Always allow guest access
    user: null,
    
    // Database sync
    dbUser: null,
    preferences: null,
    syncError: null,
    
    // Error states
    networkError: errorState.networkError,
    apiError: errorState.apiError,
    criticalError: errorState.criticalError,
    retryCount: errorState.retryCount,
    
    // Actions
    syncUserToDatabase: async () => {},
    updatePreferences: async () => {},
    refreshUserData: async () => {},
    retrySync: async () => {
      setErrorState(prev => ({ 
        ...prev, 
        retryCount: prev.retryCount + 1,
        networkError: false,
        apiError: null 
      }));
    },
    clearErrors: () => {
      setErrorState({
        networkError: false,
        apiError: null,
        criticalError: null,
        retryCount: 0,
      });
    },
    
    // Guest mode (always enabled when Clerk unavailable)
    isGuestMode: true,
    enableGuestMode: () => {},
    disableGuestMode: () => {},
    
    // Connection status
    isOnline,
    hasClerkAuth: false,
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('AuthProvider error:', error, errorInfo);
      }}
      fallback={(error, retry) => (
        <GuestAuthProvider>
          {children}
        </GuestAuthProvider>
      )}
    >
      <AuthProviderInner>{children}</AuthProviderInner>
    </ErrorBoundary>
  );
}

function AuthProviderInner({ children }: AuthProviderProps) {
  const { useAuthState } = require('../hooks/useAuthSync');
  const authState = useAuthState();

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

// Guest-only provider for when Clerk is not configured
export function GuestAuthProvider({ children }: AuthProviderProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('GuestAuthProvider error:', error, errorInfo);
      }}
    >
      <GuestAuthProviderInner>{children}</GuestAuthProviderInner>
    </ErrorBoundary>
  );
}

function GuestAuthProviderInner({ children }: AuthProviderProps) {
  const authState = createGuestAuthState();

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for checking specific auth states
export function useAuthStatus() {
  const auth = useAuth();
  
  return {
    isSignedIn: auth.isAuthenticated,
    isGuest: auth.isGuestMode,
    isLoading: auth.isLoading,
    needsAuth: !auth.hasValidSession,
    canReadWithSync: auth.isAuthenticated,
    canReadAsGuest: auth.isGuestMode || !auth.hasValidSession,
    
    // Error states
    hasErrors: !!(auth.networkError || auth.apiError || auth.criticalError),
    networkError: auth.networkError,
    apiError: auth.apiError,
    criticalError: auth.criticalError,
    retryCount: auth.retryCount,
    
    // Status indicators
    isOnline: auth.isOnline,
    hasClerkAuth: auth.hasClerkAuth,
    
    // Actions
    retry: auth.retrySync,
    clearErrors: auth.clearErrors,
  };
}

// Hook for user data
export function useUserData() {
  const auth = useAuth();
  
  return {
    clerkUser: auth.user,
    dbUser: auth.dbUser,
    preferences: auth.preferences,
    updatePreferences: auth.updatePreferences,
    refreshUserData: auth.refreshUserData,
    syncError: auth.syncError,
  };
}

// Hook for reading progress (requires authentication)
export function useReadingData() {
  const auth = useAuth();
  
  if (!auth.isAuthenticated || !auth.dbUser) {
    return {
      userId: null,
      canSaveProgress: false,
      canAccessBookmarks: false,
      canSyncAcrossDevices: false,
    };
  }
  
  return {
    userId: auth.dbUser.id,
    canSaveProgress: true,
    canAccessBookmarks: true,
    canSyncAcrossDevices: true,
  };
}