import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';

interface ReadingProgress {
  surahsCompleted: number;
  totalSurahs: number;
  versesRead: number;
  totalVerses: number;
  currentStreak: number;
  longestStreak: number;
  readingTime: number; // in minutes
}

interface ProgressTrackerProps {
  progress: ReadingProgress;
  showDetailed?: boolean;
  compact?: boolean;
}

export const ProgressTracker = React.memo<ProgressTrackerProps>(({
  progress,
  showDetailed = true,
  compact = false
}) => {
  const { colors } = useTheme();

  const surahProgress = (progress.surahsCompleted / progress.totalSurahs) * 100;
  const verseProgress = (progress.versesRead / progress.totalVerses) * 100;
  
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: colors.cardWarm }]}>
        <View style={styles.compactRow}>
          <View style={styles.compactItem}>
            <Ionicons name="book-outline" size={16} color={colors.accent} />
            <Text style={[styles.compactValue, { color: colors.text }]}>
              {progress.surahsCompleted}/{progress.totalSurahs}
            </Text>
          </View>
          
          <View style={styles.compactItem}>
            <Ionicons name="flame-outline" size={16} color={colors.accent} />
            <Text style={[styles.compactValue, { color: colors.text }]}>
              {progress.currentStreak}
            </Text>
          </View>
          
          <View style={styles.compactItem}>
            <Ionicons name="time-outline" size={16} color={colors.accent} />
            <Text style={[styles.compactValue, { color: colors.text }]}>
              {formatTime(progress.readingTime)}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.cardWarm,
      borderColor: colors.paperBorder,
      shadowColor: colors.shadow 
    }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="analytics-outline" size={24} color={colors.accent} />
          <Text style={[styles.title, { color: colors.text }]}>
            Reading Progress
          </Text>
        </View>
        <View style={[styles.streakBadge, { backgroundColor: colors.accent }]}>
          <Ionicons name="flame" size={16} color={colors.background} />
          <Text style={[styles.streakText, { color: colors.background }]}>
            {progress.currentStreak}
          </Text>
        </View>
      </View>

      {/* Main Progress Bars */}
      <View style={styles.progressSection}>
        {/* Surah Progress */}
        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.text }]}>
              Chapters Completed
            </Text>
            <Text style={[styles.progressValue, { color: colors.accent }]}>
              {progress.surahsCompleted} / {progress.totalSurahs}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.paperBorder }]}>
            <View 
              style={[styles.progressFill, { 
                backgroundColor: colors.accent,
                width: `${surahProgress}%`
              }]}
            />
          </View>
          <Text style={[styles.progressPercentage, { color: colors.secondaryText }]}>
            {Math.round(surahProgress)}% complete
          </Text>
        </View>

        {/* Verse Progress */}
        {showDetailed && (
          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.text }]}>
                Total Verses Read
              </Text>
              <Text style={[styles.progressValue, { color: colors.accent }]}>
                {progress.versesRead.toLocaleString()} / {progress.totalVerses.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.paperBorder }]}>
              <View 
                style={[styles.progressFill, { 
                  backgroundColor: colors.accent,
                  width: `${verseProgress}%`
                }]}
              />
            </View>
            <Text style={[styles.progressPercentage, { color: colors.secondaryText }]}>
              {Math.round(verseProgress)}% complete
            </Text>
          </View>
        )}
      </View>

      {/* Statistics Grid */}
      {showDetailed && (
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="flame-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>
              Current Streak
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {progress.currentStreak} days
            </Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="trophy-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>
              Best Streak
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {progress.longestStreak} days
            </Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="time-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>
              Reading Time
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatTime(progress.readingTime)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="library-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>
              Completion Rate
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {Math.round(surahProgress)}%
            </Text>
          </View>
        </View>
      )}

      {/* Motivational Message */}
      <View style={[styles.motivationContainer, { backgroundColor: colors.accent + '10' }]}>
        <Ionicons name="star" size={16} color={colors.accent} />
        <Text style={[styles.motivationText, { color: colors.accent }]}>
          {getMotivationalMessage(surahProgress, progress.currentStreak)}
        </Text>
      </View>
    </View>
  );
});

const getMotivationalMessage = (progress: number, streak: number): string => {
  if (progress >= 100) return "Alhamdulillah! You've completed the Quran!";
  if (progress >= 75) return "Amazing progress! You're almost there!";
  if (progress >= 50) return "Halfway through your journey. Keep going!";
  if (progress >= 25) return "Great start! You're making excellent progress!";
  if (streak >= 30) return "Incredible streak! Your dedication is inspiring!";
  if (streak >= 7) return "One week streak! Keep up the momentum!";
  if (streak >= 3) return "Building a good habit! Stay consistent!";
  return "Every verse is a step closer to completion!";
};

ProgressTracker.displayName = 'ProgressTracker';

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressItem: {
    marginBottom: 16,
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
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  motivationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  motivationText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    textAlign: 'center',
    flex: 1,
  },

  // Compact styles
  compactContainer: {
    borderRadius: 12,
    padding: 12,
    margin: 8,
  },
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});