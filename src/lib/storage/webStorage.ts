/**
 * Web Storage Implementation
 * Provides SQLite-compatible API using localStorage for web platform
 * Extended to support all database entities with offline-first functionality
 */

import {
  User,
  ReadingProgress,
  ReadingSession,
  Bookmark,
  UserPreferences,
  PaginationOptions
} from './models';

const STORAGE_KEYS = {
  BOOKMARKS: 'quran_bookmarks',
  RESUME_STATE: 'quran_resume_state',
  USERS: 'quran_users',
  READING_PROGRESS: 'quran_reading_progress',
  READING_SESSIONS: 'quran_reading_sessions',
  USER_PREFERENCES: 'quran_user_preferences',
  DATABASE_METADATA: 'quran_db_metadata'
} as const;

/**
 * Initialize web storage (localStorage)
 * Creates necessary storage structure if it doesn't exist
 */
export async function initializeWebStorage(): Promise<void> {
  try {
    // Initialize all storage keys
    const storageDefaults = {
      [STORAGE_KEYS.BOOKMARKS]: [],
      [STORAGE_KEYS.RESUME_STATE]: null,
      [STORAGE_KEYS.USERS]: [],
      [STORAGE_KEYS.READING_PROGRESS]: [],
      [STORAGE_KEYS.READING_SESSIONS]: [],
      [STORAGE_KEYS.USER_PREFERENCES]: [],
      [STORAGE_KEYS.DATABASE_METADATA]: {
        version: 1,
        initialized_at: new Date().toISOString(),
        last_migration: 0
      }
    };
    
    // Initialize each key if it doesn't exist
    Object.entries(storageDefaults).forEach(([key, defaultValue]) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
      }
    });
    
    console.log('Web storage initialized successfully');
  } catch (error) {
    console.error('Failed to initialize web storage:', error);
    throw new Error('Web storage initialization failed');
  }
}

/**
 * Add a bookmark to storage
 */
export async function addWebBookmark(ayahKey: string): Promise<void> {
  try {
    const bookmarks = getWebBookmarks();
    
    // Only add if not already bookmarked
    if (!bookmarks.includes(ayahKey)) {
      bookmarks.unshift(ayahKey); // Add to beginning for recent-first ordering
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    }
  } catch (error) {
    console.error('Failed to add bookmark:', error);
    throw new Error('Failed to add bookmark');
  }
}

/**
 * Remove a bookmark from storage
 */
export async function removeWebBookmark(ayahKey: string): Promise<void> {
  try {
    const bookmarks = getWebBookmarks();
    const filteredBookmarks = bookmarks.filter(key => key !== ayahKey);
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(filteredBookmarks));
  } catch (error) {
    console.error('Failed to remove bookmark:', error);
    throw new Error('Failed to remove bookmark');
  }
}

/**
 * Get all bookmarks from storage
 */
export async function listWebBookmarks(): Promise<string[]> {
  try {
    return getWebBookmarks();
  } catch (error) {
    console.error('Failed to list bookmarks:', error);
    return [];
  }
}

/**
 * Save resume state to storage
 */
export async function saveWebResume(ayahKey: string): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEYS.RESUME_STATE, JSON.stringify(ayahKey));
  } catch (error) {
    console.error('Failed to save resume state:', error);
    throw new Error('Failed to save resume state');
  }
}

/**
 * Get resume state from storage
 */
export async function getWebResume(): Promise<string | null> {
  try {
    const resumeState = localStorage.getItem(STORAGE_KEYS.RESUME_STATE);
    return resumeState ? JSON.parse(resumeState) : null;
  } catch (error) {
    console.error('Failed to get resume state:', error);
    return null;
  }
}

/**
 * Clear all web storage data
 */
export async function clearWebStorage(): Promise<void> {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('Web storage cleared successfully');
  } catch (error) {
    console.error('Failed to clear web storage:', error);
    throw new Error('Failed to clear web storage');
  }
}

/**
 * Check if bookmark exists
 */
export function isBookmarked(ayahKey: string): boolean {
  try {
    const bookmarks = getWebBookmarks();
    return bookmarks.includes(ayahKey);
  } catch (error) {
    console.error('Failed to check bookmark status:', error);
    return false;
  }
}

/**
 * Get storage size information
 */
export function getStorageInfo(): { bookmarks: number; hasResume: boolean } {
  try {
    const bookmarks = getWebBookmarks();
    const resumeState = localStorage.getItem(STORAGE_KEYS.RESUME_STATE);
    
    return {
      bookmarks: bookmarks.length,
      hasResume: !!resumeState && resumeState !== 'null'
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return { bookmarks: 0, hasResume: false };
  }
}

/**
 * Internal helper to get bookmarks array
 */
function getWebBookmarks(): string[] {
  try {
    const bookmarksJson = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return bookmarksJson ? JSON.parse(bookmarksJson) : [];
  } catch (error) {
    console.error('Failed to parse bookmarks from storage:', error);
    return [];
  }
}

// =============================================================================
// USER MANAGEMENT - WEB STORAGE
// =============================================================================

export async function saveWebUserData(user: User): Promise<void> {
  try {
    const users = getWebStorageArray<User>(STORAGE_KEYS.USERS);
    const existingIndex = users.findIndex(u => u.clerk_user_id === user.clerk_user_id);
    
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...user, updated_at: new Date().toISOString() };
    } else {
      users.push(user);
    }
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save user data:', error);
    throw new Error('Failed to save user data');
  }
}

export async function getWebUserData(clerkUserId: string): Promise<User | null> {
  try {
    const users = getWebStorageArray<User>(STORAGE_KEYS.USERS);
    return users.find(u => u.clerk_user_id === clerkUserId) || null;
  } catch (error) {
    console.error('Failed to get user data:', error);
    return null;
  }
}

// =============================================================================
// READING PROGRESS - WEB STORAGE
// =============================================================================

export async function saveWebReadingProgress(progress: ReadingProgress): Promise<void> {
  try {
    const allProgress = getWebStorageArray<ReadingProgress>(STORAGE_KEYS.READING_PROGRESS);
    const existingIndex = allProgress.findIndex(
      p => p.user_id === progress.user_id && 
           p.surah_number === progress.surah_number && 
           p.ayah_number === progress.ayah_number
    );
    
    if (existingIndex >= 0) {
      allProgress[existingIndex] = progress;
    } else {
      allProgress.push(progress);
    }
    
    localStorage.setItem(STORAGE_KEYS.READING_PROGRESS, JSON.stringify(allProgress));
  } catch (error) {
    console.error('Failed to save reading progress:', error);
    throw new Error('Failed to save reading progress');
  }
}

export async function getWebReadingProgress(
  userId: number,
  options: PaginationOptions = {}
): Promise<ReadingProgress[]> {
  try {
    const allProgress = getWebStorageArray<ReadingProgress>(STORAGE_KEYS.READING_PROGRESS);
    let userProgress = allProgress.filter(p => p.user_id === userId);
    
    // Apply sorting
    const { orderBy = 'timestamp', orderDirection = 'DESC' } = options;
    userProgress.sort((a: any, b: any) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return orderDirection === 'DESC' ? -comparison : comparison;
    });
    
    // Apply pagination
    const { limit = 50, offset = 0 } = options;
    return userProgress.slice(offset, offset + limit);
  } catch (error) {
    console.error('Failed to get reading progress:', error);
    return [];
  }
}

// =============================================================================
// USER PREFERENCES - WEB STORAGE
// =============================================================================

export async function saveWebUserPreferences(preferences: UserPreferences): Promise<void> {
  try {
    const allPrefs = getWebStorageArray<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES);
    const existingIndex = allPrefs.findIndex(p => p.user_id === preferences.user_id);
    
    if (existingIndex >= 0) {
      allPrefs[existingIndex] = { ...allPrefs[existingIndex], ...preferences, updated_at: new Date().toISOString() };
    } else {
      allPrefs.push(preferences);
    }
    
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(allPrefs));
  } catch (error) {
    console.error('Failed to save user preferences:', error);
    throw new Error('Failed to save user preferences');
  }
}

export async function getWebUserPreferences(userId: number): Promise<UserPreferences | null> {
  try {
    const allPrefs = getWebStorageArray<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES);
    return allPrefs.find(p => p.user_id === userId) || null;
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    return null;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generic helper to get array from localStorage
 */
function getWebStorageArray<T>(key: string): T[] {
  try {
    const jsonData = localStorage.getItem(key);
    return jsonData ? JSON.parse(jsonData) : [];
  } catch (error) {
    console.error(`Failed to parse ${key} from storage:`, error);
    return [];
  }
}

/**
 * Generic helper to save array to localStorage
 */
function setWebStorageArray<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${key} to storage:`, error);
    throw new Error(`Failed to save ${key} to storage`);
  }
}

/**
 * Get web storage usage information
 */
export function getWebStorageUsage(): {
  users: number;
  bookmarks: number;
  readingProgress: number;
  preferences: number;
  hasResume: boolean;
} {
  try {
    return {
      users: getWebStorageArray<User>(STORAGE_KEYS.USERS).length,
      bookmarks: getWebBookmarks().length,
      readingProgress: getWebStorageArray<ReadingProgress>(STORAGE_KEYS.READING_PROGRESS).length,
      preferences: getWebStorageArray<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES).length,
      hasResume: !!localStorage.getItem(STORAGE_KEYS.RESUME_STATE) && localStorage.getItem(STORAGE_KEYS.RESUME_STATE) !== 'null'
    };
  } catch (error) {
    console.error('Failed to get web storage usage:', error);
    return { users: 0, bookmarks: 0, readingProgress: 0, preferences: 0, hasResume: false };
  }
}