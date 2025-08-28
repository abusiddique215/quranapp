import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useTheme } from '@/theme/theme';
import { Feather } from '@expo/vector-icons';
import { PaperTexture } from './PaperTexture';

interface ReadingControlsProps {
  showEnglish: boolean;
  onToggleEnglish: (show: boolean) => void;
  showTransliteration?: boolean;
  onToggleTransliteration?: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  onPlayAudio?: () => void;
  isPlaying?: boolean;
}

export function ReadingControls({
  showEnglish,
  onToggleEnglish,
  showTransliteration = false,
  onToggleTransliteration,
  fontSize,
  onFontSizeChange,
  onPlayAudio,
  isPlaying = false,
}: ReadingControlsProps) {
  const { colors } = useTheme();
  const [showControls, setShowControls] = useState(false);

  return (
    <View style={styles.container}>
      {/* Islamic-styled floating control button */}
      <Pressable
        onPress={() => setShowControls(!showControls)}
        style={[
          styles.floatingButton,
          { 
            backgroundColor: colors.accent,
            // iOS-compatible shadow will be applied via boxShadow in styles
          },
          showControls && styles.floatingButtonActive
        ]}
      >
        {/* Decorative Islamic pattern border */}
        <View style={[styles.buttonBorder, { borderColor: colors.accentLight }]} />
        
        <Feather 
          name={showControls ? "x" : "settings"} 
          size={22} 
          color={colors.textOnAccent} 
        />
      </Pressable>

      {/* Controls panel with manuscript styling */}
      {showControls && (
        <PaperTexture variant="classic" intensity="subtle" style={styles.controlsPanel}>
          <View style={styles.panelContent}>
            {/* Header with Islamic decoration */}
            <View style={styles.panelHeader}>
              <View style={[styles.headerDecoration, { backgroundColor: colors.accent }]} />
              <Text style={[styles.panelTitle, { color: colors.primary }]}>
                Reading Controls
              </Text>
              <View style={[styles.headerDecoration, { backgroundColor: colors.accent }]} />
            </View>

            {/* Translation toggle */}
            <View style={styles.controlRow}>
              <View style={styles.controlLabelContainer}>
                <Feather name="globe" size={16} color={colors.primary} />
                <Text style={[styles.controlLabel, { color: colors.text }]}>
                  Translation
                </Text>
              </View>
              <Pressable
                onPress={() => onToggleEnglish(!showEnglish)}
                style={[
                  styles.toggle,
                  { 
                    backgroundColor: showEnglish ? colors.accent : colors.backgroundDeep,
                    borderColor: colors.paperBorder 
                  }
                ]}
              >
                <View style={[
                  styles.toggleThumb,
                  { 
                    backgroundColor: colors.card,
                    transform: [{ translateX: showEnglish ? 22 : 2 }],
                    // iOS-compatible shadow will be applied via boxShadow in styles
                  }
                ]} />
              </Pressable>
            </View>

            {/* Transliteration toggle */}
            {onToggleTransliteration && (
              <View style={styles.controlRow}>
                <View style={styles.controlLabelContainer}>
                  <Feather name="book-open" size={16} color={colors.primary} />
                  <Text style={[styles.controlLabel, { color: colors.text }]}>
                    Transliteration
                  </Text>
                </View>
                <Pressable
                  onPress={onToggleTransliteration}
                  style={[
                    styles.toggle,
                    { 
                      backgroundColor: showTransliteration ? colors.accent : colors.backgroundDeep,
                      borderColor: colors.paperBorder 
                    }
                  ]}
                >
                  <View style={[
                    styles.toggleThumb,
                    { 
                      backgroundColor: colors.card,
                      transform: [{ translateX: showTransliteration ? 22 : 2 }],
                      // iOS-compatible shadow will be applied via boxShadow in styles
                    }
                  ]} />
                </Pressable>
              </View>
            )}

            {/* Font size control */}
            <View style={styles.controlRow}>
              <View style={styles.controlLabelContainer}>
                <Feather name="type" size={16} color={colors.primary} />
                <Text style={[styles.controlLabel, { color: colors.text }]}>
                  Text Size
                </Text>
              </View>
              <View style={styles.fontControls}>
                <Pressable
                  onPress={() => onFontSizeChange(Math.max(16, fontSize - 2))}
                  style={[styles.fontButton, { backgroundColor: colors.cardWarm, borderColor: colors.paperBorder }]}
                >
                  <Feather name="minus" size={14} color={colors.text} />
                </Pressable>
                <Text style={[styles.fontSizeText, { color: colors.primary }]}>
                  {fontSize}
                </Text>
                <Pressable
                  onPress={() => onFontSizeChange(Math.min(40, fontSize + 2))}
                  style={[styles.fontButton, { backgroundColor: colors.cardWarm, borderColor: colors.paperBorder }]}
                >
                  <Feather name="plus" size={14} color={colors.text} />
                </Pressable>
              </View>
            </View>

            {/* Audio control */}
            {onPlayAudio && (
              <View style={styles.controlRow}>
                <View style={styles.controlLabelContainer}>
                  <Feather name="headphones" size={16} color={colors.primary} />
                  <Text style={[styles.controlLabel, { color: colors.text }]}>
                    Recitation
                  </Text>
                </View>
                <Pressable
                  onPress={onPlayAudio}
                  style={[
                    styles.audioButton,
                    { 
                      backgroundColor: isPlaying ? colors.accent : colors.cardWarm,
                      borderColor: colors.paperBorder 
                    }
                  ]}
                >
                  <Feather 
                    name={isPlaying ? "pause" : "play"} 
                    size={14} 
                    color={isPlaying ? colors.textOnAccent : colors.text} 
                  />
                </Pressable>
              </View>
            )}

            {/* Decorative separator */}
            <View style={styles.separatorContainer}>
              <View style={[styles.separator, { backgroundColor: colors.paperBorder }]} />
              <View style={[styles.separatorDot, { backgroundColor: colors.accent }]} />
              <View style={[styles.separator, { backgroundColor: colors.paperBorder }]} />
            </View>

            {/* Quick actions with Islamic styling */}
            <View style={styles.quickActions}>
              <Pressable style={[styles.quickAction, { backgroundColor: colors.cardWarm, borderColor: colors.paperBorder }]}>
                <Feather name="bookmark" size={14} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>
                  Bookmark
                </Text>
              </Pressable>
              <Pressable style={[styles.quickAction, { backgroundColor: colors.cardWarm, borderColor: colors.paperBorder }]}>
                <Feather name="share-2" size={14} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>
                  Share
                </Text>
              </Pressable>
            </View>
          </View>
        </PaperTexture>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 1000,
  },
  floatingButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    // iOS-compatible shadow
    boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.25)',
    elevation: 8,
    position: 'relative',
  },
  buttonBorder: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 28,
    borderWidth: 1.5,
    opacity: 0.6,
  },
  floatingButtonActive: {
    // iOS-compatible active state (removed problematic transform scale)
    opacity: 0.9,
  },
  controlsPanel: {
    position: 'absolute',
    bottom: 82,
    right: 0,
    minWidth: 280,
    maxWidth: 320,
    borderRadius: 0, // Sharp corners for manuscript feel
  },
  panelContent: {
    padding: 24,
    // iOS-compatible shadow
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.12)',
    elevation: 8,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingBottom: 12,
  },
  headerDecoration: {
    width: 24,
    height: 2,
    borderRadius: 1,
    opacity: 0.6,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  controlLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlLabel: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  toggle: {
    width: 52,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    // iOS-compatible shadow
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.2)',
    elevation: 3,
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  fontButton: {
    width: 36,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizeText: {
    fontSize: 15,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  audioButton: {
    width: 44,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  separator: {
    flex: 1,
    height: 1,
  },
  separatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
});