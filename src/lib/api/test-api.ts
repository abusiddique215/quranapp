/**
 * API Integration Test
 * Test script to verify API endpoints and functionality
 */

import { quranClient } from './quran-client';
import { prayerClient, LocationService } from './prayer-client';
import { cacheManager } from './cache';
import { QuranService, PrayerService, AppInitService } from './services';

/**
 * Test Quran API integration
 */
export async function testQuranAPI() {
  console.log('🕌 Testing Quran API...');
  
  try {
    // Test basic ayah pair
    console.log('  Testing getSampleAyahPair...');
    const ayahPair = await quranClient.getSampleAyahPair();
    console.log('  ✅ Sample Ayah:', ayahPair.arabic.substring(0, 20) + '...');
    
    // Test Al-Fatihah
    console.log('  Testing Al-Fatihah retrieval...');
    const alFatihah = await QuranService.getAlFatihah();
    console.log('  ✅ Al-Fatihah loaded:', alFatihah.surah.englishName, `(${alFatihah.ayahs.length} verses)`);
    
    // Test daily inspiration
    console.log('  Testing daily inspiration...');
    const inspiration = await QuranService.getDailyInspiration();
    console.log('  ✅ Daily inspiration:', inspiration.reference);
    
    return true;
  } catch (error) {
    console.error('  ❌ Quran API test failed:', error);
    return false;
  }
}

/**
 * Test Prayer Times API integration
 */
export async function testPrayerAPI() {
  console.log('🕌 Testing Prayer Times API...');
  
  try {
    // Test location service
    console.log('  Testing location service...');
    const location = await LocationService.getCurrentLocation();
    console.log('  ✅ Location:', location?.city || 'Default location');
    
    // Test prayer times
    console.log('  Testing prayer times retrieval...');
    const prayerData = await PrayerService.getCurrentPrayerTimes();
    console.log('  ✅ Prayer times loaded for:', prayerData.location);
    console.log('  ✅ Next prayer:', prayerData.nextPrayer, 'in', prayerData.timeToNext);
    
    return true;
  } catch (error) {
    console.error('  ❌ Prayer Times API test failed:', error);
    return false;
  }
}

/**
 * Test Cache functionality
 */
export async function testCache() {
  console.log('💾 Testing Cache System...');
  
  try {
    // Initialize cache
    console.log('  Testing cache initialization...');
    await cacheManager.initialize();
    console.log('  ✅ Cache initialized');
    
    // Test cache operations
    console.log('  Testing cache operations...');
    await cacheManager.set('quran', 'test_key', { test: 'data' });
    const cached = await cacheManager.get('quran', 'test_key');
    
    if (cached && (cached as any).test === 'data') {
      console.log('  ✅ Cache set/get working');
    } else {
      throw new Error('Cache set/get not working properly');
    }
    
    // Test cache stats
    const stats = await cacheManager.getStats();
    console.log('  ✅ Cache stats:', stats);
    
    // Clean up test data
    await cacheManager.delete('quran', 'test_key');
    
    return true;
  } catch (error) {
    console.error('  ❌ Cache test failed:', error);
    return false;
  }
}

/**
 * Test app initialization
 */
export async function testAppInitialization() {
  console.log('🚀 Testing App Initialization...');
  
  try {
    const initResult = await AppInitService.initializeApp();
    
    console.log('  Quran API:', initResult.quranReady ? '✅' : '❌');
    console.log('  Prayer Times API:', initResult.prayerTimesReady ? '✅' : '❌');
    console.log('  Cache System:', initResult.cacheReady ? '✅' : '❌');
    
    if (initResult.errors.length > 0) {
      console.log('  ⚠️  Errors:', initResult.errors);
    }
    
    return initResult.quranReady || initResult.prayerTimesReady;
  } catch (error) {
    console.error('  ❌ App initialization test failed:', error);
    return false;
  }
}

/**
 * Run comprehensive API tests
 */
export async function runAPITests() {
  console.log('🧪 Running comprehensive API tests...\n');
  
  const results = {
    quran: false,
    prayer: false,
    cache: false,
    init: false,
  };
  
  // Run tests
  results.quran = await testQuranAPI();
  console.log('');
  
  results.prayer = await testPrayerAPI();
  console.log('');
  
  results.cache = await testCache();
  console.log('');
  
  results.init = await testAppInitialization();
  console.log('');
  
  // Summary
  console.log('📊 Test Summary:');
  console.log('  Quran API:', results.quran ? '✅ PASS' : '❌ FAIL');
  console.log('  Prayer API:', results.prayer ? '✅ PASS' : '❌ FAIL');
  console.log('  Cache System:', results.cache ? '✅ PASS' : '❌ FAIL');
  console.log('  App Init:', results.init ? '✅ PASS' : '❌ FAIL');
  
  const passCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passCount}/${totalTests} tests passed`);
  
  if (passCount === totalTests) {
    console.log('🎉 All tests passed! API integration is working correctly.');
  } else if (passCount > 0) {
    console.log('⚠️  Partial success. Some APIs may be offline or misconfigured.');
  } else {
    console.log('❌ All tests failed. Check your internet connection and API configuration.');
  }
  
  return results;
}

/**
 * Performance test for API calls
 */
export async function testAPIPerformance() {
  console.log('⚡ Testing API Performance...');
  
  const tests = [
    {
      name: 'Quran Sample Ayah',
      fn: () => quranClient.getSampleAyahPair(),
    },
    {
      name: 'Prayer Times',
      fn: () => PrayerService.getCurrentPrayerTimes(),
    },
    {
      name: 'Daily Inspiration',
      fn: () => QuranService.getDailyInspiration(),
    },
  ];
  
  for (const test of tests) {
    const startTime = Date.now();
    
    try {
      await test.fn();
      const duration = Date.now() - startTime;
      console.log(`  ✅ ${test.name}: ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`  ❌ ${test.name}: Failed after ${duration}ms`);
    }
  }
}

// Export for debugging/development use
export const APITester = {
  testQuranAPI,
  testPrayerAPI,
  testCache,
  testAppInitialization,
  runAPITests,
  testAPIPerformance,
};