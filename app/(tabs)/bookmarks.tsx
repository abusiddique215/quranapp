import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalligraphicHeader } from '@/components/shared/CalligraphicHeader';
import { IslamicButton } from '@/components/shared/IslamicButton';
import { useAuthStatus } from '@/lib/contexts/AuthContext';
import { GuestModeIndicator } from '@/components/shared/ErrorStates';

export default function BookmarksScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isGuest } = useAuthStatus();
  const [lastRead, setLastRead] = useState<{ surah: number; verse: number } | null>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  // Load bookmarks and reading progress
  useEffect(() => {
    // TODO: Load from database
    // For now, showing placeholder data
    setLastRead({ surah: 2, verse: 255 });
    setBookmarks([
      { id: 1, surah: 1, verse: 1, name: 'Al-Fatihah', note: 'The Opening' },
      { id: 2, surah: 2, verse: 255, name: 'Ayatul Kursi', note: 'The Throne Verse' },
      { id: 3, surah: 36, verse: 1, name: 'Ya-Sin', note: 'The Heart of Quran' },
    ]);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.text === '#2c2c2c' ? 'dark' : 'light'} />
      
      {/* Header with safe area */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        {isGuest && <GuestModeIndicator />}
        
        <CalligraphicHeader title="Reading Progress" />
        
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          Continue where you left off
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Last Read Section */}
        {lastRead && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="book" size={20} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Continue Reading
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.continueCard, { backgroundColor: colors.background }]}
              onPress={() => router.push(`/read/${lastRead.surah}`)}
            >
              <View style={styles.continueContent}>
                <Text style={[styles.continueSurah, { color: colors.accent }]}>
                  Surah {lastRead.surah}
                </Text>
                <Text style={[styles.continueVerse, { color: colors.secondaryText }]}>
                  Verse {lastRead.verse}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.accent} />
            </TouchableOpacity>
          </View>
        )}

        {/* Bookmarks Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bookmark" size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Bookmarks
            </Text>
          </View>

          {bookmarks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={48} color={colors.secondaryText} />
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                No bookmarks yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.secondaryText }]}>
                Start reading to save your favorite verses
              </Text>
            </View>
          ) : (
            <View style={styles.bookmarksList}>
              {bookmarks.map((bookmark) => (
                <TouchableOpacity
                  key={bookmark.id}
                  style={[styles.bookmarkCard, { backgroundColor: colors.background }]}
                  onPress={() => router.push(`/read/${bookmark.surah}`)}
                >
                  <View style={styles.bookmarkContent}>
                    <Text style={[styles.bookmarkName, { color: colors.text }]}>
                      {bookmark.name}
                    </Text>
                    <Text style={[styles.bookmarkInfo, { color: colors.secondaryText }]}>
                      Surah {bookmark.surah}, Verse {bookmark.verse}
                    </Text>
                    {bookmark.note && (
                      <Text style={[styles.bookmarkNote, { color: colors.secondaryText }]}>
                        {bookmark.note}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.accent} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Quick Access
            </Text>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.background }]}
              onPress={() => router.push('/read/1')}
            >
              <Ionicons name="star" size={24} color={colors.accent} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Al-Fatihah
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.background }]}
              onPress={() => router.push('/read/36')}
            >
              <Ionicons name="heart" size={24} color={colors.accent} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Ya-Sin
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.background }]}
              onPress={() => router.push('/read/67')}
            >
              <Ionicons name="shield" size={24} color={colors.accent} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Al-Mulk
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
  },
  continueContent: {
    flex: 1,
  },
  continueSurah: {
    fontSize: 16,
    fontWeight: '600',
  },
  continueVerse: {
    fontSize: 14,
    marginTop: 4,
  },
  bookmarksList: {
    gap: 8,
  },
  bookmarkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  bookmarkContent: {
    flex: 1,
  },
  bookmarkName: {
    fontSize: 15,
    fontWeight: '600',
  },
  bookmarkInfo: {
    fontSize: 13,
    marginTop: 2,
  },
  bookmarkNote: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  quickActionText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});