"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Lang = 'hu' | 'en';

const translations = {
  hu: {
    welcome: 'Jó reggelt',
    welcome_afternoon: 'Jó napot',
    welcome_evening: 'Jó estét',
    login: 'Bejelentkezés',
    logout: 'Kijelentkezés',
    admin_panel: 'Admin felület',
    search_placeholder: 'Keresés az appok között (Cmd+K)',
    no_apps: 'Nincs megjeleníthető alkalmazás.',
    settings: 'Beállítások',
    save: 'Mentés',
    apps: 'Alkalmazások',
    groups: 'Csoportok',
    sync_authentik: 'Szinkronizálás Authentikből',
    authentik_settings: 'Authentik Beállítások',
    client_id: 'Client ID',
    client_secret: 'Client Secret',
    issuer: 'Issuer URL',
    api_token: 'API Token',
    api_url: 'API URL',
    test_connection: 'Kapcsolat tesztelése',
    success: 'Sikeres művelet',
    error: 'Hiba történt',
    username: 'Felhasználónév',
    password: 'Jelszó',
  },
  en: {
    welcome: 'Good morning',
    welcome_afternoon: 'Good afternoon',
    welcome_evening: 'Good evening',
    login: 'Login',
    logout: 'Logout',
    admin_panel: 'Admin Panel',
    search_placeholder: 'Search apps (Cmd+K)',
    no_apps: 'No apps available.',
    settings: 'Settings',
    save: 'Save',
    apps: 'Apps',
    groups: 'Groups',
    sync_authentik: 'Sync from Authentik',
    authentik_settings: 'Authentik Settings',
    client_id: 'Client ID',
    client_secret: 'Client Secret',
    issuer: 'Issuer URL',
    api_token: 'API Token',
    api_url: 'API URL',
    test_connection: 'Test Connection',
    success: 'Success',
    error: 'An error occurred',
    username: 'Username',
    password: 'Password',
  }
};

type Translations = typeof translations.hu;

const I18nContext = createContext<{
  t: (key: keyof Translations) => string;
  lang: Lang;
  setLang: (lang: Lang) => void;
}>({
  t: (key) => translations.hu[key],
  lang: 'hu',
  setLang: () => {},
});

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Lang>('hu');

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Lang;
    if (savedLang && (savedLang === 'hu' || savedLang === 'en')) {
      setLang(savedLang);
    }
  }, []);

  const handleSetLang = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const t = (key: keyof Translations): string => {
    return translations[lang][key] || key;
  };

  return (
    <I18nContext.Provider value={{ t, lang, setLang: handleSetLang }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
