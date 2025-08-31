"use client";

import { createContext, useContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Locale } from '@/lib/i18n';

interface LanguageContextType {
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = LanguageContext.Provider;

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
