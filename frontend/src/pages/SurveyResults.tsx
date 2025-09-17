import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  Download,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  FileText,
} from "lucide-react";
import { surveysApi } from "../api/surveys";
export default function SurveyResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    data: survey,
    isLoading: surveyLoading,
    error: surveyError,
  } = useQuery({
    queryKey: ["survey", id],
    queryFn: () => surveysApi.getSurvey(id!),
    enabled: !!id,
  });
  const {
    data: responses,
    isLoading: responsesLoading,
    error: responsesError,
  } = useQuery({
    queryKey: ["survey-responses", id],
    queryFn: () => surveysApi.getSurveyResponses(id!),
    enabled: !!id,
  });
  const {
    data: _analytics,
    isLoading: analyticsLoading,
  } = useQuery({
    queryKey: ["survey-analytics", id],
    queryFn: () => surveysApi.getAnalytics(id!),
    enabled: !!id,
  });
  const questionResults = useMemo(() => {
    if (!survey?.config?.questions || !responses) return [];
    return survey.config.questions.map((question: any) => {
      const questionResponses = responses
        .map((r) => r.answers?.[question.id])
        .filter((answer) => answer !== undefined && answer !== null);
      if (question.type === "scale") {
        const distribution = Array.from(
          { length: question.max || 5 },
          (_, i) => ({
            value: i + 1,
            count: questionResponses.filter((a) => a === i + 1).length,
          })
        );
        return {
          ...question,
          chartType: "bar",
          data: distribution,
          responseCount: questionResponses.length,
        };
      }
      if (question.type === "radio" || question.type === "select") {
        const counts: Record<string, number> = {};
        questionResponses.forEach((answer) => {
          counts[answer] = (counts[answer] || 0) + 1;
        });
        const data = Object.entries(counts).map(([value, count]) => ({
          name: question.options?.find((o: any) => o.value === value)?.label || value,
          value: count,
          percentage: Math.round((count / questionResponses.length) * 100),
        }));
        return {
          ...question,
          chartType: "pie",
          data,
          responseCount: questionResponses.length,
        };
      }
      if (question.type === "checkbox") {
        const counts: Record<string, number> = {};
        questionResponses.forEach((answers: string[]) => {
          if (Array.isArray(answers)) {
            answers.forEach((answer) => {
              counts[answer] = (counts[answer] || 0) + 1;
            });
          }
        });
        const data = Object.entries(counts).map(([value, count]) => ({
          name: question.options?.find((o: any) => o.value === value)?.label || value,
          value: count,
          percentage: Math.round((count / responses.length) * 100),
        }));
        return {
          ...question,
          chartType: "bar",
          data,
          responseCount: questionResponses.length,
        };
      }
      if (question.type === "boolean") {
        const yesCount = questionResponses.filter((a) => a === true).length;
        const noCount = questionResponses.filter((a) => a === false).length;
        return {
          ...question,
          chartType: "pie",
          data: [
            { name: "Ja", value: yesCount, percentage: Math.round((yesCount / questionResponses.length) * 100) },
            { name: "Nein", value: noCount, percentage: Math.round((noCount / questionResponses.length) * 100) },
          ],
          responseCount: questionResponses.length,
        };
      }
      if (question.type === "text" || question.type === "textarea") {
        return {
          ...question,
          chartType: "text",
          data: questionResponses.slice(0, 10),
          responseCount: questionResponses.length,
        };
      }
      return {
        ...question,
        chartType: "none",
        data: [],
        responseCount: questionResponses.length,
      };
    });
  }, [survey, responses]);
  const exportToCSV = () => {
    if (!responses || !survey) return;
    const headers = ["Response ID", "Member ID", "Organization ID", "Submitted At"];
    const questions = survey.config?.questions || [];
    questions.forEach((q: any) => {
      headers.push(q.text);
    });
    const rows = responses.map((response) => {
      const row = [
        response.id,
        response.member_id || "",
        response.organization_id || "",
        response.created_at ? new Date(response.created_at).toLocaleString() : "",
      ];
      questions.forEach((q: any) => {
        const answer = response.answers?.[q.id];
        if (Array.isArray(answer)) {
          row.push(answer.join(", "));
        } else if (answer !== undefined && answer !== null) {
          row.push(String(answer));
        } else {
          row.push("");
        }
      });
      return row;
    });
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `survey-results-${survey.title.replace(/\s+/g, "-")}.csv`;
    link.click();
  };
  const isLoading = surveyLoading || responsesLoading || analyticsLoading;
  const error = surveyError || responsesError;
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
        <p className="mt-4 text-sm text-gray-500">Lade Umfrageergebnisse...</p>
      </div>
    );
  }
  if (error || !survey) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="card p-6">
          <div className="text-center">
            <p className="text-red-600 font-semibold">
              Fehler beim Laden der Umfrageergebnisse
            </p>
            <button
              onClick={() => navigate("/surveys")}
              className="mt-4 text-blue-600 hover:underline"
            >
              Zurück zu Umfragen
            </button>
          </div>
        </div>
      </div>
    );
  }
  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"];
  const stats = [
    {
      title: "Gesamtantworten",
      value: responses?.length || 0,
      icon: Users,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Abschlussrate",
      value: `${Math.round(((responses?.length || 0) / (survey.max_responses || 100)) * 100)}%`,
      icon: CheckCircle,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Durchschn. Zeit",
      value: "~10 min",
      icon: Clock,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Status",
      value: survey.status === "active" ? "Aktiv" : survey.status === "planned" ? "Geplant" : "Geschlossen",
      icon: TrendingUp,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ];
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <button
        onClick={() => navigate("/surveys")}
        className="text-blue-600 hover:underline mb-6 inline-flex items-center transition-all hover:-translate-x-1"
      >
        <ArrowLeft size={16} className="mr-2" />
        Zurück zu Umfragen
      </button>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-800">{survey.title} - Ergebnisse</h1>
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center gap-2"
            disabled={!responses || responses.length === 0}
          >
            <Download className="h-4 w-4" />
            CSV Export
          </button>
        </div>
        {survey.description && (
          <p className="text-gray-600 mt-2">{survey.description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </div>
          );
        })}
      </div>
      {responses && responses.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Noch keine Antworten
          </h3>
          <p className="text-gray-600">
            Diese Umfrage hat noch keine Antworten erhalten.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {questionResults.map((result: any, index: number) => (
            <div key={index} className="card p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {index + 1}. {result.text}
                </h3>
                <p className="text-sm text-gray-600">
                  {result.responseCount} Antworten • Typ: {result.type}
                </p>
              </div>
              {result.chartType === "bar" && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={result.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey={result.type === "scale" ? "value" : "name"} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey={result.type === "scale" ? "count" : "value"} fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {result.chartType === "pie" && (
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300} style={{ maxWidth: "400px" }}>
                    <PieChart>
                      <Pie
                        data={result.data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {result.data.map((_entry: any, idx: number) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              {result.chartType === "text" && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.data.length > 0 ? (
                    result.data.map((answer: string, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{answer}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Keine Textantworten vorhanden</p>
                  )}
                  {result.responseCount > 10 && (
                    <p className="text-sm text-gray-500 italic">
                      Zeige erste 10 von {result.responseCount} Antworten
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}