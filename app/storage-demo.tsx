import React from 'react';
import { ScrollView } from 'react-native';
import StorageDemo from '@/components/StorageDemo';

export default function StorageDemoPage() {
  return (
    <ScrollView style={{ flex: 1 }}>
      <StorageDemo />
    </ScrollView>
  );
}