// Use modern API with sync open for Expo SDK >= 51
import { Platform } from 'react-native';

// Import web storage functions
import {
  initializeWebStorage,
  addWebBookmark,
  removeWebBookmark,
  listWebBookmarks,
  saveWebResume,
  getWebResume
} from './webStorage';

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
    dbPromise = openDatabaseAsync('quran.db');
  }
  return dbPromise;
}

export async function initializeDatabase(): Promise<void> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    console.log('Using web storage for data persistence');
    await initializeWebStorage();
    return;
  }
  
  const db = await getDb();
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ayah_key TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS resume_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      ayah_key TEXT
    );`
  );
}

export async function addBookmark(ayahKey: string): Promise<void> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    await addWebBookmark(ayahKey);
    return;
  }
  const db = await getDb();
  await db.runAsync('INSERT OR IGNORE INTO bookmarks (ayah_key) VALUES (?)', [ayahKey]);
}

export async function removeBookmark(ayahKey: string): Promise<void> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    await removeWebBookmark(ayahKey);
    return;
  }
  const db = await getDb();
  await db.runAsync('DELETE FROM bookmarks WHERE ayah_key = ?', [ayahKey]);
}

export async function listBookmarks(): Promise<string[]> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    return await listWebBookmarks();
  }
  const db = await getDb();
  const rows = await db.getAllAsync(
    'SELECT ayah_key FROM bookmarks ORDER BY id DESC'
  );
  return rows.map((r) => r.ayah_key);
}

export async function saveResume(ayahKey: string): Promise<void> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    await saveWebResume(ayahKey);
    return;
  }
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO resume_state (id, ayah_key) VALUES (1, ?)', [ayahKey]);
}

export async function getResume(): Promise<string | null> {
  if (Platform.OS === 'web' || !openDatabaseAsync) {
    return await getWebResume();
  }
  const db = await getDb();
  const row = await db.getFirstAsync(
    'SELECT ayah_key FROM resume_state WHERE id = 1'
  );
  return row?.ayah_key ?? null;
}
