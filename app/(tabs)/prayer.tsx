import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalligraphicHeader } from '@/components/shared/CalligraphicHeader';
import { useAuthStatus } from '@/lib/contexts/AuthContext';
import { GuestModeIndicator } from '@/components/shared/ErrorStates';
import { PrayerService } from '@/lib/api/services';
import * as Location from 'expo-location';

interface PrayerTime {
  name: string;
  time: string;
  arabicName: string;
  isNext?: boolean;
  isPassed?: boolean;
}

export default function PrayerScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isGuest } = useAuthStatus();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ city: string; country: string } | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<string>('');
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');

  // Mock prayer times for now
  useEffect(() => {
    const loadPrayerTimes = async () => {
      try {
        setLoading(true);
        // TODO: Get actual location and fetch real prayer times
        setLocation({ city: 'San Francisco', country: 'USA' });
        
        // Mock data for demonstration
        const times: PrayerTime[] = [
          { name: 'Fajr', time: '05:45', arabicName: 'الفجر', isPassed: true },
          { name: 'Dhuhr', time: '12:15', arabicName: 'الظهر', isPassed: true },
          { name: 'Asr', time: '15:30', arabicName: 'العصر', isNext: true },
          { name: 'Maghrib', time: '18:45', arabicName: 'المغرب' },
          { name: 'Isha', time: '20:00', arabicName: 'العشاء' },
        ];
        
        setPrayerTimes(times);
        setNextPrayer('Asr');
        setTimeUntilNext('2 hours 15 minutes');
      } catch (error) {
        console.error('Failed to load prayer times:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPrayerTimes();
  }, []);

  // Update time until next prayer every minute
  useEffect(() => {
    const interval = setInterval(() => {
      // TODO: Calculate actual time until next prayer
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.text === '#2c2c2c' ? 'dark' : 'light'} />
      
      {/* Header with safe area */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        {isGuest && <GuestModeIndicator />}
        
        <CalligraphicHeader title="Prayer Times" />
        
        {location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={14} color={colors.secondaryText} />
            <Text style={[styles.location, { color: colors.secondaryText }]}>
              {location.city}, {location.country}
            </Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
              Loading prayer times...
            </Text>
          </View>
        ) : (
          <>
            {/* Next Prayer Card */}
            <View style={[styles.nextPrayerCard, { backgroundColor: colors.accent }]}>
              <View style={styles.nextPrayerHeader}>
                <Text style={[styles.nextPrayerLabel, { color: colors.background }]}>
                  Next Prayer
                </Text>
                <Ionicons name="time" size={20} color={colors.background} />
              </View>
              
              <Text style={[styles.nextPrayerName, { color: colors.background }]}>
                {nextPrayer}
              </Text>
              
              <Text style={[styles.nextPrayerTime, { color: colors.background }]}>
                in {timeUntilNext}
              </Text>
              
              <View style={[styles.decorativeLine, { backgroundColor: colors.background }]} />
            </View>

            {/* Today's Prayer Times */}
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Today's Prayers
              </Text>
              
              <View style={styles.prayersList}>
                {prayerTimes.map((prayer, index) => (
                  <View 
                    key={prayer.name}
                    style={[
                      styles.prayerRow,
                      prayer.isNext && styles.nextPrayerRow,
                      { backgroundColor: prayer.isNext ? colors.accentLight + '20' : 'transparent' }
                    ]}
                  >
                    <View style={styles.prayerInfo}>
                      <Text style={[
                        styles.prayerName,
                        { color: prayer.isPassed ? colors.secondaryText : colors.text },
                        prayer.isNext && { color: colors.accent, fontWeight: '600' }
                      ]}>
                        {prayer.name}
                      </Text>
                      <Text style={[
                        styles.prayerArabic,
                        { color: colors.secondaryText }
                      ]}>
                        {prayer.arabicName}
                      </Text>
                    </View>
                    
                    <View style={styles.prayerTimeContainer}>
                      <Text style={[
                        styles.prayerTimeText,
                        { color: prayer.isPassed ? colors.secondaryText : colors.text },
                        prayer.isNext && { color: colors.accent, fontWeight: '600' }
                      ]}>
                        {prayer.time}
                      </Text>
                      {prayer.isNext && (
                        <View style={[styles.nextIndicator, { backgroundColor: colors.accent }]} />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Additional Features */}
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Prayer Tools
              </Text>
              
              <View style={styles.toolsGrid}>
                <TouchableOpacity style={[styles.toolCard, { backgroundColor: colors.background }]}>
                  <Ionicons name="compass" size={28} color={colors.accent} />
                  <Text style={[styles.toolText, { color: colors.text }]}>
                    Qibla
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.toolCard, { backgroundColor: colors.background }]}>
                  <Ionicons name="calendar" size={28} color={colors.accent} />
                  <Text style={[styles.toolText, { color: colors.text }]}>
                    Calendar
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.toolCard, { backgroundColor: colors.background }]}>
                  <Ionicons name="notifications" size={28} color={colors.accent} />
                  <Text style={[styles.toolText, { color: colors.text }]}>
                    Reminders
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.toolCard, { backgroundColor: colors.background }]}>
                  <Ionicons name="moon" size={28} color={colors.accent} />
                  <Text style={[styles.toolText, { color: colors.text }]}>
                    Hijri Date
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
        
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  location: {
    fontSize: 14,
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  nextPrayerCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  nextPrayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextPrayerLabel: {
    fontSize: 14,
    opacity: 0.9,
  },
  nextPrayerName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  nextPrayerTime: {
    fontSize: 18,
    marginTop: 4,
    opacity: 0.9,
  },
  decorativeLine: {
    height: 2,
    width: 40,
    marginTop: 12,
    opacity: 0.3,
    borderRadius: 1,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  prayersList: {
    gap: 2,
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  nextPrayerRow: {
    borderRadius: 8,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerName: {
    fontSize: 16,
  },
  prayerArabic: {
    fontSize: 14,
    marginTop: 2,
  },
  prayerTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prayerTimeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  nextIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  toolCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  toolText: {
    fontSize: 14,
    marginTop: 8,
  },
});