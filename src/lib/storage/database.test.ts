/**
 * Database Functionality Tests and Sample Operations
 * Comprehensive testing suite for the Quran reading app database
 */

import {
  initializeDatabase,
  createUser,
  getUserByClerkId,
  saveReadingProgress,
  getReadingProgress,
  getReadingStats,
  startReadingSession,
  endReadingSession,
  addBookmark,
  removeBookmark,
  listBookmarks,
  updateBookmarkNote,
  getUserPreferences,
  saveUserPreferences,
  saveResume,
  getResume,
  getDatabaseInfo,
  clearUserData
} from './sqlite';

import {
  User,
  ReadingProgress,
  ReadingSession,
  Bookmark,
  UserPreferences,
  DatabaseError,
  ValidationError
} from './models';

// Test data
const testUser: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
  clerk_user_id: 'test_user_123',
  email: 'test@example.com',
  name: 'Test User'
};

const testPreferences: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  font_size: 18,
  show_translation: true,
  show_transliteration: false,
  theme: 'dark',
  language: 'en',
  audio_reciter: 'mishary',
  auto_scroll: true
};

/**
 * Run comprehensive database tests
 */
export async function runDatabaseTests(): Promise<{
  success: boolean;
  results: string[];
  errors: string[];
}> {
  const results: string[] = [];
  const errors: string[] = [];
  
  try {
    results.push('🔧 Starting database tests...');
    
    // Initialize database
    await initializeDatabase();
    results.push('✅ Database initialized successfully');
    
    // Test database info
    const dbInfo = await getDatabaseInfo();
    results.push(`✅ Database info: version ${dbInfo?.version}, initialized at ${dbInfo?.initialized_at}`);\n    
    // Test user creation
    const userResult = await createUser(testUser);\n    const userId = userResult.data.id!;\n    results.push(`✅ User created with ID: ${userId}`);\n    
    // Test user retrieval\n    const retrievedUser = await getUserByClerkId(testUser.clerk_user_id);\n    if (retrievedUser && retrievedUser.email === testUser.email) {\n      results.push('✅ User retrieval successful');\n    } else {\n      errors.push('❌ User retrieval failed');\n    }\n    \n    // Test user preferences\n    await saveUserPreferences(userId, testPreferences);\n    results.push('✅ User preferences saved');\n    \n    const savedPrefs = await getUserPreferences(userId);\n    if (savedPrefs && savedPrefs.font_size === testPreferences.font_size) {\n      results.push('✅ User preferences retrieved successfully');\n    } else {\n      errors.push('❌ User preferences retrieval failed');\n    }\n    \n    // Test reading progress\n    await saveReadingProgress(userId, '2:255', 300); // Al-Baqarah, Ayat al-Kursi, 5 min session\n    await saveReadingProgress(userId, '1:1', 120);   // Al-Fatiha, verse 1, 2 min session\n    await saveReadingProgress(userId, '1:7', 180);   // Al-Fatiha, verse 7, 3 min session\n    results.push('✅ Reading progress saved for multiple ayahs');\n    \n    const progress = await getReadingProgress(userId, { limit: 10 });\n    if (progress.length === 3) {\n      results.push(`✅ Reading progress retrieved: ${progress.length} entries`);\n    } else {\n      errors.push(`❌ Expected 3 progress entries, got ${progress.length}`);\n    }\n    \n    // Test reading stats\n    const stats = await getReadingStats(userId);\n    if (stats.total_ayahs_read === 3 && stats.total_reading_time === 600) {\n      results.push(`✅ Reading stats calculated: ${stats.total_ayahs_read} ayahs, ${stats.total_reading_time}s total`);\n    } else {\n      errors.push(`❌ Reading stats incorrect: ${stats.total_ayahs_read} ayahs, ${stats.total_reading_time}s`);\n    }\n    \n    // Test reading sessions\n    const sessionResult = await startReadingSession(userId);\n    const sessionId = sessionResult.data.id!;\n    results.push(`✅ Reading session started with ID: ${sessionId}`);\n    \n    // Simulate some reading time\n    await new Promise(resolve => setTimeout(resolve, 1000));\n    \n    const endedSession = await endReadingSession(sessionId, [1, 2], 10);\n    if (endedSession.data.end_time && endedSession.data.total_duration > 0) {\n      results.push(`✅ Reading session ended: ${endedSession.data.total_duration}s duration`);\n    } else {\n      errors.push('❌ Reading session end failed');\n    }\n    \n    // Test bookmarks\n    await addBookmark(userId, '2:255', 'Beautiful verse about Allah\\'s knowledge');\n    await addBookmark(userId, '1:1', 'Opening of the Quran');\n    await addBookmark(userId, '112:1', 'Declaration of monotheism');\n    results.push('✅ Bookmarks added with notes');\n    \n    const bookmarks = await listBookmarks(userId);\n    if (bookmarks.length === 3) {\n      results.push(`✅ Bookmarks retrieved: ${bookmarks.length} bookmarks`);\n    } else {\n      errors.push(`❌ Expected 3 bookmarks, got ${bookmarks.length}`);\n    }\n    \n    // Test bookmark note update\n    await updateBookmarkNote(userId, '2:255', 'Updated: The Throne Verse - most powerful ayah');\n    const updatedBookmarks = await listBookmarks(userId);\n    const updatedBookmark = updatedBookmarks.find(b => b.ayah_key === '2:255');\n    if (updatedBookmark && updatedBookmark.note?.includes('Updated:')) {\n      results.push('✅ Bookmark note updated successfully');\n    } else {\n      errors.push('❌ Bookmark note update failed');\n    }\n    \n    // Test bookmark removal\n    await removeBookmark(userId, '1:1');\n    const remainingBookmarks = await listBookmarks(userId);\n    if (remainingBookmarks.length === 2) {\n      results.push('✅ Bookmark removed successfully');\n    } else {\n      errors.push(`❌ Bookmark removal failed, ${remainingBookmarks.length} bookmarks remaining`);\n    }\n    \n    // Test resume functionality\n    await saveResume('2:100', userId);\n    const resumeAyah = await getResume();\n    if (resumeAyah === '2:100') {\n      results.push('✅ Resume functionality working');\n    } else {\n      errors.push(`❌ Resume functionality failed, got: ${resumeAyah}`);\n    }\n    \n    // Test error handling\n    try {\n      await saveReadingProgress(userId, 'invalid:ayah:key', 100);\n      errors.push('❌ Validation error not caught for invalid ayah key');\n    } catch (error) {\n      if (error instanceof ValidationError) {\n        results.push('✅ Validation error properly caught for invalid ayah key');\n      } else {\n        errors.push(`❌ Wrong error type caught: ${error.constructor.name}`);\n      }\n    }\n    \n    results.push('🧹 Cleaning up test data...');\n    \n    // Clean up - remove test user and all associated data\n    const cleanupResult = await clearUserData(userId);\n    if (cleanupResult.data) {\n      results.push(`✅ Test data cleaned up: ${cleanupResult.rowsAffected} records removed`);\n    } else {\n      errors.push('❌ Test data cleanup failed');\n    }\n    \n    results.push('🎉 Database tests completed!');\n    \n    return {\n      success: errors.length === 0,\n      results,\n      errors\n    };\n    \n  } catch (error) {\n    const errorMessage = error instanceof Error ? error.message : 'Unknown error';\n    errors.push(`❌ Test suite failed: ${errorMessage}`);\n    \n    return {\n      success: false,\n      results,\n      errors\n    };\n  }\n}\n\n/**\n * Run sample operations to demonstrate database functionality\n */\nexport async function runSampleOperations(): Promise<void> {\n  console.log('🚀 Running sample database operations...');\n  \n  try {\n    // Initialize database\n    await initializeDatabase();\n    console.log('✅ Database initialized');\n    \n    // Create a sample user\n    const sampleUser = await createUser({\n      clerk_user_id: 'sample_user_456',\n      email: 'sample@quranapp.com',\n      name: 'Sample Reader'\n    });\n    \n    const userId = sampleUser.data.id!;\n    console.log(`✅ Sample user created: ${sampleUser.data.name} (ID: ${userId})`);\n    \n    // Set user preferences\n    await saveUserPreferences(userId, {\n      font_size: 20,\n      show_translation: true,\n      show_transliteration: true,\n      theme: 'light',\n      language: 'en',\n      audio_reciter: 'abdulbasit',\n      auto_scroll: false\n    });\n    console.log('✅ User preferences saved');\n    \n    // Simulate a reading session\n    console.log('📖 Starting reading session...');\n    const session = await startReadingSession(userId);\n    const sessionId = session.data.id!;\n    \n    // Simulate reading different ayahs\n    const ayahsToRead = ['1:1', '1:2', '1:3', '1:4', '1:5', '1:6', '1:7']; // Complete Al-Fatiha\n    \n    for (const ayahKey of ayahsToRead) {\n      await saveReadingProgress(userId, ayahKey, 30); // 30 seconds per ayah\n      console.log(`   📝 Read ${ayahKey}`);\n    }\n    \n    // End the session\n    await endReadingSession(sessionId, [1], 7); // Read Surah 1 (Al-Fatiha), 7 ayahs\n    console.log('✅ Reading session completed');\n    \n    // Add some bookmarks\n    await addBookmark(userId, '1:1', 'In the name of Allah - Beautiful opening');\n    await addBookmark(userId, '2:255', 'Ayat al-Kursi - Throne Verse');\n    await addBookmark(userId, '112:1', 'Say: He is Allah, the One');\n    console.log('✅ Bookmarks added');\n    \n    // Get reading statistics\n    const stats = await getReadingStats(userId);\n    console.log(`📊 Reading Statistics:`);\n    console.log(`   Total ayahs read: ${stats.total_ayahs_read}`);\n    console.log(`   Total reading time: ${stats.total_reading_time} seconds`);\n    console.log(`   Last read ayah: ${stats.last_read_ayah}`);\n    console.log(`   Sessions completed: ${stats.total_sessions}`);\n    \n    // List bookmarks\n    const bookmarks = await listBookmarks(userId);\n    console.log(`🔖 Bookmarks (${bookmarks.length}):`);\n    bookmarks.forEach(bookmark => {\n      console.log(`   ${bookmark.ayah_key}: ${bookmark.note || 'No note'}`);\n    });\n    \n    // Set resume point\n    await saveResume('2:1', userId);\n    const resumePoint = await getResume();\n    console.log(`⏯️ Resume point set to: ${resumePoint}`);\n    \n    console.log('🎉 Sample operations completed successfully!');\n    \n  } catch (error) {\n    console.error('❌ Sample operations failed:', error);\n    throw error;\n  }\n}\n\n/**\n * Performance test for database operations\n */\nexport async function runPerformanceTest(): Promise<{\n  operationsPerSecond: number;\n  totalTime: number;\n  operationCount: number;\n}> {\n  console.log('⚡ Running performance test...');\n  \n  const startTime = Date.now();\n  const operationCount = 100;\n  \n  try {\n    await initializeDatabase();\n    \n    // Create test user\n    const user = await createUser({\n      clerk_user_id: 'perf_test_user',\n      email: 'perf@test.com',\n      name: 'Performance Test User'\n    });\n    const userId = user.data.id!;\n    \n    // Run multiple operations\n    for (let i = 0; i < operationCount; i++) {\n      const surahNum = Math.floor(Math.random() * 114) + 1;\n      const ayahNum = Math.floor(Math.random() * 50) + 1;\n      const ayahKey = `${surahNum}:${ayahNum}`;\n      \n      await saveReadingProgress(userId, ayahKey, Math.floor(Math.random() * 300));\n    }\n    \n    // Clean up\n    await clearUserData(userId);\n    \n    const totalTime = Date.now() - startTime;\n    const operationsPerSecond = Math.round((operationCount / totalTime) * 1000);\n    \n    console.log(`✅ Performance test completed:`);\n    console.log(`   Operations: ${operationCount}`);\n    console.log(`   Total time: ${totalTime}ms`);\n    console.log(`   Operations per second: ${operationsPerSecond}`);\n    \n    return {\n      operationsPerSecond,\n      totalTime,\n      operationCount\n    };\n    \n  } catch (error) {\n    console.error('❌ Performance test failed:', error);\n    throw error;\n  }\n}\n\n// Export test runner for easy execution\nexport async function runAllTests(): Promise<void> {\n  console.log('🧪 Starting comprehensive database test suite...');\n  \n  try {\n    // Run functionality tests\n    const testResults = await runDatabaseTests();\n    \n    console.log('\\n📋 Test Results:');\n    testResults.results.forEach(result => console.log(result));\n    \n    if (testResults.errors.length > 0) {\n      console.log('\\n❌ Errors:');\n      testResults.errors.forEach(error => console.log(error));\n    }\n    \n    // Run sample operations\n    console.log('\\n' + '='.repeat(50));\n    await runSampleOperations();\n    \n    // Run performance test\n    console.log('\\n' + '='.repeat(50));\n    await runPerformanceTest();\n    \n    console.log(`\\n🎉 All tests completed! Success: ${testResults.success}`);\n    \n  } catch (error) {\n    console.error('❌ Test suite failed:', error);\n    throw error;\n  }\n}