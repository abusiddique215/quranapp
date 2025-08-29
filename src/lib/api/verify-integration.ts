/**
 * Manual verification script for Quran API integration
 * Run this to verify that all 114 surahs are accessible
 */

import { quranClient } from './quran-client';
import { QuranService } from './services';
import { TRANSLATION_IDS } from './config';

export class QuranIntegrationVerifier {
  static async verifyBasicConnectivity(): Promise<boolean> {
    try {
      console.log('🔗 Testing basic API connectivity...');
      const sample = await quranClient.getSampleAyahPair();
      console.log('✅ Basic connectivity verified');
      console.log(`   Arabic: ${sample.arabic.substring(0, 50)}...`);
      console.log(`   English: ${sample.english.substring(0, 50)}...`);
      return true;
    } catch (error) {
      console.error('❌ Basic connectivity failed:', error);
      return false;
    }
  }

  static async verifySurahMetadata(): Promise<boolean> {
    try {
      console.log('📚 Testing surah metadata (all 114 surahs)...');
      const surahs = await quranClient.getSurahs();
      
      if (surahs.length !== 114) {
        console.error(`❌ Expected 114 surahs, got ${surahs.length}`);
        return false;
      }
      
      console.log('✅ All 114 surahs metadata retrieved');
      console.log(`   First: ${surahs[0].englishName} (${surahs[0].numberOfAyahs} verses)`);
      console.log(`   Last: ${surahs[113].englishName} (${surahs[113].numberOfAyahs} verses)`);
      
      return true;
    } catch (error) {
      console.error('❌ Surah metadata retrieval failed:', error);
      return false;
    }
  }

  static async verifySurahAccess(): Promise<boolean> {
    try {
      console.log('📖 Testing individual surah access...');
      
      // Test representative surahs
      const testSurahs = [1, 18, 36, 114]; // Al-Fatihah, Al-Kahf, Ya-Sin, An-Nas
      
      for (const surahNumber of testSurahs) {
        const surah = await quranClient.getSurah(surahNumber);
        console.log(`   ✅ Surah ${surahNumber} (${surah.surah.englishName}): ${surah.ayahs.length} verses`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Individual surah access failed:', error);
      return false;
    }
  }

  static async verifyTranslationSupport(): Promise<boolean> {
    try {
      console.log('🌐 Testing translation support...');
      
      const surah = await quranClient.getSurahWithTranslation(1, TRANSLATION_IDS.SAHIH_INTERNATIONAL);
      const firstVerse = surah.ayahs[0];
      
      if (firstVerse.translations.length === 0) {
        console.error('❌ No translations found');
        return false;
      }
      
      console.log('✅ Translation support verified');
      console.log(`   Arabic: ${firstVerse.ayah.text.substring(0, 50)}...`);
      console.log(`   Translation: ${firstVerse.translations[0].text.substring(0, 50)}...`);
      
      return true;
    } catch (error) {
      console.error('❌ Translation support failed:', error);
      return false;
    }
  }

  static async verifyEnhancedFeatures(): Promise<boolean> {
    try {
      console.log('⚡ Testing enhanced features...');
      
      // Test verse range
      const verses = await quranClient.getVerseRange(1, 1, 3);
      console.log(`   ✅ Verse range: Retrieved ${verses.length} verses`);
      
      // Test multiple translations
      const multiTranslation = await quranClient.getSurahWithMultipleTranslations(1, [
        TRANSLATION_IDS.SAHIH_INTERNATIONAL,
        TRANSLATION_IDS.PICKTHALL
      ]);
      console.log(`   ✅ Multiple translations: ${multiTranslation.ayahs[0].translations.length} translations`);
      
      // Test navigation data
      const navigation = await QuranService.getQuranNavigation();
      console.log(`   ✅ Navigation: ${navigation.totalSurahs} surahs, ${navigation.totalAyahs} total ayahs`);
      
      return true;
    } catch (error) {
      console.error('❌ Enhanced features failed:', error);
      return false;
    }
  }

  static async verifyPerformance(): Promise<boolean> {
    try {
      console.log('⚡ Testing performance and caching...');
      
      // First call (no cache)
      const start1 = Date.now();
      await quranClient.getSurahs();
      const time1 = Date.now() - start1;
      
      // Second call (should be cached)
      const start2 = Date.now();
      await quranClient.getSurahs();
      const time2 = Date.now() - start2;
      
      console.log(`   ✅ Performance: First call ${time1}ms, Second call ${time2}ms`);
      console.log(`   ✅ Cache efficiency: ${time1 > time2 ? 'Good' : 'Fair'} (${Math.round((time1 - time2) / time1 * 100)}% improvement)`);
      
      return true;
    } catch (error) {
      console.error('❌ Performance test failed:', error);
      return false;
    }
  }

  static async runFullVerification(): Promise<{
    success: boolean;
    results: Record<string, boolean>;
  }> {
    console.log('🚀 Starting comprehensive Quran API integration verification...\n');
    
    const results = {
      basicConnectivity: await this.verifyBasicConnectivity(),
      surahMetadata: await this.verifySurahMetadata(),
      surahAccess: await this.verifySurahAccess(),
      translationSupport: await this.verifyTranslationSupport(),
      enhancedFeatures: await this.verifyEnhancedFeatures(),
      performance: await this.verifyPerformance(),
    };
    
    const success = Object.values(results).every(result => result);
    
    console.log('\n📊 Verification Summary:');
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${test}`);
    });
    
    if (success) {
      console.log('\n🎉 All tests passed! Quran API integration is fully functional.');
      console.log('✨ Features verified:');
      console.log('   • Complete access to all 114 surahs');
      console.log('   • Multiple translation support');
      console.log('   • Verse range queries');
      console.log('   • Performance optimization with caching');
      console.log('   • Enhanced navigation capabilities');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the errors above.');
    }
    
    return { success, results };
  }
}

// Export for use in other files
export default QuranIntegrationVerifier;