export type WordMapping = {
  // Maps token indices between Arabic and English arrays
  arabicIndex: number;
  englishIndex: number;
};

export function mapSwipeToCounterpart(
  direction: 'arabic-to-english' | 'english-to-arabic',
  tokenIndex: number,
  mappings: WordMapping[]
): number | null {
  if (direction === 'arabic-to-english') {
    const found = mappings.find((m) => m.arabicIndex === tokenIndex);
    return found ? found.englishIndex : null;
  }
  const found = mappings.find((m) => m.englishIndex === tokenIndex);
  return found ? found.arabicIndex : null;
}
