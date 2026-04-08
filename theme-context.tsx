import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Theme } from './types';
import { STORAGE_KEYS } from './constants/storageKeys';
import { readStorageString, setStorageItem } from './services/storage';
import { backend } from './services/backend';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

const THEME_SYNC_EVENT = 'aurora-theme-sync';

const readStoredTheme = (): Theme | null => {
  const stored = readStorageString(STORAGE_KEYS.theme);
  return stored === Theme.LIGHT || stored === Theme.DARK ? stored : null;
};

const resolveThemeForSession = (): Theme => {
  if (!backend.authStore.isValid) return Theme.LIGHT;
  return readStoredTheme() ?? Theme.LIGHT;
};

export const dispatchThemeSync = () => {
  window.dispatchEvent(new Event(THEME_SYNC_EVENT));
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const initialTheme = useMemo(() => resolveThemeForSession(), []);
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    setStorageItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === Theme.LIGHT ? Theme.DARK : Theme.LIGHT));
  };

  useEffect(() => {
    const syncTheme = () => {
      setTheme((current) => {
        const next = resolveThemeForSession();
        return current === next ? current : next;
      });
    };

    const unsubscribe = backend.authStore.onChange((token, record) => {
      if (!token || !record) {
        syncTheme();
      }
    });

    window.addEventListener(THEME_SYNC_EVENT, syncTheme);
    window.addEventListener('storage', syncTheme);

    return () => {
      unsubscribe();
      window.removeEventListener(THEME_SYNC_EVENT, syncTheme);
      window.removeEventListener('storage', syncTheme);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
