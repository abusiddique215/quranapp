import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, ScrollView, FlatList, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
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
import { QuranDB } from '@/lib/database/QuranDatabase';
import { useSurahCache } from '@/lib/hooks/useSurahCache';
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
  const [useVirtualization, setUseVirtualization] = useState(true); // Always use efficient rendering
  const [targetVerseNumber, setTargetVerseNumber] = useState<number | null>(null);
  
  // Zero-delay navigation states - always initialize with valid number
  const [currentSurahNumber, setCurrentSurahNumber] = useState<number>(1);
  const [versesLoading, setVersesLoading] = useState(false);
  
  // Smart surah caching for instant navigation
  const { 
    getCachedSurah, 
    loadSurahWithCache, 
    getSurahMetadata,
    preloadAdjacent,
    getCacheStats 
  } = useSurahCache();

  // Scroll references for both ScrollView and FlashList  
  const scrollViewRef = useRef<ScrollView>(null);
  const flashListRef = useRef<FlashList<VerseDetails>>(null);

  // Safe parameter parsing with validation
  const surahNumber = useMemo(() => {
    console.log(`[PARAMS] Raw surahParam:`, surahParam);
    
    // Handle undefined/null/empty cases
    if (!surahParam) {
      console.log(`[PARAMS] No param provided, defaulting to 1`);
      return 1;
    }
    
    const parsed = parseInt(surahParam, 10);
    console.log(`[PARAMS] Parsed number:`, parsed);
    
    // Validate range
    if (isNaN(parsed) || parsed < 1 || parsed > 114) {
      console.log(`[PARAMS] Invalid number ${parsed}, defaulting to 1`);
      return 1;
    }
    
    console.log(`[PARAMS] Valid surah number:`, parsed);
    return parsed;
  }, [surahParam]);
  
  // Sync currentSurahNumber with URL changes
  useEffect(() => {
    console.log(`[SYNC] surahNumber: ${surahNumber}, currentSurahNumber: ${currentSurahNumber}`);
    if (surahNumber && surahNumber !== currentSurahNumber) {
      console.log(`[SYNC] Updating currentSurahNumber to ${surahNumber}`);
      setCurrentSurahNumber(surahNumber);
    }
  }, [surahNumber, currentSurahNumber]);
  
  // Validate surah number
  const isValidSurah = surahNumber >= 1 && surahNumber <= 114;

  // Bismillah text constant
  const BISMILLAH_ARABIC = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

  /**
   * Clean verse data to separate Bismillah from actual verse content
   * According to Islamic scholarship, Bismillah appears before verses (not as part of them)
   * except in Al-Fatihah where it is verse 1, and At-Tawbah which has no Bismillah
   */
  // Huroof Muqatta'at (Mysterious Letters) lookup for surahs that begin with them
  const HUROOF_MUQATTAAT = {
    2: 'الم',          // Al-Baqarah
    3: 'الم',          // Aal-i-Imraan  
    7: 'المص',         // Al-A'raf
    10: 'الر',         // Yunus
    11: 'الر',         // Hud
    12: 'الر',         // Yusuf
    13: 'المر',        // Ar-Ra'd
    14: 'الر',         // Ibrahim
    15: 'الر',         // Al-Hijr
    19: 'كهيعص',       // Maryam
    20: 'طه',          // Ta-Ha
    26: 'طسم',         // Ash-Shu'ara
    27: 'طس',          // An-Naml
    28: 'طسم',         // Al-Qasas
    29: 'الم',         // Al-Ankabut
    30: 'الم',         // Ar-Rum
    31: 'الم',         // Luqman
    32: 'الم',         // As-Sajdah
    36: 'يس',          // Ya-Sin
    38: 'ص',           // Sad
    40: 'حم',          // Ghafir
    41: 'حم',          // Fussilat
    42: 'حم عسق',      // Ash-Shura
    43: 'حم',          // Az-Zukhruf
    44: 'حم',          // Ad-Dukhan
    45: 'حم',          // Al-Jathiyah
    46: 'حم',          // Al-Ahqaf
    50: 'ق',           // Qaf
    68: 'ن'            // Al-Qalam
  };

  const cleanVerseData = useCallback((verses: any[]) => {
    if (!verses || verses.length === 0) return verses;
    
    console.log(`[DEBUG] Processing surah ${surahNumber}, verses count:`, verses.length);
    
    // For surahs other than Al-Fatihah (1) and At-Tawbah (9)
    if (surahNumber !== 1 && surahNumber !== 9 && verses[0]) {
      const firstVerse = verses[0];
      const arabicText = firstVerse.ayah?.text || '';
      const translationText = firstVerse.translations?.[0]?.text || '';
      const transliterationText = firstVerse.transliteration?.text || '';
      
      console.log(`[DEBUG] Original verse 1 Arabic text:`, arabicText);
      console.log(`[DEBUG] Original verse 1 translation:`, translationText);
      
      // Special handling for surahs with Huroof Muqatta'at
      if (HUROOF_MUQATTAAT[surahNumber]) {
        const expectedText = HUROOF_MUQATTAAT[surahNumber];
        console.log(`[DEBUG] Expected Huroof Muqatta'at for surah ${surahNumber}:`, expectedText);
        
        // For these surahs, verse 1 should be only the mysterious letters
        const cleanedArabic = expectedText;
        
        // Clean up translation to only show the transliteration
        const cleanedTranslation = translationText
          .replace(/In the name of Allah[^.]*\./g, '')  // Remove Bismillah variations
          .replace(/بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ/g, '') // Remove Arabic Bismillah
          .trim();
        
        console.log(`[DEBUG] Cleaned Arabic text:`, cleanedArabic);
        console.log(`[DEBUG] Cleaned translation:`, cleanedTranslation);
        
        return verses.map((verse, index) => {
          if (index === 0) {
            return {
              ...verse,
              ayah: {
                ...verse.ayah,
                text: cleanedArabic
              },
              translations: verse.translations?.map((trans: any) => ({
                ...trans,
                text: cleanedTranslation || trans.text.replace(/.*\. */, '') // Keep only the part after Bismillah
              })) || [],
              transliteration: verse.transliteration ? {
                ...verse.transliteration,
                text: verse.transliteration.text.replace('Meeem', 'Meem')
              } : undefined
            };
          }
          return verse;
        });
      }
      
      // Fallback: Check if first verse contains Bismillah using various patterns
      const bismillahPatterns = [
        BISMILLAH_ARABIC,
        'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        'بِسۡمِ اللَّهِ الرَّحۡمَٰنِ الرَّحِيمِ'  // Alternative Unicode
      ];
      
      let foundBismillah = false;
      let cleanedArabic = arabicText;
      
      for (const pattern of bismillahPatterns) {
        if (arabicText.includes(pattern)) {
          foundBismillah = true;
          cleanedArabic = arabicText.replace(pattern, '').trim();
          break;
        }
      }
      
      if (foundBismillah) {
        console.log(`[DEBUG] Found Bismillah, cleaned Arabic:`, cleanedArabic);
        
        // Remove common Bismillah translations from English
        const bismillahTranslations = [
          'In the name of Allah—the Most Compassionate, Most Merciful.',
          'In the name of Allah, the Most Gracious, the Most Merciful.',
          'In the name of Allah, the Beneficent, the Merciful.',
          'In the name of God, the Most Gracious, the Most Merciful.'
        ];
        
        let cleanedTranslation = translationText;
        for (const bismillahTrans of bismillahTranslations) {
          cleanedTranslation = cleanedTranslation.replace(bismillahTrans, '').trim();
        }
        
        // Fix transliteration: "Alif-Laam-Meeem" → "Alif-Laam-Meem"
        let cleanedTransliteration = transliterationText;
        cleanedTransliteration = cleanedTransliteration.replace('Meeem', 'Meem');
        
        console.log(`[DEBUG] Final cleaned Arabic:`, cleanedArabic);
        console.log(`[DEBUG] Final cleaned translation:`, cleanedTranslation);
        
        // Update the first verse with cleaned content
        return verses.map((verse, index) => {
          if (index === 0) {
            return {
              ...verse,
              ayah: {
                ...verse.ayah,
                text: cleanedArabic
              },
              translations: verse.translations?.map((trans: any) => ({
                ...trans,
                text: cleanedTranslation
              })) || [],
              transliteration: verse.transliteration ? {
                ...verse.transliteration,
                text: cleanedTransliteration
              } : undefined
            };
          }
          return verse;
        });
      }
      
      // Also fix transliteration typo even if no Bismillah separation needed
      return verses.map((verse) => ({
        ...verse,
        transliteration: verse.transliteration ? {
          ...verse.transliteration,
          text: verse.transliteration.text.replace('Meeem', 'Meem')
        } : undefined
      }));
    }
    
    return verses;
  }, [surahNumber]);

  useEffect(() => {
    if (!isValidSurah) return;

    console.log(`[EFFECT] Loading surah ${currentSurahNumber} with instant cache system`);
    
    // Use the instant loading system for initial load too
    setLoading(true);
    setVersesLoading(true);
    
    loadSurahInstant(currentSurahNumber).finally(() => {
      setLoading(false);
    });
    
  }, [currentSurahNumber, retryAttempt, isValidSurah, loadSurahInstant]);

  // Zero-delay navigation functions
  const handlePreviousSurah = useCallback(() => {
    // Safety check: ensure we have a valid current surah number
    if (!currentSurahNumber || isNaN(currentSurahNumber)) {
      console.error(`[Navigation] Invalid currentSurahNumber: ${currentSurahNumber}`);
      return;
    }
    
    const targetSurah = currentSurahNumber - 1;
    if (targetSurah >= 1) {
      console.log(`[Navigation] Instant navigation to surah ${targetSurah}`);
      
      // 1. INSTANT UI UPDATE - Zero delay perception
      setCurrentSurahNumber(targetSurah);
      setVersesLoading(true);
      
      // 2. Update URL without full reload (shallow routing)
      router.replace(`/read/${targetSurah}`, undefined, { shallow: true });
      
      // 3. Load data in background (non-blocking)
      setTimeout(() => {
        loadSurahInstant(targetSurah);
      }, 0);
    }
  }, [currentSurahNumber, router, loadSurahInstant]);

  const handleNextSurah = useCallback(() => {
    // Safety check: ensure we have a valid current surah number
    if (!currentSurahNumber || isNaN(currentSurahNumber)) {
      console.error(`[Navigation] Invalid currentSurahNumber: ${currentSurahNumber}`);
      return;
    }
    
    const targetSurah = currentSurahNumber + 1;
    if (targetSurah <= 114) {
      console.log(`[Navigation] Instant navigation to surah ${targetSurah}`);
      
      // 1. INSTANT UI UPDATE - Zero delay perception  
      setCurrentSurahNumber(targetSurah);
      setVersesLoading(true);
      
      // 2. Update URL without full reload (shallow routing)
      router.replace(`/read/${targetSurah}`, undefined, { shallow: true });
      
      // 3. Load data in background (non-blocking)
      setTimeout(() => {
        loadSurahInstant(targetSurah);
      }, 0);
    }
  }, [currentSurahNumber, router, loadSurahInstant]);

  // Instant surah loading with cache-first approach
  const loadSurahInstant = useCallback(async (targetSurahNumber: number) => {
    // Safety check: ensure we have a valid surah number
    if (!targetSurahNumber || isNaN(targetSurahNumber) || targetSurahNumber < 1 || targetSurahNumber > 114) {
      console.error(`[LoadInstant] Invalid surah number: ${targetSurahNumber}, aborting load`);
      setError('api');
      setVersesLoading(false);
      return;
    }
    
    try {
      console.log(`[LoadInstant] Loading surah ${targetSurahNumber} with cache-first approach`);
      
      // Check cache first for instant response
      const cachedData = getCachedSurah(targetSurahNumber);
      if (cachedData) {
        console.log(`[LoadInstant] Using cached data for surah ${targetSurahNumber}`);
        
        // Apply Islamic accuracy cleaning
        const cleanedData = {
          ...cachedData,
          ayahs: cleanVerseData(cachedData.ayahs)
        };
        
        setSurahData(cleanedData);
        setVersesLoading(false);
        setError(null);
        
        // Preload adjacent chapters in background
        preloadAdjacent(targetSurahNumber);
        return;
      }
      
      // Load from database/API with high priority
      console.log(`[LoadInstant] Loading surah ${targetSurahNumber} from database/API`);
      const data = await loadSurahWithCache(targetSurahNumber, 'high');
      
      if (data) {
        // Apply Islamic accuracy cleaning
        const cleanedData = {
          ...data,
          ayahs: cleanVerseData(data.ayahs)
        };
        
        setSurahData(cleanedData);
        setError(null);
        console.log(`[LoadInstant] Successfully loaded surah ${targetSurahNumber} with ${cleanedData.ayahs.length} verses`);
        
        // Preload adjacent chapters in background
        preloadAdjacent(targetSurahNumber);
      } else {
        setError('api');
        console.error(`[LoadInstant] Failed to load surah ${targetSurahNumber}`);
      }
      
    } catch (error) {
      console.error(`[LoadInstant] Error loading surah ${targetSurahNumber}:`, error);
      setError('api');
    } finally {
      setVersesLoading(false);
    }
  }, [getCachedSurah, loadSurahWithCache, preloadAdjacent, cleanVerseData]);

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
    
    if (useVirtualization && flashListRef.current) {
      // For FlashList (virtualized long surahs like Al-Baqarah)
      try {
        flashListRef.current.scrollToIndex({
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
        
        flashListRef.current.scrollToOffset({
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
          {/* Top decorative line */}
          <View style={[styles.bismillahDecoration, { backgroundColor: colors.accent }]} />
          
          {/* Ornamental flourishes */}
          <View style={styles.bismillahOrnaments}>
            <Text style={[styles.bismillahOrnament, { color: colors.accent }]}>❋</Text>
            <View style={[styles.bismillahDivider, { backgroundColor: colors.accent }]} />
            <Text style={[styles.bismillahOrnament, { color: colors.accent }]}>❋</Text>
          </View>
          
          <Text style={[styles.bismillahText, { color: colors.text }]}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
          <Text style={[styles.bismillahTranslation, { color: colors.secondaryText }]}>
            In the name of Allah—the Most Compassionate, Most Merciful.
          </Text>
          
          {/* Bottom ornamental flourishes */}
          <View style={[styles.bismillahOrnaments, { marginTop: 12 }]}>
            <Text style={[styles.bismillahOrnament, { color: colors.accent }]}>❋</Text>
            <View style={[styles.bismillahDivider, { backgroundColor: colors.accent }]} />
            <Text style={[styles.bismillahOrnament, { color: colors.accent }]}>❋</Text>
          </View>
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
    
    if (flashListRef.current) {
      flashListRef.current.scrollToOffset({
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

  const isFirstSurah = currentSurahNumber === 1;
  const isLastSurah = currentSurahNumber === 114;
  
  // Get instant metadata for zero-delay UI updates
  const currentMetadata = getSurahMetadata(currentSurahNumber);

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
                disabled={false} // Never disable for zero-delay navigation
                style={[styles.navButton, { opacity: isFirstSurah ? 0.3 : 1 }]}
              >
                <Ionicons name="chevron-back" size={20} color={colors.accent} />
              </TouchableOpacity>

              <View style={styles.surahIndicatorContainer}>
                <Text style={[styles.surahIndicator, { color: colors.text }]}>
                  {currentSurahNumber} / 114
                </Text>
                {currentMetadata && (
                  <Text style={[styles.surahName, { color: colors.secondaryText }]}>
                    {currentMetadata.englishName}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={handleNextSurah}
                disabled={false} // Never disable for zero-delay navigation
                style={[styles.navButton, { opacity: isLastSurah ? 0.3 : 1 }]}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.accent} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Chapter Header - Instant or Loading */}
        {surahData ? (
          <ChapterHeader surah={surahData.surah} compact={true} />
        ) : currentMetadata ? (
          <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.loadingHeaderTitle, { color: colors.text }]}>
              {currentMetadata.name}
            </Text>
            <Text style={[styles.loadingHeaderSubtitle, { color: colors.secondaryText }]}>
              {currentMetadata.englishName}
            </Text>
            {versesLoading && (
              <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 8 }} />
            )}
          </View>
        ) : null}

        {/* Reading Content - Unified Scrollable View */}
        {useVirtualization ? (
          // Virtualized list for very long surahs (memory efficient)
          <>
            {console.log(`[FLASHLIST] Rendering ${surahData.ayahs.length} verses in FlashList with virtualization`) || null}
            <FlashList
              ref={flashListRef}
              data={surahData.ayahs}
              renderItem={renderVerseItem}
              keyExtractor={verseKeyExtractor}
              estimatedItemSize={180} // Average verse height for FlashList performance
              onScrollToIndexFailed={handleScrollToIndexFailed}
              showsVerticalScrollIndicator={false}
              // FlashList optimizations for smooth Quran reading
              drawDistance={400} // Render ahead distance for smooth scrolling
              // Smooth scrolling enhancements
              bounces={true}
              alwaysBounceVertical={false}
            />
          </>
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
                {/* Top decorative line */}
                <View style={[styles.bismillahDecoration, { backgroundColor: colors.accent }]} />
                
                {/* Ornamental flourishes */}
                <View style={styles.bismillahOrnaments}>
                  <Text style={[styles.bismillahOrnament, { color: colors.accent }]}>❋</Text>
                  <View style={[styles.bismillahDivider, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.bismillahOrnament, { color: colors.accent }]}>❋</Text>
                </View>
                
                <Text style={[styles.bismillahText, { color: colors.text }]}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </Text>
                <Text style={[styles.bismillahTranslation, { color: colors.secondaryText }]}>
                  In the name of Allah—the Most Compassionate, Most Merciful.
                </Text>
                
                {/* Bottom ornamental flourishes */}
                <View style={[styles.bismillahOrnaments, { marginTop: 12 }]}>
                  <Text style={[styles.bismillahOrnament, { color: colors.accent }]}>❋</Text>
                  <View style={[styles.bismillahDivider, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.bismillahOrnament, { color: colors.accent }]}>❋</Text>
                </View>
              </View>
            )}

            {/* All Verses */}
            {console.log(`[RENDER] Rendering ${surahData.ayahs.length} verses in ScrollView`) || null}
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
  surahIndicatorContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  surahIndicator: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  surahName: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  loadingHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  loadingHeaderSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
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
    marginHorizontal: 16,
    marginVertical: 32,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(46, 125, 50, 0.05)', // Soft Islamic green background
    borderWidth: 2,
    borderStyle: 'solid',
    alignItems: 'center',
    // Add subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  bismillahDecoration: {
    position: 'absolute',
    top: -2,
    left: '20%',
    right: '20%',
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  bismillahText: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
    // Add letter spacing for Arabic text elegance
    letterSpacing: 1,
    // Ensure proper Arabic text rendering
    writingDirection: 'rtl',
  },
  bismillahTranslation: {
    fontSize: 15,
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '500',
    lineHeight: 20,
    opacity: 0.9,
    marginTop: 4,
  },
  bismillahOrnaments: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  bismillahOrnament: {
    fontSize: 16,
    fontWeight: '400',
    marginHorizontal: 8,
    opacity: 0.7,
  },
  bismillahDivider: {
    height: 1,
    width: 40,
    opacity: 0.5,
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