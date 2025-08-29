/**
 * API Configuration
 * Centralized configuration for all API endpoints and settings
 */

import type { QuranApiConfig, PrayerApiConfig } from '@/types/quran';

// API Base URLs
export const API_ENDPOINTS = {
  // AlQuran.cloud - Free, no API key required, excellent coverage
  QURAN: 'https://api.alquran.cloud/v1',
  
  // Aladhan API - Free prayer times, no API key required, location-based
  PRAYER_TIMES: 'https://api.aladhan.com/v1',
  
  // Backup endpoints for failover
  QURAN_BACKUP: 'https://quranapi.pages.dev/api',
  PRAYER_BACKUP: 'https://muslimsalat.com/api.json',
} as const;

// Quran API Configuration
export const QURAN_CONFIG: QuranApiConfig = {
  baseUrl: API_ENDPOINTS.QURAN,
  defaultTranslation: 'en.sahih', // Saheeh International (most widely used)
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
};

// Prayer Times API Configuration  
export const PRAYER_CONFIG: PrayerApiConfig = {
  baseUrl: API_ENDPOINTS.PRAYER_TIMES,
  method: 2, // Islamic Society of North America (ISNA) method
  school: 0, // Shafi (0), Hanafi (1)
  timeout: 8000, // 8 seconds
  retryAttempts: 3,
};

// Translation identifiers for different languages (updated for AlQuran.cloud API)
export const TRANSLATION_IDS = {
  // English translations (using correct string identifiers)
  SAHIH_INTERNATIONAL: 'en.sahih', // Saheeh International
  PICKTHALL: 'en.pickthall', // Mohammed Marmaduke William Pickthall
  ARBERRY: 'en.arberry', // A. J. Arberry
  ASAD: 'en.asad', // Muhammad Asad
  HILALI: 'en.hilali', // Muhammad Taqi-ud-Din al-Hilali and Muhammad Muhsin Khan
  
  // Other languages (examples - would need to verify actual identifiers)
  FRENCH: 'fr.hamidullah', // Muhammad Hamidullah
  SPANISH: 'es.cortes', // Julio Cortes
  GERMAN: 'de.bubenheim', // Frank Bubenheim and Nadeem Elyas
  URDU: 'ur.jalandhry', // Fateh Muhammad Jalandhry
  TURKISH: 'tr.diyanet', // Diyanet İşleri
} as const;

// Transliteration identifiers (AlQuran.cloud API)
export const TRANSLITERATION_IDS = {
  // English transliterations (use proper AlQuran.cloud identifier)
  EN: 'en.transliteration', // English transliteration
  // Alternative approaches if above doesn't work
  EN_ALT: 'transliteration.en.transliteration', // Alternative format
} as const;

// Audio recitation identifiers
export const RECITER_IDS = {
  MISHARY: 'ar.alafasy', // Mishary Rashid Alafasy
  SUDAIS: 'ar.abdurrahmaansudais', // Abdul Rahman As-Sudais
  GHAMDI: 'ar.saadalghamdi', // Saad Al Ghamdi
  HUSARY: 'ar.husary', // Mahmoud Khalil Al-Husary
  MINSHAWI: 'ar.minshawi', // Mohamed Siddiq Al-Minshawi
} as const;

// Prayer calculation methods
export const CALCULATION_METHODS = {
  MWL: 3, // Muslim World League
  ISNA: 2, // Islamic Society of North America
  EGYPT: 5, // Egyptian General Authority of Survey
  KARACHI: 1, // University of Islamic Sciences, Karachi
  UMM_AL_QURA: 4, // Umm Al-Qura University, Makkah
  DUBAI: 8, // The Gulf Region
  KUWAIT: 9, // Kuwait
  QATAR: 10, // Qatar
  SINGAPORE: 11, // Majlis Ugama Islam Singapura, Singapore
  FRANCE: 12, // Union Organization islamic de France
  TURKEY: 13, // Diyanet İşleri Başkanlığı, Turkey
  RUSSIA: 14, // Spiritual Administration of Muslims of Russia
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  // Quran data cache (long-term, rarely changes)
  QURAN_CACHE_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  
  // Prayer times cache (daily)
  PRAYER_CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  
  // Location cache (weekly)
  LOCATION_CACHE_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  
  // Maximum cache entries to prevent excessive storage
  MAX_CACHE_ENTRIES: {
    QURAN: 1000,
    PRAYER: 100,
    LOCATION: 50,
  },
} as const;

// Request configuration
export const REQUEST_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'QuranApp/1.0.0 (Islamic Reading App)',
  },
  
  // Exponential backoff configuration for retries
  backoff: {
    initialDelay: 1000, // 1 second
    multiplier: 2,
    maxDelay: 30000, // 30 seconds
  },
  
  // Network timeout thresholds
  timeouts: {
    connection: 5000, // 5 seconds to establish connection
    response: 15000, // 15 seconds for full response
    
    // Specific API timeouts
    quran: QURAN_CONFIG.timeout,
    prayer: PRAYER_CONFIG.timeout,
  },
} as const;

// Offline mode configuration
export const OFFLINE_CONFIG = {
  // Minimum data required for offline mode
  essentialSurahs: [1, 2, 18, 36, 67], // Al-Fatiha, Al-Baqarah, Al-Kahf, Ya-Sin, Al-Mulk
  
  // Default location for offline prayer times
  defaultLocation: {
    city: 'Makkah',
    country: 'Saudi Arabia',
    latitude: 21.4225,
    longitude: 39.8262,
    timezone: 'Asia/Riyadh',
  },
  
  // Data preloading strategy
  preload: {
    enabled: true,
    surahs: [1], // Always preload Al-Fatiha
    translations: [TRANSLATION_IDS.SAHIH_INTERNATIONAL],
    prayers: 7, // Preload 7 days of prayer times
  },
} as const;

// Error handling configuration
export const ERROR_CONFIG = {
  // Retry conditions
  retryableErrors: [
    'NETWORK_ERROR',
    'TIMEOUT',
    'SERVER_ERROR',
    'RATE_LIMITED',
  ],
  
  // Error codes that should not be retried
  nonRetryableErrors: [
    'INVALID_REQUEST',
    'UNAUTHORIZED',
    'NOT_FOUND',
    'VALIDATION_ERROR',
  ],
  
  // Fallback strategies
  fallbacks: {
    quran: {
      useSampleData: true,
      useBackupAPI: true,
      useOfflineCache: true,
    },
    
    prayer: {
      useLastKnownTimes: true,
      useCalculatedTimes: true,
      useBackupAPI: true,
    },
  },
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  // API features
  enableBackupAPIs: true,
  enableOfflineMode: true,
  enableCaching: true,
  enableRetries: true,
  
  // Data features  
  enableAudioRecitations: true,
  enableMultipleTranslations: true,
  enableTransliterations: true,
  
  // Location features
  enableLocationServices: true,
  enableAutoLocationDetection: true,
  enableManualLocationEntry: true,
  
  // Debug features (should be false in production)
  enableAPILogging: process.env.NODE_ENV === 'development',
  enableDetailedErrors: process.env.NODE_ENV === 'development',
  enablePerformanceMetrics: process.env.NODE_ENV === 'development',
} as const;