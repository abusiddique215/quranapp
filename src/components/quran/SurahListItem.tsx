import React, { useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import type { Surah } from '@/types/quran';

interface SurahListItemData extends Surah {
  readingProgress?: number; // 0-100%
  isBookmarked?: boolean;
  lastAccessedAt?: Date;
}

interface SurahListItemProps {
  surah: SurahListItemData;
  onPress: (surah: SurahListItemData) => void;
  showProgress?: boolean;
  compact?: boolean;
}

// High-performance comparison function for React.memo
const arePropsEqual = (prevProps: SurahListItemProps, nextProps: SurahListItemProps): boolean => {
  // Shallow compare key props for maximum performance
  return (
    prevProps.surah.number === nextProps.surah.number &&
    prevProps.surah.readingProgress === nextProps.surah.readingProgress &&
    prevProps.surah.isBookmarked === nextProps.surah.isBookmarked &&
    prevProps.showProgress === nextProps.showProgress &&
    prevProps.compact === nextProps.compact &&
    prevProps.onPress === nextProps.onPress
  );
};

// Ultra-optimized SurahListItem with custom comparison
export const SurahListItem = React.memo<SurahListItemProps>(({
  surah,
  onPress,
  showProgress = true,
  compact = false
}) => {
  const { colors } = useTheme();

  // Memoized press handler to prevent re-renders
  const handlePress = useCallback(() => {
    onPress(surah);
  }, [surah.number, onPress]); // Only depend on surah.number, not entire object

  // Memoize expensive style computations
  const cardStyle = React.useMemo(() => [
    styles.surahCard,
    {
      backgroundColor: colors.cardWarm,
      borderColor: colors.paperBorder,
      shadowColor: colors.shadow,
    }
  ], [colors.cardWarm, colors.paperBorder, colors.shadow]);

  const compactCardStyle = React.useMemo(() => [
    styles.compactCard,
    {
      backgroundColor: colors.cardWarm,
      borderColor: colors.paperBorder,
    }
  ], [colors.cardWarm, colors.paperBorder]);

  // Memoize progress calculation to avoid re-computation
  const progressPercentage = React.useMemo(() => 
    surah.readingProgress ? Math.round(surah.readingProgress) : 0,
    [surah.readingProgress]
  );

  // Memoize progress width calculation
  const progressWidth = React.useMemo(() => 
    `${surah.readingProgress || 0}%`,
    [surah.readingProgress]
  );

  if (compact) {
    return (
      <TouchableOpacity 
        style={compactCardStyle}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={[styles.compactBadge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.compactNumber, { color: colors.background }]}>
            {surah.number}
          </Text>
        </View>
        
        <View style={styles.compactContent}>
          <Text style={[styles.compactEnglish, { color: colors.text }]} numberOfLines={1}>
            {surah.englishName}
          </Text>
          <Text style={[styles.compactMeta, { color: colors.secondaryText }]} numberOfLines={1}>
            {surah.numberOfAyahs} verses
          </Text>
        </View>
        
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={colors.secondaryText}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={cardStyle}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Surah Number Badge */}
      <View style={[styles.numberBadge, { backgroundColor: colors.accent }]}>
        <Text style={[styles.numberText, { color: colors.background }]}>
          {surah.number}
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.cardContent}>
        {/* Arabic Name */}
        <Text style={[styles.arabicName, { color: colors.text }]} numberOfLines={1}>
          {surah.name}
        </Text>
        
        {/* English Names */}
        <Text style={[styles.englishName, { color: colors.text }]} numberOfLines={1}>
          {surah.englishName}
        </Text>
        <Text style={[styles.englishTranslation, { color: colors.secondaryText }]} numberOfLines={1}>
          {surah.englishNameTranslation}
        </Text>

        {/* Metadata */}
        <View style={styles.metadataRow}>
          <View style={styles.metadataItem}>
            <Ionicons 
              name="list-outline" 
              size={14} 
              color={colors.accent} 
              style={styles.metadataIcon}
            />
            <Text style={[styles.metadataText, { color: colors.secondaryText }]}>
              {surah.numberOfAyahs} verses
            </Text>
          </View>
          
          <View style={styles.metadataItem}>
            <Ionicons 
              name="location-outline" 
              size={14} 
              color={colors.accent} 
              style={styles.metadataIcon}
            />
            <Text style={[styles.metadataText, { color: colors.secondaryText }]}>
              {surah.revelationType}
            </Text>
          </View>
        </View>

        {/* Progress Bar (if reading progress exists) */}
        {showProgress && surah.readingProgress !== undefined && surah.readingProgress > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: colors.paperBorder }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: colors.accent,
                    width: progressWidth
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: colors.secondaryText }]}>
              {progressPercentage}% read
            </Text>
          </View>
        )}
      </View>

      {/* Action Icons */}
      <View style={styles.actionIcons}>
        {surah.isBookmarked && (
          <Ionicons 
            name="bookmark" 
            size={18} 
            color={colors.accent} 
            style={styles.actionIcon}
          />
        )}
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={colors.secondaryText}
        />
      </View>
    </TouchableOpacity>
  );
}, arePropsEqual); // Use custom comparison function

SurahListItem.displayName = 'SurahListItem';

const styles = StyleSheet.create({
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
  
  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 2,
  },
  compactBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compactNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  compactContent: {
    flex: 1,
  },
  compactEnglish: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  compactMeta: {
    fontSize: 11,
  },
});