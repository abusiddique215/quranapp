import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/theme/theme';
import { Feather } from '@expo/vector-icons';

const dailyInsights = [
  {
    type: 'verse',
    arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
    translation: 'And whoever fears Allah - He will make for him a way out.',
    reference: 'Quran 65:2',
  },
  {
    type: 'hadith',
    text: 'The best of people are those who benefit mankind.',
    reference: 'Prophet Muhammad (ﷺ)',
  },
  {
    type: 'dua',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    translation: 'Our Lord, give us good in this world and good in the hereafter and protect us from the punishment of the Fire.',
    reference: 'Quran 2:201',
  },
];

export function IslamicInsightCard() {
  const { colors } = useTheme();
  
  // Rotate through insights daily
  const todayIndex = new Date().getDate() % dailyInsights.length;
  const todayInsight = dailyInsights[todayIndex];

  const getIcon = () => {
    switch (todayInsight.type) {
      case 'verse': return 'book';
      case 'hadith': return 'message-circle';
      case 'dua': return 'heart';
      default: return 'star';
    }
  };

  const getTitle = () => {
    switch (todayInsight.type) {
      case 'verse': return 'Daily Verse';
      case 'hadith': return 'Hadith';
      case 'dua': return 'Daily Dua';
      default: return 'Daily Reflection';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardWarm }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={[styles.iconContainer, { backgroundColor: colors.accentLight }]}>
            <Feather name={getIcon() as any} size={16} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>
        </View>
        <Pressable style={styles.shareButton}>
          <Feather name="share" size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {todayInsight.arabic && (
          <Text style={[styles.arabicText, { color: colors.text }]}>
            {todayInsight.arabic}
          </Text>
        )}
        
        <Text style={[styles.translationText, { color: colors.textLight }]}>
          {todayInsight.translation || todayInsight.text}
        </Text>
        
        <Text style={[styles.reference, { color: colors.textMuted }]}>
          — {todayInsight.reference}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.actionButton, { backgroundColor: colors.backgroundDeep }]}>
          <Feather name="bookmark" size={14} color={colors.textMuted} />
          <Text style={[styles.actionText, { color: colors.textMuted }]}>Save</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, { backgroundColor: colors.backgroundDeep }]}>
          <Feather name="more-horizontal" size={14} color={colors.textMuted} />
          <Text style={[styles.actionText, { color: colors.textMuted }]}>More</Text>
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
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    padding: 4,
  },
  content: {
    marginBottom: 16,
  },
  arabicText: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'right',
    marginBottom: 12,
    fontWeight: '500',
  },
  translationText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  reference: {
    fontSize: 13,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
});