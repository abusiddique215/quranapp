import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ImageBackground } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useReaderStore } from '@/lib/store/appStore';
import { getSampleAyahPair } from '@/lib/api/quran';
import HighlightableVerse from '@/components/HighlightableVerse';
import { ReadingHeader } from '@/components/reading/ReadingHeader';
import { VerseDivider } from '@/components/reading/VerseDivider';
import { ReadingControls } from '@/components/reading/ReadingControls';
import { initStorage } from '@/lib/storage';
import { useTheme } from '@/theme/theme';

// Sample verses for demonstration with transliteration
const sampleVerses = [
  {
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    english: 'In the name of Allah—the Most Compassionate, Most Merciful.',
    transliteration: 'Bismillāhi r-raḥmāni r-raḥīm',
    ayahNumber: 1,
  },
  {
    arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    english: 'All praise is for Allah—Lord of all worlds,',
    transliteration: 'Al-ḥamdu lillāhi rabbi l-ʿālamīn',
    ayahNumber: 2,
  },
  {
    arabic: 'الرَّحْمَٰنِ الرَّحِيمِ',
    english: 'the Most Compassionate, Most Merciful,',
    transliteration: 'Ar-raḥmāni r-raḥīm',
    ayahNumber: 3,
  },
  {
    arabic: 'مَالِكِ يَوْمِ الدِّينِ',
    english: 'Master of the Day of Judgment.',
    transliteration: 'Māliki yawmi d-dīn',
    ayahNumber: 4,
  },
  {
    arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
    english: 'You ˹alone˺ we worship and You ˹alone˺ we ask for help.',
    transliteration: 'Iyyāka naʿbudu wa-iyyāka nastaʿīn',
    ayahNumber: 5,
  },
];

export default function ReaderScreen() {
  const { colors } = useTheme();
  const { 
    toggleTranslationVisible, 
    translationVisible, 
    toggleTransliterationVisible,
    transliterationVisible 
  } = useReaderStore();
  const [fontSize, setFontSize] = useState(24);
  const [data, setData] = useState<{ arabic: string; english: string } | null>(null);

  useEffect(() => {
    function handleDatabaseError() {
      // Database initialization failed - continue without offline features
    }
    
    function handleDataError() {
      setData(null);
    }
    
    initStorage().catch(handleDatabaseError);
    getSampleAyahPair().then(setData).catch(handleDataError);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: '#f5f2ed' }]}>
      <StatusBar style="dark" />
      
      {/* Authentic paper-like background */}
      <View style={[styles.backgroundTexture, { 
        backgroundColor: colors.paperBackground,
        borderColor: colors.paperBorder 
      }]}>
        <View style={styles.paperGrain} />
        <View style={styles.paperFibers} />
      </View>
      
      <ReadingHeader 
        surahName="Al-Fatihah"
        surahNumber={1}
        currentAyah={1}
        totalAyahs={7}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bismillah - special manuscript styling */}
        <View style={[styles.bismillahContainer, { 
          borderColor: colors.accent,
          // iOS-compatible shadow will be applied via boxShadow in styles
        }]}>
          <View style={[styles.bismillahDecoration, { backgroundColor: colors.accent }]} />
          <HighlightableVerse
            arabic="بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
            english="In the name of Allah—the Most Compassionate, Most Merciful."
            transliteration="Bismillāhi r-raḥmāni r-raḥīm"
            showEnglish={translationVisible}
            showTransliteration={transliterationVisible}
          />
        </View>

        {/* Sample verses with manuscript spacing */}
        {sampleVerses.slice(1).map((verse, index) => (
          <View key={verse.ayahNumber} style={styles.verseSection}>
            <VerseDivider ayahNumber={verse.ayahNumber} />
            <HighlightableVerse
              arabic={verse.arabic}
              english={verse.english}
              transliteration={verse.transliteration}
              showEnglish={translationVisible}
              showTransliteration={transliterationVisible}
            />
            
            {/* Subtle verse separator */}
            <View style={[styles.verseSeparator, { borderColor: colors.paperBorder }]} />
          </View>
        ))}

        {/* Bottom spacing for floating controls */}
        <View style={{ height: 140 }} />
      </ScrollView>

      <ReadingControls
        showEnglish={translationVisible}
        onToggleEnglish={toggleTranslationVisible}
        showTransliteration={transliterationVisible}
        onToggleTransliteration={toggleTransliterationVisible}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        onPlayAudio={() => console.log('Play audio')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.95,
  },
  paperGrain: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.005)',
    // iOS-compatible subtle paper grain effect
    opacity: 0.6,
  },
  paperFibers: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // iOS-compatible subtle fiber texture
    backgroundColor: 'rgba(139,114,73,0.008)',
    opacity: 0.4,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  bismillahContainer: {
    position: 'relative',
    marginHorizontal: 12,
    marginBottom: 32,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 3,
    borderBottomWidth: 1,
    // No background - let PaperTexture handle it
    backgroundColor: 'transparent',
    // iOS-compatible shadow
    boxShadow: '0px 3px 8px rgba(0, 0, 0, 0.12)',
    elevation: 3,
  },
  bismillahDecoration: {
    position: 'absolute',
    top: -1,
    left: '25%',
    right: '25%',
    height: 8,
    borderRadius: 4,
    opacity: 0.4,
  },
  verseSection: {
    marginBottom: 24,
  },
  verseSeparator: {
    height: 1,
    marginTop: 16,
    marginHorizontal: 40,
    borderTopWidth: 0.5,
    opacity: 0.3,
  },
});
