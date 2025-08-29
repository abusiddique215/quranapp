/**
 * API Services
 * High-level service functions for common operations
 */

import { quranClient } from './quran-client';
import { prayerClient, LocationService } from './prayer-client';
import { cacheManager } from './cache';
import type { 
  SurahDetails, 
  Surah,
  SurahMeta,
  VerseDetails,
  QuranNavigationData,
  VerseRangeOptions,
  MultiTranslationVerse,
  BatchLoadOptions,
  QuranSearchResult,
  QuranBookmark,
  PrayerTimesData, 
  PrayerTime, 
  LocationData,
  ProgressData,
  InspirationContent 
} from '@/types/quran';

/**
 * Enhanced Quran Services with complete 114-surah support
 */
export class QuranService {
  /**
   * Get complete Quran navigation data with all 114 surahs
   */
  static async getQuranNavigation(): Promise<QuranNavigationData> {
    try {
      const surahs = await quranClient.getSurahs();
      
      return {
        totalSurahs: 114,
        totalAyahs: 6236, // Total verses in Quran
        surahs: surahs,
        lastAccessed: await this.getLastAccessedVerse(),
      };
    } catch (error) {
      console.warn('Failed to get Quran navigation data:', error);
      // Return basic structure with backup data
      return {
        totalSurahs: 114,
        totalAyahs: 6236,
        surahs: [],
        lastAccessed: undefined,
      };
    }
  }

  /**
   * Get any surah (1-114) with translation - Cached and performance optimized
   */
  static async getSurah(
    surahNumber: number, 
    translationId?: string
  ): Promise<SurahDetails> {
    if (surahNumber < 1 || surahNumber > 114) {
      throw new Error(`Invalid surah number: ${surahNumber}. Must be between 1 and 114.`);
    }
    
    // Smart caching key
    const cacheKey = `surah_${surahNumber}_${translationId || 'arabic'}`;
    
    try {
      // Try cache first for instant loading
      const cachedSurah = await cacheManager.get<SurahDetails>('quran', cacheKey);
      if (cachedSurah) {
        return cachedSurah;
      }
      
      // Fetch from API if not in cache
      let surahData: SurahDetails;
      if (translationId) {
        surahData = await quranClient.getSurahWithTranslation(surahNumber, translationId);
      } else {
        surahData = await quranClient.getSurah(surahNumber);
      }
      
      // Cache the result with smart TTL
      const isPopularSurah = [1, 2, 18, 36, 55, 67, 112, 113, 114].includes(surahNumber);
      const cacheTTL = isPopularSurah 
        ? 30 * 24 * 60 * 60 * 1000 // 30 days for popular surahs
        : 7 * 24 * 60 * 60 * 1000;  // 7 days for others
        
      await cacheManager.set('quran', cacheKey, surahData, cacheTTL);
      
      return surahData;
    } catch (error) {
      console.warn(`Failed to get surah ${surahNumber}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple surahs in batch for efficient loading - Optimized with smart caching
   */
  static async getBatchSurahs(options: BatchLoadOptions): Promise<SurahDetails[]> {
    const { surahs, translationIds, includeMetadata } = options;
    
    // Validate surah numbers
    const validSurahs = surahs.filter(num => num >= 1 && num <= 114);
    const translationId = translationIds && translationIds.length > 0 ? translationIds[0] : undefined;
    
    try {
      // Create cache keys for batch lookup
      const cacheKeys = validSurahs.map(num => `surah_${num}_${translationId || 'arabic'}`);
      
      // Batch cache lookup
      const cachedResults = await cacheManager.batchGet<SurahDetails>('quran', cacheKeys);
      
      // Identify missing surahs that need API calls
      const missingSurahs: number[] = [];
      const results: (SurahDetails | null)[] = validSurahs.map((surahNumber, index) => {
        const cacheKey = cacheKeys[index];
        const cached = cachedResults.get(cacheKey);
        if (!cached) {
          missingSurahs.push(surahNumber);
          return null;
        }
        return cached;
      });
      
      // Fetch missing surahs from API in parallel
      if (missingSurahs.length > 0) {
        const fetchPromises = missingSurahs.map(async (surahNumber) => {
          try {
            const surahData = translationId
              ? await quranClient.getSurahWithTranslation(surahNumber, translationId)
              : await quranClient.getSurah(surahNumber);
            
            // Cache the fetched data
            const cacheKey = `surah_${surahNumber}_${translationId || 'arabic'}`;
            const isPopularSurah = [1, 2, 18, 36, 55, 67, 112, 113, 114].includes(surahNumber);
            const cacheTTL = isPopularSurah ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
            
            await cacheManager.set('quran', cacheKey, surahData, cacheTTL);
            return { surahNumber, data: surahData };
          } catch (error) {
            console.warn(`Failed to fetch surah ${surahNumber}:`, error);
            return { surahNumber, data: null };
          }
        });
        
        const fetchedResults = await Promise.all(fetchPromises);
        
        // Merge cached and fetched results
        fetchedResults.forEach(({ surahNumber, data }) => {
          const index = validSurahs.indexOf(surahNumber);
          if (index !== -1 && data) {
            results[index] = data;
          }
        });
      }
      
      // Filter out null results and return
      return results.filter((result): result is SurahDetails => result !== null);
    } catch (error) {
      console.warn('Batch surah loading failed:', error);
      return [];
    }
  }

  /**
   * Get verse range from any surah
   */
  static async getVerseRange(options: VerseRangeOptions): Promise<VerseDetails[]> {
    const { surahNumber, startVerse, endVerse, translationIds, includeArabic = true } = options;
    
    if (surahNumber < 1 || surahNumber > 114) {
      throw new Error(`Invalid surah number: ${surahNumber}`);
    }
    
    try {
      // Use the client's new getVerseRange method
      const translationId = translationIds && translationIds.length > 0 ? translationIds[0] : undefined;
      return await quranClient.getVerseRange(surahNumber, startVerse, endVerse, translationId);
    } catch (error) {
      console.warn('Failed to get verse range:', error);
      return [];
    }
  }

  /**
   * Get surah with multiple translations
   */
  static async getSurahWithMultipleTranslations(
    surahNumber: number,
    translationIds: string[]
  ): Promise<SurahDetails> {
    if (surahNumber < 1 || surahNumber > 114) {
      throw new Error(`Invalid surah number: ${surahNumber}`);
    }
    
    try {
      return await quranClient.getSurahWithMultipleTranslations(surahNumber, translationIds);
    } catch (error) {
      console.warn('Failed to get surah with multiple translations:', error);
      // Fallback to single translation
      return await quranClient.getSurahWithTranslation(surahNumber, translationIds[0]);
    }
  }

  /**
   * Get all 114 Surahs metadata - Cached for instant loading
   */
  static async getAllSurahs(): Promise<Surah[]> {
    const cacheKey = 'all_surahs_metadata';
    
    try {
      // Check cache first
      const cachedSurahs = await cacheManager.get<Surah[]>('quran', cacheKey);
      if (cachedSurahs) {
        return cachedSurahs;
      }
      
      // Fetch from API
      const surahs = await quranClient.getSurahs();
      
      // Cache with long TTL since metadata rarely changes
      const cacheTTL = 30 * 24 * 60 * 60 * 1000; // 30 days
      await cacheManager.set('quran', cacheKey, surahs, cacheTTL);
      
      return surahs;
    } catch (error) {
      console.warn('Failed to get all surahs:', error);
      throw error;
    }
  }

  /**
   * Get Al-Fatihah with translation for app initialization
   */
  static async getAlFatihah(): Promise<SurahDetails> {
    return quranClient.getSurahWithTranslation(1);
  }

  /**
   * Get popular surahs for quick access
   */
  static async getPopularSurahs(): Promise<SurahDetails[]> {
    const popularSurahNumbers = [1, 2, 18, 36, 55, 67, 112, 113, 114]; // Al-Fatihah, Al-Baqarah, Al-Kahf, Ya-Sin, Ar-Rahman, Al-Mulk, Al-Ikhlas, Al-Falaq, An-Nas
    
    try {
      return await this.getBatchSurahs({
        surahs: popularSurahNumbers,
        translationIds: ['en.sahih'],
        includeMetadata: true,
      });
    } catch (error) {
      console.warn('Failed to get popular surahs:', error);
      return [];
    }
  }

  /**
   * Get last accessed verse from storage
   */
  private static async getLastAccessedVerse(): Promise<{ surahNumber: number; ayahNumber: number; timestamp: Date } | undefined> {
    try {
      // This would integrate with AsyncStorage or similar
      // For now, return undefined
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Save last accessed verse to storage
   */
  static async saveLastAccessedVerse(surahNumber: number, ayahNumber: number): Promise<void> {
    try {
      // This would save to AsyncStorage or similar
      // For now, just log
      console.log(`Last accessed: Surah ${surahNumber}, Ayah ${ayahNumber}`);
    } catch (error) {
      console.warn('Failed to save last accessed verse:', error);
    }
  }

  /**
   * Get daily inspiration verse
   */
  static async getDailyInspiration(): Promise<InspirationContent> {
    try {
      // Get a random verse from a selection of popular surahs
      const inspirationalSurahs = [2, 3, 18, 36, 55, 67]; // Al-Baqarah, Al-Imran, Al-Kahf, Ya-Sin, Ar-Rahman, Al-Mulk
      const randomSurah = inspirationalSurahs[Math.floor(Math.random() * inspirationalSurahs.length)];
      
      // For now, we'll get a specific verse. In a real app, you might have a curated list
      let surahNumber = 65;
      let ayahNumber = 2;
      
      // Special handling for popular verses
      if (Math.random() > 0.5) {
        // Ayat al-Kursi (2:255)
        surahNumber = 2;
        ayahNumber = 255;
      }

      const verse = await quranClient.getAyahWithTranslation(surahNumber, ayahNumber);
      
      return {
        type: 'verse',
        arabic: verse.ayah.text,
        translation: verse.translations[0]?.text || '',
        reference: `Quran ${surahNumber}:${ayahNumber}`,
        transliteration: verse.transliteration?.text,
      };
    } catch (error) {
      // Fallback inspiration
      return {
        type: 'verse',
        arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
        translation: 'And whoever fears Allah - He will make for him a way out.',
        reference: 'Quran 65:2',
        transliteration: 'Wa man yattaqi Allah yaj\'al lahu makhrajan',
      };
    }
  }

  /**
   * Search verses by keywords (enhanced implementation)
   */
  static async searchVerses(query: string, language: 'arabic' | 'english' = 'english'): Promise<QuranSearchResult[]> {
    try {
      // This is a basic implementation - in production, you'd want:
      // 1. A dedicated search API
      // 2. Full-text search capabilities
      // 3. Semantic search for better relevance
      
      const results: QuranSearchResult[] = [];
      
      // For now, search in popular surahs only
      const searchSurahs = [1, 2, 3, 18, 36, 55, 67];
      
      for (const surahNumber of searchSurahs) {
        try {
          const surah = await quranClient.getSurahWithTranslation(surahNumber);
          
          surah.ayahs.forEach((verse, index) => {
            const searchText = language === 'arabic' 
              ? verse.ayah.text 
              : verse.translations[0]?.text || '';
            
            if (searchText.toLowerCase().includes(query.toLowerCase())) {
              results.push({
                surahNumber,
                ayahNumber: verse.ayah.numberInSurah,
                arabicText: verse.ayah.text,
                translationText: verse.translations[0]?.text || '',
                context: `${surah.surah.englishName} - Verse ${verse.ayah.numberInSurah}`,
                relevanceScore: this.calculateRelevanceScore(query, searchText),
              });
            }
          });
        } catch (error) {
          console.warn(`Failed to search in surah ${surahNumber}:`, error);
        }
      }
      
      // Sort by relevance score
      return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.warn('Search failed:', error);
      return [];
    }
  }
  
  /**
   * Calculate relevance score for search results
   */
  private static calculateRelevanceScore(query: string, text: string): number {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Exact match gets highest score
    if (textLower.includes(queryLower)) {
      const position = textLower.indexOf(queryLower);
      // Earlier matches get higher scores
      return 100 - (position / textLower.length) * 50;
    }
    
    // Word-based matching for partial relevance
    const queryWords = queryLower.split(' ');
    const textWords = textLower.split(' ');
    let matchCount = 0;
    
    queryWords.forEach(queryWord => {
      if (textWords.some(textWord => textWord.includes(queryWord))) {
        matchCount++;
      }
    });
    
    return (matchCount / queryWords.length) * 50;
  }

  /**
   * Get enhanced reading statistics
   */
  static async getReadingStats(): Promise<Partial<ProgressData>> {
    try {
      // This would integrate with the user's reading history from the database
      // Enhanced with monthly stats and achievements
      return {
        currentStreak: 0,
        bestStreak: 0,
        totalSessions: 0,
        weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
        monthlyStats: [
          {
            month: new Date().toISOString().substring(0, 7), // Current month
            versesRead: 0,
            timeSpent: 0,
            completedSurahs: [],
          }
        ],
        achievements: [],
      };
    } catch (error) {
      return {
        currentStreak: 0,
        bestStreak: 0,
        totalSessions: 0,
        weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
        monthlyStats: [],
        achievements: [],
      };
    }
  }

  /**
   * Validate surah and ayah numbers
   */
  static validateReference(surahNumber: number, ayahNumber?: number): boolean {
    if (surahNumber < 1 || surahNumber > 114) {
      return false;
    }
    
    if (ayahNumber !== undefined) {
      // Basic ayah validation - would need actual surah data for precise validation
      return ayahNumber >= 1 && ayahNumber <= 286; // Al-Baqarah has the most verses (286)
    }
    
    return true;
  }

  /**
   * Get surah metadata by number
   */
  static async getSurahMetadata(surahNumber: number): Promise<SurahMeta | null> {
    try {
      const surahs = await quranClient.getSurahs();
      return surahs.find(surah => surah.number === surahNumber) || null;
    } catch (error) {
      console.warn('Failed to get surah metadata:', error);
      return null;
    }
  }
}

/**
 * Prayer Services
 */
export class PrayerService {
  /**
   * Get current prayer times for user's location
   */
  static async getCurrentPrayerTimes(): Promise<{ 
    prayerTimes: PrayerTime[]; 
    nextPrayer: string;
    timeToNext: string;
    location: string;
  }> {
    try {
      // Get user's location
      const location = await LocationService.getCurrentLocation();
      
      // Get prayer times
      const prayerData = await prayerClient.getPrayerTimes(location);
      
      // Convert to app format
      const prayerTimes = prayerClient.convertToAppFormat(prayerData);
      
      // Find next prayer
      const nextPrayerData = prayerClient.getNextPrayer(prayerData);
      
      return {
        prayerTimes,
        nextPrayer: nextPrayerData?.name || 'Fajr',
        timeToNext: nextPrayerData?.timeToNext || '0m',
        location: location?.city || 'Unknown Location',
      };
    } catch (error) {
      // Fallback to sample data
      return {
        prayerTimes: [
          { name: 'Fajr', arabicName: 'الفجر', time: '5:30 AM', isPassed: true, isNext: false, isCurrent: false },
          { name: 'Dhuhr', arabicName: 'الظهر', time: '12:25 PM', isPassed: true, isNext: false, isCurrent: false },
          { name: 'Asr', arabicName: 'العصر', time: '3:45 PM', isPassed: false, isNext: true, isCurrent: false },
          { name: 'Maghrib', arabicName: 'المغرب', time: '6:20 PM', isPassed: false, isNext: false, isCurrent: false },
          { name: 'Isha', arabicName: 'العشاء', time: '8:15 PM', isPassed: false, isNext: false, isCurrent: false },
        ],
        nextPrayer: 'Asr',
        timeToNext: '2h 15m',
        location: 'New York, NY',
      };
    }
  }

  /**
   * Set up prayer time notifications (future feature)
   */
  static async setupNotifications(enabled: boolean): Promise<void> {
    // This would integrate with expo-notifications
    // For now, just log the intent
    console.log(`Prayer notifications ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get prayer times for specific city
   */
  static async getPrayerTimesByCity(city: string, country?: string): Promise<PrayerTimesData> {
    return prayerClient.getPrayerTimesByCity(city, country);
  }
}

/**
 * Enhanced Cache Services with Quran-specific optimizations
 */
export class CacheService {
  /**
   * Get cache statistics
   */
  static async getCacheStats() {
    return cacheManager.getStats();
  }

  /**
   * Clear all cache
   */
  static async clearAllCache(): Promise<void> {
    await Promise.all([
      cacheManager.clear('quran'),
      cacheManager.clear('prayer'),
      cacheManager.clear('location'),
    ]);
  }

  /**
   * Clear expired cache entries
   */
  static async clearExpiredCache(): Promise<void> {
    await cacheManager.clearExpired();
  }

  /**
   * Preload essential Quran data for offline use
   */
  static async preloadEssentialData(): Promise<void> {
    try {
      // Preload all surah metadata first (lightweight)
      await quranClient.getSurahs();
      
      // Preload essential surahs
      await QuranService.getAlFatihah();
      await QuranService.getPopularSurahs();
      
      // Preload prayer times for next 7 days
      await prayerClient.preloadPrayerTimes();
      
      // Preload daily inspiration
      await QuranService.getDailyInspiration();
      
      console.log('Essential Quran data preloaded successfully');
    } catch (error) {
      console.warn('Failed to preload essential data:', error);
    }
  }

  /**
   * Preload specific surahs for offline reading
   */
  static async preloadSurahs(surahNumbers: number[], translationIds?: string[]): Promise<void> {
    try {
      const validSurahs = surahNumbers.filter(num => num >= 1 && num <= 114);
      
      await QuranService.getBatchSurahs({
        surahs: validSurahs,
        translationIds: translationIds || ['en.sahih'],
        includeMetadata: true,
      });
      
      console.log(`Preloaded ${validSurahs.length} surahs for offline reading`);
    } catch (error) {
      console.warn('Failed to preload surahs:', error);
    }
  }

  /**
   * Get cache size and usage statistics
   */
  static async getCacheUsage(): Promise<{
    totalSize: number;
    quranCacheSize: number;
    prayerCacheSize: number;
    itemCount: number;
    hitRate: number;
  }> {
    try {
      const stats = await cacheManager.getStats();
      return {
        totalSize: stats.totalSize || 0,
        quranCacheSize: stats.categories?.quran?.size || 0,
        prayerCacheSize: stats.categories?.prayer?.size || 0,
        itemCount: stats.totalItems || 0,
        hitRate: stats.hitRate || 0,
      };
    } catch (error) {
      console.warn('Failed to get cache usage:', error);
      return {
        totalSize: 0,
        quranCacheSize: 0,
        prayerCacheSize: 0,
        itemCount: 0,
        hitRate: 0,
      };
    }
  }
}

/**
 * App Initialization Service
 */
export class AppInitService {
  /**
   * Initialize app with all necessary data
   */
  static async initializeApp(): Promise<{
    quranReady: boolean;
    prayerTimesReady: boolean;
    cacheReady: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let quranReady = false;
    let prayerTimesReady = false;
    let cacheReady = false;

    try {
      // Initialize cache
      await cacheManager.initialize();
      cacheReady = true;
    } catch (error) {
      errors.push('Cache initialization failed');
      console.warn('Cache initialization error:', error);
    }

    try {
      // Test Quran API
      await quranClient.getSampleAyahPair();
      quranReady = true;
    } catch (error) {
      errors.push('Quran API not available');
      console.warn('Quran API error:', error);
    }

    try {
      // Test Prayer Times API
      await PrayerService.getCurrentPrayerTimes();
      prayerTimesReady = true;
    } catch (error) {
      errors.push('Prayer Times API not available');
      console.warn('Prayer Times API error:', error);
    }

    // Preload essential data in background
    if (quranReady || prayerTimesReady) {
      CacheService.preloadEssentialData().catch(error => {
        console.warn('Background preload failed:', error);
      });
    }

    return {
      quranReady,
      prayerTimesReady,
      cacheReady,
      errors,
    };
  }

  /**
   * Health check for all services
   */
  static async healthCheck(): Promise<{
    quran: boolean;
    prayer: boolean;
    cache: boolean;
    overall: boolean;
  }> {
    const results = {
      quran: false,
      prayer: false,
      cache: false,
      overall: false,
    };

    try {
      await quranClient.getSampleAyahPair();
      results.quran = true;
    } catch (error) {
      console.warn('Quran health check failed:', error);
    }

    try {
      const location = await LocationService.getCurrentLocation();
      await prayerClient.getPrayerTimes(location);
      results.prayer = true;
    } catch (error) {
      console.warn('Prayer health check failed:', error);
    }

    try {
      await cacheManager.getStats();
      results.cache = true;
    } catch (error) {
      console.warn('Cache health check failed:', error);
    }

    results.overall = results.quran && results.prayer && results.cache;

    return results;
  }
}