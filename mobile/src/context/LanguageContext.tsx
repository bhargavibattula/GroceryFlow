import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { translations, Language } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key) => translations.en[key] || String(key),
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('te'); // Default to Telugu or English

  useEffect(() => {
    (async () => {
      try {
        let saved: string | null = null;
        if (Platform.OS !== 'web') {
          saved = await SecureStore.getItemAsync('freshstock_language');
        } else {
          saved = typeof window !== 'undefined' ? localStorage.getItem('freshstock_language') : null;
        }
        if (saved === 'en' || saved === 'te') {
          setLanguageState(saved);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync('freshstock_language', lang);
      } else {
        localStorage.setItem('freshstock_language', lang);
      }
    } catch (e) {
      // ignore
    }
  };

  const toggleLanguage = () => {
    const next = language === 'en' ? 'te' : 'en';
    setLanguage(next);
  };

  const t = (key: keyof typeof translations['en']): string => {
    return translations[language][key] || translations.en[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
