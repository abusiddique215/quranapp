import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import type { Surah } from '@/types/quran';

interface ChapterHeaderProps {
  surah: Surah;
  showProgress?: boolean;
  progress?: number;
  compact?: boolean;
}

export const ChapterHeader = React.memo<ChapterHeaderProps>(({
  surah,
  showProgress = false,
  progress = 0,
  compact = false
}) => {
  const { colors } = useTheme();

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: colors.cardWarm }]}>
        <View style={styles.compactContent}>
          <View style={styles.compactTitleRow}>
            <Text style={[styles.compactEnglishName, { color: colors.text }]}>
              {surah.englishName}
            </Text>
            <Text style={[styles.compactNumber, { color: colors.accent }]}>
              {surah.number}
            </Text>
          </View>
          <Text style={[styles.compactArabicName, { color: colors.text }]}>
            {surah.name}
          </Text>
          <Text style={[styles.compactMeta, { color: colors.secondaryText }]}>
            {surah.numberOfAyahs} verses • {surah.revelationType}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.cardWarm,
      borderColor: colors.paperBorder 
    }]}>
      {/* Decorative Border */}
      <View style={[styles.decorativeBorder, { backgroundColor: colors.accent }]} />
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* Chapter Number */}
        <View style={[styles.numberBadge, { 
          backgroundColor: colors.accent,
          shadowColor: colors.shadow 
        }]}>
          <Text style={[styles.numberText, { color: colors.background }]}>
            {surah.number}
          </Text>
        </View>

        {/* Chapter Names */}
        <View style={styles.nameContainer}>
          <Text style={[styles.arabicName, { color: colors.text }]}>
            {surah.name}
          </Text>
          <Text style={[styles.englishName, { color: colors.text }]}>
            {surah.englishName}
          </Text>
          <Text style={[styles.englishTranslation, { color: colors.secondaryText }]}>
            {surah.englishNameTranslation}
          </Text>
        </View>

        {/* Metadata */}
        <View style={styles.metadataContainer}>
          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <Ionicons 
                name="list-outline" 
                size={16} 
                color={colors.accent} 
                style={styles.metadataIcon}
              />
              <Text style={[styles.metadataLabel, { color: colors.secondaryText }]}>
                Verses:
              </Text>
              <Text style={[styles.metadataValue, { color: colors.text }]}>
                {surah.numberOfAyahs}
              </Text>
            </View>
            
            <View style={styles.metadataItem}>
              <Ionicons 
                name="location-outline" 
                size={16} 
                color={colors.accent} 
                style={styles.metadataIcon}
              />
              <Text style={[styles.metadataLabel, { color: colors.secondaryText }]}>
                Revelation:
              </Text>
              <Text style={[styles.metadataValue, { color: colors.text }]}>
                {surah.revelationType}
              </Text>
            </View>
          </View>
          
          {/* Reading Progress */}
          {showProgress && progress > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.secondaryText }]}>
                  Reading Progress
                </Text>
                <Text style={[styles.progressValue, { color: colors.accent }]}>
                  {Math.round(progress)}%
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.paperBorder }]}>
                <View 
                  style={[styles.progressFill, { 
                    backgroundColor: colors.accent,
                    width: `${progress}%`
                  }]}
                />
              </View>
            </View>
          )}
        </View>
      </View>
      
      {/* Bottom Decorative Element */}
      <View style={styles.decorativeBottom}>
        <View style={[styles.decorativeDot, { backgroundColor: colors.accent }]} />
        <View style={[styles.decorativeLine, { backgroundColor: colors.paperBorder }]} />
        <View style={[styles.decorativeDot, { backgroundColor: colors.accent }]} />
      </View>
    </View>
  );
});

ChapterHeader.displayName = 'ChapterHeader';

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  decorativeBorder: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  numberBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  numberText: {
    fontSize: 24,
    fontWeight: '700',
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  arabicName: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  englishName: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  englishTranslation: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  metadataContainer: {
    width: '100%',
    alignItems: 'center',
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  metadataIcon: {
    marginRight: 6,
  },
  metadataLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressSection: {
    width: '100%',
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  decorativeBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  decorativeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  decorativeLine: {
    height: 2,
    flex: 1,
    marginHorizontal: 12,
    maxWidth: 80,
  },

  // Compact styles - Ultra minimal for reading page
  compactContainer: {
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  compactContent: {
    alignItems: 'center',
  },
  compactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 2,
  },
  compactEnglishName: {
    fontSize: 15,
    fontWeight: '600',
  },
  compactNumber: {
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: 'rgba(139,114,73,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compactArabicName: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 2,
  },
  compactMeta: {
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});