/**
 * SQLite Database Implementation for Quran Reading App
 * Comprehensive offline-first database with user management, reading progress, and preferences
 */

import { Platform } from 'react-native';
import {
  User,
  ReadingProgress,
  ReadingSession,
  Bookmark,
  UserPreferences,
  DatabaseMetadata,
  QueryResult,
  PaginationOptions,
  ReadingProgressStats,
  DatabaseError,
  ValidationError,
  TransactionCallback
} from './models';

// Import web storage functions
import {
  initializeWebStorage,
  addWebBookmark,
  removeWebBookmark,
  listWebBookmarks,
  saveWebResume,
  getWebResume,
  // New web storage functions
  saveWebUserData,
  getWebUserData,
  saveWebReadingProgress,
  getWebReadingProgress,
  saveWebUserPreferences,
  getWebUserPreferences
} from './webStorage';

// Constants
const DATABASE_NAME = 'quran_reading.db';
const DATABASE_VERSION = 1;

// Conditional import - only load on native platforms
let openDatabaseAsync: any = null;

// Type for SQLite database (fallback to any for web compatibility)
type DatabaseType = any;

if (Platform.OS !== 'web') {
  try {
    const sqlite = require('expo-sqlite');
    openDatabaseAsync = sqlite.openDatabaseAsync;
  } catch {
    console.warn('SQLite not available on this platform');
  }
}

let dbPromise: Promise<DatabaseType> | null = null;
async function getDb(): Promise<DatabaseType> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync(DATABASE_NAME);
  }
  return dbPromise;
}

// Helper function to execute transaction
async function executeTransaction<T>(callback: TransactionCallback<T>): Promise<T> {
  const db = await getDb();
  try {
    await db.execAsync('BEGIN TRANSACTION');
    const result = await callback(db);
    await db.execAsync('COMMIT');
    return result;
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw new DatabaseError(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Validation helpers
function validateAyahKey(ayahKey: string): void {
  const ayahKeyRegex = /^\d+:\d+$/;
  if (!ayahKeyRegex.test(ayahKey)) {
    throw new ValidationError('Invalid ayah key format. Expected format: "surah:ayah"', 'ayahKey');
  }
}

function parseAyahKey(ayahKey: string): { surahNumber: number; ayahNumber: number } {
  validateAyahKey(ayahKey);
  const [surah, ayah] = ayahKey.split(':').map(Number);
  return { surahNumber: surah, ayahNumber: ayah };
}

function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export async function initializeDatabase(): Promise<void> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    console.log('Using web storage for data persistence');
    await initializeWebStorage();
    return;
  }
  
  try {
    const db = await getDb();
    
    // Create all tables in a single transaction
    await db.execAsync(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clerk_user_id TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      
      -- Reading progress table
      CREATE TABLE IF NOT EXISTS reading_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        surah_number INTEGER NOT NULL,
        ayah_number INTEGER NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        session_duration INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, surah_number, ayah_number)
      );
      
      -- Reading sessions table
      CREATE TABLE IF NOT EXISTS reading_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        surahs_read TEXT NOT NULL DEFAULT '[]',
        ayahs_read INTEGER NOT NULL DEFAULT 0,
        total_duration INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
      
      -- Enhanced bookmarks table
      CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        surah_number INTEGER NOT NULL,
        ayah_number INTEGER NOT NULL,
        ayah_key TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, ayah_key)
      );
      
      -- User preferences table
      CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        font_size INTEGER NOT NULL DEFAULT 16,
        show_translation INTEGER NOT NULL DEFAULT 1,
        show_transliteration INTEGER NOT NULL DEFAULT 1,
        theme TEXT NOT NULL DEFAULT 'auto',
        language TEXT NOT NULL DEFAULT 'en',
        audio_reciter TEXT NOT NULL DEFAULT 'mishary',
        auto_scroll INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
      
      -- Resume state table (legacy compatibility)
      CREATE TABLE IF NOT EXISTS resume_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        ayah_key TEXT,
        user_id INTEGER,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
      );
      
      -- Database metadata table
      CREATE TABLE IF NOT EXISTS database_metadata (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        version INTEGER NOT NULL DEFAULT 1,
        initialized_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_migration INTEGER NOT NULL DEFAULT 0
      );
      
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_reading_progress_user_timestamp ON reading_progress(user_id, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_start ON reading_sessions(user_id, start_time DESC);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created ON bookmarks(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_ayah_key ON bookmarks(ayah_key);
      
      -- Insert metadata if not exists
      INSERT OR IGNORE INTO database_metadata (id, version) VALUES (1, ${DATABASE_VERSION});
    `);
    
    console.log('SQLite database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw new DatabaseError(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// USER MANAGEMENT
// =============================================================================

export async function createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<QueryResult<User>> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    const user: User = {
      ...userData,
      id: Date.now(), // Simple ID for web
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp()
    };
    await saveWebUserData(user);
    return { data: user, rowsAffected: 1 };
  }

  try {
    return await executeTransaction(async (db) => {
      const result = await db.runAsync(
        'INSERT INTO users (clerk_user_id, email, name) VALUES (?, ?, ?)',
        [userData.clerk_user_id, userData.email, userData.name]
      );
      
      const user = await db.getFirstAsync(
        'SELECT * FROM users WHERE id = ?',
        [result.lastInsertRowId]
      ) as User;
      
      return { data: user, rowsAffected: result.changes };
    });
  } catch (error) {
    throw new DatabaseError(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getUserByClerkId(clerkUserId: string): Promise<User | null> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    return await getWebUserData(clerkUserId);
  }

  try {
    const db = await getDb();
    const user = await db.getFirstAsync(
      'SELECT * FROM users WHERE clerk_user_id = ?',
      [clerkUserId]
    ) as User | null;
    
    return user;
  } catch (error) {
    throw new DatabaseError(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateUser(userId: number, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<QueryResult<User>> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    // Web implementation would need to be added to webStorage.ts
    throw new DatabaseError('User updates not supported on web platform yet');
  }

  try {
    return await executeTransaction(async (db) => {
      const updatedAt = getCurrentTimestamp();
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updates), updatedAt, userId];
      
      const result = await db.runAsync(
        `UPDATE users SET ${setClause}, updated_at = ? WHERE id = ?`,
        values
      );
      
      const user = await db.getFirstAsync(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      ) as User;
      
      return { data: user, rowsAffected: result.changes };
    });
  } catch (error) {
    throw new DatabaseError(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// READING PROGRESS
// =============================================================================

export async function saveReadingProgress(
  userId: number,
  ayahKey: string,
  sessionDuration: number = 0
): Promise<QueryResult<ReadingProgress>> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    const progress: ReadingProgress = {
      user_id: userId,
      ...parseAyahKey(ayahKey),
      timestamp: getCurrentTimestamp(),
      session_duration: sessionDuration,
      created_at: getCurrentTimestamp()
    };
    await saveWebReadingProgress(progress);
    return { data: progress, rowsAffected: 1 };
  }

  try {
    const { surahNumber, ayahNumber } = parseAyahKey(ayahKey);
    
    return await executeTransaction(async (db) => {
      const timestamp = getCurrentTimestamp();
      
      const result = await db.runAsync(`
        INSERT OR REPLACE INTO reading_progress 
        (user_id, surah_number, ayah_number, timestamp, session_duration) 
        VALUES (?, ?, ?, ?, ?)
      `, [userId, surahNumber, ayahNumber, timestamp, sessionDuration]);
      
      const progress = await db.getFirstAsync(
        'SELECT * FROM reading_progress WHERE user_id = ? AND surah_number = ? AND ayah_number = ?',
        [userId, surahNumber, ayahNumber]
      ) as ReadingProgress;
      
      return { data: progress, rowsAffected: result.changes };
    });
  } catch (error) {
    throw new DatabaseError(`Failed to save reading progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getReadingProgress(
  userId: number,
  options: PaginationOptions = {}
): Promise<ReadingProgress[]> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    return await getWebReadingProgress(userId, options);
  }

  try {
    const db = await getDb();
    const { limit = 50, offset = 0, orderBy = 'timestamp', orderDirection = 'DESC' } = options;
    
    const rows = await db.getAllAsync(`
      SELECT * FROM reading_progress 
      WHERE user_id = ? 
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);
    
    return rows as ReadingProgress[];
  } catch (error) {
    throw new DatabaseError(`Failed to get reading progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getReadingStats(userId: number): Promise<ReadingProgressStats> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    // Simplified stats for web - would need full implementation in webStorage.ts
    const progress = await getWebReadingProgress(userId, { limit: 1000 });
    return {
      total_ayahs_read: progress.length,
      total_sessions: 0,
      total_reading_time: progress.reduce((sum, p) => sum + p.session_duration, 0),
      longest_session: Math.max(...progress.map(p => p.session_duration), 0),
      current_streak: 0,
      surahs_completed: [],
      last_read_ayah: progress[0] ? `${progress[0].surah_number}:${progress[0].ayah_number}` : '1:1'
    };
  }

  try {
    const db = await getDb();
    
    // Get comprehensive stats in a single complex query
    const stats = await db.getFirstAsync(`
      WITH progress_stats AS (
        SELECT 
          COUNT(*) as total_ayahs_read,
          SUM(session_duration) as total_reading_time,
          MAX(session_duration) as longest_session,
          MAX(timestamp) as last_reading_timestamp
        FROM reading_progress 
        WHERE user_id = ?
      ),
      session_stats AS (
        SELECT COUNT(*) as total_sessions
        FROM reading_sessions
        WHERE user_id = ? AND end_time IS NOT NULL
      ),
      last_ayah AS (
        SELECT surah_number, ayah_number
        FROM reading_progress
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
      )
      SELECT 
        COALESCE(p.total_ayahs_read, 0) as total_ayahs_read,
        COALESCE(s.total_sessions, 0) as total_sessions,
        COALESCE(p.total_reading_time, 0) as total_reading_time,
        COALESCE(p.longest_session, 0) as longest_session,
        COALESCE(l.surah_number || ':' || l.ayah_number, '1:1') as last_read_ayah
      FROM progress_stats p
      CROSS JOIN session_stats s
      LEFT JOIN last_ayah l ON 1=1
    `, [userId, userId, userId]);
    
    // Get completed surahs (simplified - assuming 286 ayahs max per surah)
    const completedSurahs = await db.getAllAsync(`
      SELECT surah_number, COUNT(*) as ayah_count
      FROM reading_progress 
      WHERE user_id = ?
      GROUP BY surah_number
      HAVING COUNT(*) >= 7  -- Minimum threshold for "completion"
      ORDER BY surah_number
    `, [userId]);
    
    return {
      total_ayahs_read: stats.total_ayahs_read,
      total_sessions: stats.total_sessions,
      total_reading_time: stats.total_reading_time,
      longest_session: stats.longest_session,
      current_streak: 0, // Would need date-based calculation
      surahs_completed: completedSurahs.map((s: any) => s.surah_number),
      last_read_ayah: stats.last_read_ayah
    };
  } catch (error) {
    throw new DatabaseError(`Failed to get reading stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// READING SESSIONS
// =============================================================================

export async function startReadingSession(userId: number): Promise<QueryResult<ReadingSession>> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    // Simple web implementation
    const session: ReadingSession = {
      id: Date.now(),
      user_id: userId,
      start_time: getCurrentTimestamp(),
      surahs_read: '[]',
      ayahs_read: 0,
      total_duration: 0,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp()
    };
    return { data: session, rowsAffected: 1 };
  }

  try {
    return await executeTransaction(async (db) => {
      const startTime = getCurrentTimestamp();
      
      const result = await db.runAsync(
        'INSERT INTO reading_sessions (user_id, start_time) VALUES (?, ?)',
        [userId, startTime]
      );
      
      const session = await db.getFirstAsync(
        'SELECT * FROM reading_sessions WHERE id = ?',
        [result.lastInsertRowId]
      ) as ReadingSession;
      
      return { data: session, rowsAffected: result.changes };
    });
  } catch (error) {
    throw new DatabaseError(`Failed to start reading session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function endReadingSession(
  sessionId: number,
  surahsRead: number[],
  ayahsRead: number
): Promise<QueryResult<ReadingSession>> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    // Simple web implementation - would need proper storage
    throw new DatabaseError('Reading sessions not fully supported on web platform yet');
  }

  try {
    return await executeTransaction(async (db) => {
      const endTime = getCurrentTimestamp();
      
      // Calculate duration
      const session = await db.getFirstAsync(
        'SELECT start_time FROM reading_sessions WHERE id = ?',
        [sessionId]
      );
      
      if (!session) {
        throw new DatabaseError('Reading session not found');
      }
      
      const startTime = new Date(session.start_time);
      const duration = Math.floor((new Date(endTime).getTime() - startTime.getTime()) / 1000);
      
      const result = await db.runAsync(`
        UPDATE reading_sessions 
        SET end_time = ?, surahs_read = ?, ayahs_read = ?, total_duration = ?, updated_at = ?
        WHERE id = ?
      `, [endTime, JSON.stringify(surahsRead), ayahsRead, duration, endTime, sessionId]);
      
      const updatedSession = await db.getFirstAsync(
        'SELECT * FROM reading_sessions WHERE id = ?',
        [sessionId]
      ) as ReadingSession;
      
      return { data: updatedSession, rowsAffected: result.changes };
    });
  } catch (error) {
    throw new DatabaseError(`Failed to end reading session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getReadingSessions(
  userId: number,
  options: PaginationOptions = {}
): Promise<ReadingSession[]> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    // Simple web fallback
    return [];
  }

  try {
    const db = await getDb();
    const { limit = 20, offset = 0, orderBy = 'start_time', orderDirection = 'DESC' } = options;
    
    const rows = await db.getAllAsync(`
      SELECT * FROM reading_sessions 
      WHERE user_id = ? AND end_time IS NOT NULL
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);
    
    return rows as ReadingSession[];
  } catch (error) {
    throw new DatabaseError(`Failed to get reading sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// BOOKMARKS (Enhanced)
// =============================================================================

export async function addBookmark(
  userId: number,
  ayahKey: string,
  note?: string
): Promise<QueryResult<Bookmark>> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    await addWebBookmark(ayahKey);
    const bookmark: Bookmark = {
      id: Date.now(),
      user_id: userId,
      ...parseAyahKey(ayahKey),
      ayah_key: ayahKey,
      note,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp()
    };
    return { data: bookmark, rowsAffected: 1 };
  }

  try {
    const { surahNumber, ayahNumber } = parseAyahKey(ayahKey);
    
    return await executeTransaction(async (db) => {
      const result = await db.runAsync(`
        INSERT OR REPLACE INTO bookmarks 
        (user_id, surah_number, ayah_number, ayah_key, note) 
        VALUES (?, ?, ?, ?, ?)
      `, [userId, surahNumber, ayahNumber, ayahKey, note]);
      
      const bookmark = await db.getFirstAsync(
        'SELECT * FROM bookmarks WHERE user_id = ? AND ayah_key = ?',
        [userId, ayahKey]
      ) as Bookmark;
      
      return { data: bookmark, rowsAffected: result.changes };
    });
  } catch (error) {
    throw new DatabaseError(`Failed to add bookmark: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function removeBookmark(userId: number, ayahKey: string): Promise<QueryResult<boolean>> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    await removeWebBookmark(ayahKey);
    return { data: true, rowsAffected: 1 };
  }

  try {
    const db = await getDb();
    const result = await db.runAsync(
      'DELETE FROM bookmarks WHERE user_id = ? AND ayah_key = ?',
      [userId, ayahKey]
    );
    
    return { data: result.changes > 0, rowsAffected: result.changes };
  } catch (error) {
    throw new DatabaseError(`Failed to remove bookmark: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function listBookmarks(
  userId: number,
  options: PaginationOptions = {}
): Promise<Bookmark[]> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    const bookmarkKeys = await listWebBookmarks();
    return bookmarkKeys.map((ayahKey, index) => ({
      id: index + 1,
      user_id: userId,
      ...parseAyahKey(ayahKey),
      ayah_key: ayahKey,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp()
    }));
  }

  try {
    const db = await getDb();
    const { limit = 50, offset = 0, orderBy = 'created_at', orderDirection = 'DESC' } = options;
    
    const rows = await db.getAllAsync(`
      SELECT * FROM bookmarks 
      WHERE user_id = ?
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);
    
    return rows as Bookmark[];
  } catch (error) {
    throw new DatabaseError(`Failed to list bookmarks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateBookmarkNote(
  userId: number,
  ayahKey: string,
  note: string
): Promise<QueryResult<Bookmark>> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    throw new DatabaseError('Bookmark notes not supported on web platform yet');
  }

  try {
    return await executeTransaction(async (db) => {
      const updatedAt = getCurrentTimestamp();
      
      const result = await db.runAsync(
        'UPDATE bookmarks SET note = ?, updated_at = ? WHERE user_id = ? AND ayah_key = ?',
        [note, updatedAt, userId, ayahKey]
      );
      
      const bookmark = await db.getFirstAsync(
        'SELECT * FROM bookmarks WHERE user_id = ? AND ayah_key = ?',
        [userId, ayahKey]
      ) as Bookmark;
      
      return { data: bookmark, rowsAffected: result.changes };
    });
  } catch (error) {
    throw new DatabaseError(`Failed to update bookmark note: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// USER PREFERENCES
// =============================================================================

export async function getUserPreferences(userId: number): Promise<UserPreferences | null> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    return await getWebUserPreferences(userId);
  }

  try {
    const db = await getDb();
    const prefs = await db.getFirstAsync(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId]
    ) as UserPreferences | null;
    
    return prefs;
  } catch (error) {
    throw new DatabaseError(`Failed to get user preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function saveUserPreferences(
  userId: number,
  preferences: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<QueryResult<UserPreferences>> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    const prefs: UserPreferences = {
      id: userId,
      user_id: userId,
      ...preferences,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp()
    };
    await saveWebUserPreferences(prefs);
    return { data: prefs, rowsAffected: 1 };
  }

  try {
    return await executeTransaction(async (db) => {
      const updatedAt = getCurrentTimestamp();
      
      const result = await db.runAsync(`
        INSERT OR REPLACE INTO user_preferences 
        (user_id, font_size, show_translation, show_transliteration, theme, 
         language, audio_reciter, auto_scroll, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        preferences.font_size,
        preferences.show_translation ? 1 : 0,
        preferences.show_transliteration ? 1 : 0,
        preferences.theme,
        preferences.language,
        preferences.audio_reciter,
        preferences.auto_scroll ? 1 : 0,
        updatedAt
      ]);
      
      const savedPrefs = await db.getFirstAsync(
        'SELECT * FROM user_preferences WHERE user_id = ?',
        [userId]
      ) as UserPreferences;
      
      // Convert INTEGER back to boolean
      savedPrefs.show_translation = !!savedPrefs.show_translation;
      savedPrefs.show_transliteration = !!savedPrefs.show_transliteration;
      savedPrefs.auto_scroll = !!savedPrefs.auto_scroll;
      
      return { data: savedPrefs, rowsAffected: result.changes };
    });
  } catch (error) {
    throw new DatabaseError(`Failed to save user preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// LEGACY COMPATIBILITY (Resume State)
// =============================================================================

export async function saveResume(ayahKey: string, userId?: number): Promise<void> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    await saveWebResume(ayahKey);
    return;
  }
  
  try {
    const db = await getDb();
    const updatedAt = getCurrentTimestamp();
    await db.runAsync(
      'INSERT OR REPLACE INTO resume_state (id, ayah_key, user_id, updated_at) VALUES (1, ?, ?, ?)',
      [ayahKey, userId || null, updatedAt]
    );
  } catch (error) {
    throw new DatabaseError(`Failed to save resume state: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getResume(): Promise<string | null> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    return await getWebResume();
  }
  
  try {
    const db = await getDb();
    const row = await db.getFirstAsync(
      'SELECT ayah_key FROM resume_state WHERE id = 1'
    );
    return row?.ayah_key ?? null;
  } catch (error) {
    throw new DatabaseError(`Failed to get resume state: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// LEGACY COMPATIBILITY (Simple Bookmarks)
// =============================================================================

// For backward compatibility - defaults to user ID 1 or guest user
export async function addLegacyBookmark(ayahKey: string): Promise<void> {
  const result = await addBookmark(1, ayahKey);
  return;
}

export async function removeLegacyBookmark(ayahKey: string): Promise<void> {
  const result = await removeBookmark(1, ayahKey);
  return;
}

export async function listLegacyBookmarks(): Promise<string[]> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    return await listWebBookmarks();
  }
  
  const bookmarks = await listBookmarks(1);
  return bookmarks.map(b => b.ayah_key);
}

// =============================================================================
// DATABASE UTILITIES
// =============================================================================

export async function getDatabaseInfo(): Promise<DatabaseMetadata | null> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    return {
      version: DATABASE_VERSION,
      initialized_at: getCurrentTimestamp(),
      last_migration: 0
    };
  }

  try {
    const db = await getDb();
    const metadata = await db.getFirstAsync(
      'SELECT * FROM database_metadata WHERE id = 1'
    ) as DatabaseMetadata | null;
    
    return metadata;
  } catch (error) {
    console.warn('Failed to get database info:', error);
    return null;
  }
}

export async function clearUserData(userId: number): Promise<QueryResult<boolean>> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    throw new DatabaseError('Clear user data not supported on web platform yet');
  }

  try {
    return await executeTransaction(async (db) => {
      let totalChanges = 0;
      
      // Delete in correct order due to foreign key constraints
      const tables = ['reading_progress', 'reading_sessions', 'bookmarks', 'user_preferences'];
      
      for (const table of tables) {
        const result = await db.runAsync(`DELETE FROM ${table} WHERE user_id = ?`, [userId]);
        totalChanges += result.changes;
      }
      
      // Finally delete the user
      const userResult = await db.runAsync('DELETE FROM users WHERE id = ?', [userId]);
      totalChanges += userResult.changes;
      
      return { data: totalChanges > 0, rowsAffected: totalChanges };
    });
  } catch (error) {
    throw new DatabaseError(`Failed to clear user data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
