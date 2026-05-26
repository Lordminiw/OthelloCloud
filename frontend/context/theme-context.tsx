import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  colorScheme: ThemeMode;
  toggleColorScheme: () => void;
  setColorScheme: (scheme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme() ?? 'light';
  const [colorScheme, setColorSchemeState] = useState<ThemeMode>('light');

  useEffect(() => {
    // Load initial theme from localStorage on web, or system scheme on native
    let initialScheme: ThemeMode = systemScheme;
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('theme-preference') as ThemeMode | null;
      if (saved === 'light' || saved === 'dark') {
        initialScheme = saved;
      }
    }
    setColorSchemeState(initialScheme);
  }, [systemScheme]);

  const toggleColorScheme = () => {
    setColorSchemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('theme-preference', next);
      }
      return next;
    });
  };

  const setColorScheme = (scheme: ThemeMode) => {
    setColorSchemeState(scheme);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('theme-preference', scheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, toggleColorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      colorScheme: 'light' as ThemeMode,
      toggleColorScheme: () => {},
      setColorScheme: () => {},
    };
  }
  return context;
}
