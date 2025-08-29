import React from 'react';
import { render } from '@testing-library/react-native';
import { AuthGuard, useAuthAvailability } from '../AuthGuard';
import { Text } from 'react-native';

// Mock the environment configuration
jest.mock('@/lib/config/env', () => ({
  ENV: {
    clerkPublishableKey: 'pk_test_valid_key',
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

describe('AuthGuard', () => {
  it('should render children when auth is available', () => {
    // Mock valid Clerk key
    jest.doMock('@/lib/config/env', () => ({
      ENV: {
        clerkPublishableKey: 'pk_test_valid_key',
      },
    }));

    const { getByText } = render(
      <AuthGuard>
        <Text>Protected Content</Text>
      </AuthGuard>
    );

    expect(getByText('Protected Content')).toBeTruthy();
  });

  it('should render fallback when auth is not available', () => {
    // Mock invalid Clerk key
    jest.doMock('@/lib/config/env', () => ({
      ENV: {
        clerkPublishableKey: 'pk_test_placeholder',
      },
    }));

    const { getByText } = render(
      <AuthGuard>
        <Text>Protected Content</Text>
      </AuthGuard>
    );

    expect(getByText('Authentication Unavailable')).toBeTruthy();
    expect(getByText('Continue as Guest')).toBeTruthy();
  });
});

describe('useAuthAvailability', () => {
  it('should return correct availability status', () => {
    let result: { isAuthAvailable: boolean; publishableKey: string } | null = null;
    
    function TestComponent() {
      result = useAuthAvailability();
      return null;
    }

    render(<TestComponent />);

    expect(result).toBeTruthy();
    expect(result?.isAuthAvailable).toBe(true);
    expect(result?.publishableKey).toBe('pk_test_valid_key');
  });
});