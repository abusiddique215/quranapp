/**
 * Storage Demo Component
 * Demonstrates web storage functionality for manual testing
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, Alert } from 'react-native';
import { 
  initStorage,
  addBookmark,
  removeBookmark,
  listBookmarks,
  isAyahBookmarked,
  toggleBookmark,
  saveResume,
  getResume,
  getStorageStats,
  clearAllData,
  exportUserData,
  importUserData,
  isValidAyahKey
} from '@/lib/storage';

export default function StorageDemo() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [resumeState, setResumeState] = useState<string | null>(null);
  const [newAyahKey, setNewAyahKey] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [status, setStatus] = useState('');

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await initStorage();
      const allBookmarks = await listBookmarks();
      const currentResume = await getResume();
      const currentStats = await getStorageStats();
      
      setBookmarks(allBookmarks);
      setResumeState(currentResume);
      setStats(currentStats);
      setStatus('Storage loaded successfully');
    } catch (error) {
      setStatus(`Error loading storage: ${error}`);
      console.error('Storage error:', error);
    }
  };

  const handleAddBookmark = async () => {
    if (!isValidAyahKey(newAyahKey)) {
      setStatus('Invalid ayah key format. Use format like "1:1"');
      return;
    }

    try {
      await addBookmark(newAyahKey);
      setNewAyahKey('');
      setStatus(`Added bookmark: ${newAyahKey}`);
      loadData(); // Refresh data
    } catch (error) {
      setStatus(`Error adding bookmark: ${error}`);
    }
  };

  const handleRemoveBookmark = async (ayahKey: string) => {
    try {
      await removeBookmark(ayahKey);
      setStatus(`Removed bookmark: ${ayahKey}`);
      loadData(); // Refresh data
    } catch (error) {
      setStatus(`Error removing bookmark: ${error}`);
    }
  };

  const handleToggleBookmark = async (ayahKey: string) => {
    try {
      const newState = await toggleBookmark(ayahKey);
      setStatus(`Bookmark ${ayahKey} ${newState ? 'added' : 'removed'}`);
      loadData(); // Refresh data
    } catch (error) {
      setStatus(`Error toggling bookmark: ${error}`);
    }
  };

  const handleSaveResume = async () => {
    if (!isValidAyahKey(newAyahKey)) {
      setStatus('Invalid ayah key format for resume state');
      return;
    }

    try {
      await saveResume(newAyahKey);
      setStatus(`Resume state saved: ${newAyahKey}`);
      loadData(); // Refresh data
    } catch (error) {
      setStatus(`Error saving resume state: ${error}`);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllData();
      setStatus('All data cleared');
      loadData(); // Refresh data
    } catch (error) {
      setStatus(`Error clearing data: ${error}`);
    }
  };

  const handleExportData = async () => {
    try {
      const exportedData = await exportUserData();
      const dataString = JSON.stringify(exportedData, null, 2);
      
      // In a real app, you might save to file or show in a modal
      console.log('Exported data:', dataString);
      setStatus('Data exported to console');
    } catch (error) {
      setStatus(`Error exporting data: ${error}`);
    }
  };

  return (
    <View style={{ padding: 20, gap: 15 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Storage Demo</Text>
      
      {/* Status */}
      <View style={{ padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5 }}>
        <Text style={{ fontSize: 14, color: '#666' }}>Status: {status}</Text>
      </View>

      {/* Stats */}
      {stats && (
        <View style={{ padding: 10, backgroundColor: '#e8f5e8', borderRadius: 5 }}>
          <Text style={{ fontWeight: 'bold' }}>Storage Stats:</Text>
          <Text>Platform: {stats.platform}</Text>
          <Text>Bookmarks: {stats.bookmarksCount}</Text>
          <Text>Has Resume: {stats.hasResumeState ? 'Yes' : 'No'}</Text>
        </View>
      )}

      {/* Add Bookmark */}
      <View style={{ gap: 10 }}>
        <Text style={{ fontWeight: 'bold' }}>Add Bookmark / Set Resume:</Text>
        <TextInput
          style={{ 
            borderWidth: 1, 
            borderColor: '#ccc', 
            padding: 10, 
            borderRadius: 5,
            backgroundColor: 'white'
          }}
          placeholder="Enter ayah key (e.g., 1:1)"
          value={newAyahKey}
          onChangeText={setNewAyahKey}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={handleAddBookmark}
            style={{ 
              backgroundColor: '#4CAF50', 
              padding: 10, 
              borderRadius: 5, 
              flex: 1,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Add Bookmark</Text>
          </Pressable>
          <Pressable
            onPress={handleSaveResume}
            style={{ 
              backgroundColor: '#2196F3', 
              padding: 10, 
              borderRadius: 5, 
              flex: 1,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Set Resume</Text>
          </Pressable>
        </View>
      </View>

      {/* Resume State */}
      <View style={{ padding: 10, backgroundColor: '#fff3cd', borderRadius: 5 }}>
        <Text style={{ fontWeight: 'bold' }}>Current Resume State:</Text>
        <Text>{resumeState || 'None'}</Text>
      </View>

      {/* Bookmarks List */}
      <View style={{ gap: 5 }}>
        <Text style={{ fontWeight: 'bold' }}>Bookmarks ({bookmarks.length}):</Text>
        {bookmarks.length === 0 ? (
          <Text style={{ color: '#666', fontStyle: 'italic' }}>No bookmarks yet</Text>
        ) : (
          bookmarks.map((ayahKey) => (
            <View 
              key={ayahKey} 
              style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: 10,
                backgroundColor: 'white',
                borderRadius: 5,
                borderWidth: 1,
                borderColor: '#ddd'
              }}
            >
              <Text style={{ fontWeight: '500' }}>{ayahKey}</Text>
              <View style={{ flexDirection: 'row', gap: 5 }}>
                <Pressable
                  onPress={() => handleToggleBookmark(ayahKey)}
                  style={{ 
                    backgroundColor: '#FF9800', 
                    paddingHorizontal: 8, 
                    paddingVertical: 4, 
                    borderRadius: 3 
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 12 }}>Toggle</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleRemoveBookmark(ayahKey)}
                  style={{ 
                    backgroundColor: '#f44336', 
                    paddingHorizontal: 8, 
                    paddingVertical: 4, 
                    borderRadius: 3 
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 12 }}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Actions */}
      <View style={{ gap: 10 }}>
        <Pressable
          onPress={loadData}
          style={{ 
            backgroundColor: '#9C27B0', 
            padding: 12, 
            borderRadius: 5, 
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Refresh Data</Text>
        </Pressable>
        
        <Pressable
          onPress={handleExportData}
          style={{ 
            backgroundColor: '#607D8B', 
            padding: 12, 
            borderRadius: 5, 
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Export Data (Check Console)</Text>
        </Pressable>
        
        <Pressable
          onPress={handleClearAll}
          style={{ 
            backgroundColor: '#f44336', 
            padding: 12, 
            borderRadius: 5, 
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>⚠️ Clear All Data</Text>
        </Pressable>
      </View>
    </View>
  );
}