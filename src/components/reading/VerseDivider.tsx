import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/theme';

interface VerseDividerProps {
  ayahNumber: number;
}

export function VerseDivider({ ayahNumber }: VerseDividerProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: colors.paperBorder }]} />
      <View style={[styles.numberContainer, { backgroundColor: colors.accent }]}>
        <Text style={[styles.number, { color: colors.textOnAccent }]}>
          {ayahNumber}
        </Text>
      </View>
      <View style={[styles.line, { backgroundColor: colors.paperBorder }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    marginHorizontal: 32,
  },
  line: {
    flex: 1,
    height: 1,
  },
  numberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    // iOS-compatible shadow
    boxShadow: '0px 2px 4px rgba(212, 175, 55, 0.3)',
    elevation: 2,
  },
  number: {
    fontSize: 14,
    fontWeight: '600',
  },
});