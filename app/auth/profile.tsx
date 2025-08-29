import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthGuard } from '@/components/auth/AuthGuard';

function ProfileScreenContent() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // User preferences
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    readingReminders: true,
    darkMode: false,
  });

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmailAddress(user.emailAddresses[0]?.emailAddress || '');
    }
  }, [user]);

  const validateInputs = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!user || !isLoaded) return;
    
    if (!validateInputs()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      
      Alert.alert('Success', 'Your profile has been updated successfully.');
    } catch (err: any) {
      console.error('Profile update error:', err);
      
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (err.errors && err.errors.length > 0) {
        const error = err.errors[0];
        errorMessage = error.longMessage || error.message || errorMessage;
      }
      
      Alert.alert('Update Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your progress will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth/sign-in');
            } catch (err) {
              console.error('Sign out error:', err);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'This will permanently delete your account and all associated data. Type "DELETE" to confirm.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'I Understand', 
                  style: 'destructive',
                  onPress: async () => {
                    // Note: Clerk doesn't provide direct user deletion from client
                    // This would typically require a backend endpoint
                    Alert.alert(
                      'Account Deletion',
                      'Please contact support to delete your account. We take data privacy seriously and will process your request promptly.'
                    );
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  if (!isLoaded) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Please sign in to view your profile</Text>
        <Pressable 
          style={styles.signInButton}
          onPress={() => router.push('/auth/sign-in')}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#f8f9fa', '#e9ecef']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </Pressable>
            <Text style={styles.title}>Profile Settings</Text>
            <Text style={styles.subtitle}>Manage your account and preferences</Text>
          </View>

          {/* Profile Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    if (errors.firstName) {
                      setErrors(prev => ({ ...prev, firstName: '' }));
                    }
                  }}
                  placeholder="First name"
                  autoCapitalize="words"
                  editable={!loading}
                />
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    if (errors.lastName) {
                      setErrors(prev => ({ ...prev, lastName: '' }));
                    }
                  }}
                  placeholder="Last name"
                  autoCapitalize="words"
                  editable={!loading}
                />
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={emailAddress}
                editable={false}
              />
              <Text style={styles.emailHint}>
                Email address cannot be changed. Contact support if needed.
              </Text>
            </View>

            <Pressable
              style={[styles.updateButton, loading && styles.buttonDisabled]}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.buttonText}>Update Profile</Text>
              )}
            </Pressable>
          </View>

          {/* Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceLabel}>Email Notifications</Text>
                <Text style={styles.preferenceDescription}>
                  Receive updates about your reading progress
                </Text>
              </View>
              <Switch
                value={preferences.emailNotifications}
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, emailNotifications: value }))
                }
                trackColor={{ false: '#ccc', true: '#2e7d32' }}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceLabel}>Push Notifications</Text>
                <Text style={styles.preferenceDescription}>
                  Get reminded about your daily reading goals
                </Text>
              </View>
              <Switch
                value={preferences.pushNotifications}
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, pushNotifications: value }))
                }
                trackColor={{ false: '#ccc', true: '#2e7d32' }}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceLabel}>Reading Reminders</Text>
                <Text style={styles.preferenceDescription}>
                  Daily reminders to continue reading
                </Text>
              </View>
              <Switch
                value={preferences.readingReminders}
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, readingReminders: value }))
                }
                trackColor={{ false: '#ccc', true: '#2e7d32' }}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceLabel}>Dark Mode</Text>
                <Text style={styles.preferenceDescription}>
                  Use dark theme for reading
                </Text>
              </View>
              <Switch
                value={preferences.darkMode}
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, darkMode: value }))
                }
                trackColor={{ false: '#ccc', true: '#2e7d32' }}
              />
            </View>
          </View>

          {/* Account Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <Pressable
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </Pressable>

            <Pressable
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </Pressable>
          </View>

          {/* Account Info */}
          <View style={styles.accountInfo}>
            <Text style={styles.accountInfoText}>
              Account created: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
            </Text>
            <Text style={styles.accountInfoText}>
              Last sign in: {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'Unknown'}
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginTop: 4,
  },
  emailHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  updateButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceText: {
    flex: 1,
    marginRight: 16,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#666',
  },
  signOutButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  signOutButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
  },
  accountInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  accountInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default function ProfileScreen() {
  return (
    <AuthGuard>
      <ProfileScreenContent />
    </AuthGuard>
  );
}