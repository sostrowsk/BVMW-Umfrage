import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  GripVertical,
  Copy,
  Sparkles,
  FileText,
  ArrowLeft,
  HelpCircle,
  Clock,
  Home,
  Heart,
  Calendar,
  Users,
  ToggleLeft,
  Eye,
  Edit3,
  Settings,
  FileCheck,
  Mail,
  Loader2,
} from "lucide-react";
import { getSurvey, createSurvey, updateSurvey, getSurveyAnalytics } from "../api/surveys";
import SimpleRichTextEditor from "../components/SimpleRichTextEditor";
import SurveyInvitations from "../components/SurveyInvitations";
import { useAuth } from "../features/auth/AuthContext";
import { formatDateForInput as formatDateForInputTz, convertLocalToUTC, getUserTimezone } from "../utils/dateUtils";

interface Question {
  id: string;
  type: "text" | "textarea" | "select" | "radio" | "checkbox" | "scale" | "date";
  title: string;
  description?: string;
  required: boolean;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  validation?: {
    min?: number;
    max?: number;
  };
}

export default function SurveyEditor() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  const [activeTab, setActiveTab] = useState<"basics" | "control" | "pages" | "questions" | "invitations">("basics");
  const [previewMode, setPreviewMode] = useState<"welcome" | "thankyou" | null>(null);
  const userTimezone = getUserTimezone(user?.preferences);

  const [surveyData, setSurveyData] = useState({
    title: "",
    description: "",
    status: "planned",
    start_date: "",
    end_date: "",
    max_responses: null as number | null,
    config: {
      estimatedTime: 10,
      allowAnonymous: false,
      requiresAuth: true,
      welcomePage: {
        title: "Willkommen zur Umfrage",
        description: "Vielen Dank für Ihre Teilnahme. Diese Umfrage wird uns helfen, unsere Services zu verbessern.",
      },
      thankyouPage: {
        title: "Vielen Dank!",
        description: "Ihre Antworten wurden erfolgreich gespeichert. Wir schätzen Ihre Zeit und Ihr Feedback.",
      },
      questions: [] as Question[],
    },
  });

  const queryClient = useQueryClient();
  
  const { data: existingSurvey } = useQuery({
    queryKey: ["survey", id],
    queryFn: () => getSurvey(id!),
    enabled: isEditing,
  });
  
  const { data: analytics } = useQuery({
    queryKey: ["survey-analytics", id],
    queryFn: () => getSurveyAnalytics(id!),
    enabled: isEditing,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (existingSurvey) {
      setSurveyData({
        title: existingSurvey.title,
        description: existingSurvey.description || "",
        status: existingSurvey.status,
        start_date: formatDateForInputTz(existingSurvey.start_date, userTimezone),
        end_date: formatDateForInputTz(existingSurvey.end_date, userTimezone),
        max_responses: existingSurvey.max_responses || null,
        config: {
          estimatedTime: existingSurvey.config?.estimatedTime || 10,
          allowAnonymous: existingSurvey.config?.settings?.allowAnonymous ?? existingSurvey.config?.allowAnonymous ?? false,
          requiresAuth: existingSurvey.config?.requiresAuth ?? true,
          welcomePage: existingSurvey.config?.welcomePage || {
            title: "Willkommen zur Umfrage",
            description: "Vielen Dank für Ihre Teilnahme. Diese Umfrage wird uns helfen, unsere Services zu verbessern.",
          },
          thankyouPage: existingSurvey.config?.thankyouPage || {
            title: "Vielen Dank!",
            description: "Ihre Antworten wurden erfolgreich gespeichert. Wir schätzen Ihre Zeit und Ihr Feedback.",
          },
          questions: (existingSurvey.config?.questions || []).map(q => ({
            ...q,
            required: q.required ?? false
          })),
        },
      });
    }
  }, [existingSurvey]);

  const createMutation = useMutation({
    mutationFn: createSurvey,
    onSuccess: (data) => {
      navigate(`/surveys/${data.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateSurvey(id!, data),
    onSuccess: (updatedSurvey) => {
      queryClient.invalidateQueries({ queryKey: ["survey", id] });
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      setSurveyData({
        title: updatedSurvey.title || "",
        description: updatedSurvey.description || "",
        status: updatedSurvey.status || "planned",
        start_date: updatedSurvey.start_date || "",
        end_date: updatedSurvey.end_date || "",
        max_responses: updatedSurvey.max_responses || null,
        config: {
          estimatedTime: updatedSurvey.config?.estimatedTime || 10,
          allowAnonymous: updatedSurvey.config?.allowAnonymous ?? false,
          requiresAuth: updatedSurvey.config?.requiresAuth ?? true,
          welcomePage: updatedSurvey.config?.welcomePage || {
            title: "Willkommen zur Umfrage",
            description: "Vielen Dank für Ihre Teilnahme. Diese Umfrage wird uns helfen, unsere Services zu verbessern.",
          },
          thankyouPage: updatedSurvey.config?.thankyouPage || {
            title: "Vielen Dank!",
            description: "Ihre Antworten wurden erfolgreich gespeichert. Wir schätzen Ihre Zeit und Ihr Feedback.",
          },
          questions: updatedSurvey.config?.questions || [],
        },
      });
    },
  });

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      type: "text",
      title: "",
      required: false,
      options: [],
    };
    setSurveyData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        questions: [...prev.config.questions, newQuestion],
      },
    }));
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setSurveyData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        questions: prev.config.questions.map((q, i) =>
          i === index ? { ...q, ...updates } : q,
        ),
      },
    }));
  };

  const deleteQuestion = (index: number) => {
    setSurveyData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        questions: prev.config.questions.filter((_, i) => i !== index),
      },
    }));
  };

  const duplicateQuestion = (index: number) => {
    const question = surveyData.config.questions[index];
    const duplicated = {
      ...question,
      id: `q_${Date.now()}`,
      title: `${question.title} (Copy)`,
    };
    setSurveyData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        questions: [
          ...prev.config.questions.slice(0, index + 1),
          duplicated,
          ...prev.config.questions.slice(index + 1),
        ],
      },
    }));
  };

  const handleSubmit = () => {
    const dataToSubmit = {
      title: surveyData.title,
      description: surveyData.description,
      status: surveyData.status,
      start_date: surveyData.start_date ? convertLocalToUTC(surveyData.start_date, userTimezone) : undefined,
      end_date: surveyData.end_date ? convertLocalToUTC(surveyData.end_date, userTimezone) : undefined,
      max_responses: surveyData.max_responses || undefined,
      config: {
        questions: surveyData.config.questions.map(q => {
          if (q.type === 'scale' && (q.min !== undefined || q.max !== undefined)) {
            const { min, max, ...rest } = q;
            return {
              ...rest,
              validation: {
                min: min || 1,
                max: max || 10
              }
            };
          }
          return q;
        }),
        estimatedTime: surveyData.config.estimatedTime,
        welcomePage: surveyData.config.welcomePage,
        thankyouPage: surveyData.config.thankyouPage,
        settings: {
          allowAnonymous: surveyData.config.allowAnonymous,
          multipleSubmissions: false,
          showProgressBar: true,
        },
      },
    };

    if (isEditing) {
      updateMutation.mutate(dataToSubmit);
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const tabs = [
    { id: "basics", label: "Grundlagen", icon: FileText },
    { id: "control", label: "Steuerung", icon: Settings },
    { id: "pages", label: "Seiten", icon: FileCheck },
    { id: "questions", label: "Fragen", icon: HelpCircle, badge: surveyData.config.questions.length > 0 ? surveyData.config.questions.length : undefined },
    ...(isEditing ? [{ id: "invitations", label: "Einladungen", icon: Mail }] : []),
  ];

  return (
    <div className="px-4 sm:px-0 animate-fadeIn">
      <div className="mb-8">
        <button
          onClick={() => navigate("/surveys")}
          className="group mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Zurück zu Umfragen
        </button>
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
              {isEditing ? "Bearbeiten" : "Erstellen"}
            </span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {isEditing ? "Umfrage bearbeiten" : "Neue Umfrage erstellen"}
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            {isEditing
              ? "Bearbeiten Sie die Details und Fragen Ihrer Umfrage."
              : "Erstellen Sie eine neue Umfrage mit benutzerdefinierten Fragen."}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <nav className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200
                  ${activeTab === tab.id 
                    ? 'bg-white text-blue-600 shadow-md' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-600 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="card-modern p-8">
        {activeTab === "basics" && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Grundlegende Informationen
                </h2>
                <p className="text-sm text-gray-600">
                  Titel, Beschreibung und Einstellungen Ihrer Umfrage
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Umfragetitel
                </label>
                <input
                  type="text"
                  required
                  className="input-modern"
                  value={surveyData.title}
                  onChange={(e) =>
                    setSurveyData({ ...surveyData, title: e.target.value })
                  }
                  placeholder="Geben Sie einen aussagekräftigen Titel ein"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Beschreibung
                </label>
                <textarea
                  rows={3}
                  className="input-modern resize-none"
                  value={surveyData.description}
                  onChange={(e) =>
                    setSurveyData({ ...surveyData, description: e.target.value })
                  }
                  placeholder="Beschreiben Sie den Zweck und die Ziele dieser Umfrage"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Geschätzte Zeit (Minuten)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      className="input-modern pl-10"
                      value={surveyData.config.estimatedTime}
                      onChange={(e) =>
                        setSurveyData({
                          ...surveyData,
                          config: {
                            ...surveyData.config,
                            estimatedTime: parseInt(e.target.value),
                          },
                        })
                      }
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    className="input-modern cursor-pointer"
                    value={surveyData.status}
                    onChange={(e) =>
                      setSurveyData({ ...surveyData, status: e.target.value })
                    }
                  >
                    <option value="planned">Geplant</option>
                    <option value="active">Aktiv</option>
                    <option value="closed">Geschlossen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Einstellungen
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-all"
                        checked={surveyData.config.allowAnonymous}
                        onChange={(e) =>
                          setSurveyData({
                            ...surveyData,
                            config: {
                              ...surveyData.config,
                              allowAnonymous: e.target.checked,
                            },
                          })
                        }
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                        Anonyme Teilnahme erlauben
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-all"
                        checked={surveyData.config.requiresAuth}
                        onChange={(e) =>
                          setSurveyData({
                            ...surveyData,
                            config: {
                              ...surveyData.config,
                              requiresAuth: e.target.checked,
                            },
                          })
                        }
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                        Authentifizierung erforderlich
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={updateMutation.isPending || createMutation.isPending}
                className="btn-primary"
              >
                {(updateMutation.isPending || createMutation.isPending) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  isEditing ? "Aktualisieren" : "Umfrage erstellen"
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === "control" && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl">
                <ToggleLeft className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Status-Steuerung
                </h2>
                <p className="text-sm text-gray-600">
                  Automatische und manuelle Kontrolle des Umfragestatus
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Automatische Aktivierung nach Datum
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Startdatum (automatisch aktivieren)
                    </label>
                    <input
                      type="datetime-local"
                      className="input-modern"
                      value={surveyData.start_date}
                      onChange={(e) =>
                        setSurveyData({ ...surveyData, start_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Enddatum (automatisch schließen)
                    </label>
                    <input
                      type="datetime-local"
                      className="input-modern"
                      value={surveyData.end_date}
                      onChange={(e) =>
                        setSurveyData({ ...surveyData, end_date: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Automatisches Schließen nach Antworten
                </h3>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Maximale Anzahl Antworten
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input-modern"
                    value={surveyData.max_responses || ""}
                    onChange={(e) =>
                      setSurveyData({ 
                        ...surveyData, 
                        max_responses: e.target.value ? parseInt(e.target.value) : null 
                      })
                    }
                    placeholder="Leer lassen für unbegrenzte Antworten"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Die Umfrage wird automatisch geschlossen, wenn diese Anzahl erreicht wird.
                  </p>
                  {analytics && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm font-medium text-purple-700">
                        Aktuelle Antworten: {analytics.response_count}
                        {surveyData.max_responses && ` / ${surveyData.max_responses}`}
                      </span>
                      {surveyData.max_responses && (
                        <div className="flex-1 max-w-xs">
                          <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 transition-all duration-300"
                              style={{ 
                                width: `${Math.min(100, (analytics.response_count / surveyData.max_responses) * 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Hinweis:</strong> Manuelle Statusänderungen überschreiben automatische Einstellungen. 
                  Die Umfrage wird automatisch aktiviert/geschlossen basierend auf den konfigurierten Bedingungen.
                </p>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={updateMutation.isPending || createMutation.isPending}
                className="btn-primary"
              >
                {(updateMutation.isPending || createMutation.isPending) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  isEditing ? "Aktualisieren" : "Umfrage erstellen"
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === "pages" && (
          <div className="animate-fadeIn space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                  <Home className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Willkommensseite
                  </h2>
                  <p className="text-sm text-gray-600">
                    Die erste Seite, die Teilnehmer sehen
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Titel der Willkommensseite
                  </label>
                  <input
                    type="text"
                    className="input-modern"
                    value={surveyData.config.welcomePage.title}
                    onChange={(e) =>
                      setSurveyData({
                        ...surveyData,
                        config: {
                          ...surveyData.config,
                          welcomePage: {
                            ...surveyData.config.welcomePage,
                            title: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="z.B. Willkommen zur Mitarbeiterbefragung 2024"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Beschreibung
                    </label>
                    <button
                      type="button"
                      onClick={() => setPreviewMode(previewMode === "welcome" ? null : "welcome")}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {previewMode === "welcome" ? (
                        <><Edit3 className="h-3 w-3" /> Bearbeiten</>
                      ) : (
                        <><Eye className="h-3 w-3" /> Vorschau</>
                      )}
                    </button>
                  </div>
                  {previewMode === "welcome" ? (
                    <div className="p-4 bg-white border border-gray-200 rounded-lg min-h-[150px]">
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: surveyData.config.welcomePage.description }}
                      />
                    </div>
                  ) : (
                    <SimpleRichTextEditor
                      value={surveyData.config.welcomePage.description}
                      onChange={(value) =>
                        setSurveyData({
                          ...surveyData,
                          config: {
                            ...surveyData.config,
                            welcomePage: {
                              ...surveyData.config.welcomePage,
                              description: value,
                            },
                          },
                        })
                      }
                      placeholder="Erklären Sie den Zweck der Umfrage und wie lange sie dauert..."
                    />
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl">
                  <Heart className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Dankeseite
                  </h2>
                  <p className="text-sm text-gray-600">
                    Die letzte Seite nach Abschluss der Umfrage
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Titel der Dankeseite
                  </label>
                  <input
                    type="text"
                    className="input-modern"
                    value={surveyData.config.thankyouPage.title}
                    onChange={(e) =>
                      setSurveyData({
                        ...surveyData,
                        config: {
                          ...surveyData.config,
                          thankyouPage: {
                            ...surveyData.config.thankyouPage,
                            title: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="z.B. Vielen Dank für Ihre Teilnahme!"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Beschreibung
                    </label>
                    <button
                      type="button"
                      onClick={() => setPreviewMode(previewMode === "thankyou" ? null : "thankyou")}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {previewMode === "thankyou" ? (
                        <><Edit3 className="h-3 w-3" /> Bearbeiten</>
                      ) : (
                        <><Eye className="h-3 w-3" /> Vorschau</>
                      )}
                    </button>
                  </div>
                  {previewMode === "thankyou" ? (
                    <div className="p-4 bg-white border border-gray-200 rounded-lg min-h-[150px]">
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: surveyData.config.thankyouPage.description }}
                      />
                    </div>
                  ) : (
                    <SimpleRichTextEditor
                      value={surveyData.config.thankyouPage.description}
                      onChange={(value) =>
                        setSurveyData({
                          ...surveyData,
                          config: {
                            ...surveyData.config,
                            thankyouPage: {
                              ...surveyData.config.thankyouPage,
                              description: value,
                            },
                          },
                        })
                      }
                      placeholder="Bedanken Sie sich und informieren Sie über nächste Schritte..."
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={updateMutation.isPending || createMutation.isPending}
                className="btn-primary"
              >
                {(updateMutation.isPending || createMutation.isPending) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  isEditing ? "Aktualisieren" : "Umfrage erstellen"
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === "questions" && (
          <div className="animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                  <HelpCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Fragen</h2>
                  <p className="text-sm text-gray-600">
                    Fügen Sie Fragen zu Ihrer Umfrage hinzu
                  </p>
                </div>
              </div>
              <button onClick={addQuestion} className="btn-primary">
                <Plus className="h-4 w-4" />
                Frage hinzufügen
              </button>
            </div>
            <div className="space-y-4">
              {surveyData.config.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="glass-morphism rounded-xl p-6 border border-gray-100 hover:border-blue-200 transition-all duration-300 animate-slideUp"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 pt-2 cursor-move hover:text-blue-600 transition-colors">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          className="flex-1 input-modern"
                          value={question.title}
                          onChange={(e) =>
                            updateQuestion(index, { title: e.target.value })
                          }
                          placeholder="Fragentext eingeben"
                        />
                        <select
                          className="input-modern w-auto cursor-pointer"
                          value={question.type}
                          onChange={(e) =>
                            updateQuestion(index, {
                              type: e.target.value as Question["type"],
                            })
                          }
                        >
                          <option value="text">Kurzer Text</option>
                          <option value="textarea">Langer Text</option>
                          <option value="select">Dropdown</option>
                          <option value="radio">Radio-Buttons</option>
                          <option value="checkbox">Checkboxen</option>
                          <option value="scale">Skala</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        className="w-full input-modern"
                        value={question.description || ""}
                        onChange={(e) =>
                          updateQuestion(index, { description: e.target.value })
                        }
                        placeholder="Optionale Beschreibung oder Hilfetext"
                      />
                      {(question.type === "select" ||
                        question.type === "radio" ||
                        question.type === "checkbox") && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                          <label className="text-sm font-semibold text-gray-700">
                            Optionen
                          </label>
                          {question.options?.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className="flex items-center gap-2 group"
                            >
                              <input
                                type="text"
                                className="flex-1 input-modern py-2"
                                value={option.label}
                                onChange={(e) => {
                                  const newOptions = [...(question.options || [])];
                                  newOptions[optIndex] = {
                                    ...option,
                                    label: e.target.value,
                                    value: e.target.value,
                                  };
                                  updateQuestion(index, { options: newOptions });
                                }}
                                placeholder={`Option ${optIndex + 1}`}
                              />
                              <button
                                onClick={() => {
                                  const newOptions = question.options?.filter(
                                    (_, i) => i !== optIndex,
                                  );
                                  updateQuestion(index, { options: newOptions });
                                }}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newOptions = [
                                ...(question.options || []),
                                { value: "", label: "" },
                              ];
                              updateQuestion(index, { options: newOptions });
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                          >
                            + Option hinzufügen
                          </button>
                        </div>
                      )}
                      {question.type === "scale" && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Skalenbereich
                          </label>
                          <div className="flex items-center gap-4">
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">
                                Minimum
                              </label>
                              <input
                                type="number"
                                className="w-20 input-field py-1.5 text-sm"
                                value={question.min || 1}
                                onChange={(e) =>
                                  updateQuestion(index, {
                                    min: parseInt(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <span className="text-gray-400">bis</span>
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">
                                Maximum
                              </label>
                              <input
                                type="number"
                                className="w-20 input-field py-1.5 text-sm"
                                value={question.max || 10}
                                onChange={(e) =>
                                  updateQuestion(index, {
                                    max: parseInt(e.target.value),
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-all"
                            checked={question.required}
                            onChange={(e) =>
                              updateQuestion(index, {
                                required: e.target.checked,
                              })
                            }
                          />
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                            Pflichtfeld
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => duplicateQuestion(index)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Frage duplizieren"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteQuestion(index)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Frage löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {surveyData.config.questions.length > 0 && (
                <div className="flex justify-end">
                  <button onClick={addQuestion} className="btn-primary">
                    <Plus className="h-4 w-4" />
                    Frage hinzufügen
                  </button>
                </div>
              )}
              {surveyData.config.questions.length === 0 && (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mb-4">
                    <HelpCircle className="h-8 w-8 text-gray-500" />
                  </div>
                  <p className="text-gray-600 font-medium mb-4">
                    Noch keine Fragen hinzugefügt
                  </p>
                  <button onClick={addQuestion} className="btn-primary">
                    <Plus className="h-4 w-4" />
                    Erste Frage hinzufügen
                  </button>
                </div>
              )}
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={updateMutation.isPending || createMutation.isPending}
                className="btn-primary"
              >
                {(updateMutation.isPending || createMutation.isPending) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  isEditing ? "Aktualisieren" : "Umfrage erstellen"
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === "invitations" && isEditing && existingSurvey && (
          <div className="animate-fadeIn">
            <SurveyInvitations survey={existingSurvey} />
          </div>
        )}
      </div>
    </div>
  );
}