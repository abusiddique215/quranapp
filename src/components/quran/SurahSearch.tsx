import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  StyleSheet,
  FlatList,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import type { Surah } from '@/types/quran';

interface SurahSearchProps {
  surahs: Surah[];
  onSurahSelect: (surah: Surah) => void;
  placeholder?: string;
  showFilters?: boolean;
  style?: any;
}

type FilterType = 'all' | 'meccan' | 'medinan';
type SortType = 'number' | 'name' | 'verses';

interface SearchFilters {
  type: FilterType;
  sortBy: SortType;
  minVerses?: number;
  maxVerses?: number;
}

export const SurahSearch = React.memo<SurahSearchProps>(({
  surahs,
  onSurahSelect,
  placeholder = "Search by name, number, or meaning...",
  showFilters = false,
  style
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    sortBy: 'number'
  });
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Debounced search with filtering
  const filteredSurahs = useMemo(() => {
    let results = surahs;

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = surahs.filter(surah => 
        surah.englishName.toLowerCase().includes(query) ||
        surah.englishNameTranslation.toLowerCase().includes(query) ||
        surah.number.toString().includes(query) ||
        surah.name.includes(query)
      );
    }

    // Type filter
    if (filters.type !== 'all') {
      results = results.filter(surah => 
        surah.revelationType.toLowerCase() === filters.type
      );
    }

    // Verse count filter
    if (filters.minVerses) {
      results = results.filter(surah => surah.numberOfAyahs >= filters.minVerses!);
    }
    if (filters.maxVerses) {
      results = results.filter(surah => surah.numberOfAyahs <= filters.maxVerses!);
    }

    // Sorting
    results.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.englishName.localeCompare(b.englishName);
        case 'verses':
          return b.numberOfAyahs - a.numberOfAyahs;
        case 'number':
        default:
          return a.number - b.number;
      }
    });

    return results;
  }, [surahs, searchQuery, filters]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      type: 'all',
      sortBy: 'number'
    });
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.sortBy !== 'number') count++;
    if (filters.minVerses) count++;
    if (filters.maxVerses) count++;
    return count;
  }, [filters]);

  return (
    <>
      <View style={[styles.container, style]}>
        {/* Main Search Bar */}
        <View style={[styles.searchContainer, { 
          backgroundColor: colors.cardWarm,
          borderColor: colors.paperBorder 
        }]}>
          <Ionicons 
            name="search" 
            size={20} 
            color={colors.secondaryText} 
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { 
              color: colors.text,
              backgroundColor: 'transparent'
            }]}
            placeholder={placeholder}
            placeholderTextColor={colors.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={clearSearch}
              style={styles.clearButton}
            >
              <Ionicons 
                name="close-circle" 
                size={20} 
                color={colors.secondaryText}
              />
            </TouchableOpacity>
          )}

          {showFilters && (
            <TouchableOpacity 
              onPress={() => setShowFiltersModal(true)}
              style={[styles.filterButton, { 
                backgroundColor: activeFiltersCount > 0 ? colors.accent : 'transparent',
              }]}
            >
              <Ionicons 
                name="options-outline" 
                size={20} 
                color={activeFiltersCount > 0 ? colors.background : colors.secondaryText}
              />
              {activeFiltersCount > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: colors.background }]}>
                  <Text style={[styles.filterBadgeText, { color: colors.accent }]}>
                    {activeFiltersCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Results Summary */}
        {(searchQuery.length > 0 || activeFiltersCount > 0) && (
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultsText, { color: colors.secondaryText }]}>
              {filteredSurahs.length} chapter{filteredSurahs.length !== 1 ? 's' : ''} found
            </Text>
            {activeFiltersCount > 0 && (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={[styles.clearFiltersText, { color: colors.accent }]}>
                  Clear filters
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Suggestions (when no search) */}
        {searchQuery.length === 0 && activeFiltersCount === 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={[styles.suggestionsHeader, { color: colors.secondaryText }]}>
              Quick Access
            </Text>
            <View style={styles.suggestionChips}>
              {[
                { label: 'Al-Fatihah', number: 1 },
                { label: 'Al-Baqarah', number: 2 },
                { label: 'Ya-Sin', number: 36 },
                { label: 'Ar-Rahman', number: 55 },
              ].map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.number}
                  style={[styles.suggestionChip, { 
                    backgroundColor: colors.accent + '20',
                    borderColor: colors.accent 
                  }]}
                  onPress={() => {
                    const surah = surahs.find(s => s.number === suggestion.number);
                    if (surah) onSurahSelect(surah);
                  }}
                >
                  <Text style={[styles.suggestionText, { color: colors.accent }]}>
                    {suggestion.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Filters Modal */}
      <Modal
        visible={showFiltersModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Filter Chapters
              </Text>
              <TouchableOpacity 
                onPress={() => setShowFiltersModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Revelation Type Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>
                Revelation Type
              </Text>
              <View style={styles.filterOptions}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'meccan', label: 'Meccan' },
                  { key: 'medinan', label: 'Medinan' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.filterOption, {
                      backgroundColor: filters.type === option.key 
                        ? colors.accent + '20' 
                        : colors.cardWarm,
                      borderColor: filters.type === option.key 
                        ? colors.accent 
                        : colors.paperBorder,
                    }]}
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      type: option.key as FilterType 
                    }))}
                  >
                    <Text style={[styles.filterOptionText, {
                      color: filters.type === option.key 
                        ? colors.accent 
                        : colors.text
                    }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort By Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>
                Sort By
              </Text>
              <View style={styles.filterOptions}>
                {[
                  { key: 'number', label: 'Number' },
                  { key: 'name', label: 'Name' },
                  { key: 'verses', label: 'Verses' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.filterOption, {
                      backgroundColor: filters.sortBy === option.key 
                        ? colors.accent + '20' 
                        : colors.cardWarm,
                      borderColor: filters.sortBy === option.key 
                        ? colors.accent 
                        : colors.paperBorder,
                    }]}
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      sortBy: option.key as SortType 
                    }))}
                  >
                    <Text style={[styles.filterOptionText, {
                      color: filters.sortBy === option.key 
                        ? colors.accent 
                        : colors.text
                    }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.accent }]}
              onPress={() => setShowFiltersModal(false)}
            >
              <Text style={[styles.applyButtonText, { color: colors.background }]}>
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
});

SurahSearch.displayName = 'SurahSearch';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  filterButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionsHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SurahSearch;