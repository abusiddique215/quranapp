import React from 'react';
import { View, Text } from 'react-native';
import { GradientCard } from '../shared/GradientCard';
import { CalligraphicHeader } from '../shared/CalligraphicHeader';
import { IslamicButton } from '../shared/IslamicButton';
import { useTheme } from '@/theme/theme';

export interface ProgressData {
  currentStreak: number;
  bestStreak: number;
  totalSessions: number;
  lastRead?: {
    surah: string;
    ayah: number;
    timestamp: Date;
  };
  weeklyProgress: number[]; // 7 days of progress (0-100)
}

export interface ProgressCardProps {
  progress: ProgressData;
  onContinueReading: () => void;
}

export function ProgressCard({ progress, onContinueReading }: ProgressCardProps) {
  const { colors } = useTheme();

  const WeeklyChart = ({ data }: { data: number[] }) => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 40,
        marginVertical: 12,
      }}
    >
      {data.map((value, index) => (
        <View
          key={index}
          style={{
            backgroundColor: value > 0 ? colors.primary : colors.paperBorder,
            width: 24,
            height: Math.max(4, (value / 100) * 40),
            borderRadius: 2,
            opacity: value > 0 ? 1 : 0.3,
          }}
        />
      ))}
    </View>
  );

  const StreakBadge = ({ count, label, isActive = false }: { 
    count: number; 
    label: string; 
    isActive?: boolean; 
  }) => (
    <View
      style={{
        backgroundColor: isActive ? colors.accent : colors.cardWarm,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 4,
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: isActive ? colors.text : colors.primary,
          marginBottom: 2,
        }}
      >
        {count}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: colors.textLight,
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
    </View>
  );

  const formatLastRead = () => {
    if (!progress.lastRead) return 'Start your journey';
    
    const { surah, ayah, timestamp } = progress.lastRead;
    const timeAgo = getTimeAgo(timestamp);
    return `${surah} (${ayah}) • ${timeAgo}`;
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Recently';
  };

  return (
    <GradientCard variant="warm" padding="lg">
      <CalligraphicHeader
        title="Your Progress"
        arabicTitle="تقدمك"
        subtitle="Keep building your daily habit"
        size="md"
        align="left"
      />

      {/* Streak Information */}
      <View
        style={{
          flexDirection: 'row',
          marginVertical: 16,
        }}
      >
        <StreakBadge
          count={progress.currentStreak}
          label="Current Streak"
          isActive={progress.currentStreak > 0}
        />
        <StreakBadge
          count={progress.bestStreak}
          label="Best Streak"
        />
        <StreakBadge
          count={progress.totalSessions}
          label="Total Sessions"
        />
      </View>

      {/* Weekly Chart */}
      <View style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.textLight,
            marginBottom: 8,
          }}
        >
          This Week
        </Text>
        <WeeklyChart data={progress.weeklyProgress} />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 4,
          }}
        >
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <Text
              key={day}
              style={{
                fontSize: 10,
                color: colors.textMuted,
                width: 24,
                textAlign: 'center',
              }}
            >
              {day}
            </Text>
          ))}
        </View>
      </View>

      {/* Last Read */}
      <View
        style={{
          backgroundColor: colors.cardElevated,
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: colors.textMuted,
            fontWeight: '500',
            marginBottom: 4,
          }}
        >
          LAST READ
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.text,
            fontWeight: '500',
          }}
        >
          {formatLastRead()}
        </Text>
      </View>

      {/* Continue Reading Button */}
      <IslamicButton
        title="Continue Reading"
        onPress={onContinueReading}
        variant="primary"
        size="lg"
      />
    </GradientCard>
  );
}