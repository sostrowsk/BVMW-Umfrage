import React from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../features/auth/AuthContext";
import Card from "../components/ui/Card";
const Settings: React.FC = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { user } = useAuth();
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t("settings")}
      </h1>
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t("profile")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              defaultValue={user?.email}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              defaultValue="Admin User"
            />
          </div>
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t("preferences")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t("language")}
            </div>
            <div className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
              {language === "de" ? "Deutsch" : "English"}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t("theme")}
            </div>
            <div className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
              {theme === "dark" ? t("dark") : t("light")}
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t("organization")}
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              defaultValue="Survey Platform Inc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Timezone
            </label>
            <select className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
              <option>UTC+01:00 (Berlin)</option>
              <option>UTC+00:00 (London)</option>
              <option>UTC-05:00 (New York)</option>
              <option>UTC-08:00 (Los Angeles)</option>
            </select>
          </div>
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t("integrations")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {["Slack", "Zapier", "Google", "Microsoft", "Webhook", "S3"].map(
            (integration) => (
              <div
                key={integration}
                className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between"
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {integration}
                </div>
                <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 dark:text-gray-300">
                  Connect
                </button>
              </div>
            ),
          )}
        </div>
      </Card>
      <div className="flex justify-end gap-3">
        <button className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
          Cancel
        </button>
        <button className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
          Save Changes
        </button>
      </div>
    </div>
  );
};
export default Settings;
