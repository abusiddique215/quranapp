import React from 'react';
import { Pressable, Text, View, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/theme/theme';

export interface IslamicButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function IslamicButton({ 
  title, 
  onPress, 
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon,
  style,
  textStyle
}: IslamicButtonProps) {
  const { colors } = useTheme();
  
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: 12,
          paddingVertical: 8,
          fontSize: 14,
          borderRadius: 8,
        };
      case 'lg':
        return {
          paddingHorizontal: 24,
          paddingVertical: 16,
          fontSize: 18,
          borderRadius: 12,
        };
      default: // md
        return {
          paddingHorizontal: 16,
          paddingVertical: 12,
          fontSize: 16,
          borderRadius: 10,
        };
    }
  };

  const getVariantStyles = () => {
    const sizeStyles = getSizeStyles();
    
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: colors.primary,
            // iOS-compatible shadow
            boxShadow: `0px 2px 4px ${colors.primary}4D`,
            elevation: 3,
          },
          text: {
            color: colors.textOnAccent,
            fontWeight: '600' as const,
          },
        };
      case 'accent':
        return {
          container: {
            backgroundColor: colors.accent,
            // iOS-compatible shadow
            boxShadow: `0px 2px 4px ${colors.accent}4D`,
            elevation: 3,
          },
          text: {
            color: colors.text,
            fontWeight: '600' as const,
          },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.primary,
            // iOS-compatible shadow
            boxShadow: `0px 1px 2px ${colors.shadow}`,
            elevation: 1,
          },
          text: {
            color: colors.primary,
            fontWeight: '500' as const,
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: {
            color: colors.primary,
            fontWeight: '500' as const,
          },
        };
      default:
        return {
          container: {},
          text: {},
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const containerStyle = {
    ...variantStyles.container,
    paddingHorizontal: sizeStyles.paddingHorizontal,
    paddingVertical: sizeStyles.paddingVertical,
    borderRadius: sizeStyles.borderRadius,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    opacity: disabled ? 0.5 : 1,
  };

  const textStyleCombined = {
    ...variantStyles.text,
    fontSize: sizeStyles.fontSize,
    textAlign: 'center' as const,
    ...textStyle,
  };

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        containerStyle,
        pressed && !disabled && { opacity: 0.8 },
        style,
      ]}
      disabled={disabled}
    >
      {icon && (
        <View style={{ marginRight: 8 }}>
          {icon}
        </View>
      )}
      <Text style={textStyleCombined}>{title}</Text>
    </Pressable>
  );
}