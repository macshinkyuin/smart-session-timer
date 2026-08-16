import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  SEASONAL_THEMES,
  useAfterSession,
} from '@/hooks/use-after-session';

export default function Settings() {
  const router = useRouter();
  const {
    afterSession,
    setAfterSession,
    musicPlayback,
    setMusicPlayback,
    seasonalTheme,
    setSeasonalTheme,
  } = useAfterSession();

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
        >
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
});
