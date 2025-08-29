# Quran Reading App - Development Guide

## Project Overview
Islamic Quran reading mobile app built with Expo/React Native featuring offline-first architecture, authentic manuscript styling, and integrated prayer times. Supports iOS/Android with comprehensive authentication and progress tracking.

## Architecture Summary

### Core Stack
- **Frontend**: Expo 51.0.28 + React Native + TypeScript
- **Navigation**: Expo Router (file-based)
- **Authentication**: Clerk with iOS Simulator-safe token caching
- **Database**: SQLite with Expo SQLite for offline-first data
- **State Management**: Zustand for reading progress and preferences
- **Styling**: Custom Islamic-themed components with manuscript textures

### Key Directories
```
/app/                 # Expo Router screens
/src/                 # Core application logic
  /lib/
    /api/            # External API clients (Quran, Prayer Times)
    /database/       # SQLite schema and operations
    /storage/        # Offline data management
    /contexts/       # React contexts (Auth, Theme)
    /store/          # Zustand state stores
  /components/       # Reusable UI components
  /theme/           # Islamic design system
  /types/           # TypeScript definitions
```

## Critical Architecture Patterns

### 1. iOS Simulator Compatibility
**Problem**: ClerkProvider + expo-secure-store causes iOS Simulator crashes with "non-std C++ exception"

**Solution**: Platform-specific token caching in `app/_layout.tsx`
```typescript
const createTokenCache = () => {
  const isIOSSimulator = Platform.OS === 'ios' && !Platform.isPad && Platform.isTV === false;
  
  if (isIOSSimulator) {
    // Use in-memory cache for iOS Simulator
    const memoryCache: { [key: string]: string } = {};
    return {
      async getToken(key: string) { return memoryCache[key] || null; },
      async saveToken(key: string, value: string) { memoryCache[key] = value; }
    };
  }
  
  // Use SecureStore for physical devices
  return {
    async getToken(key: string) { return await SecureStore.getItemAsync(key); },
    async saveToken(key: string, value: string) { await SecureStore.setItemAsync(key, value); }
  };
};
```

**Key Files**: 
- `app/_layout.tsx:11-55` - Token cache implementation
- Always ensure ClerkProvider wraps AuthProvider in provider hierarchy

### 2. Offline-First Database Architecture
**Schema Location**: `src/lib/database/schema.sql`

**Core Tables**:
- `users` - User profiles with reading preferences
- `reading_sessions` - Progress tracking with timestamps
- `bookmarks` - Saved verses with notes
- `user_preferences` - UI settings and customizations

**Usage Pattern**:
```typescript
import { initStorage } from '@/lib/storage';
import { DatabaseService } from '@/lib/database/DatabaseService';

// Always initialize in app startup
await initStorage();
const user = await DatabaseService.users.create(userData);
```

**Key Files**:
- `src/lib/database/` - Database operations
- `src/lib/storage/index.ts` - Storage initialization

### 3. API Integration with Caching
**Primary APIs**:
- **Quran**: AlQuran.cloud API for verses, translations, audio
- **Prayer Times**: Aladhan API for location-based prayer schedules

**Caching Strategy**:
- Aggressive caching for Quran content (rarely changes)
- Daily refresh for prayer times
- Offline fallback for all critical functions

**Key Files**:
- `src/lib/api/quran-client.ts` - Quran API with caching
- `src/lib/api/prayer-client.ts` - Prayer times with location
- `src/lib/api/cache.ts` - Unified caching system
- `src/lib/api/services.ts` - High-level service abstractions

### 4. Authentication System
**Clerk Integration**: Handles sign-in, sign-up, user management

**Context Architecture**:
```typescript
// Provider hierarchy in app/_layout.tsx
<ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
  <ThemeProvider>
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Screens */}
      </Stack>
    </AuthProvider>
  </ThemeProvider>
</ClerkProvider>
```

**Key Files**:
- `src/lib/contexts/AuthContext.tsx` - Auth state management
- `app/auth/` - Authentication screens
- `src/lib/config/env.ts` - Environment configuration

## Common Development Commands

### Setup & Installation
```bash
# Fresh installation
npm install --legacy-peer-deps

# iOS Development (from project root)
npx expo run:ios

# Android Development
npx expo run:android

# Web Development (testing only)
npx expo start --web
```

### Build & Deployment
```bash
# Production build
npx expo build:ios
npx expo build:android

# Clear cache if issues
npx expo start --clear
```

### Database Management
```bash
# Reset database (development)
npx expo start --clear

# View database in development
# Use Flipper or similar SQLite browser
```

## Critical Dependencies

### Core Dependencies
- `expo`: ^51.0.28
- `@clerk/clerk-expo`: Authentication
- `expo-secure-store`: Secure token storage
- `expo-sqlite`: Database operations
- `expo-router`: File-based navigation
- `zustand`: State management

### Islamic Content
- AlQuran.cloud API (no auth required)
- Aladhan API for prayer times
- Custom Arabic fonts for authentic display

## Common Issues & Solutions

### 1. Build Errors
**"Unable to attach DB: database is locked"**
- Solution: Stop all Metro processes, clear cache: `npx expo start --clear`

**"Unable to resolve react-native-safe-area-context"**
- Solution: `npm install react-native-safe-area-context --legacy-peer-deps`

**"Hermes compilation stuck"**
- Solution: Switch to JavaScriptCore in `ios/Podfile.properties.json`

### 2. Authentication Issues
**"useAuth can only be used within ClerkProvider"**
- Solution: Check provider hierarchy in `app/_layout.tsx`
- Always ensure ClerkProvider is outermost auth provider

### 3. Path Resolution Issues
**"Module not found: @/ imports"**
- Solution: Check `tsconfig.json` has proper baseUrl and paths configuration

## Performance Considerations

### Optimization Patterns
- Lazy load heavy Quran content
- Cache prayer times locally
- Use React.memo for verse components
- Implement virtual scrolling for long surahs

### Memory Management
- Clean up audio players when not in use
- Limit concurrent API requests
- Use pagination for large datasets

## Testing Patterns

### Critical Test Areas
1. iOS Simulator compatibility (ClerkProvider)
2. Offline functionality (database + API fallbacks)
3. Authentication flows (sign-in, sign-up, guest mode)
4. Prayer time accuracy across timezones
5. Quran verse rendering with Arabic text

### Test Commands
```bash
# Unit tests
npm test

# E2E tests
npx detox test --configuration ios.sim.debug
```

## UI/UX Guidelines

### Islamic Design Principles
- Authentic manuscript textures and colors
- Respectful presentation of Quran verses
- Clear Arabic typography with translations
- Calligraphic headers and decorative elements

### Component Library
- `CalligraphicHeader` - Islamic-styled headings
- `HighlightableVerse` - Interactive Quran verses
- `PrayerCard` - Prayer time displays
- `IslamicButton` - Themed action buttons
- `ReadingControls` - Reading preferences

### Color Scheme
- Background: Warm paper tones (#f5f2ed)
- Text: Deep charcoal (#2c2c2c)
- Accent: Islamic green (#2e7d32)
- Gold accents for decorative elements

## Development Workflow

### Feature Development Process
1. **Design**: Create Islamic-themed mockups
2. **Database**: Update schema if needed
3. **API**: Add caching for external data
4. **Components**: Build reusable UI components
5. **Integration**: Wire up auth + database + API
6. **Testing**: Verify iOS/Android compatibility

### Code Quality Standards
- TypeScript strict mode enabled
- ESLint + Prettier configuration
- Component documentation with examples
- Comprehensive error handling
- Offline-first approach

## Deployment Checklist

### Pre-Release
- [ ] Test on physical iOS/Android devices
- [ ] Verify prayer time accuracy
- [ ] Test offline functionality
- [ ] Validate Arabic text rendering
- [ ] Check authentication flows
- [ ] Performance testing with large surahs

### App Store Considerations
- Islamic content review guidelines
- Accessibility compliance (VoiceOver, TalkBack)
- Privacy policy for location/reading data
- Content rating appropriate for religious app

## Future Architecture Considerations

### Scalability
- Cloud backup for reading progress
- Social features (reading groups)
- Audio recitation downloads
- Multi-language translations
- Bookmarking and note-taking

### Technical Debt
- Migrate to Expo SDK 52+ when stable
- Consider React Native 0.75+ features
- Evaluate alternative authentication providers
- Optimize bundle size for app stores

---

## Quick Reference

**Start Development**: `npx expo run:ios`
**Clear Cache**: `npx expo start --clear`
**Database Location**: SQLite in device storage
**API Docs**: AlQuran.cloud, Aladhan.com
**Authentication**: Clerk dashboard for user management

This is a religious application - always maintain respectful presentation of Islamic content and follow Islamic principles in design decisions.