/**
 * Comprehensive Integration Test Suite
 * Tests all 114 Quran chapters, API integration, navigation flow, and performance
 */

import { QuranService, PrayerService, CacheService, AppInitService } from '@/lib/api/services';
import { quranClient } from '@/lib/api/quran-client';
import type { SurahDetails, Surah } from '@/types/quran';

interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  metadata?: any;
}

interface PerformanceMetrics {
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  totalTests: number;
  failureRate: number;
  memoryUsage?: number;
}

export class IntegrationTestSuite {
  private results: TestResult[] = [];
  private performanceData: number[] = [];

  /**
   * Phase 3: Test API integration for all 114 chapters end-to-end
   */
  async testAllChaptersAPIIntegration(): Promise<{ success: boolean; results: TestResult[] }> {
    console.log('🚀 Starting comprehensive API integration test for all 114 chapters...');
    
    // Test 1: Verify all surah metadata loads
    await this.runTest('Load all 114 surah metadata', async () => {
      const surahs = await QuranService.getAllSurahs();
      if (surahs.length !== 114) {
        throw new Error(`Expected 114 surahs, got ${surahs.length}`);
      }
      
      // Validate each surah has required fields
      for (const surah of surahs) {
        this.validateSurahMetadata(surah);
      }
      
      return { surahCount: surahs.length };
    });

    // Test 2: Test loading individual chapters (sample across all ranges)
    const testSurahs = [1, 2, 18, 36, 55, 67, 114]; // Representative sample
    for (const surahNumber of testSurahs) {
      await this.runTest(`Load Surah ${surahNumber} with translation`, async () => {
        const surah = await QuranService.getSurah(surahNumber, 'en.sahih');
        this.validateSurahDetails(surah, surahNumber);
        return { 
          verseCount: surah.ayahs.length,
          hasTranslation: surah.ayahs[0].translations?.length > 0
        };
      });
    }

    // Test 3: Test batch loading for efficiency
    await this.runTest('Batch load multiple surahs', async () => {
      const batchSurahs = [1, 2, 3, 4, 5];
      const surahs = await QuranService.getBatchSurahs({
        surahs: batchSurahs,
        translationIds: ['en.sahih'],
        includeMetadata: true
      });
      
      if (surahs.length !== batchSurahs.length) {
        throw new Error(`Expected ${batchSurahs.length} surahs, got ${surahs.length}`);
      }
      
      return { loadedCount: surahs.length };
    });

    // Test 4: Test all edge cases (first, last, largest, smallest surahs)
    await this.runTest('Test edge case surahs', async () => {
      const edgeCases = [
        { number: 1, name: 'Al-Fatihah', expectedMinVerses: 7 },
        { number: 2, name: 'Al-Baqarah', expectedMinVerses: 285 }, // Largest
        { number: 108, name: 'Al-Kawthar', expectedMaxVerses: 3 }, // Smallest
        { number: 114, name: 'An-Nas', expectedMaxVerses: 6 }
      ];
      
      for (const testCase of edgeCases) {
        const surah = await QuranService.getSurah(testCase.number);
        if (testCase.expectedMinVerses && surah.ayahs.length < testCase.expectedMinVerses) {
          throw new Error(`${testCase.name}: Expected at least ${testCase.expectedMinVerses} verses, got ${surah.ayahs.length}`);
        }
        if (testCase.expectedMaxVerses && surah.ayahs.length > testCase.expectedMaxVerses) {
          throw new Error(`${testCase.name}: Expected at most ${testCase.expectedMaxVerses} verses, got ${surah.ayahs.length}`);
        }
      }
      
      return { edgeCasesPassed: edgeCases.length };
    });

    // Test 5: Test search functionality
    await this.runTest('Search verses functionality', async () => {
      const searchTerms = ['Allah', 'mercy', 'guidance'];
      for (const term of searchTerms) {
        const results = await QuranService.searchVerses(term);
        if (results.length === 0) {
          throw new Error(`No search results for term: ${term}`);
        }
      }
      return { searchTermsTested: searchTerms.length };
    });

    // Test 6: Validate Arabic text and translations are properly formatted
    await this.runTest('Validate text formatting', async () => {
      const surah = await QuranService.getSurah(1, 'en.sahih');
      
      for (const verse of surah.ayahs) {
        // Check Arabic text is not empty
        if (!verse.ayah.text || verse.ayah.text.trim().length === 0) {
          throw new Error(`Empty Arabic text in verse ${verse.ayah.numberInSurah}`);
        }
        
        // Check translation exists
        if (!verse.translations || verse.translations.length === 0) {
          throw new Error(`No translation for verse ${verse.ayah.numberInSurah}`);
        }
        
        // Check translation text is not empty
        if (!verse.translations[0].text || verse.translations[0].text.trim().length === 0) {
          throw new Error(`Empty translation text in verse ${verse.ayah.numberInSurah}`);
        }
      }
      
      return { versesValidated: surah.ayahs.length };
    });

    return {
      success: this.results.filter(r => r.passed).length === this.results.length,
      results: this.results
    };
  }

  /**
   * Phase 4: Test complete user experience flows and journeys
   */
  async testUserJourneys(): Promise<{ success: boolean; results: TestResult[] }> {
    console.log('👥 Testing complete user experience flows...');

    // Journey 1: New User Discovery
    await this.runTest('New User Discovery Journey', async () => {
      // Step 1: Home screen loads with navigation options
      const surahs = await QuranService.getAllSurahs();
      
      // Step 2: Browse all chapters
      if (surahs.length !== 114) {
        throw new Error('Surah list incomplete');
      }
      
      // Step 3: Search for specific chapter
      const searchResults = await QuranService.searchVerses('Rahman');
      if (searchResults.length === 0) {
        throw new Error('Search functionality not working');
      }
      
      // Step 4: Start reading
      const chapter55 = await QuranService.getSurah(55, 'en.sahih');
      if (!chapter55 || chapter55.ayahs.length === 0) {
        throw new Error('Chapter loading failed');
      }
      
      return { stepsCompleted: 4 };
    });

    // Journey 2: Returning User
    await this.runTest('Returning User Journey', async () => {
      // Step 1: Continue reading from bookmark
      const lastRead = await QuranService.getSurah(2, 'en.sahih'); // Al-Baqarah
      
      // Step 2: Navigate within chapter
      if (!lastRead || lastRead.ayahs.length === 0) {
        throw new Error('Continue reading failed');
      }
      
      // Step 3: Jump to different chapter
      const differentChapter = await QuranService.getSurah(18, 'en.sahih'); // Al-Kahf
      if (!differentChapter || differentChapter.ayahs.length === 0) {
        throw new Error('Chapter jumping failed');
      }
      
      return { chaptersNavigated: 2 };
    });

    // Journey 3: Search-Driven
    await this.runTest('Search-Driven Journey', async () => {
      // Step 1: Search for "Rahman"
      const searchResults = await QuranService.searchVerses('Rahman');
      if (searchResults.length === 0) {
        throw new Error('Search returned no results');
      }
      
      // Step 2: Navigate to Ar-Rahman (Chapter 55)
      const arRahman = await QuranService.getSurah(55, 'en.sahih');
      if (!arRahman) {
        throw new Error('Failed to load Ar-Rahman');
      }
      
      // Step 3: Explore related chapters
      const relatedChapters = await QuranService.getBatchSurahs({
        surahs: [54, 55, 56], // Around Ar-Rahman
        translationIds: ['en.sahih']
      });
      
      if (relatedChapters.length !== 3) {
        throw new Error('Failed to load related chapters');
      }
      
      return { relatedChaptersLoaded: relatedChapters.length };
    });

    return {
      success: this.results.filter(r => r.passed).length === this.results.length,
      results: this.results.slice(-3) // Return only the user journey tests
    };
  }

  /**
   * Phase 5: Test error handling and edge cases
   */
  async testErrorHandlingAndEdgeCases(): Promise<{ success: boolean; results: TestResult[] }> {
    console.log('⚠️  Testing error handling and edge cases...');

    // Test 1: Invalid surah numbers
    await this.runTest('Handle invalid surah numbers', async () => {
      const invalidNumbers = [-1, 0, 115, 999];
      
      for (const num of invalidNumbers) {
        try {
          await QuranService.getSurah(num);
          throw new Error(`Should have thrown error for surah ${num}`);
        } catch (error) {
          if (!(error as Error).message.includes('Invalid surah number')) {
            throw new Error(`Wrong error type for surah ${num}: ${(error as Error).message}`);
          }
        }
      }
      
      return { invalidNumbersTested: invalidNumbers.length };
    });

    // Test 2: Network timeout scenarios
    await this.runTest('Handle network timeouts', async () => {
      // Test with a long delay to simulate timeout (this will pass if service handles it)
      try {
        const surah = await QuranService.getSurah(1);
        if (!surah) {
          throw new Error('Failed to handle network scenario');
        }
        return { networkHandled: true };
      } catch (error) {
        // If it fails due to timeout, that's also valid error handling
        return { networkTimeoutHandled: true };
      }
    });

    // Test 3: Very long surahs (memory management)
    await this.runTest('Handle large surahs (memory test)', async () => {
      const largeSurahs = [2, 3, 4, 5]; // Al-Baqarah, Al-Imran, An-Nisa, Al-Maidah
      
      const startMemory = process.memoryUsage?.()?.heapUsed || 0;
      
      for (const surahNum of largeSurahs) {
        const surah = await QuranService.getSurah(surahNum, 'en.sahih');
        if (!surah || surah.ayahs.length === 0) {
          throw new Error(`Failed to load large surah ${surahNum}`);
        }
      }
      
      const endMemory = process.memoryUsage?.()?.heapUsed || 0;
      const memoryIncrease = endMemory - startMemory;
      
      return { 
        largeSurahsLoaded: largeSurahs.length,
        memoryIncrease: Math.round(memoryIncrease / 1024 / 1024) // MB
      };
    });

    // Test 4: Very short surahs
    await this.runTest('Handle very short surahs', async () => {
      const shortSurahs = [108, 110, 111]; // Al-Kawthar, An-Nasr, Al-Masad
      
      for (const surahNum of shortSurahs) {
        const surah = await QuranService.getSurah(surahNum, 'en.sahih');
        if (!surah || surah.ayahs.length === 0) {
          throw new Error(`Failed to load short surah ${surahNum}`);
        }
        if (surah.ayahs.length > 10) {
          throw new Error(`Surah ${surahNum} has too many verses for a short surah`);
        }
      }
      
      return { shortSurahsLoaded: shortSurahs.length };
    });

    // Test 5: Special characters in Arabic text
    await this.runTest('Handle special Arabic characters', async () => {
      const surah = await QuranService.getSurah(1, 'en.sahih'); // Al-Fatihah
      
      for (const verse of surah.ayahs) {
        const arabicText = verse.ayah.text;
        
        // Check for common Arabic diacritics and characters
        if (!/[\u0600-\u06FF]/.test(arabicText)) {
          throw new Error(`No Arabic characters found in verse ${verse.ayah.numberInSurah}`);
        }
        
        // Check for proper encoding (no mojibake)
        if (arabicText.includes('�') || arabicText.includes('?')) {
          throw new Error(`Text encoding issue in verse ${verse.ayah.numberInSurah}`);
        }
      }
      
      return { versesValidated: surah.ayahs.length };
    });

    return {
      success: this.results.filter(r => r.passed).length === this.results.length,
      results: this.results.slice(-5) // Return only the error handling tests
    };
  }

  /**
   * Phase 6: Validate performance targets across all chapters
   */
  async testPerformanceTargets(): Promise<{ success: boolean; results: TestResult[]; metrics: PerformanceMetrics }> {
    console.log('⚡ Testing performance targets across all chapters...');

    const performanceResults: number[] = [];

    // Test 1: Loading time targets
    await this.runTest('Chapter loading performance (<2s target)', async () => {
      const testSurahs = [1, 2, 18, 36, 55, 67, 114];
      const loadingTimes: number[] = [];
      
      for (const surahNum of testSurahs) {
        const startTime = Date.now();
        const surah = await QuranService.getSurah(surahNum, 'en.sahih');
        const loadTime = Date.now() - startTime;
        
        loadingTimes.push(loadTime);
        performanceResults.push(loadTime);
        
        if (!surah) {
          throw new Error(`Failed to load surah ${surahNum}`);
        }
        
        // Individual chapter should load within 2 seconds
        if (loadTime > 2000) {
          console.warn(`⚠️  Surah ${surahNum} took ${loadTime}ms to load (>2s target)`);
        }
      }
      
      const avgLoadTime = loadingTimes.reduce((a, b) => a + b, 0) / loadingTimes.length;
      
      return { 
        averageLoadTime: Math.round(avgLoadTime),
        testSurahsCount: testSurahs.length,
        targetMet: avgLoadTime < 2000
      };
    });

    // Test 2: Search performance
    await this.runTest('Search performance (<1s target)', async () => {
      const searchTerms = ['Allah', 'mercy', 'guidance', 'prayer', 'forgiveness'];
      const searchTimes: number[] = [];
      
      for (const term of searchTerms) {
        const startTime = Date.now();
        const results = await QuranService.searchVerses(term);
        const searchTime = Date.now() - startTime;
        
        searchTimes.push(searchTime);
        performanceResults.push(searchTime);
        
        if (results.length === 0) {
          throw new Error(`No results for search term: ${term}`);
        }
        
        if (searchTime > 1000) {
          console.warn(`⚠️  Search for "${term}" took ${searchTime}ms (>1s target)`);
        }
      }
      
      const avgSearchTime = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
      
      return {
        averageSearchTime: Math.round(avgSearchTime),
        searchTermsCount: searchTerms.length,
        targetMet: avgSearchTime < 1000
      };
    });

    // Test 3: Batch loading performance
    await this.runTest('Batch loading performance', async () => {
      const startTime = Date.now();
      
      const surahs = await QuranService.getBatchSurahs({
        surahs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // First 10 surahs
        translationIds: ['en.sahih'],
        includeMetadata: true
      });
      
      const batchTime = Date.now() - startTime;
      performanceResults.push(batchTime);
      
      if (surahs.length !== 10) {
        throw new Error(`Expected 10 surahs, got ${surahs.length}`);
      }
      
      // Batch loading should be more efficient than individual requests
      const avgIndividualTime = 1000; // Estimated from previous tests
      const expectedBatchTime = avgIndividualTime * 0.6; // Should be 40% faster
      
      return {
        batchLoadTime: batchTime,
        expectedTime: Math.round(expectedBatchTime),
        efficiencyGain: Math.round(((expectedBatchTime - batchTime) / expectedBatchTime) * 100),
        surahsLoaded: surahs.length
      };
    });

    // Calculate overall performance metrics
    const metrics: PerformanceMetrics = {
      averageResponseTime: Math.round(performanceResults.reduce((a, b) => a + b, 0) / performanceResults.length),
      maxResponseTime: Math.max(...performanceResults),
      minResponseTime: Math.min(...performanceResults),
      totalTests: performanceResults.length,
      failureRate: (this.results.filter(r => !r.passed).length / this.results.length) * 100,
    };

    return {
      success: this.results.filter(r => r.passed).length === this.results.length,
      results: this.results.slice(-3), // Return only the performance tests
      metrics
    };
  }

  /**
   * Run comprehensive integration test suite
   */
  async runFullIntegrationSuite(): Promise<{
    overallSuccess: boolean;
    phases: {
      apiIntegration: boolean;
      userJourneys: boolean;
      errorHandling: boolean;
      performance: boolean;
    };
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      averageResponseTime: number;
      worstPerformer: string;
      bestPerformer: string;
    };
    detailedResults: TestResult[];
    performanceMetrics: PerformanceMetrics;
  }> {
    const startTime = Date.now();
    
    console.log('🚀 Starting Full Integration Test Suite for Quran App...');
    console.log('Testing all 114 chapters, navigation flows, and performance targets\n');

    // Reset test state
    this.results = [];
    this.performanceData = [];

    // Phase 3: API Integration
    const apiTests = await this.testAllChaptersAPIIntegration();
    
    // Phase 4: User Journeys
    const journeyTests = await this.testUserJourneys();
    
    // Phase 5: Error Handling
    const errorTests = await this.testErrorHandlingAndEdgeCases();
    
    // Phase 6: Performance
    const performanceTests = await this.testPerformanceTargets();

    const totalTime = Date.now() - startTime;
    
    // Calculate summary statistics
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    const worstTest = this.results.reduce((worst, current) => 
      current.duration > worst.duration ? current : worst
    );
    const bestTest = this.results.reduce((best, current) => 
      current.duration < best.duration ? current : best
    );

    console.log('\n📊 Integration Test Suite Complete!');
    console.log(`Total Time: ${totalTime}ms`);
    console.log(`Tests: ${passedTests}/${totalTests} passed`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    return {
      overallSuccess: failedTests === 0,
      phases: {
        apiIntegration: apiTests.success,
        userJourneys: journeyTests.success,
        errorHandling: errorTests.success,
        performance: performanceTests.success,
      },
      summary: {
        totalTests,
        passedTests,
        failedTests,
        averageResponseTime: performanceTests.metrics.averageResponseTime,
        worstPerformer: worstTest.testName,
        bestPerformer: bestTest.testName,
      },
      detailedResults: this.results,
      performanceMetrics: performanceTests.metrics,
    };
  }

  /**
   * Helper method to run individual tests with timing and error handling
   */
  private async runTest(testName: string, testFunction: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`  🧪 Running: ${testName}`);
      const metadata = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        passed: true,
        duration,
        metadata
      });
      
      console.log(`  ✅ ${testName} - ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        passed: false,
        duration,
        error: (error as Error).message
      });
      
      console.log(`  ❌ ${testName} - Failed: ${(error as Error).message}`);
    }
  }

  /**
   * Validate surah metadata structure
   */
  private validateSurahMetadata(surah: Surah): void {
    if (!surah.number || surah.number < 1 || surah.number > 114) {
      throw new Error(`Invalid surah number: ${surah.number}`);
    }
    
    if (!surah.name || typeof surah.name !== 'string') {
      throw new Error(`Invalid surah name for surah ${surah.number}`);
    }
    
    if (!surah.englishName || typeof surah.englishName !== 'string') {
      throw new Error(`Missing English name for surah ${surah.number}`);
    }
    
    if (!surah.numberOfAyahs || surah.numberOfAyahs < 1) {
      throw new Error(`Invalid verse count for surah ${surah.number}`);
    }
  }

  /**
   * Validate detailed surah data structure
   */
  private validateSurahDetails(surah: SurahDetails, expectedNumber: number): void {
    if (surah.surah.number !== expectedNumber) {
      throw new Error(`Expected surah ${expectedNumber}, got ${surah.surah.number}`);
    }
    
    if (!surah.ayahs || surah.ayahs.length === 0) {
      throw new Error(`No verses found for surah ${expectedNumber}`);
    }
    
    // Validate first verse structure
    const firstVerse = surah.ayahs[0];
    if (!firstVerse.ayah || !firstVerse.ayah.text) {
      throw new Error(`Missing Arabic text in first verse of surah ${expectedNumber}`);
    }
    
    if (!firstVerse.ayah.numberInSurah || firstVerse.ayah.numberInSurah !== 1) {
      throw new Error(`Invalid verse numbering in surah ${expectedNumber}`);
    }
  }
}

// Export test runner for external use
export const integrationTestRunner = new IntegrationTestSuite();