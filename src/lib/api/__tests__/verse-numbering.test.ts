/**
 * Verse Numbering Accuracy Tests
 * 
 * Critical tests to ensure Islamic authenticity and accuracy of verse numbering
 * Based on comprehensive verification against authoritative sources
 */

import { quranClient } from '../quran-client';

// Reference data from authoritative Islamic sources (Mushaf Uthmani, Quran.com, etc.)
const REFERENCE_VERSE_COUNTS = {
  1: 7,    // Al-Fatihah
  2: 286,  // Al-Baqarah (longest chapter)
  9: 129,  // At-Tawbah (no Bismillah)
  108: 3,  // Al-Kawthar (shortest chapter)
  114: 6,  // An-Nas (final chapter)
};

const TOTAL_EXPECTED_VERSES = 6236;
const TOTAL_EXPECTED_CHAPTERS = 114;

describe('Verse Numbering Accuracy', () => {
  beforeAll(() => {
    // Allow longer timeout for API calls
    jest.setTimeout(30000);
  });

  describe('Chapter Metadata Verification', () => {
    test('should have correct total number of chapters', async () => {
      const surahs = await quranClient.getSurahs();
      expect(surahs).toHaveLength(TOTAL_EXPECTED_CHAPTERS);
    });

    test('should have correct total verse count across all chapters', async () => {
      const surahs = await quranClient.getSurahs();
      const totalVerses = surahs.reduce((sum, surah) => sum + surah.numberOfAyahs, 0);
      expect(totalVerses).toBe(TOTAL_EXPECTED_VERSES);
    });

    test('should have accurate verse counts for critical chapters', async () => {
      const surahs = await quranClient.getSurahs();
      
      for (const [chapterNumber, expectedCount] of Object.entries(REFERENCE_VERSE_COUNTS)) {
        const chapter = surahs.find(s => s.number === parseInt(chapterNumber));
        expect(chapter).toBeDefined();
        expect(chapter!.numberOfAyahs).toBe(expectedCount);
      }
    });
  });

  describe('Al-Fatihah Special Verification', () => {
    test('should have exactly 7 verses', async () => {
      const fatihah = await quranClient.getSurah(1);
      expect(fatihah.ayahs).toHaveLength(7);
      expect(fatihah.surah.numberOfAyahs).toBe(7);
    });

    test('should have Bismillah as verse 1', async () => {
      const fatihah = await quranClient.getSurah(1);
      const firstVerse = fatihah.ayahs[0];
      
      // Verify it's numbered as verse 1
      expect(firstVerse.ayah.numberInSurah).toBe(1);
      
      // Verify it contains Bismillah text
      expect(firstVerse.ayah.text).toMatch(/بِس/); // Contains "Bism"
      expect(firstVerse.ayah.text).toMatch(/لله/); // Contains "Allah" 
      expect(firstVerse.ayah.text).toMatch(/رحم/); // Contains "Rahman"
    });

    test('should have consecutive verse numbering 1-7', async () => {
      const fatihah = await quranClient.getSurah(1);
      
      for (let i = 0; i < fatihah.ayahs.length; i++) {
        const expectedNumber = i + 1;
        expect(fatihah.ayahs[i].ayah.numberInSurah).toBe(expectedNumber);
      }
    });
  });

  describe('Critical Chapter Verification', () => {
    test('Al-Baqarah should have 286 verses (longest chapter)', async () => {
      const baqarah = await quranClient.getSurah(2);
      expect(baqarah.ayahs).toHaveLength(286);
      expect(baqarah.surah.numberOfAyahs).toBe(286);
    });

    test('At-Tawbah should have 129 verses', async () => {
      const tawbah = await quranClient.getSurah(9);
      expect(tawbah.ayahs).toHaveLength(129);
      expect(tawbah.surah.numberOfAyahs).toBe(129);
    });

    test('Al-Kawthar should have 3 verses (shortest chapter)', async () => {
      const kawthar = await quranClient.getSurah(108);
      expect(kawthar.ayahs).toHaveLength(3);
      expect(kawthar.surah.numberOfAyahs).toBe(3);
    });

    test('An-Nas should have 6 verses (final chapter)', async () => {
      const nas = await quranClient.getSurah(114);
      expect(nas.ayahs).toHaveLength(6);
      expect(nas.surah.numberOfAyahs).toBe(6);
    });
  });

  describe('Verse Sequence Integrity', () => {
    test('should have consecutive numbering in all tested chapters', async () => {
      const testChapters = [1, 2, 9, 108, 114];
      
      for (const chapterNum of testChapters) {
        const chapter = await quranClient.getSurah(chapterNum);
        
        for (let i = 0; i < chapter.ayahs.length; i++) {
          const expectedNumber = i + 1;
          expect(chapter.ayahs[i].ayah.numberInSurah).toBe(expectedNumber);
        }
      }
    });

    test('should not have duplicate verse numbers within chapters', async () => {
      const testChapters = [1, 2, 9];
      
      for (const chapterNum of testChapters) {
        const chapter = await quranClient.getSurah(chapterNum);
        const verseNumbers = chapter.ayahs.map(ayah => ayah.ayah.numberInSurah);
        const uniqueNumbers = new Set(verseNumbers);
        
        expect(uniqueNumbers.size).toBe(verseNumbers.length);
      }
    });

    test('should not have gaps in verse numbering', async () => {
      const chapter = await quranClient.getSurah(1); // Al-Fatihah
      const verseNumbers = chapter.ayahs.map(ayah => ayah.ayah.numberInSurah).sort((a, b) => a - b);
      
      for (let i = 0; i < verseNumbers.length; i++) {
        expect(verseNumbers[i]).toBe(i + 1);
      }
    });
  });

  describe('API Response Structure Validation', () => {
    test('should return proper verse number fields', async () => {
      const chapter = await quranClient.getSurah(1);
      const firstVerse = chapter.ayahs[0];
      
      // Verify required numbering fields exist
      expect(firstVerse.ayah.number).toBeDefined();
      expect(firstVerse.ayah.numberInSurah).toBeDefined();
      expect(typeof firstVerse.ayah.number).toBe('number');
      expect(typeof firstVerse.ayah.numberInSurah).toBe('number');
    });

    test('should have consistent chapter metadata', async () => {
      const chapter = await quranClient.getSurah(1);
      
      expect(chapter.surah.number).toBe(1);
      expect(chapter.surah.numberOfAyahs).toBe(chapter.ayahs.length);
      expect(chapter.surah.englishName).toBe('Al-Fatihah');
    });
  });

  describe('Jump-to-Verse Compatibility', () => {
    test('should support navigation to specific verses', async () => {
      const verse = await quranClient.getAyah(1, 1); // Al-Fatihah, verse 1
      
      expect(verse.ayah.numberInSurah).toBe(1);
      expect(verse.ayah.text).toMatch(/بِس/);
    });

    test('should handle verse ranges correctly', async () => {
      const verses = await quranClient.getVerseRange(1, 1, 3); // First 3 verses of Al-Fatihah
      
      expect(verses).toHaveLength(3);
      expect(verses[0].ayah.numberInSurah).toBe(1);
      expect(verses[1].ayah.numberInSurah).toBe(2);
      expect(verses[2].ayah.numberInSurah).toBe(3);
    });
  });
});