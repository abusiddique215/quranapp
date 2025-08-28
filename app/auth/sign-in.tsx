import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function SignInScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 16 }}>Sign In</Text>
      <Text style={{ color: '#666', textAlign: 'center', marginBottom: 24 }}>
        Clerk integration is wired. Hook up providers and flows next.
      </Text>
      <Pressable
        onPress={() => {
          Alert.alert('Auth', 'Connect Clerk OAuth/email flow here.');
          router.back();
        }}
        style={{ padding: 12, backgroundColor: '#2e7d32', borderRadius: 8 }}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>Continue</Text>
      </Pressable>
    </View>
  );
}
