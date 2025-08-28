import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme/theme';
import { CalligraphicHeader } from '@/components/shared/CalligraphicHeader';
import { PrayerCard, PrayerTime } from '@/components/home/PrayerCard';
import { ProgressCard, ProgressData } from '@/components/home/ProgressCard';
import { InspirationCard, InspirationContent } from '@/components/home/InspirationCard';
import { IslamicButton } from '@/components/shared/IslamicButton';

export default function Home() {
  const { colors } = useTheme();

  // Get current hour for greeting
  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 5) return { english: 'Good Night', arabic: 'ليلة سعيدة' };
    if (currentHour < 12) return { english: 'Good Morning', arabic: 'صباح الخير' };
    if (currentHour < 17) return { english: 'Good Afternoon', arabic: 'مساء الخير' };
    if (currentHour < 21) return { english: 'Good Evening', arabic: 'مساء الخير' };
    return { english: 'Good Night', arabic: 'ليلة سعيدة' };
  };

  // Sample prayer times data
  const samplePrayerTimes: PrayerTime[] = [
    { name: 'Fajr', arabicName: 'الفجر', time: '5:30 AM', isPassed: true, isNext: false, isCurrent: false },
    { name: 'Dhuhr', arabicName: 'الظهر', time: '12:25 PM', isPassed: true, isNext: false, isCurrent: false },
    { name: 'Asr', arabicName: 'العصر', time: '3:45 PM', isPassed: false, isNext: true, isCurrent: false },
    { name: 'Maghrib', arabicName: 'المغرب', time: '6:20 PM', isPassed: false, isNext: false, isCurrent: false },
    { name: 'Isha', arabicName: 'العشاء', time: '8:15 PM', isPassed: false, isNext: false, isCurrent: false },
  ];

  const nextPrayer = samplePrayerTimes.find(p => p.isNext) || samplePrayerTimes[2];

  // Sample progress data
  const sampleProgress: ProgressData = {
    currentStreak: 7,
    bestStreak: 12,
    totalSessions: 45,
    lastRead: {
      surah: 'Al-Baqarah',
      ayah: 255,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    weeklyProgress: [80, 100, 60, 100, 40, 100, 90] // Sample week data
  };

  // Sample inspiration content
  const sampleInspiration: InspirationContent = {
    type: 'verse',
    arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
    translation: 'And whoever fears Allah - He will make for him a way out.',
    reference: 'Quran 65:2',
    transliteration: 'Wa man yattaqi Allah yaj\'al lahu makhrajan'
  };

  const greeting = getGreeting();

  const handleContinueReading = () => {
    // Navigate to reading screen
  };

  const handlePlayAudio = () => {
    // Handle audio playback
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <CalligraphicHeader
            title={greeting.english}
            arabicTitle={greeting.arabic}
            subtitle="May Allah bless your day"
            size="lg"
            align="center"
          />
        </View>

        {/* Progress Card */}
        <ProgressCard
          progress={sampleProgress}
          onContinueReading={handleContinueReading}
        />

        {/* Prayer Times Card */}
        <PrayerCard
          nextPrayer={nextPrayer}
          allPrayers={samplePrayerTimes}
          timeToNext="2h 15m"
          location="New York, NY"
        />

        {/* Daily Inspiration */}
        <InspirationCard
          content={sampleInspiration}
          onPlayAudio={handlePlayAudio}
          onBookmark={() => console.log('Bookmarked')}
          onShare={() => console.log('Shared')}
          isBookmarked={false}
        />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Link href="/read" asChild>
            <IslamicButton
              title="Start Reading"
              onPress={() => {}}
              variant="primary"
              size="lg"
            />
          </Link>
          
          <View style={{ height: 12 }} />
          
          <Link href="/auth/sign-in" asChild>
            <IslamicButton
              title="Sign In to Save Progress"
              onPress={() => {}}
              variant="secondary"
              size="md"
            />
          </Link>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
