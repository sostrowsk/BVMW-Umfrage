import React, { createContext, useContext, useState, useEffect } from "react";
const translations = {
  de: {
    dashboard: "Dashboard",
    surveys: "Umfragen",
    analytics: "Analysen",
    members: "Mitglieder",
    settings: "Einstellungen",
    createSurvey: "Neue Umfrage",
    search: "Suche…",
    overview: "Übersicht",
    responseRate: "Antwortrate",
    activeSurveys: "Aktive Umfragen",
    completionRate: "Abschlussquote",
    engagement: "Engagement-Score",
    recentActivity: "Letzte Aktivitäten",
    topSurveys: "Top-Umfragen",
    responseTrend: "Antworttrend",
    logout: "Abmelden",
    language: "Sprache",
    theme: "Design",
    profile: "Profil",
    organization: "Organisation",
    preferences: "Präferenzen",
    integrations: "Integrationen",
    light: "Hell",
    dark: "Dunkel",
  },
  en: {
    dashboard: "Dashboard",
    surveys: "Surveys",
    analytics: "Analytics",
    members: "Members",
    settings: "Settings",
    createSurvey: "Create Survey",
    search: "Search…",
    overview: "Overview",
    responseRate: "Response Rate",
    activeSurveys: "Active Surveys",
    completionRate: "Completion Rate",
    engagement: "Engagement Score",
    recentActivity: "Recent Activity",
    topSurveys: "Top Surveys",
    responseTrend: "Response Trend",
    logout: "Log out",
    language: "Language",
    theme: "Theme",
    profile: "Profile",
    organization: "Organization",
    preferences: "Preferences",
    integrations: "Integrations",
    light: "Light",
    dark: "Dark",
  },
};
type Language = "de" | "en";
type TranslationKey = keyof typeof translations.de;
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}
const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "de";
  });
  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);
  const t = (key: string): string => {
    return translations[language][key as TranslationKey] || key;
  };
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
