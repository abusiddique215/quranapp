import React from 'react';
import { View, Text } from 'react-native';
import { GradientCard } from '../shared/GradientCard';
import { CalligraphicHeader } from '../shared/CalligraphicHeader';
import { useTheme } from '@/theme/theme';

export interface PrayerTime {
  name: string;
  arabicName: string;
  time: string;
  isPassed: boolean;
  isNext: boolean;
  isCurrent: boolean;
}

export interface PrayerCardProps {
  nextPrayer: PrayerTime;
  allPrayers: PrayerTime[];
  timeToNext?: string;
  location?: string;
}

export function PrayerCard({ 
  nextPrayer, 
  allPrayers, 
  timeToNext,
  location 
}: PrayerCardProps) {
  const { colors } = useTheme();

  const PrayerTimeRow = ({ prayer }: { prayer: PrayerTime }) => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderRadius: 8,
        backgroundColor: prayer.isNext 
          ? colors.accentLight 
          : prayer.isPassed 
            ? 'transparent' 
            : colors.cardWarm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: prayer.isNext ? '600' : '500',
            color: prayer.isPassed 
              ? colors.prayerPassed 
              : prayer.isNext 
                ? colors.text 
                : colors.textLight,
            marginRight: 8,
          }}
        >
          {prayer.name}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textMuted,
            fontStyle: 'italic',
          }}
        >
          {prayer.arabicName}
        </Text>
      </View>
      
      <Text
        style={{
          fontSize: 16,
          fontWeight: prayer.isNext ? '700' : '600',
          color: prayer.isPassed 
            ? colors.prayerPassed 
            : prayer.isNext 
              ? colors.primary 
              : colors.text,
          fontVariant: ['tabular-nums'],
        }}
      >
        {prayer.time}
      </Text>
    </View>
  );

  return (
    <GradientCard variant="prayer" padding="lg">
      <CalligraphicHeader
        title="Prayer Times"
        arabicTitle="أوقات الصلاة"
        subtitle={location || 'Loading location...'}
        size="md"
        align="center"
        showDecorative={true}
      />

      {/* Next Prayer Highlight */}
      {timeToNext && (
        <View
          style={{
            backgroundColor: colors.accent,
            borderRadius: 12,
            padding: 16,
            marginVertical: 16,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: colors.text,
              fontWeight: '500',
              marginBottom: 4,
            }}
          >
            Next Prayer: {nextPrayer.name}
          </Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: colors.text,
              fontVariant: ['tabular-nums'],
            }}
          >
            {timeToNext}
          </Text>
        </View>
      )}

      {/* All Prayer Times */}
      <View style={{ marginTop: 8 }}>
        {allPrayers.map((prayer, index) => (
          <PrayerTimeRow key={`${prayer.name}-${index}`} prayer={prayer} />
        ))}
      </View>

      {/* Islamic Date */}
      <View
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.paperBorder,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: colors.textMuted,
            fontStyle: 'italic',
          }}
        >
          Today • {new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>
    </GradientCard>
  );
}