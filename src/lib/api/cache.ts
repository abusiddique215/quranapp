/**
 * API Cache Manager
 * Handles caching for API responses with SQLite and AsyncStorage fallback
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { CACHE_CONFIG } from './config';
import type { CachedQuranData, CachedPrayerData } from '@/types/quran';

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

/**
 * Cache manager with SQLite primary storage and AsyncStorage fallback
 */
export class CacheManager {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private useAsyncStorageFallback = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Try to initialize SQLite first
      this.db = await SQLite.openDatabaseAsync('api_cache.db');
      
      // Create cache tables
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS quran_cache (
          key TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS prayer_cache (
          key TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS location_cache (
          key TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_quran_expires ON quran_cache(expires_at);
        CREATE INDEX IF NOT EXISTS idx_prayer_expires ON prayer_cache(expires_at);
        CREATE INDEX IF NOT EXISTS idx_location_expires ON location_cache(expires_at);
      `);

      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize SQLite cache, falling back to AsyncStorage:', error);
      this.useAsyncStorageFallback = true;
      this.isInitialized = true;
    }
  }

  /**
   * Get cached data
   */
  async get<T>(type: 'quran' | 'prayer' | 'location', key: string): Promise<T | null> {
    await this.initialize();

    try {
      if (this.useAsyncStorageFallback) {
        return await this.getFromAsyncStorage<T>(type, key);
      } else {
        return await this.getFromSQLite<T>(type, key);
      }
    } catch (error) {
      console.warn(`Cache get error for ${type}:${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set<T>(
    type: 'quran' | 'prayer' | 'location', 
    key: string, 
    data: T, 
    customTTL?: number
  ): Promise<void> {
    await this.initialize();

    const now = Date.now();
    const ttl = customTTL || this.getDefaultTTL(type);
    const expiresAt = now + ttl;

    const entry: CacheEntry = {
      key,
      data,
      timestamp: now,
      expiresAt,
    };

    try {
      if (this.useAsyncStorageFallback) {
        await this.setToAsyncStorage(type, key, entry);
      } else {
        await this.setToSQLite(type, key, entry);
      }
    } catch (error) {
      console.warn(`Cache set error for ${type}:${key}:`, error);
    }
  }

  /**
   * Check if cached data exists and is valid
   */
  async has(type: 'quran' | 'prayer' | 'location', key: string): Promise<boolean> {
    const data = await this.get(type, key);
    return data !== null;
  }

  /**
   * Delete specific cache entry
   */
  async delete(type: 'quran' | 'prayer' | 'location', key: string): Promise<void> {
    await this.initialize();

    try {
      if (this.useAsyncStorageFallback) {
        await this.deleteFromAsyncStorage(type, key);
      } else {
        await this.deleteFromSQLite(type, key);
      }
    } catch (error) {
      console.warn(`Cache delete error for ${type}:${key}:`, error);
    }
  }

  /**
   * Clear all cache for a specific type
   */
  async clear(type: 'quran' | 'prayer' | 'location'): Promise<void> {
    await this.initialize();

    try {
      if (this.useAsyncStorageFallback) {
        await this.clearAsyncStorage(type);
      } else {
        await this.clearSQLite(type);
      }
    } catch (error) {
      console.warn(`Cache clear error for ${type}:`, error);
    }
  }

  /**
   * Clear expired entries
   */
  async clearExpired(): Promise<void> {
    await this.initialize();

    const now = Date.now();

    try {
      if (this.useAsyncStorageFallback) {
        await this.clearExpiredAsyncStorage();
      } else {
        await this.clearExpiredSQLite(now);
      }
    } catch (error) {
      console.warn('Cache cleanup error:', error);
    }
  }

  /**
   * Enhanced batch operations for performance
   */
  async batchGet<T>(type: 'quran' | 'prayer' | 'location', keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    // Process in parallel for better performance
    const promises = keys.map(async (key) => {
      const data = await this.get<T>(type, key);
      return { key, data };
    });
    
    const results_array = await Promise.all(promises);
    results_array.forEach(({ key, data }) => {
      results.set(key, data);
    });
    
    return results;
  }

  /**
   * Batch set operation for bulk caching
   */
  async batchSet<T>(
    type: 'quran' | 'prayer' | 'location',
    entries: Array<{ key: string; data: T; customTTL?: number }>
  ): Promise<void> {
    const promises = entries.map(({ key, data, customTTL }) =>
      this.set(type, key, data, customTTL)
    );
    
    await Promise.all(promises);
  }

  /**
   * Preload cache with essential data
   */
  async preloadQuranData(surahNumbers: number[], translationIds: string[] = ['en.sahih']): Promise<void> {
    // This would integrate with QuranService to preload key surahs
    console.log(`Preloading ${surahNumbers.length} surahs for offline use`);
  }

  /**
   * Smart cache eviction based on usage patterns
   */
  async smartEviction(): Promise<void> {
    await this.initialize();
    
    // Keep frequently accessed surahs (1, 2, 18, 36, 55, 67, 112-114)
    const popularSurahs = [1, 2, 18, 36, 55, 67, 112, 113, 114];
    
    if (!this.useAsyncStorageFallback && this.db) {
      // Keep popular surahs, evict others based on access time
      const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
      
      await this.db.runAsync(`
        DELETE FROM quran_cache 
        WHERE timestamp < ? 
        AND key NOT LIKE '%surah_1_%' 
        AND key NOT LIKE '%surah_2_%' 
        AND key NOT LIKE '%surah_18_%'
        AND key NOT LIKE '%surah_36_%'
        AND key NOT LIKE '%surah_55_%'
        AND key NOT LIKE '%surah_67_%'
        AND key NOT LIKE '%surah_112_%'
        AND key NOT LIKE '%surah_113_%'
        AND key NOT LIKE '%surah_114_%'
      `, [cutoffTime]);
    }
  }

  /**
   * Get enhanced cache stats with performance metrics
   */
  async getStats(): Promise<{
    quran: number;
    prayer: number;
    location: number;
    totalSize: number;
    categories?: {
      quran?: { size: number; items: number };
      prayer?: { size: number; items: number };
      location?: { size: number; items: number };
    };
    hitRate?: number;
    totalItems?: number;
  }> {
    await this.initialize();

    try {
      if (this.useAsyncStorageFallback) {
        return await this.getAsyncStorageStats();
      } else {
        return await this.getSQLiteStats();
      }
    } catch (error) {
      console.warn('Cache stats error:', error);
      return { quran: 0, prayer: 0, location: 0, totalSize: 0 };
    }
  }

  // SQLite implementation
  private async getFromSQLite<T>(type: string, key: string): Promise<T | null> {
    if (!this.db) return null;

    const now = Date.now();
    const result = await this.db.getAllAsync<{data: string}>(
      `SELECT data FROM ${type}_cache WHERE key = ? AND expires_at > ?`,
      [key, now]
    );

    if (result.length === 0) {
      return null;
    }

    try {
      return JSON.parse(result[0].data);
    } catch {
      return null;
    }
  }

  private async setToSQLite(type: string, key: string, entry: CacheEntry): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO ${type}_cache (key, data, timestamp, expires_at) VALUES (?, ?, ?, ?)`,
      [key, JSON.stringify(entry.data), entry.timestamp, entry.expiresAt]
    );

    // Clean up old entries to prevent unlimited growth
    await this.enforceCacheLimits(type);
  }

  private async deleteFromSQLite(type: string, key: string): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync(
      `DELETE FROM ${type}_cache WHERE key = ?`,
      [key]
    );
  }

  private async clearSQLite(type: string): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync(`DELETE FROM ${type}_cache`);
  }

  private async clearExpiredSQLite(now: number): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync(`DELETE FROM quran_cache WHERE expires_at < ?`, [now]);
    await this.db.runAsync(`DELETE FROM prayer_cache WHERE expires_at < ?`, [now]);
    await this.db.runAsync(`DELETE FROM location_cache WHERE expires_at < ?`, [now]);
  }

  private async getSQLiteStats() {
    if (!this.db) return { quran: 0, prayer: 0, location: 0, totalSize: 0 };

    const [quranCount, prayerCount, locationCount] = await Promise.all([
      this.db.getAllAsync('SELECT COUNT(*) as count FROM quran_cache'),
      this.db.getAllAsync('SELECT COUNT(*) as count FROM prayer_cache'),
      this.db.getAllAsync('SELECT COUNT(*) as count FROM location_cache'),
    ]);

    return {
      quran: (quranCount[0] as any).count || 0,
      prayer: (prayerCount[0] as any).count || 0,
      location: (locationCount[0] as any).count || 0,
      totalSize: 0, // SQLite doesn't easily provide size info
    };
  }

  private async enforceCacheLimits(type: string): Promise<void> {
    if (!this.db) return;

    const maxEntries = CACHE_CONFIG.MAX_CACHE_ENTRIES[type.toUpperCase() as keyof typeof CACHE_CONFIG.MAX_CACHE_ENTRIES];
    
    // Delete oldest entries if we exceed the limit
    await this.db.runAsync(`
      DELETE FROM ${type}_cache 
      WHERE key IN (
        SELECT key FROM ${type}_cache 
        ORDER BY timestamp ASC 
        LIMIT -1 OFFSET ?
      )
    `, [maxEntries]);
  }

  // AsyncStorage implementation (fallback)
  private async getFromAsyncStorage<T>(type: string, key: string): Promise<T | null> {
    const fullKey = `cache_${type}_${key}`;
    
    try {
      const cached = await AsyncStorage.getItem(fullKey);
      if (!cached) return null;

      const entry: CacheEntry = JSON.parse(cached);
      
      // Check expiration
      if (Date.now() > entry.expiresAt) {
        await AsyncStorage.removeItem(fullKey);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  private async setToAsyncStorage(type: string, key: string, entry: CacheEntry): Promise<void> {
    const fullKey = `cache_${type}_${key}`;
    await AsyncStorage.setItem(fullKey, JSON.stringify(entry));
  }

  private async deleteFromAsyncStorage(type: string, key: string): Promise<void> {
    const fullKey = `cache_${type}_${key}`;
    await AsyncStorage.removeItem(fullKey);
  }

  private async clearAsyncStorage(type: string): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const typeKeys = keys.filter(key => key.startsWith(`cache_${type}_`));
    if (typeKeys.length > 0) {
      await AsyncStorage.multiRemove(typeKeys);
    }
  }

  private async clearExpiredAsyncStorage(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('cache_'));
    
    for (const key of cacheKeys) {
      try {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          if (Date.now() > entry.expiresAt) {
            await AsyncStorage.removeItem(key);
          }
        }
      } catch {
        // Remove corrupted entries
        await AsyncStorage.removeItem(key);
      }
    }
  }

  private async getAsyncStorageStats() {
    const keys = await AsyncStorage.getAllKeys();
    
    let quran = 0, prayer = 0, location = 0, totalSize = 0;
    
    for (const key of keys) {
      if (key.startsWith('cache_quran_')) quran++;
      else if (key.startsWith('cache_prayer_')) prayer++;
      else if (key.startsWith('cache_location_')) location++;
      
      // Approximate size calculation
      try {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      } catch {
        // Ignore errors for size calculation
      }
    }

    return { quran, prayer, location, totalSize };
  }

  private getDefaultTTL(type: 'quran' | 'prayer' | 'location'): number {
    switch (type) {
      case 'quran':
        return CACHE_CONFIG.QURAN_CACHE_DURATION;
      case 'prayer':
        return CACHE_CONFIG.PRAYER_CACHE_DURATION;
      case 'location':
        return CACHE_CONFIG.LOCATION_CACHE_DURATION;
      default:
        return CACHE_CONFIG.PRAYER_CACHE_DURATION;
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager();