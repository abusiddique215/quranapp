import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/theme/theme';
import { Feather } from '@expo/vector-icons';

interface ReadingHeaderProps {
  surahName: string;
  surahNumber: number;
  currentAyah?: number;
  totalAyahs?: number;
}

export function ReadingHeader({ 
  surahName, 
  surahNumber,
  currentAyah = 1,
  totalAyahs = 286
}: ReadingHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.paperBackground, borderBottomColor: colors.paperBorder }]}>
      <View style={styles.topRow}>
        <Pressable 
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.cardElevated }]}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>

        <View style={styles.titleContainer}>
          <Text style={[styles.surahName, { color: colors.inkDark }]}>
            {surahName}
          </Text>
          <Text style={[styles.surahInfo, { color: colors.textMuted }]}>
            Surah {surahNumber} • {totalAyahs} Ayahs
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={[styles.actionButton, { backgroundColor: colors.cardElevated }]}>
            <Feather name="bookmark" size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable style={[styles.actionButton, { backgroundColor: colors.cardElevated }]}>
            <Feather name="settings" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.progressContainer, { backgroundColor: colors.backgroundDeep }]}>
        <View 
          style={[
            styles.progressBar, 
            { 
              backgroundColor: colors.accent,
              width: `${(currentAyah / totalAyahs) * 100}%`
            }
          ]} 
        />
        <Text style={[styles.progressText, { color: colors.textMuted }]}>
          Ayah {currentAyah} of {totalAyahs}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50, // Safe area
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    // iOS-compatible shadow
    boxShadow: '0px 2px 4px rgba(0,0,0,0.04)',
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    // iOS-compatible shadow
    boxShadow: '0px 1px 2px rgba(0,0,0,0.08)',
    elevation: 1,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  surahName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2,
  },
  surahInfo: {
    fontSize: 13,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // iOS-compatible shadow
    boxShadow: '0px 1px 2px rgba(0,0,0,0.08)',
    elevation: 1,
  },
  progressContainer: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    position: 'absolute',
    right: 0,
    top: -20,
    fontSize: 12,
    fontWeight: '500',
  },
});