import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  SEASONAL_THEMES,
  useAfterSession,
  type SessionPreset,
} from '@/hooks/use-after-session';

export default function Settings() {
  const router = useRouter();
  const {
    afterSession,
    setAfterSession,
    musicPlayback,
    setMusicPlayback,
    whenTimeReachesZero,
    setWhenTimeReachesZero,
    sessionEndAlert,
    setSessionEndAlert,
    keepScreenAwake,
    setKeepScreenAwake,
    seasonalTheme,
    setSeasonalTheme,
    sessionPresets,
    addSessionPreset,
    updateSessionPreset,
    deleteSessionPreset,
  } = useAfterSession();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftMinutes, setDraftMinutes] = useState('');

  const beginEditing = (preset: SessionPreset) => {
    setEditingId(preset.id);
    setDraftName(preset.name);
    setDraftMinutes(String(preset.minutes));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraftName('');
    setDraftMinutes('');
  };

  const saveEditing = () => {
    if (!editingId) return;

    const parsedMinutes = Number.parseInt(draftMinutes, 10);
    updateSessionPreset(editingId, {
      name: draftName,
      minutes: Number.isFinite(parsedMinutes) ? parsedMinutes : 1,
    });
    cancelEditing();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SESSION PRESETS</Text>

            {sessionPresets.map((preset) => {
              const isEditing = editingId === preset.id;

              return (
                <View key={preset.id} style={styles.option}>
                  {isEditing ? (
                    <View style={styles.presetEditArea}>
                      <TextInput
                        style={styles.presetInput}
                        value={draftName}
                        onChangeText={setDraftName}
                        placeholder="Preset name"
                        placeholderTextColor="#999999"
                      />
                      <TextInput
                        style={styles.presetInput}
                        value={draftMinutes}
                        onChangeText={setDraftMinutes}
                        placeholder="Minutes"
                        placeholderTextColor="#999999"
                        keyboardType="number-pad"
                      />
                      <View style={styles.presetActions}>
                        <Pressable
                          style={styles.presetActionButton}
                          onPress={saveEditing}
                        >
                          <Text style={styles.presetActionText}>Save</Text>
                        </Pressable>
                        <Pressable
                          style={styles.presetActionButton}
                          onPress={cancelEditing}
                        >
                          <Text style={styles.presetActionText}>Cancel</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={styles.optionText}>
                        <Text style={styles.optionTitle}>{preset.name}</Text>
                        <Text style={styles.optionSubtitle}>
                          {preset.minutes} minutes
                        </Text>
                      </View>
                      <View style={styles.presetActions}>
                        <Pressable
                          style={styles.presetActionButton}
                          onPress={() => beginEditing(preset)}
                        >
                          <Text style={styles.presetActionText}>Edit</Text>
                        </Pressable>
                        <Pressable
                          style={styles.presetActionButton}
                          onPress={() => {
                            if (editingId === preset.id) {
                              cancelEditing();
                            }
                            deleteSessionPreset(preset.id);
                          }}
                        >
                          <Text style={styles.presetActionText}>Delete</Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
              );
            })}

            <Pressable style={styles.addPresetButton} onPress={addSessionPreset}>
              <Text style={styles.addPresetText}>＋ Add Preset</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AFTER SESSION</Text>

            <Pressable
              style={styles.option}
              onPress={() => setAfterSession('reset')}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Reset to 60 minutes</Text>
                <Text style={styles.optionSubtitle}>
                  Start each new session at 60 minutes
                </Text>
              </View>
              {afterSession === 'reset' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.option}
              onPress={() => setAfterSession('keep')}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Keep last time</Text>
                <Text style={styles.optionSubtitle}>
                  Use the duration from the previous session
                </Text>
              </View>
              {afterSession === 'keep' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WHEN TIME REACHES ZERO</Text>

            <Pressable
              style={styles.option}
              onPress={() => setWhenTimeReachesZero('overtime')}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Continue to Overtime</Text>
                <Text style={styles.optionSubtitle}>
                  Keep counting overtime after remaining hits zero
                </Text>
              </View>
              {whenTimeReachesZero === 'overtime' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.option}
              onPress={() => setWhenTimeReachesZero('stop')}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Stop at Zero</Text>
                <Text style={styles.optionSubtitle}>
                  Pause the timer when remaining reaches zero
                </Text>
              </View>
              {whenTimeReachesZero === 'stop' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SESSION END ALERT</Text>

            <Pressable
              style={styles.option}
              onPress={() => setSessionEndAlert('none')}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>None</Text>
                <Text style={styles.optionSubtitle}>
                  No alert when the session reaches zero
                </Text>
              </View>
              {sessionEndAlert === 'none' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.option}
              onPress={() => setSessionEndAlert('sound')}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Sound</Text>
                <Text style={styles.optionSubtitle}>
                  Play a short chime when time reaches zero
                </Text>
              </View>
              {sessionEndAlert === 'sound' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.option}
              onPress={() => setSessionEndAlert('vibration')}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Vibration</Text>
                <Text style={styles.optionSubtitle}>
                  Use a short vibration when time reaches zero
                </Text>
              </View>
              {sessionEndAlert === 'vibration' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.option}
              onPress={() => setSessionEndAlert('soundAndVibration')}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Sound + Vibration</Text>
                <Text style={styles.optionSubtitle}>
                  Play a chime and vibrate when time reaches zero
                </Text>
              </View>
              {sessionEndAlert === 'soundAndVibration' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              KEEP SCREEN AWAKE DURING SESSION
            </Text>

            <Pressable
              style={styles.option}
              onPress={() => setKeepScreenAwake('on')}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>On</Text>
                <Text style={styles.optionSubtitle}>
                  Prevent auto-lock while the timer is running
                </Text>
              </View>
              {keepScreenAwake === 'on' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.option}
              onPress={() => setKeepScreenAwake('off')}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Off</Text>
                <Text style={styles.optionSubtitle}>
                  Allow normal device auto-lock behavior
                </Text>
              </View>
              {keepScreenAwake === 'off' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MUSIC PLAYBACK</Text>

            <Pressable
              style={styles.option}
              onPress={() => setMusicPlayback('manual')}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Manual</Text>
                <Text style={styles.optionSubtitle}>
                  Control music independently from the timer
                </Text>
              </View>
              {musicPlayback === 'manual' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.option}
              onPress={() => setMusicPlayback('sync')}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Sync with Timer</Text>
                <Text style={styles.optionSubtitle}>
                  Start and pause music with the timer
                </Text>
              </View>
              {musicPlayback === 'sync' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SEASONAL THEME</Text>

            {SEASONAL_THEMES.map((theme) => (
              <Pressable
                key={theme.id}
                style={styles.option}
                onPress={() => setSeasonalTheme(theme.id)}
              >
                <View
                  style={[
                    styles.themeSwatch,
                    { backgroundColor: theme.background },
                  ]}
                />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{theme.label}</Text>
                </View>
                {seasonalTheme === theme.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    fontSize: 36,
    fontWeight: '300',
    lineHeight: 40,
    color: '#222222',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#222222',
  },

  headerSpacer: {
    width: 44,
  },

  scrollContent: {
    paddingBottom: 40,
    gap: 28,
  },

  section: {
    width: '100%',
    gap: 10,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 6,
    color: '#222222',
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBBBBB',
    paddingVertical: 18,
    paddingHorizontal: 18,
  },

  themeSwatch: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBBBBB',
    marginRight: 14,
  },

  optionText: {
    flex: 1,
    paddingRight: 12,
  },

  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 4,
  },

  optionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#777777',
    lineHeight: 20,
  },

  checkmark: {
    fontSize: 22,
    fontWeight: '700',
    color: '#007AFF',
  },

  presetEditArea: {
    flex: 1,
    gap: 10,
  },

  presetInput: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#222222',
    backgroundColor: '#FFFFFF',
  },

  presetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  presetActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  presetActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },

  addPresetButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBBBBB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    alignItems: 'center',
  },

  addPresetText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
  },
});
