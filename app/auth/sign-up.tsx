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
import { useSignUp, useAuth } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthGuard } from '@/components/auth/AuthGuard';

function SignUpScreenContent() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { isSignedIn } = useAuth();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Redirect if already signed in
  React.useEffect(() => {
    if (isSignedIn) {
      router.replace('/');
    }
  }, [isSignedIn]);

  const validateInputs = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!emailAddress.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(emailAddress)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!isLoaded || !signUp) return;
    
    if (!validateInputs()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      await signUp.create({
        emailAddress: emailAddress.trim(),
        password: password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setVerifying(true);
      
    } catch (err: any) {
      console.error('Sign up error:', JSON.stringify(err, null, 2));
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err.errors && err.errors.length > 0) {
        const error = err.errors[0];
        switch (error.code) {
          case 'form_identifier_exists':
            errorMessage = 'An account with this email address already exists.';
            break;
          case 'form_password_pwned':
            errorMessage = 'This password has been found in a data breach. Please choose a different password.';
            break;
          case 'form_password_too_common':
            errorMessage = 'This password is too common. Please choose a more secure password.';
            break;
          default:
            errorMessage = error.longMessage || error.message || errorMessage;
        }
      }
      
      Alert.alert('Sign Up Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!isLoaded || !signUp) return;
    
    if (!code.trim()) {
      Alert.alert('Verification Required', 'Please enter the verification code sent to your email.');
      return;
    }
    
    setLoading(true);
    
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (completeSignUp.status !== 'complete') {
        console.log('Sign up not complete:', JSON.stringify(completeSignUp, null, 2));
        Alert.alert('Verification Incomplete', 'Please complete all required steps.');
        return;
      }

      await setActive({ session: completeSignUp.createdSessionId });
      router.replace('/');
      
    } catch (err: any) {
      console.error('Verification error:', JSON.stringify(err, null, 2));
      
      let errorMessage = 'Verification failed. Please try again.';
      
      if (err.errors && err.errors.length > 0) {
        const error = err.errors[0];
        switch (error.code) {
          case 'form_code_incorrect':
            errorMessage = 'The verification code is incorrect. Please try again.';
            break;
          case 'verification_expired':
            errorMessage = 'The verification code has expired. Please request a new one.';
            break;
          default:
            errorMessage = error.longMessage || error.message || errorMessage;
        }
      }
      
      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signUp) return;
    
    setLoading(true);
    
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (err: any) {
      console.error('Resend code error:', err);
      Alert.alert('Error', 'Failed to resend verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (verifying) {
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
              <Text style={styles.title}>Verify Your Email</Text>
              <Text style={styles.subtitle}>
                We've sent a verification code to {emailAddress}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={styles.input}
                  value={code}
                  onChangeText={setCode}
                  placeholder="Enter the 6-digit code"
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  editable={!loading}
                  maxLength={6}
                />
              </View>

              <Pressable
                style={[styles.signUpButton, loading && styles.buttonDisabled]}
                onPress={handleVerifyEmail}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Verify Email</Text>
                )}
              </Pressable>

              <Pressable
                style={[styles.resendButton, loading && styles.buttonDisabled]}
                onPress={handleResendCode}
                disabled={loading}
              >
                <Text style={styles.resendButtonText}>Resend Code</Text>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Pressable 
                onPress={() => {
                  setVerifying(false);
                  setCode('');
                }}
                disabled={loading}
              >
                <Text style={[styles.linkText, loading && styles.linkDisabled]}>
                  Back to Sign Up
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join thousands reading the Quran daily</Text>
          </View>

          <View style={styles.form}>
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
                  autoComplete="given-name"
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
                  autoComplete="family-name"
                  editable={!loading}
                />
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>
            </View>

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
                placeholder="Create a strong password"
                secureTextEntry
                autoComplete="new-password"
                editable={!loading}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              <Text style={styles.passwordHint}>
                Must be at least 8 characters with uppercase, lowercase, and number
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) {
                    setErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                placeholder="Confirm your password"
                secureTextEntry
                autoComplete="new-password"
                editable={!loading}
              />
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            <Pressable
              style={[styles.signUpButton, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
            </Text>
            <Pressable 
              onPress={() => router.push('/auth/sign-in')}
              disabled={loading}
            >
              <Text style={[styles.linkText, loading && styles.linkDisabled]}>
                Sign In
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
  passwordHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  signUpButton: {
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
  resendButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  resendButtonText: {
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

export default function SignUpScreen() {
  return (
    <AuthGuard>
      <SignUpScreenContent />
    </AuthGuard>
  );
}