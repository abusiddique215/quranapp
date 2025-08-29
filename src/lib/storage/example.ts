/**
 * Database Usage Examples
 * Demonstrates how to use the Quran reading app database system
 */

import {
  initStorageWithUser,
  saveReadingProgress,
  getReadingStats,
  startReadingSession,
  endReadingSession,
  addBookmark,
  toggleBookmark,
  listBookmarks,
  saveUserPreferences,
  getUserPreferences,
  exportUserData,
  getStorageStats
} from './index';

/**
 * Example: Complete user reading session workflow
 */
export async function exampleReadingSession() {
  console.log('📚 Starting example reading session...');

  try {
    // Initialize database and create/get user
    const { user, isNewUser } = await initStorageWithUser(
      'example_user_123',
      'reader@quranapp.com',
      'Example Reader'
    );

    if (!user) {
      throw new Error('Failed to create or retrieve user');
    }

    console.log(`✅ User ${isNewUser ? 'created' : 'retrieved'}: ${user.name}`);

    // Set user preferences
    await saveUserPreferences(user.id!, {
      font_size: 20,
      show_translation: true,
      show_transliteration: false,
      theme: 'light',
      language: 'en',
      audio_reciter: 'mishary',
      auto_scroll: true
    });
    console.log('✅ User preferences saved');

    // Start a reading session
    const sessionResult = await startReadingSession(user.id!);
    const sessionId = sessionResult.data.id!;
    console.log(`✅ Reading session started (ID: ${sessionId})`);

    // Simulate reading Al-Fatiha (Chapter 1, verses 1-7)
    const alFatihaAyahs = [
      { ayah: '1:1', duration: 45, note: 'Bismillah - In the name of Allah' },
      { ayah: '1:2', duration: 30, note: 'Praise be to Allah, Lord of the worlds' },
      { ayah: '1:3', duration: 25, note: 'The Compassionate, the Merciful' },
      { ayah: '1:4', duration: 30, note: 'Master of the Day of Judgment' },
      { ayah: '1:5', duration: 35, note: 'You we worship and You we ask for help' },
      { ayah: '1:6', duration: 40, note: 'Guide us to the straight path' },
      { ayah: '1:7', duration: 55, note: 'Path of those You have blessed' }
    ];

    console.log('📖 Reading Al-Fatiha...');
    for (const { ayah, duration, note } of alFatihaAyahs) {
      // Track reading progress
      await saveReadingProgress(user.id!, ayah, duration);
      
      // Bookmark special verses with notes
      if (ayah === '1:1' || ayah === '1:5') {
        await addBookmark(user.id!, ayah, note);
      }
      
      console.log(`   📝 Read ${ayah} (${duration}s): ${note}`);\n      // Simulate reading time\n      await new Promise(resolve => setTimeout(resolve, 100));\n    }\n\n    // End the reading session\n    await endReadingSession(sessionId, [1], 7); // Read Surah 1, 7 ayahs\n    console.log('✅ Reading session completed');\n\n    // Add a few more bookmarks for demonstration\n    await addBookmark(user.id!, '2:255', 'Ayat al-Kursi - The Throne Verse');\n    await addBookmark(user.id!, '112:1', 'Surah Al-Ikhlas - Declaration of Unity');\n    await addBookmark(user.id!, '114:1', 'Surah An-Nas - Seeking refuge in Allah');\n\n    // Get reading statistics\n    const stats = await getReadingStats(user.id!);\n    console.log('\\n📊 Reading Statistics:');\n    console.log(`   Total ayahs read: ${stats.total_ayahs_read}`);\n    console.log(`   Total reading time: ${Math.floor(stats.total_reading_time / 60)}m ${stats.total_reading_time % 60}s`);\n    console.log(`   Longest session: ${stats.longest_session}s`);\n    console.log(`   Last read ayah: ${stats.last_read_ayah}`);\n    console.log(`   Sessions completed: ${stats.total_sessions}`);\n\n    // List bookmarks\n    const bookmarks = await listBookmarks(user.id!, { limit: 10 });\n    console.log(`\\n🔖 Bookmarks (${bookmarks.length}):`);\n    bookmarks.forEach(bookmark => {\n      console.log(`   ${bookmark.ayah_key}: ${bookmark.note || 'No note'}`);\n    });\n\n    // Get storage statistics\n    const storageStats = await getStorageStats(user.id!);\n    console.log('\\n💾 Storage Statistics:');\n    console.log(`   Platform: ${storageStats.platform}`);\n    console.log(`   Database version: ${storageStats.database.version}`);\n    console.log(`   Bookmarks: ${storageStats.user.bookmarksCount}`);\n    console.log(`   Reading progress entries: ${storageStats.user.readingProgressCount}`);\n    console.log(`   Has preferences: ${storageStats.user.hasPreferences}`);\n\n    console.log('\\n🎉 Example reading session completed successfully!');\n    \n    return {\n      userId: user.id!,\n      stats,\n      bookmarks: bookmarks.length,\n      storageStats\n    };\n\n  } catch (error) {\n    console.error('❌ Example reading session failed:', error);\n    throw error;\n  }\n}\n\n/**\n * Example: Bookmark management\n */\nexport async function exampleBookmarkManagement() {\n  console.log('🔖 Starting bookmark management example...');\n\n  try {\n    const { user } = await initStorageWithUser(\n      'bookmark_user_456',\n      'bookmarks@quranapp.com',\n      'Bookmark Manager'\n    );\n\n    if (!user) throw new Error('Failed to get user');\n\n    // Add various bookmarks\n    const bookmarksToAdd = [\n      { ayah: '1:1', note: 'Opening of the Quran - Bismillah' },\n      { ayah: '2:255', note: 'Ayat al-Kursi - Most powerful verse' },\n      { ayah: '18:10', note: 'Story of the Cave - Young believers' },\n      { ayah: '55:13', note: 'Which favors of your Lord will you deny?' },\n      { ayah: '67:1', note: 'Blessed is He in whose hand is dominion' }\n    ];\n\n    console.log('📚 Adding bookmarks...');\n    for (const { ayah, note } of bookmarksToAdd) {\n      await addBookmark(user.id!, ayah, note);\n      console.log(`   ✅ Added bookmark: ${ayah}`);\n    }\n\n    // List all bookmarks\n    let bookmarks = await listBookmarks(user.id!);\n    console.log(`\\n📖 All bookmarks (${bookmarks.length}):`);\n    bookmarks.forEach(b => console.log(`   ${b.ayah_key}: ${b.note}`));\n\n    // Toggle a bookmark (remove it)\n    console.log('\\n🔄 Toggling bookmark 18:10...');\n    const isBookmarked = await toggleBookmark(user.id!, '18:10');\n    console.log(`   Bookmark 18:10 is now: ${isBookmarked ? 'saved' : 'removed'}`);\n\n    // Update a bookmark note\n    console.log('\\n✏️ Updating bookmark note...');\n    await updateBookmarkNote(\n      user.id!,\n      '2:255',\n      'Updated: Ayat al-Kursi - Allah, there is no deity except Him'\n    );\n    console.log('   ✅ Updated note for 2:255');\n\n    // Get final bookmark list\n    bookmarks = await listBookmarks(user.id!);\n    console.log(`\\n📖 Final bookmarks (${bookmarks.length}):`);\n    bookmarks.forEach(b => console.log(`   ${b.ayah_key}: ${b.note}`));\n\n    console.log('\\n🎉 Bookmark management example completed!');\n    \n    return bookmarks;\n\n  } catch (error) {\n    console.error('❌ Bookmark management example failed:', error);\n    throw error;\n  }\n}\n\n/**\n * Example: Data export and user preferences\n */\nexport async function exampleDataExport() {\n  console.log('💾 Starting data export example...');\n\n  try {\n    const { user } = await initStorageWithUser(\n      'export_user_789',\n      'export@quranapp.com',\n      'Export User'\n    );\n\n    if (!user) throw new Error('Failed to get user');\n\n    // Add some sample data\n    await saveUserPreferences(user.id!, {\n      font_size: 22,\n      show_translation: true,\n      show_transliteration: true,\n      theme: 'dark',\n      language: 'ar',\n      audio_reciter: 'sudais',\n      auto_scroll: false\n    });\n\n    // Add reading progress\n    const progressData = [\n      { ayah: '2:1', duration: 60 },\n      { ayah: '2:2', duration: 45 },\n      { ayah: '2:3', duration: 55 }\n    ];\n\n    for (const { ayah, duration } of progressData) {\n      await saveReadingProgress(user.id!, ayah, duration);\n    }\n\n    // Add bookmarks\n    await addBookmark(user.id!, '2:1', 'Alif Lam Meem');\n    await addBookmark(user.id!, '2:2', 'This is the Book about which there is no doubt');\n\n    // Export all data\n    console.log('📤 Exporting user data...');\n    const exportedData = await exportUserData(user.id!);\n    \n    console.log('\\n📊 Exported Data Summary:');\n    console.log(`   User: ${exportedData.user?.name || 'Unknown'}`);\n    console.log(`   Bookmarks: ${exportedData.bookmarks.length}`);\n    console.log(`   Reading Progress: ${exportedData.readingProgress.length}`);\n    console.log(`   Has Preferences: ${!!exportedData.preferences}`);\n    console.log(`   Export Date: ${exportedData.exportDate}`);\n    console.log(`   Platform: ${exportedData.platform}`);\n    \n    // Show preferences\n    if (exportedData.preferences) {\n      console.log('\\n⚙️ User Preferences:');\n      console.log(`   Font Size: ${exportedData.preferences.font_size}`);\n      console.log(`   Theme: ${exportedData.preferences.theme}`);\n      console.log(`   Language: ${exportedData.preferences.language}`);\n      console.log(`   Audio Reciter: ${exportedData.preferences.audio_reciter}`);\n      console.log(`   Show Translation: ${exportedData.preferences.show_translation}`);\n    }\n\n    console.log('\\n🎉 Data export example completed!');\n    \n    return exportedData;\n\n  } catch (error) {\n    console.error('❌ Data export example failed:', error);\n    throw error;\n  }\n}\n\n/**\n * Run all examples\n */\nexport async function runAllExamples() {\n  console.log('🚀 Running all database examples...\\n');\n  \n  try {\n    const results = await Promise.all([\n      exampleReadingSession(),\n      exampleBookmarkManagement(),\n      exampleDataExport()\n    ]);\n    \n    console.log('\\n' + '='.repeat(60));\n    console.log('🎊 All examples completed successfully!');\n    console.log('='.repeat(60));\n    \n    return results;\n    \n  } catch (error) {\n    console.error('❌ Examples failed:', error);\n    throw error;\n  }\n}