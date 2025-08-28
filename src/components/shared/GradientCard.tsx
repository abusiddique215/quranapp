import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/theme';

export interface GradientCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'warm' | 'elevated' | 'prayer';
  padding?: 'sm' | 'md' | 'lg';
}

export function GradientCard({ 
  children, 
  style, 
  variant = 'default',
  padding = 'md'
}: GradientCardProps) {
  const { colors } = useTheme();
  
  const getCardStyle = () => {
    const baseStyle = {
      borderRadius: 16,
      overflow: 'hidden' as const,
    };

    const paddingStyles = {
      sm: 12,
      md: 16,
      lg: 20,
    };

    switch (variant) {
      case 'warm':
        return {
          ...baseStyle,
          backgroundColor: colors.cardWarm,
          borderWidth: 1,
          borderColor: colors.paperBorder,
          padding: paddingStyles[padding],
        };
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: colors.cardElevated,
          // iOS-compatible shadow
          boxShadow: `0px 4px 12px ${colors.shadow}`,
          elevation: 8,
          padding: paddingStyles[padding],
        };
      case 'prayer':
        return {
          ...baseStyle,
          backgroundColor: colors.card,
          borderWidth: 2,
          borderColor: colors.accent,
          // iOS-compatible shadow
          boxShadow: `0px 2px 8px ${colors.accent}33`,
          elevation: 4,
          padding: paddingStyles[padding],
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.card,
          // iOS-compatible shadow
          boxShadow: `0px 2px 8px ${colors.shadow}`,
          elevation: 3,
          padding: paddingStyles[padding],
        };
    }
  };

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // Any additional styles if needed
});