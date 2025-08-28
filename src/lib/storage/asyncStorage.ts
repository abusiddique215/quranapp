import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_READ_KEY = 'last_read_ayah_v1';

export async function saveLastRead(ayahKey: string): Promise<void> {
  await AsyncStorage.setItem(LAST_READ_KEY, ayahKey);
}

export async function getLastRead(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_READ_KEY);
}
