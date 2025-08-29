/**
 * Database Models and Types
 * Defines TypeScript interfaces for all database entities
 */

// Base interface for all entities
export interface BaseEntity {
  id?: number;
  created_at?: string;
  updated_at?: string;
}

// User entity
export interface User extends BaseEntity {
  clerk_user_id: string;
  email: string;
  name: string;
}

// Reading progress tracking
export interface ReadingProgress extends BaseEntity {
  user_id: number;
  surah_number: number;
  ayah_number: number;
  timestamp: string;
  session_duration: number; // in seconds
}

// Reading session tracking
export interface ReadingSession extends BaseEntity {
  user_id: number;
  start_time: string;
  end_time?: string;
  surahs_read: string; // JSON array of surah numbers
  ayahs_read: number;
  total_duration: number; // in seconds
}

// Enhanced bookmark entity
export interface Bookmark extends BaseEntity {
  user_id: number;
  surah_number: number;
  ayah_number: number;
  ayah_key: string; // e.g., "1:1"
  note?: string;
}

// User preferences
export interface UserPreferences extends BaseEntity {
  user_id: number;
  font_size: number;
  show_translation: boolean;
  show_transliteration: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  audio_reciter: string;
  auto_scroll: boolean;
}

// Database configuration and metadata
export interface DatabaseMetadata {
  version: number;
  initialized_at: string;
  last_migration: number;
}

// Query result types
export interface QueryResult<T = any> {
  data: T;
  rowsAffected: number;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface ReadingProgressStats {
  total_ayahs_read: number;
  total_sessions: number;
  total_reading_time: number; // in seconds
  longest_session: number; // in seconds
  current_streak: number; // days
  surahs_completed: number[];
  last_read_ayah: string;
  favorite_reading_time?: string; // time of day
}

// Error types
export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Transaction callback type
export type TransactionCallback<T> = (db: any) => Promise<T>;