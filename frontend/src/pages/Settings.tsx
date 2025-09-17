import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../features/auth/AuthContext";
import Card from "../components/ui/Card";
import Select from "../components/ui/Select";
import Toggle from "../components/ui/Toggle";
import { toast } from "../components/ui/Toast";
import { TIMEZONES, getUserTimezone } from "../utils/dateUtils";
import { updateMember } from "../api/members";
const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organizationName: "",
    timezone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    surveyUpdates: true,
    weeklyReports: false,
    marketingEmails: false,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "Admin User",
        email: user.email || "",
        organizationName: "Survey Platform Inc.",
        timezone: getUserTimezone(user.preferences),
      }));
    }
  }, [user]);
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };
  const validatePasswordChange = () => {
    const newErrors: Record<string, string> = {};
    if (formData.currentPassword && !formData.newPassword) {
      newErrors.newPassword = t("passwordRequired");
    }
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t("passwordMismatch");
    }
    if (formData.newPassword && formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }
    return newErrors;
  };
  const handleSave = async () => {
    const validationErrors = validatePasswordChange();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      await updateMember(user.id, {
        name: formData.name,
        preferences: {
          ...user.preferences,
          timezone: formData.timezone,
        },
      });
      await refreshUser();
      toast.success(t("settingsSaved"));
      setHasChanges(false);
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error(t("settingsFailed"));
    } finally {
      setSaving(false);
    }
  };
  const handleCancel = () => {
    if (hasChanges && !window.confirm(t("unsavedChanges"))) {
      return;
    }
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "Admin User",
        email: user.email || "",
        timezone: getUserTimezone(user.preferences),
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    }
    setHasChanges(false);
    setErrors({});
  };
  const tabs = [
    { id: "general", label: t("general"), icon: "⚙️" },
    { id: "appearance", label: t("appearance"), icon: "🎨" },
    { id: "notifications", label: t("notifications"), icon: "🔔" },
    { id: "security", label: t("security"), icon: "🔒" },
    { id: "integrations", label: t("integrations"), icon: "🔗" },
  ];
  const languageOptions = [
    { value: "de", label: "Deutsch" },
    { value: "en", label: "English" },
  ];
  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <>
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {t("profile")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("email")}
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    value={formData.email}
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Email cannot be changed
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("name")}
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
              </div>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {t("organization")}
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("organizationName")}
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange("organizationName", e.target.value)}
                  />
                </div>
                <Select
                  label={t("timezone")}
                  value={formData.timezone}
                  onChange={(value) => handleInputChange("timezone", value)}
                  options={TIMEZONES.map((tz) => ({
                    value: tz.value,
                    label: tz.label,
                  }))}
                />
              </div>
            </Card>
          </>
        );
      case "appearance":
        return (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              {t("appearance")}
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t("theme")}
                </label>
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => theme === "dark" && toggleTheme()}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      theme === "light"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <div className="text-3xl">☀️</div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("light")}
                    </span>
                  </button>
                  <button
                    onClick={() => theme === "light" && toggleTheme()}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      theme === "dark"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <div className="text-3xl">🌙</div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("dark")}
                    </span>
                  </button>
                </div>
              </div>
              <div>
                <Select
                  label={t("language")}
                  value={language}
                  onChange={(value) => setLanguage(value as "de" | "en")}
                  options={languageOptions}
                />
              </div>
            </div>
          </Card>
        );
      case "notifications":
        return (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              {t("emailNotifications")}
            </h2>
            <div className="space-y-4">
              <Toggle
                checked={formData.emailNotifications}
                onChange={(checked) => handleInputChange("emailNotifications", checked)}
                label={t("emailNotifications")}
              />
              <Toggle
                checked={formData.surveyUpdates}
                onChange={(checked) => handleInputChange("surveyUpdates", checked)}
                label={t("surveyUpdates")}
              />
              <Toggle
                checked={formData.weeklyReports}
                onChange={(checked) => handleInputChange("weeklyReports", checked)}
                label={t("weeklyReports")}
              />
              <Toggle
                checked={formData.marketingEmails}
                onChange={(checked) => handleInputChange("marketingEmails", checked)}
                label={t("marketingEmails")}
              />
            </div>
          </Card>
        );
      case "security":
        return (
          <>
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {t("changePassword")}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("currentPassword")}
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("newPassword")}
                  </label>
                  <input
                    type="password"
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
                      errors.newPassword
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange("newPassword", e.target.value)}
                  />
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.newPassword}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("confirmPassword")}
                  </label>
                  <input
                    type="password"
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
                      errors.confirmPassword
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {t("security")}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t("twoFactor")}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Add an extra layer of security to your account
                    </div>
                  </div>
                  <button className="px-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                    Enable
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t("sessions")}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Manage your active sessions
                    </div>
                  </div>
                  <button className="px-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                    View
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium text-red-600 dark:text-red-400">
                      {t("deleteAccount")}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t("deleteAccountWarning")}
                    </div>
                  </div>
                  <button className="px-4 py-2 text-sm rounded-xl border border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          </>
        );
      case "integrations":
        return (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              {t("integrations")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: "Slack", icon: "💬", connected: false },
                { name: "Zapier", icon: "⚡", connected: false },
                { name: "Google", icon: "🔍", connected: true },
                { name: "Microsoft", icon: "📊", connected: false },
                { name: "Webhook", icon: "🔗", connected: false },
                { name: "S3", icon: "☁️", connected: true },
              ].map((integration) => (
                <div
                  key={integration.name}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {integration.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {integration.connected ? t("connected") : t("notConnected")}
                      </div>
                    </div>
                  </div>
                  <button
                    className={`px-3 py-1.5 text-sm rounded-lg border ${
                      integration.connected
                        ? "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                        : "border-blue-500 bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    {integration.connected ? t("disconnect") : t("connect")}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        );
      default:
        return null;
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t("settings")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account settings and preferences
          </p>
        </div>
        <div className="flex gap-8">
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeTab === tab.id
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="text-sm">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="flex-1 space-y-6">
            {renderTabContent()}
            {hasChanges && (
              <div className="sticky bottom-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    You have unsaved changes
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
                    onClick={handleCancel}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                    disabled={saving}
                    onClick={handleSave}
                  >
                    {saving ? t("saving") : t("saveChanges")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Settings;