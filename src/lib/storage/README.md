# Quran Reading App Database Implementation

Comprehensive offline-first database system for the Quran reading app with support for user management, reading progress tracking, bookmarks, and preferences.

## 🏗️ Architecture

The database system is built with a **platform-agnostic approach**:

- **Native (iOS/Android)**: Uses SQLite through expo-sqlite
- **Web**: Uses localStorage with structured data management
- **Unified API**: Single interface that automatically handles platform differences

## 📊 Database Schema

### Core Entities

1. **users** - User account management
   ```sql
   id, clerk_user_id, email, name, created_at, updated_at
   ```

2. **reading_progress** - Individual ayah reading tracking
   ```sql
   id, user_id, surah_number, ayah_number, timestamp, session_duration, created_at
   ```

3. **reading_sessions** - Complete reading session tracking
   ```sql
   id, user_id, start_time, end_time, surahs_read, ayahs_read, total_duration, created_at, updated_at
   ```

4. **bookmarks** - Enhanced bookmark system with notes
   ```sql
   id, user_id, surah_number, ayah_number, ayah_key, note, created_at, updated_at
   ```

5. **user_preferences** - User customization settings
   ```sql
   id, user_id, font_size, show_translation, show_transliteration, theme, language, audio_reciter, auto_scroll, created_at, updated_at
   ```

6. **resume_state** - Last reading position (legacy compatibility)
   ```sql
   id, ayah_key, user_id, updated_at
   ```

## 🚀 Key Features

### ✅ Offline-First Design
- **SQLite** for native apps with ACID transactions
- **localStorage** fallback for web with structured data
- **Automatic sync** between storage mechanisms

### ✅ Comprehensive User Management
- **Clerk integration** for authentication
- **User preferences** with theme, language, and audio settings
- **Reading statistics** and progress tracking

### ✅ Advanced Reading Progress
- **Ayah-level tracking** with session duration
- **Session management** with start/end times
- **Statistical analysis** including streaks and completion

### ✅ Enhanced Bookmarks
- **Note support** for personal reflections
- **Organized by user** with creation timestamps
- **Easy management** with add/remove/update operations

### ✅ Performance & Reliability
- **Database transactions** for data consistency
- **Error handling** with custom error types
- **Performance indexes** for fast queries
- **Migration system** for schema updates

### ✅ Developer Experience
- **TypeScript interfaces** for type safety
- **Comprehensive testing** suite
- **Legacy compatibility** for existing apps
- **Import/Export functionality** for data backup

## 📚 Usage Examples

### Initialize Database
```typescript
import { initStorage, initStorageWithUser } from '@/lib/storage';

// Basic initialization
await initStorage();

// Initialize with user setup
const { user, isNewUser } = await initStorageWithUser(
  'clerk_user_123',
  'user@example.com',
  'John Doe'
);
```

### User Management
```typescript
import { createUser, getUserByClerkId, saveUserPreferences } from '@/lib/storage';

// Create new user
const result = await createUser({
  clerk_user_id: 'clerk_123',
  email: 'user@example.com',
  name: 'John Doe'
});

// Get user
const user = await getUserByClerkId('clerk_123');

// Save preferences
await saveUserPreferences(user.id, {
  font_size: 18,
  theme: 'dark',
  show_translation: true,
  language: 'en'
});
```

### Reading Progress
```typescript
import { saveReadingProgress, getReadingStats, startReadingSession, endReadingSession } from '@/lib/storage';

// Track reading progress
await saveReadingProgress(userId, '2:255', 300); // Ayat al-Kursi, 5 minutes

// Start reading session
const session = await startReadingSession(userId);

// End session
await endReadingSession(session.data.id, [1, 2], 15); // Read surahs 1&2, 15 ayahs

// Get reading statistics
const stats = await getReadingStats(userId);
console.log(`Total ayahs read: ${stats.total_ayahs_read}`);
console.log(`Total reading time: ${stats.total_reading_time} seconds`);
```

### Bookmarks
```typescript
import { addBookmark, listBookmarks, toggleBookmark, updateBookmarkNote } from '@/lib/storage';

// Add bookmark with note
await addBookmark(userId, '2:255', 'Beautiful verse about Allah\'s knowledge');

// Toggle bookmark
const isBookmarked = await toggleBookmark(userId, '1:1');

// Update note
await updateBookmarkNote(userId, '2:255', 'Updated: The Throne Verse');

// List all bookmarks
const bookmarks = await listBookmarks(userId, { limit: 50 });
```

### Data Management
```typescript
import { exportUserData, importUserData, clearUserData } from '@/lib/storage';

// Export user data for backup
const backup = await exportUserData(userId);

// Import data from backup
const result = await importUserData(userId, backup);

// Clear user data
await clearUserData(userId);
```

## 🧪 Testing

### Run Tests
```typescript
import { runAllTests, runDatabaseTests, runSampleOperations } from '@/lib/storage/database.test';

// Run comprehensive test suite
await runAllTests();

// Run specific tests
const results = await runDatabaseTests();
await runSampleOperations();
```

### Test Coverage
- ✅ Database initialization and schema creation
- ✅ User creation and retrieval
- ✅ Reading progress tracking and statistics
- ✅ Reading session management
- ✅ Bookmark operations with notes
- ✅ User preferences save/load
- ✅ Error handling and validation
- ✅ Data import/export functionality
- ✅ Performance testing
- ✅ Legacy compatibility

## 🔧 Configuration

### Database Settings
```typescript
// Constants in sqlite.ts
const DATABASE_NAME = 'quran_reading.db';
const DATABASE_VERSION = 1;

// Storage keys for web fallback
const STORAGE_KEYS = {
  USERS: 'quran_users',
  READING_PROGRESS: 'quran_reading_progress',
  BOOKMARKS: 'quran_bookmarks',
  // ... etc
};
```

### Performance Indexes
```sql
CREATE INDEX idx_reading_progress_user_timestamp ON reading_progress(user_id, timestamp DESC);
CREATE INDEX idx_reading_sessions_user_start ON reading_sessions(user_id, start_time DESC);
CREATE INDEX idx_bookmarks_user_created ON bookmarks(user_id, created_at DESC);
CREATE INDEX idx_bookmarks_ayah_key ON bookmarks(ayah_key);
```

## 📱 Platform Compatibility

| Feature | Native (SQLite) | Web (localStorage) | Status |
|---------|-----------------|-------------------|---------|
| User Management | ✅ Full Support | ⚠️ Limited | Complete |
| Reading Progress | ✅ Full Support | ✅ Full Support | Complete |
| Reading Sessions | ✅ Full Support | ⚠️ Limited | Partial |
| Bookmarks | ✅ Full Support | ✅ Basic Support | Complete |
| User Preferences | ✅ Full Support | ✅ Full Support | Complete |
| Statistics | ✅ Advanced | ⚠️ Basic | Complete |
| Transactions | ✅ ACID | ❌ Not Available | Platform Dependent |

## 🚨 Error Handling

### Custom Error Types
```typescript
import { DatabaseError, ValidationError } from '@/lib/storage';

try {
  await saveReadingProgress(userId, 'invalid:format', 100);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Invalid ayah key format');
  } else if (error instanceof DatabaseError) {
    console.log('Database operation failed');
  }
}
```

### Validation
- **Ayah Key Format**: Validates `surah:ayah` format (e.g., "2:255")
- **Range Validation**: Ensures surah numbers 1-114, ayah numbers within reasonable bounds
- **Data Integrity**: Foreign key constraints and unique constraints
- **Transaction Safety**: Automatic rollback on errors

## 🔄 Migration Support

The database includes a migration system for future schema updates:
- **Version tracking** in database_metadata table
- **Automatic detection** of schema changes
- **Safe migration** with rollback capability
- **Data preservation** during updates

## 📖 Legacy Compatibility

The system maintains backward compatibility with existing bookmark and resume functionality:
- `addLegacyBookmark()` / `removeLegacyBookmark()` / `listLegacyBookmarks()`
- `saveResume()` / `getResume()`
- Automatic migration utilities for upgrading existing data

## 🎯 Next Steps

1. **Enhanced Statistics**: Add more detailed analytics (reading patterns, favorite surahs, etc.)
2. **Offline Sync**: Implement sync with cloud storage when internet available
3. **Audio Progress**: Track audio recitation progress and playback positions
4. **Study Notes**: Expand note-taking capabilities beyond bookmarks
5. **Social Features**: Share progress and bookmarks with friends
6. **Advanced Search**: Full-text search across notes and bookmarks

## 📄 File Structure
```
src/lib/storage/
├── index.ts              # Main API exports and unified interface
├── sqlite.ts             # SQLite implementation with comprehensive CRUD
├── webStorage.ts         # localStorage fallback for web platform
├── models/
│   └── index.ts          # TypeScript interfaces and types
├── database.test.ts      # Comprehensive test suite
└── README.md             # This documentation
```

The database implementation provides a robust foundation for the Quran reading app with comprehensive offline support, user management, and detailed progress tracking capabilities.