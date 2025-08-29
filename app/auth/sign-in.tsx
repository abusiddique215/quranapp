import React, { useState } from 'react';
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
  StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthGuard } from '@/components/auth/AuthGuard';

function SignInScreenContent() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Redirect if already signed in
  React.useEffect(() => {
    if (isSignedIn) {
      router.replace('/');
    }
  }, [isSignedIn]);

  const validateInputs = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!emailAddress.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(emailAddress)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!isLoaded || !signIn) return;
    
    if (!validateInputs()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress.trim(),
        password: password,
      });

      if (completeSignIn.status !== 'complete') {
        console.log('Sign in not complete:', JSON.stringify(completeSignIn, null, 2));
        Alert.alert('Error', 'Sign in process incomplete. Please try again.');
        return;
      }

      await setActive({ session: completeSignIn.createdSessionId });
      router.replace('/');
      
    } catch (err: any) {
      console.error('Sign in error:', JSON.stringify(err, null, 2));
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err.errors && err.errors.length > 0) {
        const error = err.errors[0];
        switch (error.code) {
          case 'form_identifier_not_found':
            errorMessage = 'No account found with this email address.';
            break;
          case 'form_password_incorrect':
            errorMessage = 'Incorrect password. Please try again.';
            break;
          case 'session_exists':
            errorMessage = 'You are already signed in.';
            break;
          default:
            errorMessage = error.longMessage || error.message || errorMessage;
        }
      }
      
      Alert.alert('Sign In Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    Alert.alert(
      'Guest Mode',
      'Continue without signing in? You won\'t be able to sync your progress across devices.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => router.replace('/') 
        }
      ]
    );
  };

  if (!isLoaded) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading...</Text>
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
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your Quran journey</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={emailAddress}
                onChangeText={(text) => {
                  setEmailAddress(text);
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors(prev => ({ ...prev, password: '' }));
                  }
                }}
                placeholder="Enter your password"
                secureTextEntry
                autoComplete="password"
                editable={!loading}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <Pressable
              style={[styles.signInButton, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={[styles.guestButton, loading && styles.buttonDisabled]}
              onPress={handleGuestMode}
              disabled={loading}
            >
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
            </Text>
            <Pressable 
              onPress={() => router.push('/auth/sign-up')}
              disabled={loading}
            >
              <Text style={[styles.linkText, loading && styles.linkDisabled]}>
                Sign Up
              </Text>
            </Pressable>
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
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
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
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#1a1a1a',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginTop: 4,
  },
  signInButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    padding: 16,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  guestButton: {
    borderWidth: 1,
    borderColor: '#2e7d32',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  linkText: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '600',
  },
  linkDisabled: {
    opacity: 0.6,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default function SignInScreen() {
  return (
    <AuthGuard>
      <SignInScreenContent />
    </AuthGuard>
  );
}
