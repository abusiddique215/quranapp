import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalligraphicHeader } from '@/components/shared/CalligraphicHeader';
import { IslamicButton } from '@/components/shared/IslamicButton';
import { useAuthStatus } from '@/lib/contexts/AuthContext';
import { GuestModeIndicator } from '@/components/shared/ErrorStates';

// Separate component for authenticated users that uses Clerk hooks
const AuthenticatedProfile = () => {
  const { useClerk, useUser } = require('@clerk/clerk-expo');
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const { colors } = useTheme();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <>
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={[styles.avatarText, { color: colors.background }]}>
              {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || 'U'}
            </Text>
          </View>
          
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.firstName || 'User'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.secondaryText }]}>
              {user?.emailAddresses?.[0]?.emailAddress || ''}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.signOutContainer}>
        <TouchableOpacity
          style={[styles.signOutButton, { borderColor: colors.accent }]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.accent} />
          <Text style={[styles.signOutText, { color: colors.accent }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

// Guest profile component
const GuestProfile = () => {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={[styles.avatarText, { color: colors.background }]}>
            👤
          </Text>
        </View>
        
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: colors.text }]}>
            Guest User
          </Text>
          <Text style={[styles.userEmail, { color: colors.secondaryText }]}>
            Sign in to save progress
          </Text>
        </View>
      </View>

      <View style={styles.authButtons}>
        <IslamicButton
          title="Sign In"
          onPress={() => router.push('/auth/sign-in')}
          variant="primary"
        />
        <IslamicButton
          title="Create Account"
          onPress={() => router.push('/auth/sign-up')}
          variant="secondary"
        />
      </View>
    </View>
  );
};

export default function ProfileScreen() {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isGuest } = useAuthStatus();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.text === '#2c2c2c' ? 'dark' : 'light'} />
      
      {/* Header with safe area */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        {isGuest && <GuestModeIndicator />}
        
        <CalligraphicHeader title="Profile" />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Section - Conditionally render based on auth status */}
        {isGuest ? <GuestProfile /> : <AuthenticatedProfile />}

        {/* Settings Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Settings
          </Text>

          {/* Theme Toggle */}
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={toggleTheme}
          >
            <View style={styles.settingInfo}>
              <Ionicons 
                name={isDarkMode ? 'moon' : 'sunny'} 
                size={20} 
                color={colors.accent} 
              />
              <Text style={[styles.settingText, { color: colors.text }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.secondaryText, true: colors.accent }}
              thumbColor={colors.background}
            />
          </TouchableOpacity>

          {/* Reading Preferences */}
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="text" size={20} color={colors.accent} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                Reading Preferences
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={20} color={colors.accent} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                Prayer Reminders
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>

          {/* Language */}
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="language" size={20} color={colors.accent} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                Language
              </Text>
            </View>
            <Text style={[styles.settingValue, { color: colors.secondaryText }]}>
              English
            </Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About
          </Text>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="help-circle-outline" size={20} color={colors.accent} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                Help & Support
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                Privacy Policy
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="document-text-outline" size={20} color={colors.accent} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                Terms of Service
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                Version
              </Text>
            </View>
            <Text style={[styles.settingValue, { color: colors.secondaryText }]}>
              1.0.0
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  authButtons: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 14,
  },
  signOutContainer: {
    marginVertical: 20,
    paddingHorizontal: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});