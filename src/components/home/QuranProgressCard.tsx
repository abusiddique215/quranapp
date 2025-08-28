import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '@/theme/theme';
import { Feather } from '@expo/vector-icons';

interface QuranProgressCardProps {
  lastRead?: {
    surah: number;
    ayah: number;
    surahName: string;
  };
  readingStreak?: number;
  totalProgress?: number; // percentage of Quran read
}

export function QuranProgressCard({ 
  lastRead = { surah: 2, ayah: 45, surahName: 'Al-Baqarah' },
  readingStreak = 7,
  totalProgress = 23.5
}: QuranProgressCardProps) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.cardWarm }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Feather name="bookmark" size={20} color={colors.accent} />
          <Text style={[styles.title, { color: colors.text }]}>Continue Reading</Text>
        </View>
        <View style={styles.streak}>
          <Feather name="flame" size={16} color={colors.accent} />
          <Text style={[styles.streakText, { color: colors.accent }]}>{readingStreak} days</Text>
        </View>
      </View>

      <Link href="/read" asChild>
        <Pressable style={styles.mainContent}>
          <View style={styles.lastReadSection}>
            <Text style={[styles.surahName, { color: colors.text }]}>
              {lastRead.surahName}
            </Text>
            <Text style={[styles.ayahInfo, { color: colors.textMuted }]}>
              Surah {lastRead.surah}, Ayah {lastRead.ayah}
            </Text>
            
            <View style={styles.progressContainer}>
              <View style={[styles.progressTrack, { backgroundColor: colors.backgroundDeep }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: colors.accent,
                      width: `${totalProgress}%`
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textMuted }]}>
                {totalProgress.toFixed(1)}% completed
              </Text>
            </View>
          </View>

          <View style={[styles.continueButton, { backgroundColor: colors.primary }]}>
            <Feather name="play" size={20} color={colors.textOnAccent} />
          </View>
        </Pressable>
      </Link>

      <View style={styles.footer}>
        <Pressable style={styles.footerButton}>
          <Feather name="list" size={16} color={colors.textMuted} />
          <Text style={[styles.footerButtonText, { color: colors.textMuted }]}>
            All Surahs
          </Text>
        </Pressable>
        <Pressable style={styles.footerButton}>
          <Feather name="star" size={16} color={colors.textMuted} />
          <Text style={[styles.footerButtonText, { color: colors.textMuted }]}>
            Bookmarks
          </Text>
        </Pressable>
        <Pressable style={styles.footerButton}>
          <Feather name="search" size={16} color={colors.textMuted} />
          <Text style={[styles.footerButtonText, { color: colors.textMuted }]}>
            Search
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    padding: 20,
    // iOS-compatible shadow
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  lastReadSection: {
    flex: 1,
  },
  surahName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  ayahInfo: {
    fontSize: 14,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 80,
  },
  continueButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  footerButtonText: {
    fontSize: 13,
    marginLeft: 6,
  },
});