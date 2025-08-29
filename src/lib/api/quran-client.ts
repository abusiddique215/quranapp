/**
 * Quran API Client
 * Integration with AlQuran.cloud API for Quran text, translations, and audio
 */

import { BaseAPIClient, APIError } from './base';
import { cacheManager } from './cache';
import { QURAN_CONFIG, TRANSLATION_IDS, TRANSLITERATION_IDS, RECITER_IDS, API_ENDPOINTS, FEATURE_FLAGS } from './config';
import type {
  Surah,
  Ayah,
  Translation,
  VerseDetails,
  SurahDetails,
  QuranApiResponse,
  AyahPair,
} from '@/types/quran';

/**
 * AlQuran.cloud API response interfaces
 * Updated to match actual API response structure
 */
interface AlQuranSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface AlQuranAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda?: boolean | { id: number; recommended: boolean; obligatory: boolean };
}

// Updated to match actual API response structure
// API returns surah properties directly in data, not nested in data.surah
interface AlQuranSurahResponse {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  ayahs: AlQuranAyah[];
}

// For translation endpoint, structure is the same
interface AlQuranTranslationResponse {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  ayahs: Array<{
    number: number;
    text: string;
    numberInSurah: number;
    juz: number;
    manzil: number;
    page: number;
    ruku: number;
    hizbQuarter: number;
    sajda?: boolean | { id: number; recommended: boolean; obligatory: boolean };
  }>;
}

/**
 * Quran API client with caching and error handling
 */
export class QuranAPIClient extends BaseAPIClient {
  private defaultTranslation: string;

  constructor() {
    super(QURAN_CONFIG.baseUrl, QURAN_CONFIG.timeout, QURAN_CONFIG.retryAttempts);
    this.defaultTranslation = QURAN_CONFIG.defaultTranslation;
  }

  /**
   * Get all Surahs (chapters) metadata with intelligent caching
   */
  async getSurahs(): Promise<Surah[]> {
    const cacheKey = 'surahs_metadata';
    
    // Try cache first
    if (FEATURE_FLAGS.enableCaching) {
      const cached = await cacheManager.get<Surah[]>('quran', cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await this.get<QuranApiResponse<AlQuranSurah[]>>('surah');
      
      const surahs: Surah[] = response.data.map(surah => ({
        number: surah.number,
        name: surah.name,
        englishName: surah.englishName,
        englishNameTranslation: surah.englishNameTranslation,
        numberOfAyahs: surah.numberOfAyahs,
        revelationType: surah.revelationType as 'Meccan' | 'Medinan',
      }));

      // Cache the result
      if (FEATURE_FLAGS.enableCaching) {
        await cacheManager.set('quran', cacheKey, surahs);
      }

      return surahs;
    } catch (error) {
      if (FEATURE_FLAGS.enableBackupAPIs && error instanceof APIError) {
        return this.getSurahsFromBackup();
      }
      throw error;
    }
  }

  /**
   * Get a specific Surah with Arabic text
   */
  async getSurah(surahNumber: number): Promise<SurahDetails> {
    const cacheKey = `surah_${surahNumber}_arabic`;
    
    // Try cache first
    if (FEATURE_FLAGS.enableCaching) {
      const cached = await cacheManager.get<SurahDetails>('quran', cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await this.get<QuranApiResponse<AlQuranSurahResponse>>(`surah/${surahNumber}`);
      
      // Add null checks for API response
      if (!response?.data) {
        throw new APIError(500, 'Invalid API response', 'Response data is missing');
      }

      const surahDetails: SurahDetails = {
        surah: {
          number: response.data.number || 0,
          name: response.data.name || '',
          englishName: response.data.englishName || '',
          englishNameTranslation: response.data.englishNameTranslation || '',
          numberOfAyahs: response.data.numberOfAyahs || 0,
          revelationType: (response.data.revelationType as 'Meccan' | 'Medinan') || 'Meccan',
        },
        ayahs: (response.data.ayahs || []).map(ayah => ({
          ayah: {
            number: ayah?.number || 0,
            text: ayah?.text || '',
            numberInSurah: ayah?.numberInSurah || 0,
            juz: ayah?.juz || 0,
            manzil: ayah?.manzil || 0,
            page: ayah?.page || 0,
            ruku: ayah?.ruku || 0,
            hizbQuarter: ayah?.hizbQuarter || 0,
            sajda: ayah?.sajda || false,
          },
          translations: [], // Will be populated separately if needed
        })),
      };

      // Cache the result
      if (FEATURE_FLAGS.enableCaching) {
        await cacheManager.set('quran', cacheKey, surahDetails);
      }

      return surahDetails;
    } catch (error) {
      if (FEATURE_FLAGS.enableBackupAPIs && error instanceof APIError) {
        return this.getSurahFromBackup(surahNumber);
      }
      throw error;
    }
  }

  /**
   * Get Surah with translation
   */
  async getSurahWithTranslation(
    surahNumber: number, 
    translationId: string = this.defaultTranslation
  ): Promise<SurahDetails> {
    const cacheKey = `surah_${surahNumber}_translation_${translationId}_v2`; // v2 to invalidate old cache
    
    // Try cache first - TEMPORARILY DISABLED FOR TESTING
    if (false && FEATURE_FLAGS.enableCaching) {
      const cached = await cacheManager.get<SurahDetails>('quran', cacheKey);
      if (cached) {
        console.log('Using cached surah data (should have transliteration)');
        return cached;
      }
    }
    
    console.log(`Loading fresh surah ${surahNumber} data with transliteration...`);

    try {
      // Fetch Arabic and translation in parallel
      const [arabicResponse, translationResponse] = await Promise.all([
        this.get<QuranApiResponse<AlQuranSurahResponse>>(`surah/${surahNumber}`),
        this.get<QuranApiResponse<AlQuranTranslationResponse>>(`surah/${surahNumber}/${translationId}`),
      ]);
      
      // Try to fetch transliteration if enabled (may fail gracefully)
      let transliterationResponse: QuranApiResponse<AlQuranTranslationResponse> | undefined;
      if (FEATURE_FLAGS.enableTransliterations) {
        try {
          // Try multiple possible endpoints for transliteration
          const possibleEndpoints = [
            `surah/${surahNumber}/en.transliteration`,
            `surah/${surahNumber}/transliteration.en.transliteration`,
            `surah/${surahNumber}/ar.transliteration`,
          ];
          
          for (const endpoint of possibleEndpoints) {
            try {
              transliterationResponse = await this.get<QuranApiResponse<AlQuranTranslationResponse>>(endpoint);
              if (transliterationResponse?.data?.ayahs) {
                break; // Success - use this endpoint
              }
            } catch (e) {
              console.log(`Transliteration endpoint ${endpoint} failed, trying next...`);
            }
          }
        } catch (error) {
          console.warn('Transliteration not available from API, will use fallback');
        }
      }

      // Add null checks for API responses
      if (!arabicResponse?.data || !translationResponse?.data) {
        throw new APIError(500, 'Invalid API response', 'Response data is missing from Arabic or translation API');
      }

      const surahDetails: SurahDetails = {
        surah: {
          number: arabicResponse.data.number || 0,
          name: arabicResponse.data.name || '',
          englishName: arabicResponse.data.englishName || '',
          englishNameTranslation: arabicResponse.data.englishNameTranslation || '',
          numberOfAyahs: arabicResponse.data.numberOfAyahs || 0,
          revelationType: (arabicResponse.data.revelationType as 'Meccan' | 'Medinan') || 'Meccan',
        },
        ayahs: (arabicResponse.data.ayahs || []).map((ayah, index) => ({
          ayah: {
            number: ayah?.number || 0,
            text: ayah?.text || '',
            numberInSurah: ayah?.numberInSurah || 0,
            juz: ayah?.juz || 0,
            manzil: ayah?.manzil || 0,
            page: ayah?.page || 0,
            ruku: ayah?.ruku || 0,
            hizbQuarter: ayah?.hizbQuarter || 0,
            sajda: ayah?.sajda || false,
          },
          translations: [{
            id: translationId,
            name: 'Saheeh International',
            author: 'Saheeh International',
            language: 'en',
            text: translationResponse.data.ayahs?.[index]?.text || '',
          }],
          transliteration: transliterationResponse?.data?.ayahs?.[index] ? {
            text: transliterationResponse.data.ayahs[index].text || '',
            language: 'en',
          } : (FEATURE_FLAGS.enableTransliterations ? (() => {
            const generated = this.generateBasicTransliteration(ayah.text);
            if (index < 3) { // Debug first 3 verses
              console.log(`Generating transliteration for verse ${index + 1}: "${ayah.text}" → "${generated}"`);
            }
            return {
              text: generated,
              language: 'en',
            };
          })() : undefined),
        })),
      };

      // Cache the result
      if (FEATURE_FLAGS.enableCaching) {
        await cacheManager.set('quran', cacheKey, surahDetails);
      }

      return surahDetails;
    } catch (error) {
      if (FEATURE_FLAGS.enableBackupAPIs && error instanceof APIError) {
        return this.getSurahWithTranslationFromBackup(surahNumber, translationId);
      }
      throw error;
    }
  }

  /**
   * Get specific Ayah (verse)
   */
  async getAyah(surahNumber: number, ayahNumber: number): Promise<VerseDetails> {
    const cacheKey = `ayah_${surahNumber}_${ayahNumber}_arabic`;
    
    // Try cache first
    if (FEATURE_FLAGS.enableCaching) {
      const cached = await cacheManager.get<VerseDetails>('quran', cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await this.get<QuranApiResponse<AlQuranAyah>>(`ayah/${surahNumber}:${ayahNumber}`);
      
      const verseDetails: VerseDetails = {
        ayah: {
          number: response.data.number,
          text: response.data.text,
          numberInSurah: response.data.numberInSurah,
          juz: response.data.juz,
          manzil: response.data.manzil,
          page: response.data.page,
          ruku: response.data.ruku,
          hizbQuarter: response.data.hizbQuarter,
          sajda: response.data.sajda,
        },
        translations: [],
      };

      // Cache the result
      if (FEATURE_FLAGS.enableCaching) {
        await cacheManager.set('quran', cacheKey, verseDetails);
      }

      return verseDetails;
    } catch (error) {
      if (FEATURE_FLAGS.enableBackupAPIs && error instanceof APIError) {
        return this.getAyahFromBackup(surahNumber, ayahNumber);
      }
      throw error;
    }
  }

  /**
   * Get Ayah with translation (backward compatibility)
   */
  async getSampleAyahPair(): Promise<AyahPair> {
    try {
      const verse = await this.getAyahWithTranslation(1, 1, this.defaultTranslation);
      return {
        arabic: verse.ayah.text,
        english: verse.translations[0]?.text || '',
      };
    } catch (error) {
      // Fallback to sample data
      return {
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        english: 'In the name of Allah—the Most Compassionate, Most Merciful.',
      };
    }
  }

  /**
   * Get Ayah with translation
   */
  async getAyahWithTranslation(
    surahNumber: number, 
    ayahNumber: number, 
    translationId: string = this.defaultTranslation
  ): Promise<VerseDetails> {
    const cacheKey = `ayah_${surahNumber}_${ayahNumber}_translation_${translationId}`;
    
    // Try cache first
    if (FEATURE_FLAGS.enableCaching) {
      const cached = await cacheManager.get<VerseDetails>('quran', cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Fetch Arabic and translation in parallel
      const [arabicResponse, translationResponse] = await Promise.all([
        this.get<QuranApiResponse<AlQuranAyah>>(`ayah/${surahNumber}:${ayahNumber}`),
        this.get<QuranApiResponse<AlQuranAyah>>(`ayah/${surahNumber}:${ayahNumber}/${translationId}`),
      ]);

      const verseDetails: VerseDetails = {
        ayah: {
          number: arabicResponse.data.number,
          text: arabicResponse.data.text,
          numberInSurah: arabicResponse.data.numberInSurah,
          juz: arabicResponse.data.juz,
          manzil: arabicResponse.data.manzil,
          page: arabicResponse.data.page,
          ruku: arabicResponse.data.ruku,
          hizbQuarter: arabicResponse.data.hizbQuarter,
          sajda: arabicResponse.data.sajda,
        },
        translations: [{
          id: translationId,
          name: 'Saheeh International',
          author: 'Saheeh International', 
          language: 'en',
          text: translationResponse.data.text,
        }],
      };

      // Cache the result
      if (FEATURE_FLAGS.enableCaching) {
        await cacheManager.set('quran', cacheKey, verseDetails);
      }

      return verseDetails;
    } catch (error) {
      if (FEATURE_FLAGS.enableBackupAPIs && error instanceof APIError) {
        return this.getAyahWithTranslationFromBackup(surahNumber, ayahNumber, translationId);
      }
      throw error;
    }
  }

  /**
   * Generate basic transliteration as fallback
   * Simple mapping of common Arabic characters to Latin
   */
  private generateBasicTransliteration(arabicText: string): string {
    if (!arabicText) return '';
    
    // Basic transliteration mapping for common Arabic letters
    const transliterationMap: { [key: string]: string } = {
      'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
      'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
      'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
      'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
      'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
      'ع': "'", 'غ': 'gh', 'ف': 'f', 'ق': 'q',
      'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
      'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
      'ة': 'h', 'ؤ': 'u', 'ئ': 'i', 'ء': "'",
      // Vowel marks (diacritics)
      'َ': 'a', 'ِ': 'i', 'ُ': 'u', 'ً': 'an',
      'ٍ': 'in', 'ٌ': 'un', 'ْ': '', 'ّ': '',
      'ۡ': '', 'ٰ': 'aa', 'ۢ': '', 'ۣ': ''
    };
    
    let result = '';
    for (const char of arabicText) {
      if (transliterationMap[char]) {
        result += transliterationMap[char];
      } else if (char === ' ') {
        result += ' ';
      }
      // Skip unknown characters (numbers, punctuation, etc.)
    }
    
    // Clean up multiple spaces and trim
    return result.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  /**
   * Get verse range from a surah
   */
  async getVerseRange(
    surahNumber: number,
    startVerse?: number,
    endVerse?: number,
    translationId: string = this.defaultTranslation
  ): Promise<VerseDetails[]> {
    try {
      const surahData = await this.getSurahWithTranslation(surahNumber, translationId);
      
      const start = startVerse ? startVerse - 1 : 0;
      const end = endVerse ? endVerse : surahData.ayahs.length;
      
      return surahData.ayahs.slice(start, end);
    } catch (error) {
      console.warn('Failed to get verse range:', error);
      return [];
    }
  }

  /**
   * Get surah with multiple translations
   */
  async getSurahWithMultipleTranslations(
    surahNumber: number,
    translationIds: string[]
  ): Promise<SurahDetails> {
    try {
      // Get Arabic text first
      const arabicSurah = await this.getSurah(surahNumber);
      
      // Get all translations in parallel
      const translationPromises = translationIds.map(id =>
        this.get<QuranApiResponse<AlQuranTranslationResponse>>(`surah/${surahNumber}/${id}`)
      );
      
      const translationResponses = await Promise.all(translationPromises);
      
      // Combine all translations
      const enhancedAyahs: VerseDetails[] = arabicSurah.ayahs.map((ayahData, index) => ({
        ...ayahData,
        translations: translationResponses.map((response, transIndex) => ({
          id: translationIds[transIndex],
          name: `Translation ${transIndex + 1}`,
          author: 'Multiple Authors',
          language: 'en',
          text: response.data.ayahs?.[index]?.text || '',
        })),
      }));
      
      return {
        ...arabicSurah,
        ayahs: enhancedAyahs,
      };
    } catch (error) {
      // Fallback to single translation
      return this.getSurahWithTranslation(surahNumber, translationIds[0]);
    }
  }

  /**
   * Get audio URL for recitation
   */
  async getAudioUrl(
    surahNumber: number, 
    ayahNumber?: number, 
    reciterId: string = RECITER_IDS.MISHARY
  ): Promise<string | null> {
    if (!FEATURE_FLAGS.enableAudioRecitations) {
      return null;
    }

    try {
      const endpoint = ayahNumber 
        ? `ayah/${surahNumber}:${ayahNumber}/${reciterId}`
        : `surah/${surahNumber}/${reciterId}`;

      const response = await this.get<QuranApiResponse<{ audio: string }>>(`audio/${endpoint}`);
      return response.data.audio;
    } catch (error) {
      console.warn('Failed to get audio URL:', error);
      return null;
    }
  }

  // Backup API methods (simplified implementations)
  private async getSurahsFromBackup(): Promise<Surah[]> {
    // Fallback to hardcoded essential data
    return [
      {
        number: 1,
        name: 'سُورَةُ ٱلْفَاتِحَةِ',
        englishName: 'Al-Fatihah',
        englishNameTranslation: 'The Opening',
        numberOfAyahs: 7,
        revelationType: 'Meccan',
      },
      // Add more essential surahs as needed
    ];
  }

  private async getSurahFromBackup(surahNumber: number): Promise<SurahDetails> {
    // Return minimal Al-Fatihah data as fallback
    if (surahNumber === 1) {
      return {
        surah: {
          number: 1,
          name: 'سُورَةُ ٱلْفَاتِحَةِ',
          englishName: 'Al-Fatihah',
          englishNameTranslation: 'The Opening',
          numberOfAyahs: 7,
          revelationType: 'Meccan',
        },
        ayahs: [
          {
            ayah: {
              number: 1,
              text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
              numberInSurah: 1,
              juz: 1,
              manzil: 1,
              page: 1,
              ruku: 1,
              hizbQuarter: 1,
            },
            translations: [],
          },
        ],
      };
    }

    throw new APIError(404, 'Surah not found in backup', `Surah ${surahNumber} not available in backup`);
  }

  private async getSurahWithTranslationFromBackup(
    surahNumber: number, 
    translationId: string
  ): Promise<SurahDetails> {
    const surah = await this.getSurahFromBackup(surahNumber);
    
    // Add basic translation if it's Al-Fatihah
    if (surahNumber === 1) {
      surah.ayahs[0].translations = [{
        id: translationId,
        name: 'Backup Translation',
        author: 'Fallback',
        language: 'en',
        text: 'In the name of Allah—the Most Compassionate, Most Merciful.',
      }];
    }

    return surah;
  }

  private async getAyahFromBackup(surahNumber: number, ayahNumber: number): Promise<VerseDetails> {
    if (surahNumber === 1 && ayahNumber === 1) {
      return {
        ayah: {
          number: 1,
          text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          numberInSurah: 1,
          juz: 1,
          manzil: 1,
          page: 1,
          ruku: 1,
          hizbQuarter: 1,
        },
        translations: [],
      };
    }

    throw new APIError(404, 'Ayah not found in backup', `Ayah ${surahNumber}:${ayahNumber} not available in backup`);
  }

  private async getAyahWithTranslationFromBackup(
    surahNumber: number, 
    ayahNumber: number, 
    translationId: string
  ): Promise<VerseDetails> {
    const ayah = await this.getAyahFromBackup(surahNumber, ayahNumber);
    
    if (surahNumber === 1 && ayahNumber === 1) {
      ayah.translations = [{
        id: translationId,
        name: 'Backup Translation',
        author: 'Fallback',
        language: 'en',
        text: 'In the name of Allah—the Most Compassionate, Most Merciful.',
      }];
    }

    return ayah;
  }
}

// Singleton instance
export const quranClient = new QuranAPIClient();