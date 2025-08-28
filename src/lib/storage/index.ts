/**
 * Unified Storage Interface
 * Provides a clean, type-safe interface for all storage operations
 * Automatically handles platform differences (SQLite vs Web Storage)
 */

import { Platform } from 'react-native';
import { 
  initializeDatabase,
  addBookmark,
  removeBookmark,
  listBookmarks,
  saveResume,
  getResume
} from './sqlite';
import { 
  isBookmarked,
  getStorageInfo,
  clearWebStorage
} from './webStorage';

// Re-export core storage functions with consistent naming
export {
  initializeDatabase as initStorage,
  addBookmark,
  removeBookmark,
  listBookmarks,
  saveResume,
  getResume
};

/**
 * Check if an ayah is bookmarked
 * More efficient than fetching all bookmarks just to check one
 */
export async function isAyahBookmarked(ayahKey: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return isBookmarked(ayahKey);
  }
  
  // For native platforms, check SQLite
  const bookmarks = await listBookmarks();
  return bookmarks.includes(ayahKey);
}

/**
 * Toggle bookmark status for an ayah
 * Returns the new bookmark state
 */
export async function toggleBookmark(ayahKey: string): Promise<boolean> {
  const isCurrentlyBookmarked = await isAyahBookmarked(ayahKey);
  
  if (isCurrentlyBookmarked) {
    await removeBookmark(ayahKey);
    return false;
  } else {
    await addBookmark(ayahKey);
    return true;
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  bookmarksCount: number;
  hasResumeState: boolean;
  platform: string;
}> {
  if (Platform.OS === 'web') {
    const info = getStorageInfo();
    return {
      bookmarksCount: info.bookmarks,
      hasResumeState: info.hasResume,
      platform: 'web'
    };
  }
  
  // For native platforms
  const bookmarks = await listBookmarks();
  const resumeState = await getResume();
  
  return {
    bookmarksCount: bookmarks.length,
    hasResumeState: !!resumeState,
    platform: Platform.OS
  };
}

/**
 * Clear all storage data
 * Use with caution - this will remove all bookmarks and resume state
 */
export async function clearAllData(): Promise<void> {
  if (Platform.OS === 'web') {
    await clearWebStorage();
    return;
  }
  
  // For native platforms, clear by removing all bookmarks and resume state
  const bookmarks = await listBookmarks();
  for (const ayahKey of bookmarks) {
    await removeBookmark(ayahKey);
  }
  await saveResume(''); // Clear resume state by setting empty string
}

/**
 * Validate ayah key format
 * Ensures ayah keys follow expected format (e.g., "1:1", "2:255")
 */
export function isValidAyahKey(ayahKey: string): boolean {
  const ayahKeyRegex = /^\d+:\d+$/;
  return ayahKeyRegex.test(ayahKey);
}

/**
 * Export storage data for backup purposes
 * Returns serializable object with all user data
 */
export async function exportUserData(): Promise<{
  bookmarks: string[];
  resumeState: string | null;
  exportDate: string;
  platform: string;
}> {
  const bookmarks = await listBookmarks();
  const resumeState = await getResume();
  
  return {
    bookmarks,
    resumeState,
    exportDate: new Date().toISOString(),
    platform: Platform.OS
  };
}

/**
 * Import storage data from backup
 * Merges imported bookmarks with existing ones (no duplicates)
 */
export async function importUserData(data: {
  bookmarks?: string[];
  resumeState?: string | null;
}): Promise<void> {
  // Import bookmarks
  if (data.bookmarks && Array.isArray(data.bookmarks)) {
    for (const ayahKey of data.bookmarks) {
      if (isValidAyahKey(ayahKey)) {
        // addBookmark handles duplicates automatically
        await addBookmark(ayahKey);
      }
    }
  }
  
  // Import resume state
  if (data.resumeState && isValidAyahKey(data.resumeState)) {
    await saveResume(data.resumeState);
  }
}