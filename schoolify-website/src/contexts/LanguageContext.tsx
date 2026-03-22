import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface Translations {
  [key: string]: string | Translations;
}

// Translation files will be imported here
import enTranslations from '../locales/en.json';
import arTranslations from '../locales/ar.json';

const translations: Record<Language, Translations> = {
  en: enTranslations,
  ar: arTranslations,
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Get language from localStorage or default to 'en'
    const savedLanguage = localStorage.getItem('schoolify-language') as Language;
    return savedLanguage || 'en';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    // Save language to localStorage
    localStorage.setItem('schoolify-language', language);
    
    // Update document direction and language
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const getNestedTranslation = (obj: Translations, path: string): string => {
    const keys = path.split('.');
    let current: any = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return path; // Return the key if translation not found
      }
    }
    
    return typeof current === 'string' ? current : path;
  };

  const t = (key: string): string => {
    return getNestedTranslation(translations[language], key);
  };

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  const value: LanguageContextType = {
    language,
    setLanguage: handleSetLanguage,
    t,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};