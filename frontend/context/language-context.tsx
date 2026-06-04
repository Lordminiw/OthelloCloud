import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { LanguageCode, SUPPORTED_LANGUAGES, translate } from "@/i18n/messages";

const STORAGE_KEY = "language-preference";

type LanguageContextType = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  languages: readonly LanguageCode[];
  t: (key: string, args?: Record<string, string | number | boolean>) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

async function readStoredLanguage() {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "de") {
      return stored;
    }
    return null;
  }

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "de") {
      return stored;
    }
  } catch {
    // Ignore storage errors and fall back to the default language.
  }

  return null;
}

async function persistLanguage(language: LanguageCode) {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY, language);
    return;
  }

  try {
    await AsyncStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Ignore storage errors and keep the in-memory language.
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  useEffect(() => {
    let mounted = true;

    void readStoredLanguage().then((stored) => {
      if (mounted && stored) {
        setLanguageState(stored);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    void persistLanguage(nextLanguage);
  };

  const value = useMemo<LanguageContextType>(
    () => ({
      language,
      setLanguage,
      languages: SUPPORTED_LANGUAGES,
      t: (key, args) => translate(language, key, args),
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    return {
      language: "en" as LanguageCode,
      setLanguage: (_language: LanguageCode) => {},
      languages: SUPPORTED_LANGUAGES,
      t: (key: string, args?: Record<string, string | number | boolean>) =>
        translate("en", key, args),
    };
  }

  return context;
}
