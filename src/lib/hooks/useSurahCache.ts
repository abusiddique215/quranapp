/**
 * useSurahCache - Zero-delay navigation with smart surah caching
 * Implements LRU cache with prefetching for instant chapter navigation
 */

import { useRef, useCallback, useEffect } from 'react';
import type { SurahDetails } from '@/types/quran';
import { QuranDB } from '@/lib/database/QuranDatabase';
import { QuranService } from '@/lib/api/services';

interface CacheEntry {
  data: SurahDetails;
  timestamp: number;
  accessCount: number;
}

interface SurahMetadata {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
  revelationType: 'meccan' | 'medinan';
}

// Lightweight surah metadata for instant UI updates
const SURAH_METADATA: SurahMetadata[] = [
  { number: 1, name: 'الفاتحة', englishName: 'Al-Fatihah', numberOfAyahs: 7, revelationType: 'meccan' },
  { number: 2, name: 'البقرة', englishName: 'Al-Baqarah', numberOfAyahs: 286, revelationType: 'medinan' },
  { number: 3, name: 'آل عمران', englishName: 'Aal-i-Imraan', numberOfAyahs: 200, revelationType: 'medinan' },
  { number: 4, name: 'النساء', englishName: 'An-Nisa', numberOfAyahs: 176, revelationType: 'medinan' },
  { number: 5, name: 'المائدة', englishName: 'Al-Maidah', numberOfAyahs: 120, revelationType: 'medinan' },
  { number: 6, name: 'الأنعام', englishName: 'Al-Anaam', numberOfAyahs: 165, revelationType: 'meccan' },
  { number: 7, name: 'الأعراف', englishName: 'Al-Araf', numberOfAyahs: 206, revelationType: 'meccan' },
  { number: 8, name: 'الأنفال', englishName: 'Al-Anfal', numberOfAyahs: 75, revelationType: 'medinan' },
  { number: 9, name: 'التوبة', englishName: 'At-Tawbah', numberOfAyahs: 129, revelationType: 'medinan' },
  { number: 10, name: 'يونس', englishName: 'Yunus', numberOfAyahs: 109, revelationType: 'meccan' },
  { number: 11, name: 'هود', englishName: 'Hud', numberOfAyahs: 123, revelationType: 'meccan' },
  { number: 12, name: 'يوسف', englishName: 'Yusuf', numberOfAyahs: 111, revelationType: 'meccan' },
  { number: 13, name: 'الرعد', englishName: 'Ar-Rad', numberOfAyahs: 43, revelationType: 'medinan' },
  { number: 14, name: 'إبراهيم', englishName: 'Ibrahim', numberOfAyahs: 52, revelationType: 'meccan' },
  { number: 15, name: 'الحجر', englishName: 'Al-Hijr', numberOfAyahs: 99, revelationType: 'meccan' },
  { number: 16, name: 'النحل', englishName: 'An-Nahl', numberOfAyahs: 128, revelationType: 'meccan' },
  { number: 17, name: 'الإسراء', englishName: 'Al-Isra', numberOfAyahs: 111, revelationType: 'meccan' },
  { number: 18, name: 'الكهف', englishName: 'Al-Kahf', numberOfAyahs: 110, revelationType: 'meccan' },
  { number: 19, name: 'مريم', englishName: 'Maryam', numberOfAyahs: 98, revelationType: 'meccan' },
  { number: 20, name: 'طه', englishName: 'Taha', numberOfAyahs: 135, revelationType: 'meccan' },
  // ... Additional metadata would be added here for all 114 surahs
  // For now, providing key surahs for testing
];

interface UseSurahCacheReturn {
  getCachedSurah: (surahNumber: number) => SurahDetails | null;
  loadSurahWithCache: (surahNumber: number, priority?: 'high' | 'normal' | 'background') => Promise<SurahDetails | null>;
  getSurahMetadata: (surahNumber: number) => SurahMetadata | null;
  preloadAdjacent: (currentSurah: number) => void;
  getCacheStats: () => { size: number; maxSize: number; hitRate: number };
  clearCache: () => void;
}

export const useSurahCache = (): UseSurahCacheReturn => {
  const cacheRef = useRef<Map<number, CacheEntry>>(new Map());
  const loadingRef = useRef<Set<number>>(new Set());
  const statsRef = useRef({ hits: 0, misses: 0 });
  
  // Cache configuration
  const MAX_CACHE_SIZE = 7; // Keep 7 surahs in memory (current + 3 prev/next + frequently accessed)
  const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
  const PRIORITY_SURAHS = [1, 2, 18, 36, 67, 112, 113, 114]; // Commonly read surahs

  /**
   * Get surah metadata for instant UI updates
   */
  const getSurahMetadata = useCallback((surahNumber: number): SurahMetadata | null => {
    // For production, this would come from a complete metadata array
    const metadata = SURAH_METADATA.find(s => s.number === surahNumber);
    if (metadata) return metadata;

    // Fallback metadata generation for missing surahs
    if (surahNumber >= 1 && surahNumber <= 114) {
      return {
        number: surahNumber,
        name: `السورة ${surahNumber}`,
        englishName: `Surah ${surahNumber}`,
        numberOfAyahs: 0, // Unknown, will be updated when loaded
        revelationType: 'meccan' // Default assumption
      };
    }
    
    return null;
  }, []);

  /**
   * Get cached surah data if available
   */
  const getCachedSurah = useCallback((surahNumber: number): SurahDetails | null => {
    const entry = cacheRef.current.get(surahNumber);
    
    if (entry) {
      // Check TTL
      if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        cacheRef.current.delete(surahNumber);
        return null;
      }
      
      // Update access stats
      entry.accessCount++;
      entry.timestamp = Date.now();
      statsRef.current.hits++;
      
      console.log(`[SurahCache] Cache HIT for surah ${surahNumber}`);
      return entry.data;
    }
    
    statsRef.current.misses++;
    console.log(`[SurahCache] Cache MISS for surah ${surahNumber}`);
    return null;
  }, []);

  /**
   * Load surah with caching and priority handling
   */
  const loadSurahWithCache = useCallback(async (
    surahNumber: number, 
    priority: 'high' | 'normal' | 'background' = 'normal'
  ): Promise<SurahDetails | null> => {
    // Check cache first
    const cached = getCachedSurah(surahNumber);
    if (cached) return cached;

    // Prevent duplicate loading
    if (loadingRef.current.has(surahNumber)) {
      console.log(`[SurahCache] Already loading surah ${surahNumber}, waiting...`);
      // Wait for existing load to complete
      while (loadingRef.current.has(surahNumber)) {
        await new Promise(resolve => setTimeout(resolve, 50));
        const nowCached = getCachedSurah(surahNumber);
        if (nowCached) return nowCached;
      }
    }

    try {
      loadingRef.current.add(surahNumber);
      console.log(`[SurahCache] Loading surah ${surahNumber} with ${priority} priority`);

      let data: SurahDetails | null = null;

      // Try database first for unlimited verses
      try {
        data = await QuranDB.getSurah(surahNumber);
      } catch (dbError) {
        console.warn(`[SurahCache] Database failed for surah ${surahNumber}:`, dbError);
      }

      // Fallback to API if database fails
      if (!data) {
        try {
          data = await QuranService.getSurah(surahNumber, 'en.sahih');
        } catch (apiError) {
          console.error(`[SurahCache] API failed for surah ${surahNumber}:`, apiError);
          return null;
        }
      }

      if (data) {
        // Store in cache
        setCachedSurah(surahNumber, data);
        console.log(`[SurahCache] Cached surah ${surahNumber} with ${data.ayahs.length} verses`);
      }

      return data;
    } catch (error) {
      console.error(`[SurahCache] Failed to load surah ${surahNumber}:`, error);
      return null;
    } finally {
      loadingRef.current.delete(surahNumber);
    }
  }, [getCachedSurah]);

  /**
   * Store surah in cache with LRU eviction
   */
  const setCachedSurah = useCallback((surahNumber: number, data: SurahDetails) => {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      accessCount: 1
    };

    cacheRef.current.set(surahNumber, entry);

    // LRU eviction if cache is full
    if (cacheRef.current.size > MAX_CACHE_SIZE) {
      evictLeastRecentlyUsed();
    }
  }, []);

  /**
   * Evict least recently used entries, but keep priority surahs
   */
  const evictLeastRecentlyUsed = useCallback(() => {
    const entries = Array.from(cacheRef.current.entries())
      .filter(([surahNumber]) => !PRIORITY_SURAHS.includes(surahNumber))
      .sort(([, a], [, b]) => {
        // Sort by access count (descending) then by timestamp (ascending)
        if (a.accessCount !== b.accessCount) {
          return a.accessCount - b.accessCount;
        }
        return a.timestamp - b.timestamp;
      });

    // Remove oldest/least accessed entries
    const toRemove = entries.slice(0, cacheRef.current.size - MAX_CACHE_SIZE + 1);
    toRemove.forEach(([surahNumber]) => {
      console.log(`[SurahCache] Evicting surah ${surahNumber} from cache`);
      cacheRef.current.delete(surahNumber);
    });
  }, []);

  /**
   * Preload adjacent chapters for zero-delay navigation
   */
  const preloadAdjacent = useCallback((currentSurah: number) => {
    const toPreload: number[] = [];

    // Previous chapter
    if (currentSurah > 1) {
      toPreload.push(currentSurah - 1);
    }

    // Next chapter  
    if (currentSurah < 114) {
      toPreload.push(currentSurah + 1);
    }

    // Preload in background with low priority
    toPreload.forEach(surahNumber => {
      if (!getCachedSurah(surahNumber) && !loadingRef.current.has(surahNumber)) {
        console.log(`[SurahCache] Background preloading surah ${surahNumber}`);
        loadSurahWithCache(surahNumber, 'background').catch(error => 
          console.warn(`[SurahCache] Background preload failed for surah ${surahNumber}:`, error)
        );
      }
    });
  }, [getCachedSurah, loadSurahWithCache]);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    const { hits, misses } = statsRef.current;
    const total = hits + misses;
    const hitRate = total > 0 ? hits / total : 0;

    return {
      size: cacheRef.current.size,
      maxSize: MAX_CACHE_SIZE,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }, []);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    loadingRef.current.clear();
    statsRef.current = { hits: 0, misses: 0 };
    console.log('[SurahCache] Cache cleared');
  }, []);

  // Preload priority surahs on mount
  useEffect(() => {
    const preloadPrioritySurahs = async () => {
      for (const surahNumber of PRIORITY_SURAHS.slice(0, 3)) { // Load first 3 priority surahs
        try {
          await loadSurahWithCache(surahNumber, 'background');
        } catch (error) {
          console.warn(`[SurahCache] Failed to preload priority surah ${surahNumber}:`, error);
        }
      }
    };

    // Delay preloading to avoid blocking initial render
    setTimeout(preloadPrioritySurahs, 1000);
  }, [loadSurahWithCache]);

  return {
    getCachedSurah,
    loadSurahWithCache,
    getSurahMetadata,
    preloadAdjacent,
    getCacheStats,
    clearCache
  };
};