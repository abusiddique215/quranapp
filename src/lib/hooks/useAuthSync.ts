import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { 
  createUser, 
  getUserByClerkId, 
  initializeDatabase,
  getUserPreferences,
  saveUserPreferences 
} from '../storage/sqlite';
import { User, UserPreferences } from '../storage/models';

interface AuthSyncState {
  dbUser: User | null;
  preferences: UserPreferences | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthSyncActions {
  syncUserToDatabase: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

export function useAuthSync(): AuthSyncState & AuthSyncActions {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isSignedIn } = useAuth();
  
  const [state, setState] = useState<AuthSyncState>({
    dbUser: null,
    preferences: null,
    isLoading: true,
    isInitialized: false,
    error: null
  });

  // Initialize database on first load
  useEffect(() => {
    const initDb = async () => {
      try {
        await initializeDatabase();
        setState(prev => ({ ...prev, isInitialized: true }));
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to initialize database',
          isInitialized: true 
        }));
      }
    };

    initDb();
  }, []);

  // Sync user data when authentication state changes
  useEffect(() => {
    const syncUser = async () => {
      if (!isUserLoaded || !state.isInitialized) {
        return;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        if (isSignedIn && user) {
          // User is signed in, sync with database
          await syncUserToDatabase();
        } else {
          // User is not signed in, clear local data
          setState(prev => ({
            ...prev,
            dbUser: null,
            preferences: null,
            isLoading: false
          }));
        }
      } catch (error) {
        console.error('Failed to sync user:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to sync user data',
          isLoading: false 
        }));
      }
    };

    syncUser();
  }, [isSignedIn, user, isUserLoaded, state.isInitialized]);

  const syncUserToDatabase = async (): Promise<void> => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if user exists in database
      let dbUser = await getUserByClerkId(user.id);

      if (!dbUser) {
        // Create new user in database
        const result = await createUser({
          clerk_user_id: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'
        });
        dbUser = result.data;
      }

      // Load user preferences
      const preferences = await getUserPreferences(dbUser.id);

      setState(prev => ({
        ...prev,
        dbUser,
        preferences,
        isLoading: false
      }));

    } catch (error) {
      console.error('Failed to sync user to database:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to sync user data',
        isLoading: false 
      }));
      throw error;
    }
  };

  const updatePreferences = async (prefs: Partial<UserPreferences>): Promise<void> => {
    if (!state.dbUser) {
      throw new Error('User not authenticated');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Merge with existing preferences
      const currentPrefs = state.preferences || {
        font_size: 16,
        show_translation: true,
        show_transliteration: true,
        theme: 'auto' as const,
        language: 'en',
        audio_reciter: 'mishary',
        auto_scroll: true
      };

      const updatedPrefs = {
        ...currentPrefs,
        ...prefs
      };

      // Save to database
      const result = await saveUserPreferences(state.dbUser.id, updatedPrefs);
      
      setState(prev => ({
        ...prev,
        preferences: result.data,
        isLoading: false
      }));

    } catch (error) {
      console.error('Failed to update preferences:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to update preferences',
        isLoading: false 
      }));
      throw error;
    }
  };

  const refreshUserData = async (): Promise<void> => {
    if (!user) return;
    await syncUserToDatabase();
  };

  return {
    ...state,
    syncUserToDatabase,
    updatePreferences,
    refreshUserData
  };
}

// Hook for guest mode functionality
export function useGuestMode() {
  const [isGuestMode, setIsGuestMode] = useState(false);

  const enableGuestMode = () => {
    setIsGuestMode(true);
  };

  const disableGuestMode = () => {
    setIsGuestMode(false);
  };

  return {
    isGuestMode,
    enableGuestMode,
    disableGuestMode
  };
}

// Check if we're running with Clerk authentication
const isClerkAvailable = () => {
  try {
    // This will throw if Clerk is not initialized
    useAuth();
    return true;
  } catch (error) {
    return false;
  }
};

// Main authentication hook that combines Clerk and database sync
export function useAuthState() {
  const guestMode = useGuestMode();
  
  // Check if Clerk is available
  let clerkAuth;
  let clerkUser;
  let authSync;
  
  try {
    clerkAuth = useAuth();
    clerkUser = useUser();
    authSync = useAuthSync();
  } catch (error) {
    // Clerk not available, run in guest-only mode
    console.log('Running in guest-only mode - Clerk not configured');
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
      
      // Actions
      syncUserToDatabase: async () => {},
      updatePreferences: async () => {},
      refreshUserData: async () => {},
      
      // Guest mode (always enabled when Clerk unavailable)
      isGuestMode: true,
      enableGuestMode: () => {},
      disableGuestMode: () => {}
    };
  }

  const isAuthenticated = clerkAuth.isSignedIn && !!clerkUser.user && !!authSync.dbUser;
  const isLoading = !clerkAuth.isLoaded || !clerkUser.isLoaded || authSync.isLoading;
  const hasValidSession = isAuthenticated || guestMode.isGuestMode;

  return {
    // Authentication state
    isAuthenticated,
    isLoading,
    hasValidSession,
    user: clerkUser.user,
    
    // Database sync
    dbUser: authSync.dbUser,
    preferences: authSync.preferences,
    syncError: authSync.error,
    
    // Actions
    syncUserToDatabase: authSync.syncUserToDatabase,
    updatePreferences: authSync.updatePreferences,
    refreshUserData: authSync.refreshUserData,
    
    // Guest mode
    ...guestMode
  };
}