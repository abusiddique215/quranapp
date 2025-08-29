/**
 * Unified Storage Interface
 * Provides a clean, type-safe interface for all storage operations
 * Automatically handles platform differences (SQLite vs Web Storage)
 * Comprehensive API for Quran reading app database operations
 */

import { Platform } from 'react-native';
import {
  // Core database operations
  initializeDatabase,
  getDatabaseInfo,
  
  // User management
  createUser,
  getUserByClerkId,
  updateUser,
  
  // Reading progress
  saveReadingProgress,
  getReadingProgress,
  getReadingStats,
  
  // Reading sessions
  startReadingSession,
  endReadingSession,
  getReadingSessions,
  
  // Enhanced bookmarks
  addBookmark,
  removeBookmark,
  listBookmarks,
  updateBookmarkNote,
  
  // User preferences
  getUserPreferences,
  saveUserPreferences,
  
  // Legacy compatibility
  addLegacyBookmark,
  removeLegacyBookmark,
  listLegacyBookmarks,
  saveResume,
  getResume,
  
  // Utilities
  clearUserData
} from './sqlite';

import { 
  isBookmarked,
  getStorageInfo,
  getWebStorageUsage,
  clearWebStorage
} from './webStorage';

import {
  User,
  ReadingProgress,
  ReadingSession,
  Bookmark,
  UserPreferences,
  ReadingProgressStats,
  PaginationOptions,
  QueryResult,
  DatabaseError,
  ValidationError
} from './models';

// =============================================================================
// CORE EXPORTS - Main Database Operations
// =============================================================================

// Database initialization and info
export {
  initializeDatabase as initStorage,
  getDatabaseInfo
};

// User management
export {
  createUser,
  getUserByClerkId,
  updateUser
};

// Reading progress and sessions
export {
  saveReadingProgress,
  getReadingProgress,
  getReadingStats,
  startReadingSession,
  endReadingSession,
  getReadingSessions
};

// Enhanced bookmarks
export {
  addBookmark,
  removeBookmark,
  listBookmarks,
  updateBookmarkNote
};

// User preferences
export {
  getUserPreferences,
  saveUserPreferences
};

// Legacy compatibility
export {
  addLegacyBookmark,
  removeLegacyBookmark,
  listLegacyBookmarks,
  saveResume,
  getResume
};

// Utilities
export {
  clearUserData
};

// Types and models
export type {
  User,
  ReadingProgress,
  ReadingSession,
  Bookmark,
  UserPreferences,
  ReadingProgressStats,
  PaginationOptions,
  QueryResult
};

// Errors
export {
  DatabaseError,
  ValidationError
};

// =============================================================================
// ENHANCED UTILITY FUNCTIONS
// =============================================================================

/**
 * Initialize database with user setup
 * Creates a new user if clerk_user_id is provided and user doesn't exist
 */
export async function initStorageWithUser(
  clerkUserId?: string,
  userEmail?: string,
  userName?: string
): Promise<{ user: User | null; isNewUser: boolean }> {
  await initializeDatabase();
  
  if (!clerkUserId) {
    return { user: null, isNewUser: false };
  }
  
  try {
    // Try to get existing user
    let user = await getUserByClerkId(clerkUserId);
    
    if (user) {
      return { user, isNewUser: false };
    }
    
    // Create new user if email and name provided
    if (userEmail && userName) {
      const result = await createUser({
        clerk_user_id: clerkUserId,
        email: userEmail,
        name: userName
      });
      
      return { user: result.data, isNewUser: true };
    }
    
    return { user: null, isNewUser: false };
  } catch (error) {
    console.error('Error initializing storage with user:', error);
    return { user: null, isNewUser: false };
  }
}

/**
 * Check if an ayah is bookmarked for a specific user
 * More efficient than fetching all bookmarks just to check one
 */
export async function isAyahBookmarked(userId: number, ayahKey: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return isBookmarked(ayahKey);
  }
  
  try {
    const bookmarks = await listBookmarks(userId, { limit: 1000 });
    return bookmarks.some(b => b.ayah_key === ayahKey);
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
}

/**
 * Toggle bookmark status for an ayah
 * Returns the new bookmark state
 */
export async function toggleBookmark(
  userId: number,
  ayahKey: string,
  note?: string
): Promise<boolean> {
  try {
    const isCurrentlyBookmarked = await isAyahBookmarked(userId, ayahKey);
    
    if (isCurrentlyBookmarked) {
      await removeBookmark(userId, ayahKey);
      return false;
    } else {
      await addBookmark(userId, ayahKey, note);
      return true;
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    throw error;
  }
}

/**
 * Legacy toggle function for backward compatibility
 */
export async function toggleLegacyBookmark(ayahKey: string): Promise<boolean> {
  return toggleBookmark(1, ayahKey); // Use default user ID 1
}

/**
 * Get comprehensive storage statistics
 */
export async function getStorageStats(userId?: number): Promise<{
  platform: string;
  database: {
    version?: number;
    initialized?: string;
  };
  user: {
    bookmarksCount: number;
    readingProgressCount: number;
    hasResumeState: boolean;
    hasPreferences: boolean;
  };
  legacy: {
    legacyBookmarksCount: number;
  };
}> {
  try {
    if (Platform.OS === 'web') {
      const webUsage = getWebStorageUsage();
      const legacyInfo = getStorageInfo();
      
      return {
        platform: 'web',
        database: {
          version: 1,
          initialized: 'localStorage'
        },
        user: {
          bookmarksCount: userId ? (await listBookmarks(userId)).length : webUsage.bookmarks,
          readingProgressCount: webUsage.readingProgress,
          hasResumeState: webUsage.hasResume,
          hasPreferences: webUsage.preferences > 0
        },
        legacy: {
          legacyBookmarksCount: legacyInfo.bookmarks
        }
      };
    }
    
    // For native platforms
    const dbInfo = await getDatabaseInfo();
    let userStats = {
      bookmarksCount: 0,
      readingProgressCount: 0,
      hasResumeState: false,
      hasPreferences: false
    };
    
    if (userId) {
      const [bookmarks, progress, prefs] = await Promise.all([
        listBookmarks(userId, { limit: 1000 }),
        getReadingProgress(userId, { limit: 1000 }),
        getUserPreferences(userId)
      ]);
      
      userStats = {
        bookmarksCount: bookmarks.length,
        readingProgressCount: progress.length,
        hasResumeState: false, // Would need to check resume table
        hasPreferences: !!prefs
      };
    }
    
    const resumeState = await getResume();
    const legacyBookmarks = await listLegacyBookmarks();
    
    return {
      platform: Platform.OS,
      database: {
        version: dbInfo?.version,
        initialized: dbInfo?.initialized_at
      },
      user: {
        ...userStats,
        hasResumeState: !!resumeState
      },
      legacy: {
        legacyBookmarksCount: legacyBookmarks.length
      }
    };
    
  } catch (error) {
    console.error('Error getting storage stats:', error);
    throw error;
  }
}

/**
 * Clear all storage data
 * Use with caution - this will remove all data for specified user or all data
 */
export async function clearAllData(userId?: number): Promise<void> {
  if (Platform.OS === 'web') {
    await clearWebStorage();
    return;
  }
  
  try {
    if (userId) {
      // Clear specific user's data
      await clearUserData(userId);
    } else {
      // Legacy: clear all data by removing legacy bookmarks and resume state
      const legacyBookmarks = await listLegacyBookmarks();
      for (const ayahKey of legacyBookmarks) {
        await removeLegacyBookmark(ayahKey);
      }
      await saveResume(''); // Clear resume state
    }
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
}

/**
 * Migrate legacy bookmarks to user-based bookmarks
 * Useful for upgrading existing installations
 */
export async function migrateLegacyBookmarks(userId: number): Promise<{
  migrated: number;
  errors: number;
}> {
  try {
    const legacyBookmarks = await listLegacyBookmarks();
    let migrated = 0;
    let errors = 0;
    
    for (const ayahKey of legacyBookmarks) {
      try {
        await addBookmark(userId, ayahKey, 'Migrated from legacy storage');
        migrated++;
      } catch (error) {
        console.error(`Failed to migrate bookmark ${ayahKey}:`, error);
        errors++;
      }
    }
    
    return { migrated, errors };
  } catch (error) {
    console.error('Error migrating legacy bookmarks:', error);
    throw error;
  }
}

/**
 * Validate ayah key format
 * Ensures ayah keys follow expected format (e.g., "1:1", "2:255")
 */
export function isValidAyahKey(ayahKey: string): boolean {
  const ayahKeyRegex = /^\d+:\d+$/;
  if (!ayahKeyRegex.test(ayahKey)) {
    return false;
  }
  
  const [surah, ayah] = ayahKey.split(':').map(Number);
  
  // Basic validation - Quran has 114 surahs
  if (surah < 1 || surah > 114) {
    return false;
  }
  
  // Basic ayah validation (most surahs have fewer than 300 ayahs)
  if (ayah < 1 || ayah > 286) {
    return false;
  }
  
  return true;
}

/**
 * Parse ayah key into surah and ayah numbers
 */
export function parseAyahKey(ayahKey: string): { surahNumber: number; ayahNumber: number } {
  if (!isValidAyahKey(ayahKey)) {
    throw new ValidationError('Invalid ayah key format. Expected format: "surah:ayah"', 'ayahKey');
  }
  
  const [surah, ayah] = ayahKey.split(':').map(Number);
  return { surahNumber: surah, ayahNumber: ayah };
}

/**
 * Format ayah key from surah and ayah numbers
 */
export function formatAyahKey(surahNumber: number, ayahNumber: number): string {
  return `${surahNumber}:${ayahNumber}`;
}

/**
 * Export user data for backup purposes
 * Returns serializable object with all user data
 */
export async function exportUserData(userId: number): Promise<{
  user: User | null;
  bookmarks: Bookmark[];
  readingProgress: ReadingProgress[];
  preferences: UserPreferences | null;
  readingStats: ReadingProgressStats;
  resumeState: string | null;
  exportDate: string;
  platform: string;
  legacy: {
    bookmarks: string[];
  };
}> {
  try {
    const [user, bookmarks, progress, preferences, stats, resumeState, legacyBookmarks] = await Promise.all([
      getUserByClerkId(`user_${userId}`).catch(() => null),
      listBookmarks(userId, { limit: 1000 }),
      getReadingProgress(userId, { limit: 1000 }),
      getUserPreferences(userId),
      getReadingStats(userId),
      getResume(),
      listLegacyBookmarks()
    ]);
    
    return {
      user,
      bookmarks,
      readingProgress: progress,
      preferences,
      readingStats: stats,
      resumeState,
      exportDate: new Date().toISOString(),
      platform: Platform.OS,
      legacy: {
        bookmarks: legacyBookmarks
      }
    };
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw error;
  }
}

/**
 * Import user data from backup
 * Merges imported data with existing data (handles duplicates)
 */
export async function importUserData(
  userId: number,
  data: {
    bookmarks?: Bookmark[];
    readingProgress?: ReadingProgress[];
    preferences?: UserPreferences;
    resumeState?: string | null;
    legacy?: {
      bookmarks?: string[];
    };
  }
): Promise<{
  imported: {
    bookmarks: number;
    readingProgress: number;
    preferences: boolean;
    resumeState: boolean;
    legacyBookmarks: number;
  };
  errors: string[];
}> {
  const imported = {
    bookmarks: 0,
    readingProgress: 0,
    preferences: false,
    resumeState: false,
    legacyBookmarks: 0
  };
  const errors: string[] = [];
  
  try {
    // Import bookmarks
    if (data.bookmarks && Array.isArray(data.bookmarks)) {
      for (const bookmark of data.bookmarks) {
        try {
          if (isValidAyahKey(bookmark.ayah_key)) {
            await addBookmark(userId, bookmark.ayah_key, bookmark.note);
            imported.bookmarks++;
          }
        } catch (error) {
          errors.push(`Failed to import bookmark ${bookmark.ayah_key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
    
    // Import reading progress
    if (data.readingProgress && Array.isArray(data.readingProgress)) {
      for (const progress of data.readingProgress) {
        try {
          const ayahKey = formatAyahKey(progress.surah_number, progress.ayah_number);
          await saveReadingProgress(userId, ayahKey, progress.session_duration);
          imported.readingProgress++;
        } catch (error) {
          errors.push(`Failed to import reading progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
    
    // Import preferences
    if (data.preferences) {
      try {
        await saveUserPreferences(userId, data.preferences);
        imported.preferences = true;
      } catch (error) {
        errors.push(`Failed to import preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Import resume state
    if (data.resumeState && isValidAyahKey(data.resumeState)) {
      try {
        await saveResume(data.resumeState, userId);
        imported.resumeState = true;
      } catch (error) {
        errors.push(`Failed to import resume state: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Import legacy bookmarks
    if (data.legacy?.bookmarks && Array.isArray(data.legacy.bookmarks)) {
      for (const ayahKey of data.legacy.bookmarks) {
        try {
          if (isValidAyahKey(ayahKey)) {
            await addBookmark(userId, ayahKey, 'Imported from legacy backup');
            imported.legacyBookmarks++;
          }
        } catch (error) {
          errors.push(`Failed to import legacy bookmark ${ayahKey}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
    
    return { imported, errors };
  } catch (error) {
    console.error('Error importing user data:', error);
    throw error;
  }
}