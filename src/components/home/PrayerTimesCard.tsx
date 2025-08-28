import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/theme/theme';
import { Feather } from '@expo/vector-icons';

interface PrayerTime {
  name: string;
  arabicName: string;
  time: string;
  isActive?: boolean;
  isNext?: boolean;
}

export function PrayerTimesCard() {
  const { colors } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock prayer times - in a real app, calculate based on location
  const prayerTimes: PrayerTime[] = [
    { name: 'Fajr', arabicName: 'الفجر', time: '05:30' },
    { name: 'Dhuhr', arabicName: 'الظهر', time: '12:30' },
    { name: 'Asr', arabicName: 'العصر', time: '15:45' },
    { name: 'Maghrib', arabicName: 'المغرب', time: '18:20' },
    { name: 'Isha', arabicName: 'العشاء', time: '19:50' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getPrayerStatus = (time: string) => {
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    const [hours, minutes] = time.split(':').map(Number);
    const prayerMinutes = hours * 60 + minutes;
    
    if (Math.abs(now - prayerMinutes) < 30) return 'active';
    if (prayerMinutes > now) return 'upcoming';
    return 'passed';
  };

  const getNextPrayer = () => {
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    return prayerTimes.find(prayer => {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      return (hours * 60 + minutes) > now;
    }) || prayerTimes[0];
  };

  const nextPrayer = getNextPrayer();
  const timeToNext = () => {
    const [hours, minutes] = nextPrayer.time.split(':').map(Number);
    const prayerTime = new Date();
    prayerTime.setHours(hours, minutes, 0, 0);
    
    const diff = prayerTime.getTime() - currentTime.getTime();
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hoursLeft > 0) return `${hoursLeft}h ${minutesLeft}m`;
    return `${minutesLeft}m`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardWarm }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Feather name="clock" size={20} color={colors.accent} />
          <Text style={[styles.title, { color: colors.text }]}>Prayer Times</Text>
        </View>
        <Text style={[styles.nextPrayer, { color: colors.textMuted }]}>
          Next: {nextPrayer.name} in {timeToNext()}
        </Text>
      </View>

      <View style={styles.timesContainer}>
        {prayerTimes.map((prayer, index) => {
          const status = getPrayerStatus(prayer.time);
          const isNextPrayer = prayer.name === nextPrayer.name;
          
          return (
            <Pressable 
              key={prayer.name} 
              style={[
                styles.prayerRow,
                isNextPrayer && styles.nextPrayerRow,
                { borderBottomColor: colors.backgroundDeep }
              ]}
            >
              <View style={styles.prayerInfo}>
                <Text style={[
                  styles.prayerName, 
                  { 
                    color: status === 'active' ? colors.prayerActive : 
                           status === 'upcoming' ? colors.text : colors.prayerPassed,
                    fontWeight: isNextPrayer ? '600' : '500'
                  }
                ]}>
                  {prayer.name}
                </Text>
                <Text style={[styles.arabicName, { color: colors.textMuted }]}>
                  {prayer.arabicName}
                </Text>
              </View>
              <View style={styles.timeContainer}>
                <Text style={[
                  styles.time,
                  { 
                    color: status === 'active' ? colors.prayerActive : 
                           status === 'upcoming' ? colors.text : colors.prayerPassed,
                    fontWeight: isNextPrayer ? '600' : '400'
                  }
                ]}>
                  {prayer.time}
                </Text>
                {status === 'active' && (
                  <View style={[styles.activeIndicator, { backgroundColor: colors.prayerActive }]} />
                )}
              </View>
            </Pressable>
          );
        })}
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
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  nextPrayer: {
    fontSize: 14,
  },
  timesContainer: {
    gap: 2,
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
  },
  nextPrayerRow: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderRadius: 8,
    marginHorizontal: -4,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerName: {
    fontSize: 16,
    marginBottom: 2,
  },
  arabicName: {
    fontSize: 13,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: 16,
    // iOS-compatible monospace alternative
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
});