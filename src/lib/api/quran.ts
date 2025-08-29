import type { AyahPair } from '@/types/quran';
import { quranClient } from './quran-client';

/**
 * Get sample Ayah pair for backward compatibility
 * This function now uses the new Quran API client
 */
export async function getSampleAyahPair(): Promise<AyahPair> {
  try {
    // Use the new API client to get Al-Fatihah 1:1
    return await quranClient.getSampleAyahPair();
  } catch (error) {
    console.warn('Failed to get sample ayah pair:', error);
    
    // Fallback to hardcoded data
    return {
      arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      english: 'In the name of Allah—the Most Compassionate, Most Merciful.',
    };
  }
}
