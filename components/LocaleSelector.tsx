import React, { useState, useRef, useEffect } from 'react';
import { GlobeIcon, UsaFlagIcon, UkFlagIcon, AustraliaFlagIcon, CheckCircleIcon } from './icons';

export type Locale = 'Generic/Global' | 'USA' | 'UK' | 'Australia';

interface LocaleSelectorProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

const locales: { id: Locale; name: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'Generic/Global', name: 'Global', icon: GlobeIcon },
  { id: 'USA', name: 'USA', icon: UsaFlagIcon },
  { id: 'UK', name: 'UK', icon: UkFlagIcon },
  { id: 'Australia', name: 'Australia', icon: AustraliaFlagIcon },
];

const LocaleSelector: React.FC<LocaleSelectorProps> = ({ locale, onLocaleChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLocale = locales.find(l => l.id === locale) || locales[0];

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

  const handleSelect = (selectedLocale: Locale) => {
    onLocaleChange(selectedLocale);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <selectedLocale.icon className="h-6 w-6 rounded-full object-cover" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 origin-top-right animate-scale-in">
          <div className="py-1">
            {locales.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleSelect(loc.id)}
                className="w-full text-left flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                <div className="flex items-center gap-3">
                    <loc.icon className="h-5 w-5 rounded-full object-cover flex-shrink-0" />
                    <span>{loc.name}</span>
                </div>
                {locale === loc.id && <CheckCircleIcon className="h-5 w-5 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocaleSelector;
