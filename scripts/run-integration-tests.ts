#!/usr/bin/env npx ts-node

/**
 * Integration Test Runner
 * Runs comprehensive tests and generates detailed reports
 */

import { integrationTestRunner } from '../tests/integration-test';

async function main() {
  console.log('🚀 Quran App Integration Test Suite');
  console.log('=====================================\n');
  
  try {
    // Run the full integration test suite
    const results = await integrationTestRunner.runFullIntegrationSuite();
    
    console.log('\n📊 FINAL TEST RESULTS');
    console.log('===================');
    console.log(`Overall Success: ${results.overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Total Tests: ${results.summary.totalTests}`);
    console.log(`Passed: ${results.summary.passedTests}`);
    console.log(`Failed: ${results.summary.failedTests}`);
    console.log(`Success Rate: ${((results.summary.passedTests / results.summary.totalTests) * 100).toFixed(1)}%`);
    
    console.log('\n📈 PERFORMANCE METRICS');
    console.log('====================');
    console.log(`Average Response Time: ${results.performanceMetrics.averageResponseTime}ms`);
    console.log(`Max Response Time: ${results.performanceMetrics.maxResponseTime}ms`);
    console.log(`Min Response Time: ${results.performanceMetrics.minResponseTime}ms`);
    console.log(`Failure Rate: ${results.performanceMetrics.failureRate.toFixed(2)}%`);
    
    console.log('\n🎯 PHASE RESULTS');
    console.log('===============');
    console.log(`API Integration: ${results.phases.apiIntegration ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`User Journeys: ${results.phases.userJourneys ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Error Handling: ${results.phases.errorHandling ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Performance: ${results.phases.performance ? '✅ PASS' : '❌ FAIL'}`);
    
    if (results.summary.failedTests > 0) {
      console.log('\n❌ FAILED TESTS');
      console.log('==============');
      results.detailedResults
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`• ${test.testName}: ${test.error}`);
        });
    }
    
    console.log('\n⚡ PERFORMANCE HIGHLIGHTS');
    console.log('=======================');
    console.log(`Fastest Test: ${results.summary.bestPerformer}`);
    console.log(`Slowest Test: ${results.summary.worstPerformer}`);
    
    // Performance target validation
    console.log('\n🎯 TARGET VALIDATION');
    console.log('==================');
    const targets = {
      loadTime: { target: 2000, actual: results.performanceMetrics.averageResponseTime, unit: 'ms' },
      successRate: { target: 95, actual: (results.summary.passedTests / results.summary.totalTests) * 100, unit: '%' }
    };
    
    Object.entries(targets).forEach(([key, data]) => {
      const met = key === 'loadTime' ? data.actual <= data.target : data.actual >= data.target;
      console.log(`${key}: ${data.actual}${data.unit} (target: ${key === 'loadTime' ? '≤' : '≥'}${data.target}${data.unit}) ${met ? '✅' : '❌'}`);
    });
    
    if (results.overallSuccess) {
      console.log('\n🎉 ALL SYSTEMS GO! Quran app is ready for production.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed. Please review and fix issues before deployment.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Test suite crashed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}