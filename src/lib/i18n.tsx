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
    search_placeholder: 'Keresés az alkalmazások között...',
    no_apps: 'Nincs megjeleníthető alkalmazás.',
    settings: 'Beállítások',
    save: 'Mentés',
    apps: 'Alkalmazások',
    groups: 'Csoportok',
    sync_authentik: 'Authentik Szinkronizálás',
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
    all: 'Összes',
    media: 'Média',
    network: 'Hálózat',
    system: 'Rendszer',
    management: 'Menedzsment',
    launch: 'Megnyitás',
    online: 'Elérhető',
    standby: 'Készenlét',
    stopped: 'Leállítva',
    services_count: 'szolgáltatás elérhető',
    overview: 'Áttekintés',
    permissions: 'Jogosultságok',
    sync: 'Szinkronizálás',
    back_to_dashboard: 'Vissza a Főoldalra',
    edit_app: 'Alkalmazás szerkesztése',
    visibility: 'Láthatóság',
    source: 'Forrás',
    name: 'Név',
    url: 'URL',
    actions: 'Műveletek',
  },
  en: {
    welcome: 'Good morning',
    welcome_afternoon: 'Good afternoon',
    welcome_evening: 'Good evening',
    login: 'Sign In',
    logout: 'Sign Out',
    admin_panel: 'Admin Panel',
    search_placeholder: 'Search applications...',
    no_apps: 'No applications available.',
    settings: 'Settings',
    save: 'Save Changes',
    apps: 'Applications',
    groups: 'Groups & Permissions',
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
    all: 'All',
    media: 'Media',
    network: 'Network',
    system: 'System',
    management: 'Management',
    launch: 'Launch',
    online: 'Online',
    standby: 'Standby',
    stopped: 'Stopped',
    services_count: 'services online',
    overview: 'Overview',
    permissions: 'Permissions',
    sync: 'Sync',
    back_to_dashboard: 'Back to Dashboard',
    edit_app: 'Edit Application',
    visibility: 'Visibility',
    source: 'Source',
    name: 'Name',
    url: 'URL',
    actions: 'Actions',
  }
};

type Translations = typeof translations.hu;

const I18nContext = createContext<{
  t: (key: keyof Translations) => string;
  lang: Lang;
  setLang: (lang: Lang) => void;
}>({
  t: (key) => translations.hu[key] || (key as string),
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
    return translations[lang][key] || translations['hu'][key] || (key as string);
  };

  return (
    <I18nContext.Provider value={{ t, lang, setLang: handleSetLang }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
