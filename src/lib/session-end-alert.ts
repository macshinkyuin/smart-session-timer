import * as Haptics from 'expo-haptics';

import type { SessionEndAlertOption } from '@/hooks/use-after-session';

const HEAVY_IMPACT_GAP_MS = 250;
const HEAVY_IMPACT_COUNT = 3;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function triggerSessionEndHaptics(): Promise<void> {
  for (let i = 0; i < HEAVY_IMPACT_COUNT; i += 1) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (i < HEAVY_IMPACT_COUNT - 1) {
      await wait(HEAVY_IMPACT_GAP_MS);
    }
  }
}

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
      await triggerSessionEndHaptics();
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
