import { Redirect } from 'expo-router';

export default function RootIndex() {
  // Redirect to the tabs layout which will show the home tab
  return <Redirect href="/(tabs)" />;
}