import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import Sidebar from "../components/Sidebar";
import { LogOut, User, Search, Globe, Moon, Sun } from "lucide-react";

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/80 backdrop-blur dark:bg-gray-900/80 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              SP
            </div>
            <span className="hidden sm:block text-gray-900 dark:text-gray-100 font-semibold">
              Survey Platform
            </span>
          </div>
          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  aria-label={t("search")}
                  placeholder={t("search")}
                  className="w-40 sm:w-64 rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
              <button
                onClick={() => setLanguage(language === "de" ? "en" : "de")}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"
                aria-label={t("language")}
              >
                <Globe className="h-4 w-4" />
                {language.toUpperCase()}
              </button>
              <button
                onClick={toggleTheme}
                className="rounded-xl border border-gray-300 bg-white p-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                aria-label={t("theme")}
                title={t("theme")}
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Sun className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                )}
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <User
                    size={16}
                    className="text-gray-600 dark:text-gray-300"
                  />
                </div>
                <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow hover:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                <LogOut className="h-4 w-4" />
                {t("logout")}
              </button>
            </div>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 py-6">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          t={t}
        />
        <main id="main" className="pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
