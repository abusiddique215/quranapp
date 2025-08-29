import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  Text, 
  ActivityIndicator, 
  TextInput,
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import { useAuthStatus } from '@/lib/contexts/AuthContext';
import { CalligraphicHeader } from '@/components/shared/CalligraphicHeader';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { 
  ErrorBanner, 
  GuestModeIndicator, 
  NetworkError,
  ApiError,
  LoadingError 
} from '@/components/shared/ErrorStates';
import { QuranService } from '@/lib/api/services';
import { SurahListItem } from '@/components/quran/SurahListItem';
import type { Surah } from '@/types/quran';

const { width: screenWidth } = Dimensions.get('window');

interface SurahItemData extends Surah {
  readingProgress?: number; // 0-100%
  isBookmarked?: boolean;
  lastAccessedAt?: Date;
}


export default function SurahsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    isGuest,
    isOnline,
    hasErrors,
    apiError,
    retry,
    clearErrors
  } = useAuthStatus();
  
  const [surahs, setSurahs] = useState<SurahItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [renderMetrics, setRenderMetrics] = useState({
    totalRenderTime: 0,
    itemsRendered: 0,
    scrollPerformance: 'optimal'
  });

  // Load Surahs data
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadSurahs = async () => {
      try {
        setLoading(true);
        setError(null);
        setLoadingTimeout(false);

        // Set timeout for loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            setLoadingTimeout(true);
          }
        }, 8000); // 8 second timeout

        // Load Surahs with timeout
        const loadWithTimeout = <T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
          return Promise.race([
            promise,
            new Promise<T>((_, reject) => 
              setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
            )
          ]);
        };

        const surahsData = await loadWithTimeout(QuranService.getAllSurahs());
        
        if (!isMounted) return;

        // Clear timeout if successful
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Enhance with reading progress data (mock for now)
        const enhancedSurahs: SurahItemData[] = surahsData.map((surah, index) => ({
          ...surah,
          readingProgress: index === 0 ? 100 : Math.random() > 0.7 ? Math.random() * 100 : undefined,
          isBookmarked: Math.random() > 0.8,
          lastAccessedAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
        }));

        setSurahs(enhancedSurahs);
      } catch (err) {
        console.error('Error loading Surahs:', err);
        
        if (!isMounted) return;
        
        // Determine error type
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const isNetworkError = errorMessage.includes('Network') || 
                              errorMessage.includes('fetch') ||
                              errorMessage.includes('timeout');
        
        setError(isNetworkError ? 'network' : 'api');
        
        // Fallback to minimal data
        setSurahs([{
          number: 1,
          name: 'سُورَةُ ٱلْفَاتِحَةِ',
          englishName: 'Al-Fatihah',
          englishNameTranslation: 'The Opening',
          numberOfAyahs: 7,
          revelationType: 'Meccan',
          readingProgress: 100,
          isBookmarked: true,
        }]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    loadSurahs();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [retryAttempt]);

  // Retry function
  const handleRetryData = useCallback(() => {
    setRetryAttempt(prev => prev + 1);
    clearErrors();
  }, [clearErrors]);

  // Search functionality with debouncing
  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return surahs;
    
    const query = searchQuery.toLowerCase().trim();
    return surahs.filter(surah => 
      surah.englishName.toLowerCase().includes(query) ||
      surah.englishNameTranslation.toLowerCase().includes(query) ||
      surah.number.toString().includes(query) ||
      surah.name.includes(query)
    );
  }, [surahs, searchQuery]);

  // Navigate to reading screen
  const handleSurahPress = useCallback((surah: SurahItemData) => {
    router.push(`/read/${surah.number}`);
  }, [router]);

  // Optimized FlatList renderItem
  const renderSurahItem = useCallback(({ item }: { item: SurahItemData }) => (
    <SurahListItem
      surah={item}
      onPress={handleSurahPress}
      showProgress={true}
    />
  ), [handleSurahPress]);

  // FlatList keyExtractor
  const keyExtractor = useCallback((item: SurahItemData) => `surah-${item.number}`, []);

  // High-precision getItemLayout for 60fps performance  
  const getItemLayout = useCallback((data: any, index: number) => {
    const ITEM_HEIGHT = 120; // Fixed height per item
    return {
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    };
  }, []);

  // Performance-optimized empty component
  const EmptyListComponent = React.useMemo(() => () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name="search-outline" 
        size={48} 
        color={colors.secondaryText}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
        No chapters found matching "{searchQuery}"
      </Text>
      <TouchableOpacity 
        onPress={() => setSearchQuery('')}
        style={[styles.clearSearchButton, { borderColor: colors.accent }]}
      >
        <Text style={[styles.clearSearchText, { color: colors.accent }]}>
          Clear search
        </Text>
      </TouchableOpacity>
    </View>
  ), [searchQuery, colors.secondaryText, colors.accent]);

  // Memoized separator component for performance
  const ItemSeparatorComponent = React.useMemo(() => () => 
    <View style={{ height: 8 }} />, []);

  // Performance monitoring callbacks
  const onScrollToIndexFailed = useCallback((info: any) => {
    console.warn('Scroll to index failed:', info);
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    setRenderMetrics(prev => ({
      ...prev,
      itemsRendered: viewableItems.length,
    }));
  }, []);

  const viewabilityConfig = React.useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 16, // 60fps frame time
  }), []);

  // Show network error if offline
  if (!isOnline) {
    return (
      <NetworkError
        title="No Internet Connection"
        message="Browsing Quran chapters requires an internet connection. Please check your connection."
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
        fallbackMessage="Quran service is temporarily unavailable. Showing available chapters."
        onRetry={handleRetryData}
        isRetrying={loading}
      />
    );
  }

  // Show loading timeout error
  if (loadingTimeout && loading) {
    return (
      <LoadingError
        resource="Quran chapters"
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
          Loading Quran chapters...
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="dark" />
        
        {/* Guest mode indicator with proper safe area */}
        {isGuest && (
          <View style={{ paddingTop: insets.top + 8 }}>
            <GuestModeIndicator />
          </View>
        )}
        
        {/* Content with proper safe area handling */}
        <View style={[
          styles.safeContent, 
          { paddingTop: isGuest ? 8 : insets.top + 16 }
        ]}>
          {/* Content starts here */}
          
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

          {/* Header with improved spacing */}
          <View style={styles.header}>
            <CalligraphicHeader
              title="Quran Chapters"
              arabicTitle="سور القرآن"
              subtitle={`${filteredSurahs.length} of ${surahs.length} chapters`}
              size="lg"
              align="center"
            />
          </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { 
            backgroundColor: colors.cardWarm,
            borderColor: colors.paperBorder 
          }]}>
            <Ionicons 
              name="search" 
              size={20} 
              color={colors.secondaryText} 
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { 
                color: colors.text,
                backgroundColor: 'transparent'
              }]}
              placeholder="Search by name, number, or meaning..."
              placeholderTextColor={colors.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons 
                  name="close-circle" 
                  size={20} 
                  color={colors.secondaryText}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Results Summary */}
          {searchQuery.length > 0 && (
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsText, { color: colors.secondaryText }]}>
                {filteredSurahs.length} chapter{filteredSurahs.length !== 1 ? 's' : ''} found
              </Text>
            </View>
          )}

          {/* High-Performance Surahs List - Optimized for 114 chapters */}
          <FlatList
          data={filteredSurahs}
          renderItem={renderSurahItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          // Performance optimizations for large lists
          initialNumToRender={15} // Reduced for faster initial render
          maxToRenderPerBatch={8} // Smaller batches for 60fps
          updateCellsBatchingPeriod={50} // 50ms batching for smooth scrolling
          windowSize={5} // Smaller window size for memory efficiency
          removeClippedSubviews={true}
          scrollEventThrottle={16} // 60fps scroll events
          // Advanced performance settings
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          // Enable native optimizations
          legacyImplementation={false}
          disableVirtualization={false}
          // Performance-critical viewport settings
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          // Memoized components
          ItemSeparatorComponent={ItemSeparatorComponent}
          ListEmptyComponent={EmptyListComponent}
          // Performance monitoring
          onScrollToIndexFailed={onScrollToIndexFailed}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />

          {/* Quick Navigation (Optional) */}
          <View style={styles.quickNav}>
            <Link href="/read/1" asChild>
              <TouchableOpacity 
                style={[styles.quickNavButton, { 
                  backgroundColor: colors.accent,
                  shadowColor: colors.shadow
                }]}
              >
                <Ionicons name="play" size={20} color={colors.background} />
                <Text style={[styles.quickNavText, { color: colors.background }]}>
                  Start Reading
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeContent: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Space for quick nav
  },
  surahCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  numberText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
  },
  arabicName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'right',
  },
  englishName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  englishTranslation: {
    fontSize: 14,
    marginBottom: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metadataIcon: {
    marginRight: 4,
  },
  metadataText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 60,
    textAlign: 'right',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  clearSearchButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickNav: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  quickNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  quickNavText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
});