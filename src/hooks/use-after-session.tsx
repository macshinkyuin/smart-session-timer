import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type AfterSessionOption = 'reset' | 'keep';
export type MusicPlaybackOption = 'manual' | 'sync';
export type WhenTimeReachesZeroOption = 'overtime' | 'stop';
export type SessionEndAlertOption =
  | 'none'
  | 'sound'
  | 'vibration'
  | 'soundAndVibration';
export type KeepScreenAwakeOption = 'on' | 'off';
export type SeasonalTheme =
  | 'spring'
  | 'earlySummer'
  | 'lateSummer'
  | 'autumn'
  | 'winter';

export type SessionPreset = {
  id: string;
  name: string;
  minutes: number;
};

export const SEASONAL_THEMES: {
  id: SeasonalTheme;
  label: string;
  background: string;
}[] = [
  { id: 'spring', label: 'Spring', background: '#EAF4E6' },
  { id: 'earlySummer', label: 'Early Summer', background: '#EAF4FA' },
  { id: 'lateSummer', label: 'Late Summer', background: '#FCEEF2' },
  { id: 'autumn', label: 'Autumn', background: '#F2E8DD' },
  { id: 'winter', label: 'Winter', background: '#FAFAFA' },
];

const AFTER_SESSION_KEY = 'afterSessionOption';
const MUSIC_PLAYBACK_KEY = 'musicPlaybackOption';
const WHEN_TIME_REACHES_ZERO_KEY = 'whenTimeReachesZeroOption';
const SESSION_END_ALERT_KEY = 'sessionEndAlertOption';
const KEEP_SCREEN_AWAKE_KEY = 'keepScreenAwakeOption';
const SEASONAL_THEME_KEY = 'seasonalTheme';
const SESSION_PRESETS_KEY = 'sessionPresets';

const DEFAULT_AFTER_SESSION: AfterSessionOption = 'reset';
const DEFAULT_MUSIC_PLAYBACK: MusicPlaybackOption = 'manual';
const DEFAULT_WHEN_TIME_REACHES_ZERO: WhenTimeReachesZeroOption = 'overtime';
const DEFAULT_SESSION_END_ALERT: SessionEndAlertOption = 'soundAndVibration';
const DEFAULT_KEEP_SCREEN_AWAKE: KeepScreenAwakeOption = 'on';
const DEFAULT_SEASONAL_THEME: SeasonalTheme = 'winter';
const DEFAULT_SESSION_PRESETS: SessionPreset[] = [
  { id: 'preset-1', name: 'Preset 1', minutes: 30 },
  { id: 'preset-2', name: 'Preset 2', minutes: 60 },
  { id: 'preset-3', name: 'Preset 3', minutes: 90 },
];

type SettingsContextValue = {
  afterSession: AfterSessionOption;
  setAfterSession: (value: AfterSessionOption) => void;
  musicPlayback: MusicPlaybackOption;
  setMusicPlayback: (value: MusicPlaybackOption) => void;
  whenTimeReachesZero: WhenTimeReachesZeroOption;
  setWhenTimeReachesZero: (value: WhenTimeReachesZeroOption) => void;
  sessionEndAlert: SessionEndAlertOption;
  setSessionEndAlert: (value: SessionEndAlertOption) => void;
  keepScreenAwake: KeepScreenAwakeOption;
  setKeepScreenAwake: (value: KeepScreenAwakeOption) => void;
  seasonalTheme: SeasonalTheme;
  setSeasonalTheme: (value: SeasonalTheme) => void;
  seasonalBackground: string;
  sessionPresets: SessionPreset[];
  addSessionPreset: () => void;
  updateSessionPreset: (
    id: string,
    updates: { name?: string; minutes?: number }
  ) => void;
  deleteSessionPreset: (id: string) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function isAfterSessionOption(value: string | null): value is AfterSessionOption {
  return value === 'reset' || value === 'keep';
}

function isMusicPlaybackOption(
  value: string | null
): value is MusicPlaybackOption {
  return value === 'manual' || value === 'sync';
}

function isWhenTimeReachesZeroOption(
  value: string | null
): value is WhenTimeReachesZeroOption {
  return value === 'overtime' || value === 'stop';
}

function isSessionEndAlertOption(
  value: string | null
): value is SessionEndAlertOption {
  return (
    value === 'none' ||
    value === 'sound' ||
    value === 'vibration' ||
    value === 'soundAndVibration'
  );
}

function isKeepScreenAwakeOption(
  value: string | null
): value is KeepScreenAwakeOption {
  return value === 'on' || value === 'off';
}

function isSeasonalTheme(value: string | null): value is SeasonalTheme {
  return (
    value === 'spring' ||
    value === 'earlySummer' ||
    value === 'lateSummer' ||
    value === 'autumn' ||
    value === 'winter'
  );
}

function getSeasonalBackground(theme: SeasonalTheme): string {
  return (
    SEASONAL_THEMES.find((item) => item.id === theme)?.background ??
    '#FAFAFA'
  );
}

function parseSessionPresets(value: string | null): SessionPreset[] | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;

    const presets = parsed
      .map((item) => {
        if (
          !item ||
          typeof item !== 'object' ||
          typeof (item as SessionPreset).id !== 'string' ||
          typeof (item as SessionPreset).name !== 'string' ||
          typeof (item as SessionPreset).minutes !== 'number'
        ) {
          return null;
        }

        const minutes = Math.max(
          1,
          Math.round((item as SessionPreset).minutes)
        );
        const name = (item as SessionPreset).name.trim() || 'Untitled Preset';

        return {
          id: (item as SessionPreset).id,
          name,
          minutes,
        } satisfies SessionPreset;
      })
      .filter((item): item is SessionPreset => item !== null);

    return presets.length > 0 ? presets : null;
  } catch {
    return null;
  }
}

function createPresetId() {
  return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AfterSessionProvider({ children }: { children: ReactNode }) {
  const [afterSession, setAfterSessionState] =
    useState<AfterSessionOption>(DEFAULT_AFTER_SESSION);
  const [musicPlayback, setMusicPlaybackState] =
    useState<MusicPlaybackOption>(DEFAULT_MUSIC_PLAYBACK);
  const [whenTimeReachesZero, setWhenTimeReachesZeroState] =
    useState<WhenTimeReachesZeroOption>(DEFAULT_WHEN_TIME_REACHES_ZERO);
  const [sessionEndAlert, setSessionEndAlertState] =
    useState<SessionEndAlertOption>(DEFAULT_SESSION_END_ALERT);
  const [keepScreenAwake, setKeepScreenAwakeState] =
    useState<KeepScreenAwakeOption>(DEFAULT_KEEP_SCREEN_AWAKE);
  const [seasonalTheme, setSeasonalThemeState] =
    useState<SeasonalTheme>(DEFAULT_SEASONAL_THEME);
  const [sessionPresets, setSessionPresetsState] = useState<SessionPreset[]>(
    DEFAULT_SESSION_PRESETS
  );

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(AFTER_SESSION_KEY),
      AsyncStorage.getItem(MUSIC_PLAYBACK_KEY),
      AsyncStorage.getItem(WHEN_TIME_REACHES_ZERO_KEY),
      AsyncStorage.getItem(SESSION_END_ALERT_KEY),
      AsyncStorage.getItem(KEEP_SCREEN_AWAKE_KEY),
      AsyncStorage.getItem(SEASONAL_THEME_KEY),
      AsyncStorage.getItem(SESSION_PRESETS_KEY),
    ]).then(
      ([
        storedAfterSession,
        storedMusicPlayback,
        storedWhenTimeReachesZero,
        storedSessionEndAlert,
        storedKeepScreenAwake,
        storedTheme,
        storedPresets,
      ]) => {
        if (isAfterSessionOption(storedAfterSession)) {
          setAfterSessionState(storedAfterSession);
        }
        if (isMusicPlaybackOption(storedMusicPlayback)) {
          setMusicPlaybackState(storedMusicPlayback);
        }
        if (isWhenTimeReachesZeroOption(storedWhenTimeReachesZero)) {
          setWhenTimeReachesZeroState(storedWhenTimeReachesZero);
        }
        if (isSessionEndAlertOption(storedSessionEndAlert)) {
          setSessionEndAlertState(storedSessionEndAlert);
        }
        if (isKeepScreenAwakeOption(storedKeepScreenAwake)) {
          setKeepScreenAwakeState(storedKeepScreenAwake);
        }
        if (isSeasonalTheme(storedTheme)) {
          setSeasonalThemeState(storedTheme);
        }
        const presets = parseSessionPresets(storedPresets);
        if (presets) {
          setSessionPresetsState(presets);
        }
      }
    );
  }, []);

  const persistSessionPresets = (presets: SessionPreset[]) => {
    setSessionPresetsState(presets);
    AsyncStorage.setItem(SESSION_PRESETS_KEY, JSON.stringify(presets));
  };

  const setAfterSession = (value: AfterSessionOption) => {
    setAfterSessionState(value);
    AsyncStorage.setItem(AFTER_SESSION_KEY, value);
  };

  const setMusicPlayback = (value: MusicPlaybackOption) => {
    setMusicPlaybackState(value);
    AsyncStorage.setItem(MUSIC_PLAYBACK_KEY, value);
  };

  const setWhenTimeReachesZero = (value: WhenTimeReachesZeroOption) => {
    setWhenTimeReachesZeroState(value);
    AsyncStorage.setItem(WHEN_TIME_REACHES_ZERO_KEY, value);
  };

  const setSessionEndAlert = (value: SessionEndAlertOption) => {
    setSessionEndAlertState(value);
    AsyncStorage.setItem(SESSION_END_ALERT_KEY, value);
  };

  const setKeepScreenAwake = (value: KeepScreenAwakeOption) => {
    setKeepScreenAwakeState(value);
    AsyncStorage.setItem(KEEP_SCREEN_AWAKE_KEY, value);
  };

  const setSeasonalTheme = (value: SeasonalTheme) => {
    setSeasonalThemeState(value);
    AsyncStorage.setItem(SEASONAL_THEME_KEY, value);
  };

  const addSessionPreset = () => {
    const nextPresets = [
      ...sessionPresets,
      {
        id: createPresetId(),
        name: `Preset ${sessionPresets.length + 1}`,
        minutes: 60,
      },
    ];
    persistSessionPresets(nextPresets);
  };

  const updateSessionPreset = (
    id: string,
    updates: { name?: string; minutes?: number }
  ) => {
    const nextPresets = sessionPresets.map((preset) => {
      if (preset.id !== id) return preset;

      const name =
        updates.name !== undefined
          ? updates.name.trim() || preset.name
          : preset.name;
      const minutes =
        updates.minutes !== undefined
          ? Math.max(1, Math.round(updates.minutes))
          : preset.minutes;

      return { ...preset, name, minutes };
    });
    persistSessionPresets(nextPresets);
  };

  const deleteSessionPreset = (id: string) => {
    persistSessionPresets(sessionPresets.filter((preset) => preset.id !== id));
  };

  return (
    <SettingsContext.Provider
      value={{
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
        seasonalBackground: getSeasonalBackground(seasonalTheme),
        sessionPresets,
        addSessionPreset,
        updateSessionPreset,
        deleteSessionPreset,
      }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useAfterSession() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useAfterSession must be used within AfterSessionProvider');
  }
  return context;
}
