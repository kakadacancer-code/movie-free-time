import { createContext, useContext, useLayoutEffect, useState } from 'react';
import { khmer } from '../lib/translations';

const PreferencesContext = createContext(null);
function readPreference(key, fallback, allowed) {
  try { const value = localStorage.getItem(key); return allowed.includes(value) ? value : fallback; }
  catch { return fallback; }
}
export function PreferencesProvider({ children }) {
  const [language, setLanguage] = useState(() => readPreference('moviefreetime-language', 'en', ['en', 'km']));
  const [theme, setTheme] = useState(() => readPreference('moviefreetime-theme', 'dark', ['light', 'dark']));
  useLayoutEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f6f7fb' : '#090d17');
    try {
      localStorage.setItem('moviefreetime-language', language);
      localStorage.setItem('moviefreetime-theme', theme);
    } catch { /* Preferences still work when storage is unavailable. */ }
  }, [language, theme]);
  const t = text => language === 'km' && typeof text === 'string' ? khmer[text] || text : text;
  return <PreferencesContext.Provider value={{ language, setLanguage, theme, setTheme, t }}>{children}</PreferencesContext.Provider>;
}
export function usePreferences() { return useContext(PreferencesContext); }
