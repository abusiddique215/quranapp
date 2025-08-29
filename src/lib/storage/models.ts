/**
 * Database Model Types for Quran Reading App
 * Comprehensive type definitions for SQLite database schema
 */

// Base types for database operations
export interface QueryResult<T> {
  data: T;
  rowsAffected: number;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface TransactionCallback<T> {
  (db: any): Promise<T>;
}

// Custom error types
export class DatabaseError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// User Management Models
export interface User {
  id: number;
  clerk_user_id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ReadingProgress {
  id?: number;
  user_id: number;
  surah_number: number;
  ayah_number: number;
  timestamp: string;
  session_duration: number;
  created_at: string;
}

export interface ReadingSession {
  id: number;
  user_id: number;
  start_time: string;
  end_time?: string;
  surahs_read: string; // JSON array of surah numbers
  ayahs_read: number;
  total_duration: number;
  created_at: string;
  updated_at: string;
}

export interface Bookmark {
  id: number;
  user_id: number;
  surah_number: number;
  ayah_number: number;
  ayah_key: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: number;
  user_id: number;
  font_size: number;
  show_translation: boolean;
  show_transliteration: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  audio_reciter: string;
  auto_scroll: boolean;
  created_at: string;
  updated_at: string;
}

// Statistics and Analytics
export interface ReadingProgressStats {
  total_ayahs_read: number;
  total_sessions: number;
  total_reading_time: number; // in seconds
  longest_session: number; // in seconds
  current_streak: number; // consecutive days
  surahs_completed: number[];
  last_read_ayah: string; // ayah key format
}

// Database metadata
export interface DatabaseMetadata {
  version: number;
  initialized_at: string;
  last_migration: number;
}

// Reading session helpers
export interface SessionData {
  surahsRead: number[];
  ayahsRead: number;
  duration: number;
}

// User creation payload
export type CreateUserData = Omit<User, 'id' | 'created_at' | 'updated_at'>;

// Preference creation payload
export type CreatePreferencesData = Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// Bookmark creation payload
export type CreateBookmarkData = Omit<Bookmark, 'id' | 'created_at' | 'updated_at'>;

// Progress creation payload
export type CreateProgressData = Omit<ReadingProgress, 'id' | 'created_at'>;

// Default user preferences
export const DEFAULT_USER_PREFERENCES: CreatePreferencesData = {
  font_size: 16,
  show_translation: true,
  show_transliteration: true,
  theme: 'auto',
  language: 'en',
  audio_reciter: 'mishary',
  auto_scroll: true,
};

// Utility types for updates
export type UpdateUserData = Partial<Omit<User, 'id' | 'clerk_user_id' | 'created_at'>>;
export type UpdatePreferencesData = Partial<CreatePreferencesData>;
export type UpdateBookmarkData = Partial<Pick<Bookmark, 'note'>>;

// Authentication and guest mode types
export interface AuthUser {
  id: number;
  clerkId: string;
  email: string;
  name: string;
  isGuest: boolean;
}

export interface AuthSession {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
}

// Reading context types
export interface ReadingContext {
  currentAyah: string | null;
  bookmarks: string[];
  preferences: UserPreferences | null;
  readingSession: ReadingSession | null;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Validation schemas (for runtime validation if needed)
export interface ValidationSchema {
  ayahKey: RegExp;
  email: RegExp;
  password: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
  };
}

export const VALIDATION_PATTERNS: ValidationSchema = {
  ayahKey: /^\d+:\d+$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
  },
};

// Constants for database limits
export const DATABASE_LIMITS = {
  MAX_NAME_LENGTH: 255,
  MAX_EMAIL_LENGTH: 320,
  MAX_NOTE_LENGTH: 1000,
  MAX_BOOKMARK_COUNT: 1000,
  MAX_SESSION_DURATION: 86400, // 24 hours in seconds
  PAGINATION_DEFAULT_LIMIT: 50,
  PAGINATION_MAX_LIMIT: 500,
};

// Export utility functions for type guards
export function isValidAyahKey(key: string): boolean {
  return VALIDATION_PATTERNS.ayahKey.test(key);
}

export function isValidEmail(email: string): boolean {
  return VALIDATION_PATTERNS.email.test(email);
}

export function isValidPassword(password: string): boolean {
  const { minLength, requireUppercase, requireLowercase, requireNumbers } = VALIDATION_PATTERNS.password;
  
  if (password.length < minLength) return false;
  if (requireUppercase && !/[A-Z]/.test(password)) return false;
  if (requireLowercase && !/[a-z]/.test(password)) return false;
  if (requireNumbers && !/\d/.test(password)) return false;
  
  return true;
}

// Helper function to parse ayah keys
export function parseAyahKey(ayahKey: string): { surahNumber: number; ayahNumber: number } {
  if (!isValidAyahKey(ayahKey)) {
    throw new ValidationError(`Invalid ayah key format: ${ayahKey}`, 'ayahKey');
  }
  
  const [surah, ayah] = ayahKey.split(':').map(Number);
  return { surahNumber: surah, ayahNumber: ayah };
}

// Helper function to create ayah keys
export function createAyahKey(surahNumber: number, ayahNumber: number): string {
  return `${surahNumber}:${ayahNumber}`;
}