import React from 'react';
import { View, Text, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/theme';

export interface CalligraphicHeaderProps {
  title: string;
  subtitle?: string;
  arabicTitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'left' | 'center' | 'right';
  style?: ViewStyle;
  showDecorative?: boolean;
}

export function CalligraphicHeader({
  title,
  subtitle,
  arabicTitle,
  size = 'md',
  align = 'left',
  style,
  showDecorative = false,
}: CalligraphicHeaderProps) {
  const { colors } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          title: { fontSize: 18, lineHeight: 24 },
          subtitle: { fontSize: 14, lineHeight: 20 },
          arabic: { fontSize: 20, lineHeight: 28 },
        };
      case 'lg':
        return {
          title: { fontSize: 28, lineHeight: 36 },
          subtitle: { fontSize: 18, lineHeight: 24 },
          arabic: { fontSize: 32, lineHeight: 44 },
        };
      case 'xl':
        return {
          title: { fontSize: 32, lineHeight: 40 },
          subtitle: { fontSize: 20, lineHeight: 26 },
          arabic: { fontSize: 36, lineHeight: 48 },
        };
      default: // md
        return {
          title: { fontSize: 22, lineHeight: 28 },
          subtitle: { fontSize: 16, lineHeight: 22 },
          arabic: { fontSize: 24, lineHeight: 32 },
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const textAlign = align;

  const DecorativeElement = () => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        marginVertical: 8,
      }}
    >
      <View
        style={{
          width: 20,
          height: 2,
          backgroundColor: colors.accent,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.accent,
          marginHorizontal: 8,
        }}
      />
      <View
        style={{
          width: 20,
          height: 2,
          backgroundColor: colors.accent,
          borderRadius: 1,
        }}
      />
    </View>
  );

  return (
    <View style={[{ alignItems: align === 'center' ? 'center' : 'flex-start' }, style]}>
      {arabicTitle && (
        <Text
          style={[
            {
              ...sizeStyles.arabic,
              color: colors.primary,
              fontWeight: '400',
              textAlign,
              writingDirection: 'rtl',
              marginBottom: size === 'lg' ? 8 : 6,
            },
          ]}
        >
          {arabicTitle}
        </Text>
      )}
      
      <Text
        style={[
          {
            ...sizeStyles.title,
            color: colors.text,
            fontWeight: '700',
            textAlign,
            marginBottom: subtitle ? (size === 'lg' ? 6 : 4) : 0,
          },
        ]}
      >
        {title}
      </Text>

      {subtitle && (
        <Text
          style={[
            {
              ...sizeStyles.subtitle,
              color: colors.textLight,
              fontWeight: '400',
              textAlign,
              marginTop: 2,
            },
          ]}
        >
          {subtitle}
        </Text>
      )}

      {showDecorative && <DecorativeElement />}
    </View>
  );
}