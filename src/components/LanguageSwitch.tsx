import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../lib/translations';

// EN | FR toggle; the choice is remembered on this device by LanguageContext.
export const LanguageSwitch: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage, t } = useLanguage();
  const options: { code: Language; label: string; name: string }[] = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'fr', label: 'FR', name: 'Français' },
  ];
  return (
    <div role="group" aria-label={t.languageLabel} className={`flex border border-[#16402E] rounded-sm overflow-hidden text-[11px] font-bold ${className}`}>
      {options.map(option => (
        <button
          key={option.code}
          type="button"
          lang={option.code}
          aria-label={option.name}
          aria-pressed={language === option.code}
          onClick={() => setLanguage(option.code)}
          className={`px-2 py-1.5 transition-colors ${
            language === option.code ? 'bg-[#16402E] text-white' : 'bg-white text-[#16402E] hover:bg-[#F8F5EE]'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
