import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * Reading Index Route - Redirects to Al-Fatihah
 * This route maintains backward compatibility while redirecting
 * users to the new dynamic reading interface.
 */

export default function ReaderScreen() {
  const router = useRouter();
  
  // Auto-redirect to Al-Fatihah (Chapter 1)
  useEffect(() => {
    router.replace('/read/1');
  }, [router]);

  return null; // This component just redirects
}