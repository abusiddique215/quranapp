import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/theme';
import { Feather } from '@expo/vector-icons';

interface WelcomeHeaderProps {
  userName?: string;
}

export function WelcomeHeader({ userName }: WelcomeHeaderProps) {
  const { colors } = useTheme();
  const currentHour = new Date().getHours();
  
  const getGreeting = () => {
    if (currentHour < 12) return 'Good Morning';
    if (currentHour < 17) return 'Good Afternoon'; 
    if (currentHour < 20) return 'Good Evening';
    return 'Peace be upon you';
  };

  const getIslamicGreeting = () => {
    if (currentHour >= 5 && currentHour < 12) return 'صباح الخير';
    if (currentHour >= 12 && currentHour < 17) return 'مساء الخير';
    return 'السلام عليكم';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.greeting, { color: colors.textOnAccent }]}>
            {getGreeting()}
            {userName && `, ${userName}`}
          </Text>
          <Text style={[styles.arabicGreeting, { color: colors.accentLight }]}>
            {getIslamicGreeting()}
          </Text>
        </View>
        <View style={[styles.iconContainer, { backgroundColor: colors.accentLight }]}>
          <Feather name="book-open" size={24} color={colors.primary} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 60,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  arabicGreeting: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'left',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
});