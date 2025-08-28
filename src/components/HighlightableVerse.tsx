import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, GestureResponderEvent } from 'react-native';
import { mapSwipeToCounterpart, WordMapping } from '@/lib/interaction/highlight';
import { PaperTexture } from './reading/PaperTexture';
import { useTheme } from '@/theme/theme';

export type HighlightableVerseProps = {
  arabic: string;
  english?: string;
  transliteration?: string;
  showEnglish: boolean;
  showTransliteration?: boolean;
  mappings?: WordMapping[]; // optional real mappings if available
};

export function HighlightableVerse({ 
  arabic, 
  english = '', 
  transliteration = '', 
  showEnglish, 
  showTransliteration = false, 
  mappings: providedMappings 
}: HighlightableVerseProps) {
  const { colors } = useTheme();
  const arabicTokens = useMemo(() => tokenize(arabic), [arabic]);
  const englishTokens = useMemo(() => tokenize(english), [english]);
  const transliterationTokens = useMemo(() => tokenize(transliteration), [transliteration]);
  const mappings = useMemo(
    () => providedMappings ?? buildIndexMappings(arabicTokens.length, englishTokens.length),
    [providedMappings, arabicTokens.length, englishTokens.length]
  );

  const [arabicRects, setArabicRects] = useState<Rect[]>(Array(arabicTokens.length).fill(null));
  const [englishRects, setEnglishRects] = useState<Rect[]>(Array(englishTokens.length).fill(null));

  const [highlightArabicIndex, setHighlightArabicIndex] = useState<number | null>(null);
  const [highlightEnglishIndex, setHighlightEnglishIndex] = useState<number | null>(null);

  const arabicContainerRef = useRef<View>(null);
  const englishContainerRef = useRef<View>(null);

  function handleMoveArabic(e: GestureResponderEvent) {
    const { locationX, locationY } = e.nativeEvent;
    const hovered = findWordIndexAtLocation(arabicRects, locationX, locationY);
    if (hovered == null) return;
    if (hovered !== highlightArabicIndex) {
      setHighlightArabicIndex(hovered);
      const counterpart = mapSwipeToCounterpart('arabic-to-english', hovered, mappings);
      setHighlightEnglishIndex(counterpart);
    }
  }

  function handleMoveEnglish(e: GestureResponderEvent) {
    const { locationX, locationY } = e.nativeEvent;
    const hovered = findWordIndexAtLocation(englishRects, locationX, locationY);
    if (hovered == null) return;
    if (hovered !== highlightEnglishIndex) {
      setHighlightEnglishIndex(hovered);
      const counterpart = mapSwipeToCounterpart('english-to-arabic', hovered, mappings);
      setHighlightArabicIndex(counterpart);
    }
  }

  function resetHighlights() {
    setHighlightArabicIndex(null);
    setHighlightEnglishIndex(null);
  }

  return (
    <View style={styles.container}>
      {/* Arabic text in manuscript style */}
      <PaperTexture variant="manuscript" intensity="medium" style={styles.arabicPaper}>
        <View
          ref={arabicContainerRef}
          style={styles.textContainer}
          onStartShouldSetResponder={() => true}
          onResponderMove={handleMoveArabic}
          onResponderRelease={resetHighlights}
        >
          {/* Decorative border for Arabic text */}
          <View style={[styles.decorativeBorder, { borderColor: colors.accent }]} />
          
          <Text style={[styles.arabicText, { color: colors.inkDark }]}>
            {arabicTokens.map((token, idx) => (
              <Text
                key={`ar-${idx}-${token}`}
                onLayout={(ev) => {
                  const { x, y, width, height } = ev.nativeEvent.layout;
                  setArabicRects((prev) => setAt(prev, idx, { x, y, width, height }));
                }}
                style={[
                  styles.word,
                  styles.arabicWord,
                  highlightArabicIndex === idx && [styles.highlight, { backgroundColor: colors.highlight }],
                ]}
              >
                {token}
                {idx < arabicTokens.length - 1 ? ' ' : ''}
              </Text>
            ))}
          </Text>
        </View>
      </PaperTexture>

      {/* Transliteration - shown between Arabic and English */}
      {showTransliteration && transliteration && (
        <PaperTexture variant="aged" intensity="subtle" style={styles.transliterationPaper}>
          <View style={styles.textContainer}>
            <Text style={[styles.transliterationText, { color: colors.primary }]}>
              {transliterationTokens.map((token, idx) => (
                <Text
                  key={`tr-${idx}-${token}`}
                  style={[
                    styles.word,
                    styles.transliterationWord,
                  ]}
                >
                  {token}
                  {idx < transliterationTokens.length - 1 ? ' ' : ''}
                </Text>
              ))}
            </Text>

            {/* Transliteration indicator */}
            <View style={[styles.transliterationIndicator, { backgroundColor: colors.primary }]} />
          </View>
        </PaperTexture>
      )}

      {showEnglish && (
        <PaperTexture variant="classic" intensity="subtle" style={styles.englishPaper}>
          <View
            ref={englishContainerRef}
            style={styles.textContainer}
            onStartShouldSetResponder={() => true}
            onResponderMove={handleMoveEnglish}
            onResponderRelease={resetHighlights}
          >
            <Text style={[styles.englishText, { color: colors.inkMedium }]}>
              {englishTokens.map((token, idx) => (
                <Text
                  key={`en-${idx}-${token}`}
                  onLayout={(ev) => {
                    const { x, y, width, height } = ev.nativeEvent.layout;
                    setEnglishRects((prev) => setAt(prev, idx, { x, y, width, height }));
                  }}
                  style={[
                    styles.word,
                    highlightEnglishIndex === idx && [styles.highlight, { backgroundColor: colors.highlight }],
                  ]}
                >
                  {token}
                  {idx < englishTokens.length - 1 ? ' ' : ''}
                </Text>
              ))}
            </Text>

            {/* Subtle translation indicator */}
            <View style={[styles.translationIndicator, { backgroundColor: colors.accentLight }]} />
          </View>
        </PaperTexture>
      )}
    </View>
  );
}

// Helpers

type Rect = { x: number; y: number; width: number; height: number } | null;

function tokenize(text: string): string[] {
  if (!text) return [];
  // simple splitter: split on whitespace; retain basic punctuation attached
  return text.trim().split(/\s+/g);
}

function buildIndexMappings(arLen: number, enLen: number): WordMapping[] {
  if (arLen === 0 || enLen === 0) return [];
  if (arLen === enLen) {
    // Named function for equal length mapping
    function createEqualMapping(_: unknown, i: number) {
      return { arabicIndex: i, englishIndex: i };
    }
    return Array.from({ length: arLen }, createEqualMapping);
  }
  // proportional mapping - named function for proportional mapping
  function createProportionalMapping(_: unknown, i: number) {
    const mapped = Math.round((i * (enLen - 1)) / (arLen - 1));
    return { arabicIndex: i, englishIndex: mapped };
  }
  return Array.from({ length: arLen }, createProportionalMapping);
}

function findWordIndexAtLocation(rects: Rect[], x: number, y: number): number | null {
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i];
    if (!r) continue;
    if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) {
      return i;
    }
  }
  return null;
}

function setAt<T>(arr: T[], index: number, value: T): T[] {
  const copy = arr.slice();
  copy[index] = value;
  return copy;
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginHorizontal: 12,
  },
  arabicPaper: {
    borderRadius: 0, // Sharp edges for manuscript feel
    marginHorizontal: 4,
  },
  englishPaper: {
    borderRadius: 2, // Slight rounding for modern translation
    marginHorizontal: 8,
    marginTop: 8,
  },
  transliterationPaper: {
    borderRadius: 1, // Very slight rounding for transliteration
    marginHorizontal: 6,
    marginTop: 6,
  },
  textContainer: {
    position: 'relative',
    paddingHorizontal: 24,
    paddingVertical: 20,
    minHeight: 80,
  },
  decorativeBorder: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    height: 1,
    borderTopWidth: 2,
    borderStyle: 'solid',
    opacity: 0.3,
  },
  translationIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.2,
  },
  transliterationIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
    opacity: 0.3,
  },
  arabicText: {
    fontSize: 32, // Larger for manuscript feel
    textAlign: 'right',
    lineHeight: 52, // Generous line height for readability
    fontWeight: '400',
    letterSpacing: 0.8,
    writingDirection: 'rtl',
    paddingTop: 8, // Space for decorative border
    // Enhanced text shadow for ink depth - iOS compatible
    textShadow: '0.5px 0.5px 0.5px rgba(0,0,0,0.025)',
  },
  englishText: {
    fontSize: 18,
    lineHeight: 30,
    fontWeight: '400',
    letterSpacing: 0.3,
    textAlign: 'left',
    paddingBottom: 8, // Space for indicator line
    // Subtle text shadow for paper feel - iOS compatible
    textShadow: '0.25px 0.25px 0.25px rgba(0,0,0,0.015)',
  },
  transliterationText: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '500',
    letterSpacing: 0.4,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingBottom: 6, // Space for indicator line
    paddingHorizontal: 12,
    // Subtle text shadow for paper feel - iOS compatible
    textShadow: '0.3px 0.3px 0.3px rgba(0,0,0,0.02)',
  },
  word: {
    borderRadius: 4,
    padding: 3,
    margin: -3,
    // Smooth transitions for interactions
    transitionProperty: 'background-color, transform',
    transitionDuration: '150ms',
  },
  arabicWord: {
    paddingHorizontal: 2,
    // Slightly larger touch targets for Arabic
    paddingVertical: 4,
    margin: -4,
  },
  transliterationWord: {
    paddingHorizontal: 1.5,
    paddingVertical: 2,
    margin: -2,
  },
  highlight: {
    borderRadius: 6,
    // Enhanced highlighting with paper-appropriate colors - iOS compatible
    boxShadow: '0px 1px 3px rgba(212, 175, 55, 0.25)',
    elevation: 1,
    // iOS-compatible emphasis (remove problematic transform scale)
    // Border for definition
    borderWidth: 0.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
});

export default HighlightableVerse;
