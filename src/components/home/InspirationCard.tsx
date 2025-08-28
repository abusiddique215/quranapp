import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { GradientCard } from '../shared/GradientCard';
import { CalligraphicHeader } from '../shared/CalligraphicHeader';
import { IslamicButton } from '../shared/IslamicButton';
import { useTheme } from '@/theme/theme';

export interface InspirationContent {
  type: 'verse' | 'hadith' | 'dua';
  arabic: string;
  translation: string;
  reference?: string;
  transliteration?: string;
}

export interface InspirationCardProps {
  content: InspirationContent;
  onPlayAudio?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

export function InspirationCard({ 
  content, 
  onPlayAudio,
  onShare,
  onBookmark,
  isBookmarked = false
}: InspirationCardProps) {
  const { colors } = useTheme();
  const [showTransliteration, setShowTransliteration] = useState(false);

  const getHeaderInfo = () => {
    switch (content.type) {
      case 'verse':
        return {
          title: 'Verse of the Day',
          arabic: 'آية اليوم',
          subtitle: 'Reflection for today',
        };
      case 'hadith':
        return {
          title: 'Daily Hadith',
          arabic: 'حديث اليوم',
          subtitle: 'Wisdom from the Prophet ﷺ',
        };
      case 'dua':
        return {
          title: 'Daily Du\'a',
          arabic: 'دعاء اليوم',
          subtitle: 'Prayer for today',
        };
      default:
        return {
          title: 'Daily Inspiration',
          arabic: 'إلهام يومي',
          subtitle: 'Islamic guidance',
        };
    }
  };

  const headerInfo = getHeaderInfo();

  const ActionButton = ({ 
    title, 
    onPress, 
    variant = 'ghost' 
  }: { 
    title: string; 
    onPress?: () => void; 
    variant?: 'ghost' | 'accent' 
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: variant === 'accent' 
          ? colors.accentLight 
          : pressed 
            ? colors.cardWarm 
            : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: colors.primary,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
    </Pressable>
  );

  return (
    <GradientCard variant="elevated" padding="lg">
      <CalligraphicHeader
        title={headerInfo.title}
        arabicTitle={headerInfo.arabic}
        subtitle={headerInfo.subtitle}
        size="sm"
        align="center"
        showDecorative={true}
      />

      {/* Arabic Text */}
      <View
        style={{
          backgroundColor: colors.paperBackground,
          borderRadius: 12,
          padding: 16,
          marginVertical: 16,
          borderLeftWidth: 3,
          borderLeftColor: colors.accent,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            lineHeight: 32,
            color: colors.inkDark,
            textAlign: 'right',
            fontWeight: '400',
            writingDirection: 'rtl',
            marginBottom: 12,
          }}
        >
          {content.arabic}
        </Text>

        {/* Transliteration (if available and shown) */}
        {content.transliteration && showTransliteration && (
          <Text
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: colors.textMuted,
              fontStyle: 'italic',
              marginBottom: 8,
              textAlign: 'left',
            }}
          >
            {content.transliteration}
          </Text>
        )}

        {/* Translation */}
        <Text
          style={{
            fontSize: 16,
            lineHeight: 24,
            color: colors.text,
            fontWeight: '400',
            textAlign: 'left',
          }}
        >
          {content.translation}
        </Text>

        {/* Reference */}
        {content.reference && (
          <Text
            style={{
              fontSize: 12,
              color: colors.textMuted,
              fontWeight: '500',
              marginTop: 12,
              textAlign: 'right',
            }}
          >
            — {content.reference}
          </Text>
        )}
      </View>

      {/* Toggle Transliteration */}
      {content.transliteration && (
        <Pressable
          onPress={() => setShowTransliteration(!showTransliteration)}
          style={{
            alignSelf: 'center',
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: colors.primary,
              fontWeight: '500',
              textDecorationLine: 'underline',
            }}
          >
            {showTransliteration ? 'Hide' : 'Show'} Transliteration
          </Text>
        </Pressable>
      )}

      {/* Action Buttons */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.paperBorder,
        }}
      >
        {onPlayAudio && (
          <ActionButton title="🔊 Play" onPress={onPlayAudio} />
        )}
        
        {content.transliteration && (
          <ActionButton 
            title="📝 Script" 
            onPress={() => setShowTransliteration(!showTransliteration)} 
          />
        )}
        
        {onBookmark && (
          <ActionButton 
            title={isBookmarked ? "💛 Saved" : "🤍 Save"} 
            onPress={onBookmark}
            variant={isBookmarked ? 'accent' : 'ghost'}
          />
        )}
        
        {onShare && (
          <ActionButton title="📤 Share" onPress={onShare} />
        )}
      </View>
    </GradientCard>
  );
}