import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, ScrollView, FlatList, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useReaderStore } from '@/lib/store/appStore';
import HighlightableVerse from '@/components/HighlightableVerse';
import { ReadingHeader } from '@/components/reading/ReadingHeader';
import { VerseDivider } from '@/components/reading/VerseDivider';
import { ReadingControls } from '@/components/reading/ReadingControls';
import { ChapterHeader } from '@/components/quran/ChapterHeader';
import { useTheme } from '@/theme/theme';
import { QuranService } from '@/lib/api/services';
import { useAuthStatus } from '@/lib/contexts/AuthContext';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { 
  ErrorBanner, 
  GuestModeIndicator, 
  NetworkError,
  ApiError,
  LoadingError 
} from '@/components/shared/ErrorStates';
import type { SurahDetails, VerseDetails } from '@/types/quran';

export default function ReadSurahScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { surah: surahParam } = useLocalSearchParams<{ surah: string }>();
  
  const { 
    toggleTranslationVisible, 
    translationVisible, 
    toggleTransliterationVisible,
    transliterationVisible 
  } = useReaderStore();
  
  const {
    isGuest,
    isOnline,
    hasErrors,
    apiError,
    retry,
    clearErrors
  } = useAuthStatus();
  
  const [fontSize, setFontSize] = useState(24);
  const [surahData, setSurahData] = useState<SurahDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [useVirtualization, setUseVirtualization] = useState(false);
  const [targetVerseNumber, setTargetVerseNumber] = useState<number | null>(null);

  // Scroll references for both ScrollView and FlatList
  const scrollViewRef = useRef<ScrollView>(null);
  const flatListRef = useRef<FlatList>(null);

  // Parse surah number from params
  const surahNumber = parseInt(surahParam || '1', 10);
  
  // Validate surah number
  const isValidSurah = surahNumber >= 1 && surahNumber <= 114;

  useEffect(() => {
    if (!isValidSurah) return;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadSurahData = async () => {
      try {
        setLoading(true);
        setError(null);
        setLoadingTimeout(false);

        // Set timeout for loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            setLoadingTimeout(true);
          }
        }, 10000); // 10 second timeout

        // Load surah with translation and timeout
        const loadWithTimeout = <T>(promise: Promise<T>, timeoutMs: number = 8000): Promise<T> => {
          return Promise.race([
            promise,
            new Promise<T>((_, reject) => 
              setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
            )
          ]);
        };

        const data = await loadWithTimeout(QuranService.getSurah(surahNumber, 'en.sahih'));
        
        if (!isMounted) return;

        // Clear timeout if successful
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        setSurahData(data);
        
        // Enable virtualization for long surahs (>100 verses) for memory efficiency
        if (data.ayahs.length > 100) {
          setUseVirtualization(true);
        }
        
        // Save last accessed verse (optional)
        QuranService.saveLastAccessedVerse(surahNumber, 1).catch(console.warn);
      } catch (err) {
        console.error('Error loading Surah data:', err);
        
        if (!isMounted) return;
        
        // Determine error type
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const isNetworkError = errorMessage.includes('Network') || 
                              errorMessage.includes('fetch') ||
                              errorMessage.includes('timeout');
        
        setError(isNetworkError ? 'network' : 'api');
        
        // For Al-Fatihah, try fallback data
        if (surahNumber === 1) {
          try {
            const fallbackData = await QuranService.getAlFatihah();
            setSurahData(fallbackData);
            setError(null);
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    loadSurahData();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [surahNumber, retryAttempt, isValidSurah]);

  // Navigation functions
  const handlePreviousSurah = useCallback(() => {
    if (surahNumber > 1) {
      router.replace(`/read/${surahNumber - 1}`);
    }
  }, [surahNumber, router]);

  const handleNextSurah = useCallback(() => {
    if (surahNumber < 114) {
      router.replace(`/read/${surahNumber + 1}`);
    }
  }, [surahNumber, router]);


  const handleRetryData = useCallback(() => {
    setRetryAttempt(prev => prev + 1);
    clearErrors();
  }, [clearErrors]);

  // Jump to verse functionality with enhanced accuracy
  const jumpToVerse = useCallback((verseNumber: number) => {
    if (!surahData || verseNumber < 1 || verseNumber > surahData.ayahs.length) {
      console.warn(`Invalid verse number: ${verseNumber}. Valid range: 1-${surahData?.ayahs.length || 0}`);
      return;
    }

    const targetIndex = verseNumber - 1;
    
    if (useVirtualization && flatListRef.current) {
      // For FlatList (virtualized long surahs like Al-Baqarah)
      try {
        flatListRef.current.scrollToIndex({
          index: targetIndex,
          animated: true,
          viewPosition: 0.15, // Show verse slightly below top for better visibility
        });
      } catch (error) {
        // Fallback: calculate approximate offset
        console.log(`ScrollToIndex failed, using offset fallback for verse ${verseNumber}`);
        const ESTIMATED_VERSE_HEIGHT = 180;
        const BISMILLAH_HEIGHT = 80;
        const HEADER_HEIGHT = 120;
        const targetY = HEADER_HEIGHT + (targetIndex === 0 ? 0 : BISMILLAH_HEIGHT) + (targetIndex * ESTIMATED_VERSE_HEIGHT);
        
        flatListRef.current.scrollToOffset({
          offset: Math.max(0, targetY),
          animated: true,
        });
      }
    } else if (scrollViewRef.current) {
      // For ScrollView (most surahs)
      // More accurate calculation for ScrollView
      const ESTIMATED_VERSE_HEIGHT = 180;
      const BISMILLAH_HEIGHT = surahNumber !== 1 && surahNumber !== 9 ? 80 : 0;
      const CHAPTER_HEADER_HEIGHT = 120;
      const VERSE_DIVIDER_HEIGHT = 40;
      
      // Calculate cumulative height more accurately
      const targetY = CHAPTER_HEADER_HEIGHT + 
                     BISMILLAH_HEIGHT + 
                     (targetIndex * (ESTIMATED_VERSE_HEIGHT + VERSE_DIVIDER_HEIGHT));
      
      scrollViewRef.current.scrollTo({
        y: Math.max(0, targetY - 50), // Offset by 50px to show verse comfortably
        animated: true,
      });
    }
  }, [surahData, useVirtualization, surahNumber]);

  // Handle jump-to-verse requests
  const handleJumpToVerse = useCallback((verseNumber: number) => {
    setTargetVerseNumber(verseNumber);
  }, []);

  // Effect to execute verse jump after data is loaded
  useEffect(() => {
    if (targetVerseNumber && surahData) {
      // Small delay to ensure content is rendered
      const timer = setTimeout(() => {
        jumpToVerse(targetVerseNumber);
        setTargetVerseNumber(null);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [targetVerseNumber, surahData, jumpToVerse]);

  // Virtualized verse rendering for memory efficiency
  const renderVerseItem = useCallback(({ item: verse, index }: { item: any; index: number }) => (
    <View key={`verse-${index}`} style={styles.verseContainer}>
      {/* Bismillah for first verse of most surahs */}
      {index === 0 && surahNumber !== 1 && surahNumber !== 9 && (
        <View style={[styles.bismillahContainer, { 
          borderColor: colors.accent,
        }]}>
          <View style={[styles.bismillahDecoration, { backgroundColor: colors.accent }]} />
          <Text style={[styles.bismillahText, { color: colors.text }]}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
          <Text style={[styles.bismillahTranslation, { color: colors.secondaryText }]}>
            In the name of Allah—the Most Compassionate, Most Merciful.
          </Text>
        </View>
      )}

      <VerseDivider ayahNumber={verse.ayah.numberInSurah} />
      
      <HighlightableVerse
        arabic={verse.ayah.text}
        english={verse.translations[0]?.text || ''}
        transliteration={verse.transliteration?.text || ''}
        showEnglish={translationVisible}
        showTransliteration={transliterationVisible}
      />

      {/* Verse Metadata */}
      <View style={styles.verseMetadata}>
        <Text style={[styles.verseInfo, { color: colors.secondaryText }]}>
          Verse {verse.ayah.numberInSurah} of {surahData?.ayahs.length} • 
          Juz {verse.ayah.juz} • 
          Page {verse.ayah.page}
        </Text>
      </View>
    </View>
  ), [surahNumber, colors, translationVisible, transliterationVisible, surahData?.ayahs.length]);

  // Optimized getItemLayout for verse virtualization
  const getVerseItemLayout = useCallback((data: any, index: number) => {
    const VERSE_HEIGHT = 200; // Estimated verse height
    return {
      length: VERSE_HEIGHT,
      offset: VERSE_HEIGHT * index,
      index,
    };
  }, []);

  // Memoized key extractor for verses
  const verseKeyExtractor = useCallback((verse: any, index: number) => 
    `verse-${surahNumber}-${verse.ayah.numberInSurah}`, [surahNumber]);

  // Handle scroll-to-index failures in FlatList
  const handleScrollToIndexFailed = useCallback((info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    console.log('ScrollToIndex failed, using fallback approach');
    const { index, averageItemLength } = info;
    const targetY = index * averageItemLength;
    
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: targetY,
        animated: true,
      });
    }
  }, []);


  // Invalid surah number
  if (!isValidSurah) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="warning-outline" size={64} color={colors.accent} style={styles.errorIcon} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Invalid Chapter
        </Text>
        <Text style={[styles.errorMessage, { color: colors.secondaryText }]}>
          Chapter number must be between 1 and 114.
        </Text>
        <Link href="/surahs" asChild>
          <TouchableOpacity style={[styles.errorButton, { backgroundColor: colors.accent }]}>
            <Text style={[styles.errorButtonText, { color: colors.background }]}>
              Browse All Chapters
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  // Show network error if offline
  if (!isOnline) {
    return (
      <NetworkError
        title="No Internet Connection"
        message={`Chapter ${surahNumber} requires an internet connection to load. Please check your connection.`}
        onRetry={handleRetryData}
        isRetrying={loading}
      />
    );
  }

  // Show critical API error
  if (error === 'network') {
    return (
      <NetworkError
        title="Connection Problems"
        message="Having trouble connecting to Quran servers. Please check your internet connection."
        onRetry={handleRetryData}
        isRetrying={loading}
      />
    );
  }

  if (error === 'api') {
    return (
      <ApiError
        service="Quran API"
        fallbackMessage={`Chapter ${surahNumber} is temporarily unavailable. Please try again or browse other chapters.`}
        onRetry={handleRetryData}
        isRetrying={loading}
      />
    );
  }

  // Show loading timeout error
  if (loadingTimeout && loading) {
    return (
      <LoadingError
        resource={`Chapter ${surahNumber}`}
        timeout={true}
        onRetry={handleRetryData}
        isRetrying={loading}
      />
    );
  }

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading Chapter {surahNumber}...
        </Text>
        {surahNumber === 1 && (
          <Text style={[styles.loadingSubtext, { color: colors.secondaryText }]}>
            Al-Fatihah • The Opening
          </Text>
        )}
      </View>
    );
  }

  if (!surahData) {
    return (
      <LoadingError
        resource={`Chapter ${surahNumber}`}
        onRetry={handleRetryData}
        isRetrying={loading}
      />
    );
  }

  const isFirstSurah = surahNumber === 1;
  const isLastSurah = surahNumber === 114;

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
          />
        )}
        
        {error && (
          <ErrorBanner
            message="Using limited content due to connection issues"
            type="info"
            onRetry={handleRetryData}
          />
        )}

        {/* Paper-like background */}
        <View style={[styles.backgroundTexture, { 
          backgroundColor: colors.paperBackground,
          borderColor: colors.paperBorder 
        }]}>
          <View style={styles.paperGrain} />
          <View style={styles.paperFibers} />
        </View>

        {/* Header with navigation */}
        <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
          <View style={styles.headerRow}>
            <Link href="/surahs" asChild>
              <TouchableOpacity style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color={colors.accent} />
                <Text style={[styles.backText, { color: colors.accent }]}>Chapters</Text>
              </TouchableOpacity>
            </Link>

            <View style={styles.surahNavigation}>
              <TouchableOpacity
                onPress={handlePreviousSurah}
                disabled={isFirstSurah}
                style={[styles.navButton, { opacity: isFirstSurah ? 0.3 : 1 }]}
              >
                <Ionicons name="chevron-back" size={20} color={colors.accent} />
              </TouchableOpacity>

              <Text style={[styles.surahIndicator, { color: colors.text }]}>
                {surahNumber} / 114
              </Text>

              <TouchableOpacity
                onPress={handleNextSurah}
                disabled={isLastSurah}
                style={[styles.navButton, { opacity: isLastSurah ? 0.3 : 1 }]}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.accent} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Chapter Header - Compact Version */}
        <ChapterHeader surah={surahData.surah} compact={true} />

        {/* Reading Content - Unified Scrollable View */}
        {useVirtualization && surahData.ayahs.length > 100 ? (
          // Virtualized list for very long surahs (memory efficient)
          <FlatList
            ref={flatListRef}
            data={surahData.ayahs}
            renderItem={renderVerseItem}
            keyExtractor={verseKeyExtractor}
            getItemLayout={getVerseItemLayout}
            onScrollToIndexFailed={handleScrollToIndexFailed}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            // Enhanced performance optimizations
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            windowSize={10}
            removeClippedSubviews={true}
            // Smooth scrolling enhancements
            scrollEventThrottle={16}
            decelerationRate="normal"
            bounces={true}
            alwaysBounceVertical={false}
            // Memory management
            legacyImplementation={false}
            disableVirtualization={false}
          />
        ) : (
          // ScrollView for most surahs - Full content visible
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            // Smooth scrolling enhancements
            decelerationRate="normal"
            scrollEventThrottle={16}
            bounces={true}
            alwaysBounceVertical={false}
          >
            {/* Bismillah for first verse of most surahs */}
            {surahNumber !== 1 && surahNumber !== 9 && (
              <View style={[styles.bismillahContainer, { 
                borderColor: colors.accent,
              }]}>
                <View style={[styles.bismillahDecoration, { backgroundColor: colors.accent }]} />
                <Text style={[styles.bismillahText, { color: colors.text }]}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </Text>
                <Text style={[styles.bismillahTranslation, { color: colors.secondaryText }]}>
                  In the name of Allah—the Most Compassionate, Most Merciful.
                </Text>
              </View>
            )}

            {/* All Verses */}
            {surahData.ayahs.map((verse, index) => (
              <View key={`verse-${verse.ayah.numberInSurah}`} style={styles.verseContainer}>
                <VerseDivider ayahNumber={verse.ayah.numberInSurah} />
                
                <HighlightableVerse
                  arabic={verse.ayah.text}
                  english={verse.translations[0]?.text || ''}
                  transliteration={verse.transliteration?.text || ''}
                  showEnglish={translationVisible}
                  showTransliteration={transliterationVisible}
                />

                {/* Verse Metadata */}
                <View style={styles.verseMetadata}>
                  <Text style={[styles.verseInfo, { color: colors.secondaryText }]}>
                    Verse {verse.ayah.numberInSurah} of {surahData.ayahs.length} • 
                    Juz {verse.ayah.juz} • 
                    Page {verse.ayah.page}
                  </Text>
                </View>
              </View>
            ))}
            <View style={{ height: 120 }} />
          </ScrollView>
        )}

        {/* Reading Controls */}
        <ReadingControls
          showEnglish={translationVisible}
          onToggleEnglish={toggleTranslationVisible}
          showTransliteration={transliterationVisible}
          onToggleTransliteration={toggleTransliterationVisible}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onPlayAudio={() => console.log('Play audio')}
          totalVerses={surahData.ayahs.length}
          currentChapter={surahNumber}
          onJumpToVerse={handleJumpToVerse}
        />
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  backgroundTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.95,
  },
  paperGrain: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.005)',
    opacity: 0.6,
  },
  paperFibers: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139,114,73,0.008)',
    opacity: 0.4,
  },
  headerContainer: {
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  surahNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
  },
  surahIndicator: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  verseContainer: {
    marginBottom: 24,
  },
  bismillahContainer: {
    position: 'relative',
    marginHorizontal: 12,
    marginBottom: 32,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderTopWidth: 3,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  bismillahDecoration: {
    position: 'absolute',
    top: -1,
    left: '25%',
    right: '25%',
    height: 8,
    borderRadius: 4,
    opacity: 0.4,
  },
  bismillahText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  bismillahTranslation: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  verseMetadata: {
    marginTop: 16,
    alignItems: 'center',
  },
  verseInfo: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Error styles
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});