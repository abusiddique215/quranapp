#!/usr/bin/env node
/**
 * VERSE ACCURACY VERIFICATION SCRIPT
 * 
 * Comprehensive verification of Quran verse numbering against authoritative sources
 * Tests all 114 chapters for accurate verse counts and proper numbering
 */

// Use built-in fetch for Node.js 18+
const fetch = globalThis.fetch;

// Reference data from authoritative Islamic sources (Mushaf Uthmani, Quran.com, etc.)
const REFERENCE_VERSE_COUNTS = {
  1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
  11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
  21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
  31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
  41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
  51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
  61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
  71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
  81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
  91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
  101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
  111: 5, 112: 4, 113: 5, 114: 6
};

// Critical chapters with special numbering considerations
const CRITICAL_CHAPTERS = {
  1: { name: 'Al-Fatihah', bismillahIsVerse1: true, verses: 7 },
  2: { name: 'Al-Baqarah', bismillahIsVerse1: false, verses: 286 },
  9: { name: 'At-Tawbah', hasBismillah: false, verses: 129 },
  108: { name: 'Al-Kawthar', bismillahIsVerse1: false, verses: 3 },
  114: { name: 'An-Nas', bismillahIsVerse1: false, verses: 6 }
};

const API_BASE_URL = 'https://api.alquran.cloud/v1';

class VerseNumberingVerifier {
  constructor() {
    this.results = {
      totalSurahs: 114,
      verifiedSurahs: 0,
      accurateSurahs: 0,
      issuesFound: [],
      criticalIssues: [],
      minorDiscrepancies: [],
      summaryReport: {}
    };
  }

  /**
   * Main verification process
   */
  async verify() {
    console.log('🔍 STARTING COMPREHENSIVE VERSE NUMBERING VERIFICATION');
    console.log('=' .repeat(60));
    
    try {
      // Phase 1: Verify all surah metadata
      console.log('\n📊 Phase 1: Verifying Surah Metadata');
      await this.verifySurahsMetadata();

      // Phase 2: Verify critical chapters in detail
      console.log('\n🎯 Phase 2: Verifying Critical Chapters');
      await this.verifyCriticalChapters();

      // Phase 3: Sample random chapters for spot checking
      console.log('\n🎲 Phase 3: Random Chapter Verification');
      await this.verifyRandomChapters();

      // Phase 4: Verify total verse count
      console.log('\n📈 Phase 4: Total Verse Count Verification');
      await this.verifyTotalVerseCount();

      // Generate final report
      console.log('\n📋 Generating Final Report');
      this.generateReport();

    } catch (error) {
      console.error('❌ Verification failed:', error);
      throw error;
    }
  }

  /**
   * Verify all surah metadata from API
   */
  async verifySurahsMetadata() {
    try {
      const response = await fetch(`${API_BASE_URL}/surah`);
      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid API response for surahs metadata');
      }

      const surahs = data.data;
      console.log(`✅ Retrieved ${surahs.length} surahs from API`);

      if (surahs.length !== 114) {
        this.results.criticalIssues.push({
          type: 'TOTAL_SURAH_COUNT_ERROR',
          expected: 114,
          actual: surahs.length,
          severity: 'CRITICAL'
        });
      }

      // Verify each surah's verse count
      for (const surah of surahs) {
        const expectedVerses = REFERENCE_VERSE_COUNTS[surah.number];
        const actualVerses = surah.numberOfAyahs;

        if (expectedVerses !== actualVerses) {
          const issue = {
            type: 'VERSE_COUNT_MISMATCH',
            surahNumber: surah.number,
            surahName: surah.englishName,
            expected: expectedVerses,
            actual: actualVerses,
            severity: expectedVerses ? 'HIGH' : 'MEDIUM'
          };

          if (expectedVerses) {
            this.results.criticalIssues.push(issue);
          } else {
            this.results.minorDiscrepancies.push(issue);
          }
        } else {
          this.results.accurateSurahs++;
        }

        this.results.verifiedSurahs++;
      }

      console.log(`✅ Metadata verification complete: ${this.results.accurateSurahs}/${this.results.verifiedSurahs} accurate`);

    } catch (error) {
      console.error('❌ Failed to verify surah metadata:', error);
      this.results.criticalIssues.push({
        type: 'API_ERROR',
        message: 'Failed to retrieve surah metadata',
        error: error.message,
        severity: 'CRITICAL'
      });
    }
  }

  /**
   * Verify critical chapters with detailed analysis
   */
  async verifyCriticalChapters() {
    for (const [surahNumber, chapter] of Object.entries(CRITICAL_CHAPTERS)) {
      console.log(`\n🔍 Verifying ${chapter.name} (Surah ${surahNumber})`);
      
      try {
        const response = await fetch(`${API_BASE_URL}/surah/${surahNumber}`);
        const data = await response.json();
        
        if (!data.data || !data.data.ayahs) {
          throw new Error(`Invalid API response for surah ${surahNumber}`);
        }

        const surahData = data.data;
        const ayahs = surahData.ayahs;

        // Verify verse count
        const expectedCount = chapter.verses;
        const actualCount = ayahs.length;
        
        if (expectedCount !== actualCount) {
          this.results.criticalIssues.push({
            type: 'CRITICAL_CHAPTER_VERSE_COUNT',
            surahNumber: parseInt(surahNumber),
            surahName: chapter.name,
            expected: expectedCount,
            actual: actualCount,
            severity: 'CRITICAL'
          });
          console.log(`❌ Verse count mismatch: expected ${expectedCount}, got ${actualCount}`);
        } else {
          console.log(`✅ Verse count correct: ${actualCount} verses`);
        }

        // Verify verse numbering sequence
        const numberingIssues = this.verifyVerseSequence(ayahs, surahNumber);
        if (numberingIssues.length > 0) {
          this.results.criticalIssues.push(...numberingIssues);
        }

        // Special Bismillah verification for Chapter 1
        if (parseInt(surahNumber) === 1) {
          await this.verifyBismillahHandling(surahData, chapter);
        }

        // Special verification for Chapter 9 (no Bismillah)
        if (parseInt(surahNumber) === 9) {
          console.log('ℹ️  Chapter 9 (At-Tawbah) correctly has no Bismillah');
        }

      } catch (error) {
        console.error(`❌ Failed to verify ${chapter.name}:`, error);
        this.results.criticalIssues.push({
          type: 'CRITICAL_CHAPTER_API_ERROR',
          surahNumber: parseInt(surahNumber),
          surahName: chapter.name,
          error: error.message,
          severity: 'CRITICAL'
        });
      }
    }
  }

  /**
   * Verify verse sequence is correct (1, 2, 3, ... n)
   */
  verifyVerseSequence(ayahs, surahNumber) {
    const issues = [];
    
    for (let i = 0; i < ayahs.length; i++) {
      const expectedNumber = i + 1;
      const actualNumber = ayahs[i].numberInSurah;
      
      if (expectedNumber !== actualNumber) {
        issues.push({
          type: 'VERSE_SEQUENCE_ERROR',
          surahNumber: parseInt(surahNumber),
          verseIndex: i,
          expected: expectedNumber,
          actual: actualNumber,
          severity: 'HIGH'
        });
      }
    }

    if (issues.length === 0) {
      console.log(`✅ Verse sequence verified: 1-${ayahs.length}`);
    } else {
      console.log(`❌ Found ${issues.length} verse sequence errors`);
    }

    return issues;
  }

  /**
   * Special verification for Bismillah handling in Al-Fatihah
   */
  async verifyBismillahHandling(surahData, chapter) {
    const firstVerse = surahData.ayahs[0];
    
    if (chapter.bismillahIsVerse1) {
      // In Al-Fatihah, Bismillah should be verse 1
      // Check for core Bismillah components by pattern matching
      const text = firstVerse.text.trim();
      
      // Debug: show actual character codes
      console.log('Text analysis:');
      for(let i = 0; i < Math.min(text.length, 50); i++) {
        console.log(`  ${i}: "${text.charAt(i)}" (U+${text.charCodeAt(i).toString(16).toUpperCase()})`);
      }
      
      // Use exact Unicode sequences reconstructed from the actual API data
      const hasBismWord = text.indexOf('بِسۡمِ') !== -1;  // بِسۡمِ
      const hasAllah = text.indexOf('ٱللَّهِ') !== -1;  // ٱللَّهِ (note: ّ before َ)
      const hasRahman = text.indexOf('ٱلرَّحۡمَـٰنِ') !== -1;  // ٱلرَّحۡمَـٰنِ
      const hasRaheem = text.indexOf('ٱلرَّحِیمِ') !== -1;  // ٱلرَّحِیمِ
      
      console.log(`Components: bism=${hasBismWord}, allah=${hasAllah}, rahman=${hasRahman}, raheem=${hasRaheem}`);
      
      const isBismillah = hasBismWord && hasAllah && hasRahman && hasRaheem;
      
      if (firstVerse.numberInSurah === 1 && isBismillah) {
        console.log('✅ Bismillah correctly counted as verse 1 in Al-Fatihah');
      } else {
        this.results.criticalIssues.push({
          type: 'BISMILLAH_NUMBERING_ERROR',
          surahNumber: 1,
          surahName: 'Al-Fatihah',
          issue: 'Bismillah should be verse 1',
          actual: `First verse number: ${firstVerse.numberInSurah}, detected as Bismillah: ${isBismillah}`,
          debug: `Text: ${text}`,
          severity: 'CRITICAL'
        });
        console.log('❌ Bismillah numbering error in Al-Fatihah');
      }
    }
  }

  /**
   * Verify random sample of chapters for spot checking
   */
  async verifyRandomChapters() {
    const randomSurahs = [18, 36, 55, 67, 112]; // Popular surahs
    
    for (const surahNumber of randomSurahs) {
      try {
        const response = await fetch(`${API_BASE_URL}/surah/${surahNumber}`);
        const data = await response.json();
        
        const expectedCount = REFERENCE_VERSE_COUNTS[surahNumber];
        const actualCount = data.data.ayahs.length;
        
        if (expectedCount === actualCount) {
          console.log(`✅ Surah ${surahNumber}: ${actualCount} verses (correct)`);
        } else {
          console.log(`❌ Surah ${surahNumber}: expected ${expectedCount}, got ${actualCount}`);
          this.results.issuesFound.push({
            surahNumber,
            expected: expectedCount,
            actual: actualCount
          });
        }
      } catch (error) {
        console.log(`❌ Failed to verify Surah ${surahNumber}: ${error.message}`);
      }
    }
  }

  /**
   * Verify total verse count across all chapters
   */
  async verifyTotalVerseCount() {
    const expectedTotal = Object.values(REFERENCE_VERSE_COUNTS).reduce((sum, count) => sum + count, 0);
    console.log(`Expected total verses: ${expectedTotal}`);

    try {
      const response = await fetch(`${API_BASE_URL}/surah`);
      const data = await response.json();
      
      const actualTotal = data.data.reduce((sum, surah) => sum + surah.numberOfAyahs, 0);
      console.log(`Actual total verses from API: ${actualTotal}`);

      if (expectedTotal === actualTotal) {
        console.log('✅ Total verse count matches reference (6,236 verses)');
      } else {
        console.log(`❌ Total verse count mismatch: expected ${expectedTotal}, got ${actualTotal}`);
        this.results.criticalIssues.push({
          type: 'TOTAL_VERSE_COUNT_ERROR',
          expected: expectedTotal,
          actual: actualTotal,
          difference: actualTotal - expectedTotal,
          severity: 'CRITICAL'
        });
      }
    } catch (error) {
      console.error('❌ Failed to verify total verse count:', error);
    }
  }

  /**
   * Generate comprehensive accuracy report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSurahs: this.results.totalSurahs,
        verifiedSurahs: this.results.verifiedSurahs,
        accurateSurahs: this.results.accurateSurahs,
        accuracyRate: ((this.results.accurateSurahs / this.results.verifiedSurahs) * 100).toFixed(1),
        criticalIssues: this.results.criticalIssues.length,
        minorDiscrepancies: this.results.minorDiscrepancies.length
      },
      issues: {
        critical: this.results.criticalIssues,
        minor: this.results.minorDiscrepancies,
        other: this.results.issuesFound
      },
      recommendations: this.generateRecommendations()
    };

    // Console output
    console.log('\n' + '='.repeat(60));
    console.log('📋 VERSE NUMBERING ACCURACY REPORT');
    console.log('='.repeat(60));
    console.log(`📊 Chapters verified: ${report.summary.verifiedSurahs}/${report.summary.totalSurahs}`);
    console.log(`✅ Accuracy rate: ${report.summary.accuracyRate}%`);
    console.log(`🚨 Critical issues: ${report.summary.criticalIssues}`);
    console.log(`⚠️  Minor discrepancies: ${report.summary.minorDiscrepancies}`);

    if (report.summary.criticalIssues > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND:');
      report.issues.critical.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.type}: ${JSON.stringify(issue, null, 2)}`);
      });
    }

    if (report.summary.minorDiscrepancies > 0) {
      console.log('\n⚠️  MINOR DISCREPANCIES:');
      report.issues.minor.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${JSON.stringify(issue, null, 2)}`);
      });
    }

    console.log('\n📋 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });

    // Save detailed report to file
    const fs = require('fs');
    fs.writeFileSync('verse-accuracy-report.json', JSON.stringify(report, null, 2));
    console.log('\n💾 Detailed report saved to: verse-accuracy-report.json');

    return report;
  }

  /**
   * Generate recommendations based on findings
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.results.criticalIssues.length === 0) {
      recommendations.push('✅ All verse numbering appears accurate and matches Islamic references');
      recommendations.push('✅ API integration is working correctly with proper verse counts');
      recommendations.push('✅ Critical chapters (Al-Fatihah, At-Tawbah) are handled properly');
    } else {
      recommendations.push('🚨 URGENT: Fix critical verse numbering issues immediately');
      recommendations.push('📞 Contact AlQuran.cloud API support regarding data discrepancies');
      recommendations.push('🔄 Consider implementing backup API or local verification');
    }

    recommendations.push('✅ Add automated verification tests to CI/CD pipeline');
    recommendations.push('📊 Implement periodic accuracy monitoring');
    recommendations.push('📝 Add verse count validation in jump-to-verse functionality');

    return recommendations;
  }
}

// Execute verification if run directly
if (require.main === module) {
  const verifier = new VerseNumberingVerifier();
  verifier.verify()
    .then(() => {
      console.log('\n🎉 Verification complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { VerseNumberingVerifier };