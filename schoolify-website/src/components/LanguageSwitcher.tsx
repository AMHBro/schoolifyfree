import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en' as const, name: t('languageSwitcher.english'), flag: '🇺🇸' },
    { code: 'ar' as const, name: t('languageSwitcher.arabic'), flag: '🇸🇦' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (langCode: 'en' | 'ar') => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className={`language-switcher ${isRTL ? 'rtl' : 'ltr'}`} ref={dropdownRef}>
      <button
        className="language-fab"
        onClick={() => setIsOpen(!isOpen)}
        title={t('languageSwitcher.tooltip')}
        aria-label={t('languageSwitcher.tooltip')}
      >
        <span className="current-flag">{currentLanguage?.flag}</span>
        <span className="fab-icon">🌐</span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className={`language-dropdown ${isRTL ? 'rtl' : 'ltr'}`}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-option ${language === lang.code ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <span className="language-flag">{lang.flag}</span>
              <span className="language-name">{lang.name}</span>
              {language === lang.code && <span className="check-mark">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;