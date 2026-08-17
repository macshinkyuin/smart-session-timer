import * as DocumentPicker from 'expo-document-picker';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KeepAwakeGuard } from '@/components/keep-awake-guard';
import { useAfterSession, type SessionPreset } from '@/hooks/use-after-session';
import { triggerSessionEndAlert } from '@/lib/session-end-alert';

const HOLD_DELAY_MS = 350;
const HOLD_INTERVAL_MS = 250;
const SESSION_END_BEEP = require('@/assets/sounds/session-end-beep.wav');
const BEEP_STATUS_POLL_MS = 50;
const BEEP_FAILSAFE_TIMEOUT_MS = 2500;

function waitForBeepCondition(
  predicate: () => boolean,
  timeoutMs: number
): Promise<boolean> {
  return new Promise((resolve) => {
    if (predicate()) {
      resolve(true);
      return;
    }

    const startedAt = Date.now();
    const intervalId = setInterval(() => {
      if (predicate()) {
        clearInterval(intervalId);
        resolve(true);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        clearInterval(intervalId);
        resolve(false);
      }
    }, BEEP_STATUS_POLL_MS);
  });
}

export default function HomeScreen() {
  const {
    afterSession,
    musicPlayback,
    whenTimeReachesZero,
    sessionEndAlert,
    keepScreenAwake,
    seasonalBackground,
    sessionPresets,
  } = useAfterSession();
  const [currentTime, setCurrentTime] = useState('');
  const [totalMinutes, setTotalMinutes] = useState(60);
  const [presetVisible, setPresetVisible] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60 * 60);
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [musicUri, setMusicUri] = useState<string | null>(null);
  const [musicName, setMusicName] = useState<string | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingSecondsRef = useRef(remainingSeconds);
  const overtimeSecondsRef = useRef(overtimeSeconds);
  const endAlertFiredRef = useRef(false);
  const sessionEndAlertRef = useRef(sessionEndAlert);
  const playSessionEndBeepRef = useRef<
    (options?: { shouldResumeMusic?: boolean }) => Promise<void>
  >(async () => {});
  remainingSecondsRef.current = remainingSeconds;
  overtimeSecondsRef.current = overtimeSeconds;
  sessionEndAlertRef.current = sessionEndAlert;
  const player = useAudioPlayer(musicUri ? { uri: musicUri } : null);
  const playbackStatus = useAudioPlayerStatus(player);
  const beepPlayer = useAudioPlayer(SESSION_END_BEEP, {
    updateInterval: 100,
    keepAudioSessionActive: true,
  });
  const beepStatus = useAudioPlayerStatus(beepPlayer);
  const beepStatusRef = useRef(beepStatus);
  beepStatusRef.current = beepStatus;

  useEffect(() => {
    beepPlayer.volume = 1;
  }, [beepPlayer]);

  const playSessionEndBeep = async (options?: {
    shouldResumeMusic?: boolean;
  }) => {
    try {
      beepPlayer.volume = 1;
      await beepPlayer.seekTo(0);
      beepPlayer.play();

      const didStart = await waitForBeepCondition(
        () => beepStatusRef.current.playing,
        BEEP_FAILSAFE_TIMEOUT_MS
      );

      if (!didStart) {
        beepPlayer.play();
        await waitForBeepCondition(
          () => beepStatusRef.current.playing,
          500
        );
      }

      await waitForBeepCondition(
        () =>
          beepStatusRef.current.didJustFinish ||
          (!beepStatusRef.current.playing &&
            beepStatusRef.current.currentTime > 0.05),
        BEEP_FAILSAFE_TIMEOUT_MS
      );
    } finally {
      if (options?.shouldResumeMusic) {
        try {
          // Resume from the paused position; do not seek/reset music.
          player.play();
        } catch {
          // Ignore resume failures.
        }
      }
    }
  };
  playSessionEndBeepRef.current = playSessionEndBeep;

  const applySessionPreset = (preset: SessionPreset) => {
    const minutes = Math.max(1, preset.minutes);
    setTotalMinutes(minutes);
    setRemainingSeconds(minutes * 60);
    remainingSecondsRef.current = minutes * 60;
    setOvertimeSeconds(0);
    overtimeSecondsRef.current = 0;
    setIsRunning(false);
    setPresetVisible(false);
  };

  const pickMusic = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    setMusicUri(asset.uri);
    setMusicName(asset.name);
  };

  const stopMusic = () => {
    player.pause();
    void player.seekTo(0);
  };

  const playMusicFromCurrentPosition = () => {
    if (!musicUri) return;

    if (playbackStatus.didJustFinish) {
      void player.seekTo(0).then(() => {
        player.play();
      });
      return;
    }

    player.play();
  };

  const toggleMusicPlayback = () => {
    if (!musicUri) return;

    if (playbackStatus.playing) {
      player.pause();
      return;
    }

    playMusicFromCurrentPosition();
  };

  const toggleTimerRunning = () => {
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);

    if (musicPlayback === 'sync' && musicUri) {
      if (nextRunning) {
        playMusicFromCurrentPosition();
      } else {
        player.pause();
      }
    }
  };

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      shouldRouteThroughEarpiece: false,
      interruptionMode: 'mixWithOthers',
    });
  }, []);

  useEffect(() => {
    if (remainingSeconds > 0) {
      endAlertFiredRef.current = false;
    }
  }, [remainingSeconds]);

  const adjustTime = (deltaMinutes: number) => {
    setTotalMinutes((prevTotal) => {
      const newTotal = Math.max(1, prevTotal + deltaMinutes);
      const actualDelta = newTotal - prevTotal;

      if (actualDelta !== 0) {
        const currentBalance =
          remainingSecondsRef.current - overtimeSecondsRef.current;
        const newBalance = currentBalance + actualDelta * 60;

        if (newBalance > 0) {
          remainingSecondsRef.current = newBalance;
          overtimeSecondsRef.current = 0;
          setRemainingSeconds(newBalance);
          setOvertimeSeconds(0);
        } else if (newBalance === 0) {
          remainingSecondsRef.current = 0;
          overtimeSecondsRef.current = 0;
          setRemainingSeconds(0);
          setOvertimeSeconds(0);
        } else {
          remainingSecondsRef.current = 0;
          overtimeSecondsRef.current = Math.abs(newBalance);
          setRemainingSeconds(0);
          setOvertimeSeconds(Math.abs(newBalance));
        }
      }

      return newTotal;
    });
  };

  const clearHoldTimers = () => {
    if (holdIntervalRef.current !== null) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  const startHoldAdjust = (deltaMinutes: number) => {
    clearHoldTimers();
    adjustTime(deltaMinutes);
    holdIntervalRef.current = setInterval(() => {
      adjustTime(deltaMinutes);
    }, HOLD_INTERVAL_MS);
  };

  useEffect(() => () => clearHoldTimers(), []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateClock();

    const timer = setInterval(updateClock, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        if (prev === 1) {
          if (!endAlertFiredRef.current) {
            endAlertFiredRef.current = true;

            const musicWasPlaying = Boolean(musicUri) && player.playing;
            if (musicWasPlaying) {
              // Pause immediately so the full double-beep is audible.
              player.pause();
            }

            const shouldResumeMusic =
              musicWasPlaying &&
              (musicPlayback === 'manual' ||
                (musicPlayback === 'sync' &&
                  whenTimeReachesZero === 'overtime'));

            void triggerSessionEndAlert(sessionEndAlertRef.current, () =>
              playSessionEndBeepRef.current({ shouldResumeMusic })
            );
          }

          if (whenTimeReachesZero === 'stop') {
            setIsRunning(false);
            setOvertimeSeconds(0);
            if (musicPlayback === 'sync' && musicUri) {
              player.pause();
            }
          }
          return 0;
        }

        if (whenTimeReachesZero === 'stop') {
          setIsRunning(false);
          setOvertimeSeconds(0);
          if (musicPlayback === 'sync' && musicUri) {
            player.pause();
          }
          return 0;
        }

        setOvertimeSeconds((overtime) => overtime + 1);
        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, whenTimeReachesZero, musicPlayback, musicUri, player]);


  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: seasonalBackground }]}
    >
      {keepScreenAwake === 'on' && isRunning ? <KeepAwakeGuard /> : null}
      <View style={styles.container}>
        <Text style={styles.title}>SMART SESSION TIMER</Text>
        <Pressable
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>

        <Text style={styles.clock}>{currentTime}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>TOTAL TIME</Text>
          <Pressable onPress={() => setPresetVisible((prev) => !prev)}>
            <Text style={styles.totalTime}>{totalMinutes}:00</Text>
          </Pressable>

          {presetVisible && (
            <View style={styles.presetInline}>
              {sessionPresets.map((preset) => (
                <Pressable
                  key={preset.id}
                  style={styles.presetInlineButton}
                  onPress={() => applySessionPreset(preset)}
                >
                  <Text style={styles.presetInlineText}>{preset.name}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.adjustRow}>
            <Pressable
              style={styles.adjustButton}
              onPress={() => adjustTime(-1)}
              onLongPress={() => startHoldAdjust(-5)}
              onPressOut={clearHoldTimers}
              delayLongPress={HOLD_DELAY_MS}
            >
              <Text style={styles.adjustText}>−</Text>
            </Pressable>

            <Pressable
              style={styles.adjustButton}
              onPress={() => adjustTime(1)}
              onLongPress={() => startHoldAdjust(5)}
              onPressOut={clearHoldTimers}
              delayLongPress={HOLD_DELAY_MS}
            >
              <Text style={styles.adjustText}>＋</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeBox}>
            <Text style={styles.label}>REMAINING</Text>
            <Text style={styles.timeValue}>
              {Math.floor(remainingSeconds / 60)}:
              {String(remainingSeconds % 60).padStart(2, '0')}
            </Text>
          </View>

          <View style={styles.timeBox}>
            <Text style={styles.label}>OVERTIME</Text>
            <Text style={styles.timeValue}>
              {Math.floor(overtimeSeconds / 60)}:
              {String(overtimeSeconds % 60).padStart(2, '0')}
          </Text>
          </View>
        </View>

        <Pressable
          style={styles.startButton}
          onPress={toggleTimerRunning}
        >
          <Text style={styles.startText}>
            {isRunning ? '⏸ PAUSE' : '▶ START'}
          </Text>
        </Pressable>
        <Pressable
          style={styles.endButton}
          onPress={() => {
            setIsRunning(false);
            setOvertimeSeconds(0);
            stopMusic();

            if (afterSession === 'reset') {
              setTotalMinutes(60);
              setRemainingSeconds(60 * 60);
            } else {
              setRemainingSeconds(totalMinutes * 60);
            }
          }}
        >
          <Text style={styles.endText}>■ END SESSION</Text>
        </Pressable>

        <View style={styles.audioArea}>
          <View style={styles.musicRow}>
            <Pressable onPress={pickMusic} style={styles.musicSelect}>
              <Text style={styles.audioText}>
                ♫ {musicName ?? 'No Music Selected'}
              </Text>
            </Pressable>
            {musicUri ? (
              <Pressable onPress={toggleMusicPlayback} hitSlop={8}>
                <Text style={styles.audioText}>
                  {playbackStatus.playing ? '⏸' : '▶'}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.audioText}>🔊 Device Speaker</Text>
        </View>
      </View>
     </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 18,
  },

  clock: {
    fontSize: 38,
    fontWeight: '300',
    marginBottom: 34,
  },

  section: {
    width: '100%',
    alignItems: 'center',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 5,
  },

  totalTime: {
    fontSize: 64,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  adjustRow: {
    flexDirection: 'row',
    gap: 30,
    marginTop: 15,
    marginBottom: 35,
  },

  adjustButton: {
    width: 80,
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBBBBB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  adjustText: {
    fontSize: 36,
    fontWeight: '400',
  },

  timeRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 14,
  },

  timeBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderRadius: 16,
  },

  timeValue: {
    fontSize: 34,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  startButton: {
    width: '100%',
    marginTop: 30,
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: '#222222',
    alignItems: 'center',
  },

  startText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },

  endButton: {
    width: '100%',
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#BBBBBB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  
  endText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  audioArea: {
    width: '100%',
    marginTop: 28,
    gap: 12,
  },

  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  musicSelect: {
    flex: 1,
  },

  audioText: {
    fontSize: 16,
  },

  presetInline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  
  presetInlineButton: {
    minWidth: 58,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  
  presetInlineText: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingsButton: {
    position: 'absolute',
    top: 18,
    right: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  settingsIcon: {
    fontSize: 28,
  },

});