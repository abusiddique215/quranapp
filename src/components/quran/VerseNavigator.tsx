import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  Modal,
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';

interface VerseNavigatorProps {
  currentVerse: number;
  totalVerses: number;
  onVerseChange: (verseNumber: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  showJumpTo?: boolean;
  compact?: boolean;
}

export const VerseNavigator = React.memo<VerseNavigatorProps>(({
  currentVerse,
  totalVerses,
  onVerseChange,
  onPrevious,
  onNext,
  showJumpTo = true,
  compact = false
}) => {
  const { colors } = useTheme();
  const [showJumpModal, setShowJumpModal] = useState(false);
  const [jumpValue, setJumpValue] = useState(currentVerse.toString());

  const handleJumpSubmit = useCallback(() => {
    const verseNumber = parseInt(jumpValue, 10);
    if (verseNumber >= 1 && verseNumber <= totalVerses) {
      onVerseChange(verseNumber);
      setShowJumpModal(false);
    }
  }, [jumpValue, totalVerses, onVerseChange]);

  const canGoPrevious = currentVerse > 1;
  const canGoNext = currentVerse < totalVerses;

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: colors.cardWarm }]}>
        <TouchableOpacity
          onPress={onPrevious}
          disabled={!canGoPrevious}
          style={[styles.compactButton, {
            opacity: canGoPrevious ? 1 : 0.3
          }]}
        >
          <Ionicons 
            name="chevron-back" 
            size={20} 
            color={colors.accent}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.compactCounter}
          onPress={() => showJumpTo && setShowJumpModal(true)}
        >
          <Text style={[styles.compactCurrentVerse, { color: colors.accent }]}>
            {currentVerse}
          </Text>
          <Text style={[styles.compactTotalVerses, { color: colors.secondaryText }]}>
            /{totalVerses}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNext}
          disabled={!canGoNext}
          style={[styles.compactButton, {
            opacity: canGoNext ? 1 : 0.3
          }]}
        >
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={colors.accent}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.container, { 
        backgroundColor: colors.cardWarm,
        borderColor: colors.paperBorder,
        shadowColor: colors.shadow 
      }]}>
        {/* Navigation Buttons */}
        <View style={styles.navigationRow}>
          <TouchableOpacity
            onPress={onPrevious}
            disabled={!canGoPrevious}
            style={[styles.navButton, {
              backgroundColor: canGoPrevious ? colors.accent : colors.paperBorder,
              opacity: canGoPrevious ? 1 : 0.5
            }]}
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={canGoPrevious ? colors.background : colors.secondaryText}
            />
          </TouchableOpacity>

          {/* Verse Counter */}
          <View style={styles.counterContainer}>
            <Text style={[styles.counterLabel, { color: colors.secondaryText }]}>
              Verse
            </Text>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => showJumpTo && setShowJumpModal(true)}
            >
              <Text style={[styles.currentVerse, { color: colors.accent }]}>
                {currentVerse}
              </Text>
              <Text style={[styles.verseDivider, { color: colors.secondaryText }]}>
                of
              </Text>
              <Text style={[styles.totalVerses, { color: colors.text }]}>
                {totalVerses}
              </Text>
              {showJumpTo && (
                <Ionicons 
                  name="chevron-down" 
                  size={16} 
                  color={colors.secondaryText}
                  style={styles.dropdownIcon}
                />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={onNext}
            disabled={!canGoNext}
            style={[styles.navButton, {
              backgroundColor: canGoNext ? colors.accent : colors.paperBorder,
              opacity: canGoNext ? 1 : 0.5
            }]}
          >
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color={canGoNext ? colors.background : colors.secondaryText}
            />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.paperBorder }]}>
            <View 
              style={[styles.progressFill, { 
                backgroundColor: colors.accent,
                width: `${(currentVerse / totalVerses) * 100}%`
              }]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.secondaryText }]}>
            {Math.round((currentVerse / totalVerses) * 100)}% complete
          </Text>
        </View>
      </View>

      {/* Jump To Verse Modal */}
      <Modal
        visible={showJumpModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowJumpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Jump to Verse
              </Text>
              <TouchableOpacity 
                onPress={() => setShowJumpModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.secondaryText }]}>
              Enter a verse number between 1 and {totalVerses}
            </Text>

            <TextInput
              style={[styles.jumpInput, { 
                backgroundColor: colors.cardWarm,
                borderColor: colors.paperBorder,
                color: colors.text
              }]}
              value={jumpValue}
              onChangeText={setJumpValue}
              keyboardType="numeric"
              placeholder={`1 - ${totalVerses}`}
              placeholderTextColor={colors.secondaryText}
              selectTextOnFocus
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { 
                  backgroundColor: colors.paperBorder 
                }]}
                onPress={() => setShowJumpModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { 
                  backgroundColor: colors.accent 
                }]}
                onPress={handleJumpSubmit}
              >
                <Text style={[styles.modalButtonText, { color: colors.background }]}>
                  Jump
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Jump Options */}
            <View style={styles.quickJumpContainer}>
              <Text style={[styles.quickJumpTitle, { color: colors.secondaryText }]}>
                Quick Jump
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.quickJumpScroll}
              >
                {[
                  { label: 'Beginning', value: 1 },
                  { label: '25%', value: Math.ceil(totalVerses * 0.25) },
                  { label: 'Middle', value: Math.ceil(totalVerses * 0.5) },
                  { label: '75%', value: Math.ceil(totalVerses * 0.75) },
                  { label: 'End', value: totalVerses },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[styles.quickJumpChip, { 
                      backgroundColor: colors.accent + '20',
                      borderColor: colors.accent 
                    }]}
                    onPress={() => {
                      setJumpValue(option.value.toString());
                      onVerseChange(option.value);
                      setShowJumpModal(false);
                    }}
                  >
                    <Text style={[styles.quickJumpChipText, { color: colors.accent }]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.quickJumpChipVerse, { color: colors.accent }]}>
                      {option.value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
});

VerseNavigator.displayName = 'VerseNavigator';

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  counterContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  counterLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  counterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  currentVerse: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 8,
  },
  verseDivider: {
    fontSize: 14,
    marginRight: 8,
  },
  totalVerses: {
    fontSize: 18,
    fontWeight: '500',
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressTrack: {
    height: 6,
    width: '100%',
    borderRadius: 3,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 8,
  },
  compactButton: {
    padding: 8,
  },
  compactCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  compactCurrentVerse: {
    fontSize: 18,
    fontWeight: '700',
  },
  compactTotalVerses: {
    fontSize: 14,
    marginLeft: 2,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  jumpInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickJumpContainer: {
    marginTop: 20,
  },
  quickJumpTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  quickJumpScroll: {
    flexGrow: 0,
  },
  quickJumpChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  quickJumpChipText: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 2,
  },
  quickJumpChipVerse: {
    fontSize: 14,
    fontWeight: '700',
  },
});