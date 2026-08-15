import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAfterSession } from '@/hooks/use-after-session';

const HOLD_DELAY_MS = 350;
const HOLD_INTERVAL_MS = 250;

export default function HomeScreen() {
  const { afterSession } = useAfterSession();
  const [currentTime, setCurrentTime] = useState('');
  const [totalMinutes, setTotalMinutes] = useState(60);
  const [presetVisible, setPresetVisible] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60 * 60);
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const adjustTime = (deltaMinutes: number) => {
    setTotalMinutes((prevTotal) => {
      const newTotal = Math.max(1, prevTotal + deltaMinutes);
      const actualDelta = newTotal - prevTotal;

      if (actualDelta !== 0) {
        setRemainingSeconds((prev) => Math.max(0, prev + actualDelta * 60));
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
        if (prev > 0) {
          return prev - 1;
        }
  
        setOvertimeSeconds((overtime) => overtime + 1);
        return 0;
      });
    }, 1000);
  
    return () => clearInterval(timer);
  }, [isRunning]);


  return (
    <SafeAreaView style={styles.safeArea}>
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
              {[30, 45, 60, 90, 120].map((minutes) => (
                <Pressable
                  key={minutes}
                  style={styles.presetInlineButton}
                  onPress={() => {
                    setTotalMinutes(minutes);
                    setRemainingSeconds(minutes * 60);
                    setOvertimeSeconds(0);
                    setIsRunning(false);
                    setPresetVisible(false);
                  }}
                >
                  <Text style={styles.presetInlineText}>{minutes}</Text>
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
          onPress={() => setIsRunning((prev) => !prev)}
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
          <Text style={styles.audioText}>♫ No Music Selected</Text>
          <Text style={styles.audioText}>🔊 Device Speaker</Text>
        </View>
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