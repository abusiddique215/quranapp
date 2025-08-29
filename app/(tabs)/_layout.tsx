import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, Text } from 'react-native';
import { useTheme } from '@/theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent || '#2e7d32',
        tabBarInactiveTintColor: colors.secondaryText || '#666',
        tabBarStyle: {
          backgroundColor: colors.background || '#f5f2ed',
          borderTopWidth: 1.5,
          borderTopColor: colors.accentLight || 'rgba(46, 125, 50, 0.2)',
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingTop: 5,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        // Add subtle press animation
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Ionicons 
                name={focused ? 'home' : 'home-outline'} 
                size={size - 2} 
                color={color} 
              />
              {focused && (
                <View 
                  style={{ 
                    position: 'absolute', 
                    bottom: -8, 
                    width: 4, 
                    height: 4, 
                    borderRadius: 2, 
                    backgroundColor: color 
                  }} 
                />
              )}
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="quran"
        options={{
          title: 'Quran',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Ionicons 
                name={focused ? 'book' : 'book-outline'} 
                size={size - 2} 
                color={color} 
              />
              {focused && (
                <View 
                  style={{ 
                    position: 'absolute', 
                    bottom: -8, 
                    width: 4, 
                    height: 4, 
                    borderRadius: 2, 
                    backgroundColor: color 
                  }} 
                />
              )}
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: 'Reading',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Ionicons 
                name={focused ? 'bookmark' : 'bookmark-outline'} 
                size={size - 2} 
                color={color} 
              />
              {focused && (
                <View 
                  style={{ 
                    position: 'absolute', 
                    bottom: -8, 
                    width: 4, 
                    height: 4, 
                    borderRadius: 2, 
                    backgroundColor: color 
                  }} 
                />
              )}
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="prayer"
        options={{
          title: 'Prayer',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Ionicons 
                name={focused ? 'time' : 'time-outline'} 
                size={size - 2} 
                color={color} 
              />
              {focused && (
                <View 
                  style={{ 
                    position: 'absolute', 
                    bottom: -8, 
                    width: 4, 
                    height: 4, 
                    borderRadius: 2, 
                    backgroundColor: color 
                  }} 
                />
              )}
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={size - 2} 
                color={color} 
              />
              {focused && (
                <View 
                  style={{ 
                    position: 'absolute', 
                    bottom: -8, 
                    width: 4, 
                    height: 4, 
                    borderRadius: 2, 
                    backgroundColor: color 
                  }} 
                />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}