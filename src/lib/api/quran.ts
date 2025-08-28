import type { AyahPair } from '@/types/quran';
import { ENV } from '@/lib/config/env';

// In future, prefer ENV.apiBaseUrl to route via your server function
const QURAN_API = ENV.apiBaseUrl || 'https://api.quran.com/api/v4';

export async function getSampleAyahPair(): Promise<AyahPair> {
  // Fetch Al-Fatiha 1:1 in Arabic and a common English translation
  try {
    const arabicRes = await fetch(`${QURAN_API}/quran/verses/uthmani?chapter_number=1`);
    const englishRes = await fetch(
      `${QURAN_API}/quran/translations/131?chapter_number=1` // 131 = Dr. Mustafa Khattab (The Clear Quran)
    );

    const arabicJson = await arabicRes.json();
    const englishJson = await englishRes.json();

    return {
      arabic: arabicJson?.verses?.[0]?.text_uthmani ?? '',
      english: englishJson?.translations?.[0]?.text ?? '',
    };
  } catch (e) {
    return { arabic: '', english: '' };
  }
}
