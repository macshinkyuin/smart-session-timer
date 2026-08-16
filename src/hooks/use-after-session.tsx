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
export type SeasonalTheme =
  | 'spring'
  | 'earlySummer'
  | 'lateSummer'
  | 'autumn'
  | 'winter';

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
const SEASONAL_THEME_KEY = 'seasonalTheme';

const DEFAULT_AFTER_SESSION: AfterSessionOption = 'reset';
const DEFAULT_MUSIC_PLAYBACK: MusicPlaybackOption = 'manual';
const DEFAULT_SEASONAL_THEME: SeasonalTheme = 'winter';

type SettingsContextValue = {
  afterSession: AfterSessionOption;
  setAfterSession: (value: AfterSessionOption) => void;
  musicPlayback: MusicPlaybackOption;
  setMusicPlayback: (value: MusicPlaybackOption) => void;
  seasonalTheme: SeasonalTheme;
  setSeasonalTheme: (value: SeasonalTheme) => void;
  seasonalBackground: string;
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

export function AfterSessionProvider({ children }: { children: ReactNode }) {
  const [afterSession, setAfterSessionState] =
    useState<AfterSessionOption>(DEFAULT_AFTER_SESSION);
  const [musicPlayback, setMusicPlaybackState] =
    useState<MusicPlaybackOption>(DEFAULT_MUSIC_PLAYBACK);
  const [seasonalTheme, setSeasonalThemeState] =
    useState<SeasonalTheme>(DEFAULT_SEASONAL_THEME);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(AFTER_SESSION_KEY),
      AsyncStorage.getItem(MUSIC_PLAYBACK_KEY),
      AsyncStorage.getItem(SEASONAL_THEME_KEY),
    ]).then(([storedAfterSession, storedMusicPlayback, storedTheme]) => {
      if (isAfterSessionOption(storedAfterSession)) {
        setAfterSessionState(storedAfterSession);
      }
      if (isMusicPlaybackOption(storedMusicPlayback)) {
        setMusicPlaybackState(storedMusicPlayback);
      }
      if (isSeasonalTheme(storedTheme)) {
        setSeasonalThemeState(storedTheme);
      }
    });
  }, []);

  const setAfterSession = (value: AfterSessionOption) => {
    setAfterSessionState(value);
    AsyncStorage.setItem(AFTER_SESSION_KEY, value);
  };

  const setMusicPlayback = (value: MusicPlaybackOption) => {
    setMusicPlaybackState(value);
    AsyncStorage.setItem(MUSIC_PLAYBACK_KEY, value);
  };

  const setSeasonalTheme = (value: SeasonalTheme) => {
    setSeasonalThemeState(value);
    AsyncStorage.setItem(SEASONAL_THEME_KEY, value);
  };

  return (
    <SettingsContext.Provider
      value={{
        afterSession,
        setAfterSession,
        musicPlayback,
        setMusicPlayback,
        seasonalTheme,
        setSeasonalTheme,
        seasonalBackground: getSeasonalBackground(seasonalTheme),
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
