import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type AfterSessionOption = 'reset' | 'keep';

const STORAGE_KEY = 'afterSessionOption';
const DEFAULT_OPTION: AfterSessionOption = 'reset';

type AfterSessionContextValue = {
  afterSession: AfterSessionOption;
  setAfterSession: (value: AfterSessionOption) => void;
};

const AfterSessionContext = createContext<AfterSessionContextValue | null>(null);

function isAfterSessionOption(value: string | null): value is AfterSessionOption {
  return value === 'reset' || value === 'keep';
}

export function AfterSessionProvider({ children }: { children: ReactNode }) {
  const [afterSession, setAfterSessionState] =
    useState<AfterSessionOption>(DEFAULT_OPTION);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (isAfterSessionOption(stored)) {
        setAfterSessionState(stored);
      }
    });
  }, []);

  const setAfterSession = (value: AfterSessionOption) => {
    setAfterSessionState(value);
    AsyncStorage.setItem(STORAGE_KEY, value);
  };

  return (
    <AfterSessionContext.Provider value={{ afterSession, setAfterSession }}>
      {children}
    </AfterSessionContext.Provider>
  );
}

export function useAfterSession() {
  const context = useContext(AfterSessionContext);
  if (!context) {
    throw new Error('useAfterSession must be used within AfterSessionProvider');
  }
  return context;
}
