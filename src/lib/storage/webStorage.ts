/**
 * Web Storage Implementation
 * Provides SQLite-compatible API using localStorage for web platform
 */

const STORAGE_KEYS = {
  BOOKMARKS: 'quran_bookmarks',
  RESUME_STATE: 'quran_resume_state'
} as const;

/**
 * Initialize web storage (localStorage)
 * Creates necessary storage structure if it doesn't exist
 */
export async function initializeWebStorage(): Promise<void> {
  try {
    // Initialize bookmarks array if it doesn't exist
    if (!localStorage.getItem(STORAGE_KEYS.BOOKMARKS)) {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify([]));
    }
    
    // Initialize resume state if it doesn't exist
    if (!localStorage.getItem(STORAGE_KEYS.RESUME_STATE)) {
      localStorage.setItem(STORAGE_KEYS.RESUME_STATE, JSON.stringify(null));
    }
    
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
    localStorage.removeItem(STORAGE_KEYS.BOOKMARKS);
    localStorage.removeItem(STORAGE_KEYS.RESUME_STATE);
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