import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme/theme';
import { useAuthStatus, useUserData } from '@/lib/contexts/AuthContext';
import { CalligraphicHeader } from '@/components/shared/CalligraphicHeader';
import { PrayerCard, PrayerTime } from '@/components/home/PrayerCard';
import { ProgressCard, ProgressData } from '@/components/home/ProgressCard';
import { InspirationCard, InspirationContent } from '@/components/home/InspirationCard';
import { IslamicButton } from '@/components/shared/IslamicButton';
import { PrayerService, QuranService } from '@/lib/api/services';
import { useAuthAvailability } from '@/components/auth/AuthGuard';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { 
  ErrorBanner, 
  GuestModeIndicator, 
  NetworkError,
  ApiError,
  LoadingError 
} from '@/components/shared/ErrorStates';

export default function Home() {
  const { colors } = useTheme();
  const router = useRouter();
  const { 
    isSignedIn, 
    isGuest, 
    isLoading, 
    needsAuth, 
    hasErrors,
    networkError,
    apiError,
    isOnline,
    hasClerkAuth,
    retry,
    clearErrors 
  } = useAuthStatus();
  const { clerkUser, dbUser } = useUserData();
  const { isAuthAvailable } = useAuthAvailability();

  // Get current hour for greeting
  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 5) return { english: 'Good Night', arabic: 'ليلة سعيدة' };
    if (currentHour < 12) return { english: 'Good Morning', arabic: 'صباح الخير' };
    if (currentHour < 17) return { english: 'Good Afternoon', arabic: 'مساء الخير' };
    if (currentHour < 21) return { english: 'Good Evening', arabic: 'مساء الخير' };
    return { english: 'Good Night', arabic: 'ليلة سعيدة' };
  };

  // Real-time data state
  const [prayerData, setPrayerData] = useState<{
    prayerTimes: PrayerTime[];
    nextPrayer: PrayerTime;
    timeToNext: string;
    location: string;
  } | null>(null);

  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [inspirationData, setInspirationData] = useState<InspirationContent | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Load real-time data
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadData = async () => {
      try {
        setDataLoading(true);
        setDataError(null);
        setLoadingTimeout(false);

        // Set timeout for loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            setLoadingTimeout(true);
          }
        }, 10000); // 10 second timeout

        // Load all data in parallel with individual timeouts
        const loadWithTimeout = <T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
          return Promise.race([
            promise,
            new Promise<T>((_, reject) => 
              setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
            )
          ]);
        };

        const [prayerResult, inspirationResult, progressResult] = await Promise.allSettled([
          loadWithTimeout(PrayerService.getCurrentPrayerTimes()),
          loadWithTimeout(QuranService.getDailyInspiration()),
          loadWithTimeout(QuranService.getReadingStats()),
        ]);

        if (!isMounted) return;

        // Process prayer times
        if (prayerResult.status === 'fulfilled') {
          const { prayerTimes, nextPrayer, timeToNext, location } = prayerResult.value;
          const nextPrayerObj = prayerTimes.find(p => p.isNext) || prayerTimes[0];
          
          setPrayerData({
            prayerTimes,
            nextPrayer: nextPrayerObj,
            timeToNext,
            location,
          });
        } else {
          console.warn('Failed to load prayer times:', prayerResult.reason);
          // Set fallback prayer data
          const fallbackPrayerTimes: PrayerTime[] = [
            { name: 'Fajr', arabicName: 'الفجر', time: '5:30 AM', isPassed: true, isNext: false, isCurrent: false },
            { name: 'Dhuhr', arabicName: 'الظهر', time: '12:25 PM', isPassed: true, isNext: false, isCurrent: false },
            { name: 'Asr', arabicName: 'العصر', time: '3:45 PM', isPassed: false, isNext: true, isCurrent: false },
            { name: 'Maghrib', arabicName: 'المغرب', time: '6:20 PM', isPassed: false, isNext: false, isCurrent: false },
            { name: 'Isha', arabicName: 'العشاء', time: '8:15 PM', isPassed: false, isNext: false, isCurrent: false },
          ];
          
          setPrayerData({
            prayerTimes: fallbackPrayerTimes,
            nextPrayer: fallbackPrayerTimes[2],
            timeToNext: '2h 15m',
            location: 'New York, NY',
          });
        }

        // Process inspiration
        if (inspirationResult.status === 'fulfilled') {
          setInspirationData(inspirationResult.value);
        } else {
          console.warn('Failed to load inspiration:', inspirationResult.reason);
          // Set fallback inspiration
          setInspirationData({
            type: 'verse',
            arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
            translation: 'And whoever fears Allah - He will make for him a way out.',
            reference: 'Quran 65:2',
            transliteration: 'Wa man yattaqi Allah yaj\'al lahu makhrajan',
          });
        }

        // Process progress data
        if (progressResult.status === 'fulfilled') {
          const stats = progressResult.value;
          setProgressData({
            currentStreak: stats.currentStreak || 7,
            bestStreak: stats.bestStreak || 12,
            totalSessions: stats.totalSessions || 45,
            lastRead: {
              surah: 'Al-Baqarah',
              ayah: 255,
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            },
            weeklyProgress: stats.weeklyProgress || [80, 100, 60, 100, 40, 100, 90],
          });
        } else {
          console.warn('Failed to load progress:', progressResult.reason);
          // Set fallback progress data
          setProgressData({
            currentStreak: 7,
            bestStreak: 12,
            totalSessions: 45,
            lastRead: {
              surah: 'Al-Baqarah',
              ayah: 255,
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            },
            weeklyProgress: [80, 100, 60, 100, 40, 100, 90],
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
        
        // Set all fallback data if everything fails
        if (!isMounted) return;

        // Determine error type
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isNetworkError = errorMessage.includes('Network') || 
                              errorMessage.includes('fetch') ||
                              errorMessage.includes('timeout');
        
        setDataError(isNetworkError ? 'network' : 'api');
        
        const fallbackPrayerTimes: PrayerTime[] = [
          { name: 'Fajr', arabicName: 'الفجر', time: '5:30 AM', isPassed: true, isNext: false, isCurrent: false },
          { name: 'Dhuhr', arabicName: 'الظهر', time: '12:25 PM', isPassed: true, isNext: false, isCurrent: false },
          { name: 'Asr', arabicName: 'العصر', time: '3:45 PM', isPassed: false, isNext: true, isCurrent: false },
          { name: 'Maghrib', arabicName: 'المغرب', time: '6:20 PM', isPassed: false, isNext: false, isCurrent: false },
          { name: 'Isha', arabicName: 'العشاء', time: '8:15 PM', isPassed: false, isNext: false, isCurrent: false },
        ];
        
        setPrayerData({
          prayerTimes: fallbackPrayerTimes,
          nextPrayer: fallbackPrayerTimes[2],
          timeToNext: '2h 15m',
          location: 'New York, NY',
        });
        
        setInspirationData({
          type: 'verse',
          arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
          translation: 'And whoever fears Allah - He will make for him a way out.',
          reference: 'Quran 65:2',
          transliteration: 'Wa man yattaqi Allah yaj\'al lahu makhrajan',
        });
        
        setProgressData({
          currentStreak: 7,
          bestStreak: 12,
          totalSessions: 45,
          lastRead: {
            surah: 'Al-Baqarah',
            ayah: 255,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          weeklyProgress: [80, 100, 60, 100, 40, 100, 90],
        });
      } finally {
        if (isMounted) {
          setDataLoading(false);
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    loadData();

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [retryAttempt]); // Re-run when retryAttempt changes

  // Retry function
  const handleRetryData = () => {
    setRetryAttempt(prev => prev + 1);
    clearErrors(); // Clear auth errors too
  };

  const greeting = getGreeting();

  const getUserName = () => {
    if (isSignedIn && clerkUser) {
      return clerkUser.firstName || 'Reader';
    }
    if (isGuest) {
      return 'Guest';
    }
    return 'Reader';
  };

  const getWelcomeMessage = () => {
    if (isSignedIn) {
      return `Welcome back, ${getUserName()}!`;
    }
    if (isGuest) {
      return 'Welcome, Guest Reader!';
    }
    return 'Welcome to Quran Reading';
  };

  const handleContinueReading = () => {
    router.push('/read');
  };

  const handlePlayAudio = () => {
    // Handle audio playback
  };

  // Helper function to get surah number from name (simple mapping)
  const getSurahNumberFromName = (name: string): number => {
    const surahMap: { [key: string]: number } = {
      'Al-Fatihah': 1,
      'Al-Baqarah': 2,
      'Al-Imran': 3,
      'An-Nisa': 4,
      'Al-Maidah': 5,
      // Add more as needed, or use API lookup
    };
    return surahMap[name] || 1; // Default to Al-Fatihah
  };

  // Helper function to format time ago
  const getTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  // Show network error if offline
  if (!isOnline) {
    return (
      <NetworkError
        onRetry={handleRetryData}
        isRetrying={dataLoading}
      />
    );
  }

  // Show critical API error
  if (dataError === 'network') {
    return (
      <NetworkError
        title="Connection Problems"
        message="Having trouble connecting to our servers. Please check your internet connection."
        onRetry={handleRetryData}
        isRetrying={dataLoading}
      />
    );
  }

  if (dataError === 'api') {
    return (
      <ApiError
        service="Quran and Prayer Services"
        fallbackMessage="Some services are temporarily unavailable. Showing cached content when possible."
        onRetry={handleRetryData}
        isRetrying={dataLoading}
      />
    );
  }

  // Show loading timeout error
  if (loadingTimeout && dataLoading) {
    return (
      <LoadingError
        resource="daily content"
        timeout={true}
        onRetry={handleRetryData}
        isRetrying={dataLoading}
      />
    );
  }

  // Show loading state while authentication is being determined
  if (isLoading || dataLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          {isLoading ? 'Loading...' : 'Loading prayer times and daily inspiration...'}
        </Text>
      </View>
    );
  }

  // Don't render until we have data (this should rarely happen now due to fallbacks)
  if (!prayerData || !progressData || !inspirationData) {
    return (
      <LoadingError
        resource="essential data"
        onRetry={handleRetryData}
        isRetrying={dataLoading}
      />
    );
  }

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="dark" />
        
        {/* Guest mode indicator */}
        {isGuest && <GuestModeIndicator />}
        
        {/* Error banners for non-critical issues */}
        {hasErrors && apiError && (
          <ErrorBanner
            message={`Authentication: ${apiError}`}
            type="warning"
            onRetry={retry}
            persistent={false}
          />
        )}
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
        {/* Welcome Header */}
        <View style={styles.header}>
          <CalligraphicHeader
            title={getWelcomeMessage()}
            arabicTitle={greeting.arabic}
            subtitle="May Allah bless your day"
            size="lg"
            align="center"
          />
        </View>

        {/* Progress Card */}
        <ProgressCard
          progress={progressData}
          onContinueReading={handleContinueReading}
        />

        {/* Prayer Times Card */}
        <PrayerCard
          nextPrayer={prayerData.nextPrayer}
          allPrayers={prayerData.prayerTimes}
          timeToNext={prayerData.timeToNext}
          location={prayerData.location}
        />

        {/* Daily Inspiration */}
        <InspirationCard
          content={inspirationData}
          onPlayAudio={handlePlayAudio}
          onBookmark={() => console.log('Bookmarked')}
          onShare={() => console.log('Shared')}
          isBookmarked={false}
        />

        {/* Enhanced Quick Actions */}
        <View style={styles.quickActions}>
          {/* Continue Reading - Dynamic based on progress */}
          <Link href={progressData.lastRead.surah === 'Al-Fatihah' ? '/read/1' : `/read/${getSurahNumberFromName(progressData.lastRead.surah)}`} asChild>
            <IslamicButton
              title={`Continue Reading • ${progressData.lastRead.surah}`}
              subtitle={`Verse ${progressData.lastRead.ayah} • ${getTimeAgo(progressData.lastRead.timestamp)}`}
              onPress={() => {}}
              variant="primary"
              size="lg"
              icon="book-outline"
            />
          </Link>
          
          <View style={{ height: 16 }} />
          
          {/* Browse All Chapters - Enhanced */}
          <Link href="/surahs" asChild>
            <IslamicButton
              title="Browse All 114 Chapters"
              subtitle="Search, filter and navigate through the complete Quran"
              onPress={() => {}}
              variant="secondary"
              size="lg"
              icon="library-outline"
            />
          </Link>
          
          <View style={{ height: 16 }} />
          
          {/* Popular Chapters Quick Access */}
          <View style={styles.popularChapters}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Chapters</Text>
            <View style={styles.popularGrid}>
              <Link href="/read/1" asChild>
                <TouchableOpacity style={[styles.popularChapter, { backgroundColor: colors.cardWarm, borderColor: colors.paperBorder }]}>
                  <View style={[styles.chapterNumber, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.chapterNumberText, { color: colors.background }]}>1</Text>
                  </View>
                  <View style={styles.chapterInfo}>
                    <Text style={[styles.chapterName, { color: colors.text }]}>Al-Fatihah</Text>
                    <Text style={[styles.chapterMeaning, { color: colors.secondaryText }]}>The Opening</Text>
                  </View>
                </TouchableOpacity>
              </Link>
              
              <Link href="/read/2" asChild>
                <TouchableOpacity style={[styles.popularChapter, { backgroundColor: colors.cardWarm, borderColor: colors.paperBorder }]}>
                  <View style={[styles.chapterNumber, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.chapterNumberText, { color: colors.background }]}>2</Text>
                  </View>
                  <View style={styles.chapterInfo}>
                    <Text style={[styles.chapterName, { color: colors.text }]}>Al-Baqarah</Text>
                    <Text style={[styles.chapterMeaning, { color: colors.secondaryText }]}>The Cow</Text>
                  </View>
                </TouchableOpacity>
              </Link>
            </View>
            
            <View style={styles.popularGrid}>
              <Link href="/read/36" asChild>
                <TouchableOpacity style={[styles.popularChapter, { backgroundColor: colors.cardWarm, borderColor: colors.paperBorder }]}>
                  <View style={[styles.chapterNumber, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.chapterNumberText, { color: colors.background }]}>36</Text>
                  </View>
                  <View style={styles.chapterInfo}>
                    <Text style={[styles.chapterName, { color: colors.text }]}>Ya-Sin</Text>
                    <Text style={[styles.chapterMeaning, { color: colors.secondaryText }]}>Ya Sin</Text>
                  </View>
                </TouchableOpacity>
              </Link>
              
              <Link href="/read/18" asChild>
                <TouchableOpacity style={[styles.popularChapter, { backgroundColor: colors.cardWarm, borderColor: colors.paperBorder }]}>
                  <View style={[styles.chapterNumber, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.chapterNumberText, { color: colors.background }]}>18</Text>
                  </View>
                  <View style={styles.chapterInfo}>
                    <Text style={[styles.chapterName, { color: colors.text }]}>Al-Kahf</Text>
                    <Text style={[styles.chapterMeaning, { color: colors.secondaryText }]}>The Cave</Text>
                  </View>
                </TouchableOpacity>
              </Link>
            </View>
            
            <View style={styles.popularGrid}>
              <Link href="/read/67" asChild>
                <TouchableOpacity style={[styles.popularChapter, { backgroundColor: colors.cardWarm, borderColor: colors.paperBorder }]}>
                  <View style={[styles.chapterNumber, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.chapterNumberText, { color: colors.background }]}>67</Text>
                  </View>
                  <View style={styles.chapterInfo}>
                    <Text style={[styles.chapterName, { color: colors.text }]}>Al-Mulk</Text>
                    <Text style={[styles.chapterMeaning, { color: colors.secondaryText }]}>The Sovereignty</Text>
                  </View>
                </TouchableOpacity>
              </Link>
              
              <Link href="/read/55" asChild>
                <TouchableOpacity style={[styles.popularChapter, { backgroundColor: colors.cardWarm, borderColor: colors.paperBorder }]}>
                  <View style={[styles.chapterNumber, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.chapterNumberText, { color: colors.background }]}>55</Text>
                  </View>
                  <View style={styles.chapterInfo}>
                    <Text style={[styles.chapterName, { color: colors.text }]}>Ar-Rahman</Text>
                    <Text style={[styles.chapterMeaning, { color: colors.secondaryText }]}>The Beneficent</Text>
                  </View>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
          
          <View style={{ height: 16 }} />
          
          {/* Dynamic auth actions based on state and availability */}
          {isSignedIn && isAuthAvailable ? (
            <Link href="/auth/profile" asChild>
              <IslamicButton
                title="View Profile"
                onPress={() => {}}
                variant="secondary"
                size="md"
              />
            </Link>
          ) : (
            <View style={styles.authButtons}>
              {/* Only show sign-in option if auth is available */}
              {isAuthAvailable && (
                <>
                  <Link href="/auth/sign-in" asChild>
                    <IslamicButton
                      title="Sign In"
                      onPress={() => {}}
                      variant="secondary"
                      size="md"
                    />
                  </Link>
                  
                  <View style={{ height: 8 }} />
                </>
              )}
              
              <IslamicButton
                title="Continue as Guest"
                onPress={() => {
                  // Enable guest mode through context
                  router.push('/read');
                }}
                variant="outline"
                size="md"
              />
            </View>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  header: {
    paddingVertical: 24,
    marginBottom: 8,
  },
  quickActions: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  popularChapters: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  popularGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  popularChapter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chapterNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  chapterNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  chapterInfo: {
    flex: 1,
  },
  chapterName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  chapterMeaning: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  authButtons: {
    // Container for auth buttons
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
});