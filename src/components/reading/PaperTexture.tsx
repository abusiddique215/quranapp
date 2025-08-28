import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

export interface PaperTextureProps {
  children: React.ReactNode;
  variant?: 'classic' | 'manuscript' | 'aged' | 'modern';
  intensity?: 'subtle' | 'medium' | 'strong';
  style?: ViewStyle;
}

export function PaperTexture({ 
  children, 
  variant = 'manuscript', 
  intensity = 'medium',
  style 
}: PaperTextureProps) {
  const getTextureStyles = () => {
    const baseStyles = {
      backgroundColor: '#faf9f6', // Warm paper base
      borderColor: '#e8e5e0',
    };

    switch (variant) {
      case 'manuscript':
        return {
          ...baseStyles,
          backgroundColor: '#fcfbf8', // Slightly warmer manuscript tone
          borderColor: '#e5e0d8',
          // iOS-compatible shadow
          boxShadow: '0px 2px 6px rgba(101, 67, 33, 0.08)',
          elevation: 3,
        };
      
      case 'aged':
        return {
          ...baseStyles,
          backgroundColor: '#f8f5f0', // Slightly yellowed aged paper
          borderColor: '#ded7c8',
          // iOS-compatible shadow
          boxShadow: '1px 3px 8px rgba(139, 114, 73, 0.12)',
          elevation: 4,
        };
      
      case 'classic':
        return {
          ...baseStyles,
          backgroundColor: '#fffef9', // Pure paper white with cream tint
          borderColor: '#f0ede6',
          // iOS-compatible shadow
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.06)',
          elevation: 2,
        };
      
      default: // modern
        return {
          ...baseStyles,
          backgroundColor: '#ffffff', // Clean white
          borderColor: '#e5e5e5',
          // iOS-compatible shadow
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.04)',
          elevation: 1,
        };
    }
  };

  const getPatternOpacity = () => {
    switch (intensity) {
      case 'subtle': return 0.015;
      case 'strong': return 0.04;
      default: return 0.025; // medium
    }
  };

  const textureStyles = getTextureStyles();
  const patternOpacity = getPatternOpacity();

  return (
    <View style={[styles.container, textureStyles, style]}>
      {/* Content - simplified for iOS compatibility */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});