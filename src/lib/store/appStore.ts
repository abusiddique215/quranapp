import { create } from 'zustand';

interface ReaderState {
  translationVisible: boolean;
  transliterationVisible: boolean;
  toggleTranslationVisible: () => void;
  toggleTransliterationVisible: () => void;
  setTranslationVisible: (visible: boolean) => void;
  setTransliterationVisible: (visible: boolean) => void;
}

export const useReaderStore = create<ReaderState>((set) => ({
  translationVisible: true,
  transliterationVisible: false,
  toggleTranslationVisible: () => set((s) => ({ translationVisible: !s.translationVisible })),
  toggleTransliterationVisible: () => set((s) => ({ transliterationVisible: !s.transliterationVisible })),
  setTranslationVisible: (visible: boolean) => set({ translationVisible: visible }),
  setTransliterationVisible: (visible: boolean) => set({ transliterationVisible: visible }),
}));
