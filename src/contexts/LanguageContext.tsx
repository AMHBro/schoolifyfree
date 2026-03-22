import React, { createContext, useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import arEG from "antd/locale/ar_EG";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<Language>("en");
  const [isRTL, setIsRTL] = useState(false);

  // Initialize language from localStorage or default to 'en'
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "ar")) {
      setLanguage(savedLanguage);
      setIsRTL(savedLanguage === "ar");
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  // Update document direction and language
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    setIsRTL(lang === "ar");
    localStorage.setItem("language", lang);
    i18n.changeLanguage(lang);
  };

  // Get Ant Design locale based on current language
  const getAntdLocale = () => {
    return language === "ar" ? arEG : enUS;
  };

  const contextValue: LanguageContextType = {
    language,
    changeLanguage,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      <ConfigProvider
        locale={getAntdLocale()}
        direction={isRTL ? "rtl" : "ltr"}
      >
        {children}
      </ConfigProvider>
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
