/**
 * Quran API Integration Tests
 * Tests the complete 114-surah functionality
 */

import { quranClient } from '../quran-client';
import { QuranService } from '../services';
import { TRANSLATION_IDS } from '../config';

describe('Quran API Integration', () => {
  // Test basic connectivity
  test('should connect to AlQuran.cloud API', async () => {
    const result = await quranClient.getSampleAyahPair();
    expect(result).toBeDefined();
    expect(result.arabic).toBeTruthy();
    expect(result.english).toBeTruthy();
  }, 10000);

  // Test all 114 surahs metadata
  test('should fetch all 114 surahs metadata', async () => {
    const surahs = await quranClient.getSurahs();
    expect(surahs).toBeDefined();
    expect(surahs.length).toBe(114);
    
    // Verify Al-Fatihah
    const alFatihah = surahs.find(s => s.number === 1);
    expect(alFatihah?.englishName).toBe('Al-Fatihah');
    expect(alFatihah?.numberOfAyahs).toBe(7);
    
    // Verify An-Nas (last surah)
    const anNas = surahs.find(s => s.number === 114);
    expect(anNas?.englishName).toBe('An-Nas');
    expect(anNas?.numberOfAyahs).toBe(6);
  }, 15000);

  // Test individual surah access
  test('should fetch individual surahs (1-114)', async () => {
    // Test a few representative surahs
    const testSurahs = [1, 18, 36, 55, 114]; // Al-Fatihah, Al-Kahf, Ya-Sin, Ar-Rahman, An-Nas
    
    for (const surahNumber of testSurahs) {
      const surah = await quranClient.getSurah(surahNumber);
      expect(surah).toBeDefined();
      expect(surah.surah.number).toBe(surahNumber);
      expect(surah.ayahs.length).toBeGreaterThan(0);
    }
  }, 20000);

  // Test translation support
  test('should fetch surahs with translations', async () => {
    const surah = await quranClient.getSurahWithTranslation(1, TRANSLATION_IDS.SAHIH_INTERNATIONAL);
    expect(surah).toBeDefined();
    expect(surah.surah.number).toBe(1);
    expect(surah.ayahs[0].translations.length).toBe(1);
    expect(surah.ayahs[0].translations[0].text).toBeTruthy();
  }, 10000);

  // Test verse range functionality
  test('should fetch verse ranges', async () => {
    const verses = await quranClient.getVerseRange(1, 1, 3); // First 3 verses of Al-Fatihah
    expect(verses).toBeDefined();
    expect(verses.length).toBe(3);
    expect(verses[0].ayah.numberInSurah).toBe(1);
    expect(verses[2].ayah.numberInSurah).toBe(3);
  }, 10000);

  // Test multiple translations
  test('should fetch multiple translations', async () => {
    const surah = await quranClient.getSurahWithMultipleTranslations(1, [
      TRANSLATION_IDS.SAHIH_INTERNATIONAL,
      TRANSLATION_IDS.PICKTHALL
    ]);
    expect(surah).toBeDefined();
    expect(surah.ayahs[0].translations.length).toBe(2);
  }, 15000);

  // Test error handling for invalid ranges
  test('should handle invalid surah numbers gracefully', async () => {
    await expect(quranClient.getSurah(0)).rejects.toThrow();
    await expect(quranClient.getSurah(115)).rejects.toThrow();
  });

  // Test services layer
  test('should provide Quran navigation data', async () => {
    const navigation = await QuranService.getQuranNavigation();
    expect(navigation.totalSurahs).toBe(114);
    expect(navigation.totalAyahs).toBe(6236);
    expect(navigation.surahs).toBeDefined();
  }, 10000);

  // Test popular surahs access
  test('should fetch popular surahs', async () => {
    const popularSurahs = await QuranService.getPopularSurahs();
    expect(popularSurahs.length).toBeGreaterThan(0);
    
    // Should include Al-Fatihah
    const alFatihah = popularSurahs.find(s => s.surah.number === 1);
    expect(alFatihah).toBeDefined();
  }, 20000);

  // Test search functionality
  test('should search verses by keyword', async () => {
    const results = await QuranService.searchVerses('Allah');
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    
    if (results.length > 0) {
      expect(results[0].arabicText).toBeTruthy();
      expect(results[0].translationText).toBeTruthy();
      expect(results[0].relevanceScore).toBeGreaterThan(0);
    }
  }, 15000);

  // Test validation helper
  test('should validate surah and ayah references', () => {
    expect(QuranService.validateReference(1, 7)).toBe(true); // Valid
    expect(QuranService.validateReference(114, 6)).toBe(true); // Valid
    expect(QuranService.validateReference(0, 1)).toBe(false); // Invalid surah
    expect(QuranService.validateReference(115, 1)).toBe(false); // Invalid surah
    expect(QuranService.validateReference(1, 0)).toBe(false); // Invalid ayah
  });

  // Test backup data availability
  test('should have backup data for all 114 surahs', () => {
    const { BACKUP_SURAH_METADATA } = require('../quran-client');
    expect(BACKUP_SURAH_METADATA).toBeDefined();
    expect(BACKUP_SURAH_METADATA.length).toBe(114);
    
    // Verify first and last entries
    expect(BACKUP_SURAH_METADATA[0].number).toBe(1);
    expect(BACKUP_SURAH_METADATA[113].number).toBe(114);
  });
});

describe('Quran API Performance', () => {
  test('should cache surah metadata efficiently', async () => {
    const start1 = Date.now();
    await quranClient.getSurahs();
    const time1 = Date.now() - start1;
    
    // Second call should be faster (cached)
    const start2 = Date.now();
    await quranClient.getSurahs();
    const time2 = Date.now() - start2;
    
    expect(time2).toBeLessThan(time1); // Should be significantly faster
  }, 15000);

  test('should handle concurrent requests efficiently', async () => {
    const promises = [
      quranClient.getSurah(1),
      quranClient.getSurah(18),
      quranClient.getSurah(36),
      quranClient.getSurah(114)
    ];
    
    const results = await Promise.all(promises);
    expect(results.length).toBe(4);
    results.forEach(result => expect(result).toBeDefined());
  }, 20000);
});