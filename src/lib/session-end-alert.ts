import * as Haptics from 'expo-haptics';

import type { SessionEndAlertOption } from '@/hooks/use-after-session';

export async function triggerSessionEndAlert(
  option: SessionEndAlertOption,
  playSound?: () => void | Promise<void>
): Promise<void> {
  if (option === 'none') return;

  const shouldPlaySound = option === 'sound' || option === 'soundAndVibration';
  const shouldVibrate =
    option === 'vibration' || option === 'soundAndVibration';

  if (shouldVibrate) {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Ignore haptics failures so sound/timer behavior continues.
    }
  }

  if (shouldPlaySound && playSound) {
    try {
      await playSound();
    } catch {
      // Ignore alert sound failures so timer behavior is unaffected.
    }
  }
}
