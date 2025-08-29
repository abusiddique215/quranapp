// Basic interfaces
export interface AyahPair {
  arabic: string;
  english: string;
}

// Comprehensive Quran data models
export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda?: boolean | SajdaInfo;
}

export interface SajdaInfo {
  id: number;
  recommended: boolean;
  obligatory: boolean;
}

export interface Translation {
  id: string | number; // Support both string (new API) and number (legacy)
  name: string;
  author: string;
  language: string;
  text: string;
}

export interface Transliteration {
  text: string;
  language: string;
}

export interface AudioRecitation {
  identifier: string;
  name: string;
  englishName: string;
  format: string;
  bitrate: string;
}

export interface VerseDetails {
  ayah: Ayah;
  translations: Translation[];
  transliteration?: Transliteration;
  audio?: string;
}

export interface SurahDetails {
  surah: Surah;
  ayahs: VerseDetails[];
}

// Prayer Times interfaces
export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  sunset: string;
  maghrib: string;
  isha: string;
  imsak: string;
  midnight: string;
}

export interface PrayerTimesData {
  timings: PrayerTimes;
  date: {
    readable: string;
    timestamp: string;
    hijri: {
      date: string;
      format: string;
      day: string;
      weekday: {
        en: string;
        ar: string;
      };
      month: {
        number: number;
        en: string;
        ar: string;
      };
      year: string;
      designation: {
        abbreviated: string;
        expanded: string;
      };
      holidays: string[];
    };
    gregorian: {
      date: string;
      format: string;
      day: string;
      weekday: {
        en: string;
      };
      month: {
        number: number;
        en: string;
      };
      year: string;
      designation: {
        abbreviated: string;
        expanded: string;
      };
    };
  };
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
    method: {
      id: number;
      name: string;
      params: {
        Fajr: number;
        Isha: number;
      };
    };
    latitudeAdjustmentMethod: string;
    midnightMode: string;
    school: string;
    offset: {
      [key: string]: number;
    };
  };
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  timezone?: string;
}

// API Response interfaces
export interface QuranApiResponse<T> {
  code: number;
  status: string;
  data: T;
}

export interface PrayerApiResponse<T> {
  code: number;
  status: string;
  data: T;
}

// Cache interfaces
export interface CachedQuranData {
  id: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

export interface CachedPrayerData {
  location: string;
  date: string;
  data: PrayerTimesData;
  timestamp: number;
  expiresAt: number;
}

// Error interfaces
export interface ApiError {
  code: number;
  message: string;
  details?: string;
}

// Configuration interfaces
export interface QuranApiConfig {
  baseUrl: string;
  defaultTranslation: string; // Changed from number to string for AlQuran.cloud API
  timeout: number;
  retryAttempts: number;
}

export interface PrayerApiConfig {
  baseUrl: string;
  method: number;
  school: number;
  timeout: number;
  retryAttempts: number;
}

// Enhanced component prop interfaces
export interface PrayerTime {
  name: string;
  arabicName: string;
  time: string;
  isPassed: boolean;
  isNext: boolean;
  isCurrent: boolean;
}

export interface QuranReaderSettings {
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  arabicFont: 'uthmanic' | 'indopak' | 'simple';
  translationLanguage: string;
  showTransliteration: boolean;
  audioAutoplay: boolean;
  preferredReciter: string;
  displayMode: 'verse-by-verse' | 'side-by-side' | 'translation-only';
  nightMode: boolean;
}

export interface QuranProgress {
  totalVersesRead: number;
  completedSurahs: number[];
  currentStreak: number;
  longestStreak: number;
  averageReadingTime: number;
  favoriteReadingTime: string;
  weeklyGoal: number;
  monthlyProgress: number;
}

export interface ProgressData {
  currentStreak: number;
  bestStreak: number;
  totalSessions: number;
  lastRead: {
    surah: string;
    ayah: number;
    timestamp: Date;
  };
  weeklyProgress: number[];
  // Enhanced progress tracking
  monthlyStats: {
    month: string;
    versesRead: number;
    timeSpent: number;
    completedSurahs: number[];
  }[];
  achievements: {
    id: string;
    name: string;
    description: string;
    unlockedAt: Date;
    icon: string;
  }[];
}

export interface InspirationContent {
  type: 'verse' | 'hadith' | 'quote';
  arabic: string;
  translation: string;
  reference: string;
  transliteration?: string;
}

// Enhanced interfaces for comprehensive Quran navigation
export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface QuranNavigationData {
  totalSurahs: number;
  totalAyahs: number;
  surahs: SurahMeta[];
  lastAccessed?: {
    surahNumber: number;
    ayahNumber: number;
    timestamp: Date;
  };
}

export interface VerseRangeOptions {
  surahNumber: number;
  startVerse?: number;
  endVerse?: number;
  translationIds?: string[];
  includeArabic?: boolean;
}

export interface MultiTranslationVerse {
  ayah: Ayah;
  translations: Translation[];
  transliteration?: Transliteration;
  audio?: string;
}

export interface BatchLoadOptions {
  surahs: number[];
  translationIds?: string[];
  includeMetadata?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

export interface QuranSearchResult {
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  translationText: string;
  context: string;
  relevanceScore: number;
}

export interface QuranBookmark {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  note?: string;
  tags?: string[];
  createdAt: Date;
  lastAccessedAt?: Date;
}

// API Enhancement interfaces
export interface ApiPerformanceMetrics {
  endpoint: string;
  responseTime: number;
  cacheHit: boolean;
  dataSize: number;
  timestamp: Date;
}

export interface QuranCacheEntry {
  key: string;
  data: any;
  size: number;
  ttl: number;
  accessCount: number;
  lastAccessedAt: Date;
  createdAt: Date;
}

export interface OfflineCapabilities {
  availableSurahs: number[];
  availableTranslations: string[];
  estimatedStorage: number;
  lastSyncDate: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
}