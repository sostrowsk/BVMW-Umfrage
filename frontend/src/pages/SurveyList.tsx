import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { surveysApi } from "../api/surveys";
import { useAuth } from "../features/auth/AuthContext";
import {
  FileText,
  Search,
  Filter,
  Plus,
  Calendar,
  ChevronRight,
  Users,
  Clock,
  Grid,
  List,
} from "lucide-react";
const SurveyList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const {
    data: surveys,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["surveys"],
    queryFn: () => surveysApi.getSurveys(),
  });
  const filteredSurveys = surveys?.filter((survey) => {
    const matchesSearch =
      survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || survey.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Umfragen</h1>
          <p className="mt-2 text-gray-600">
            Verwalten Sie Ihre Umfragen und nehmen Sie an aktiven Umfragen teil.
          </p>
        </div>
        {user?.role === "admin" && (
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => navigate("/surveys/create")}
              className="btn-primary"
            >
              <Plus className="mr-2 h-5 w-5" />
              Neue Umfrage
            </button>
          </div>
        )}
      </div>
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
              placeholder="Umfragen suchen..."
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field cursor-pointer"
            >
              <option value="all">Alle Status</option>
              <option value="published">Aktiv</option>
              <option value="draft">Entwurf</option>
              <option value="closed">Geschlossen</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm text-gray-500">Lade Umfragen...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 card">
          <p className="text-red-600 font-semibold">
            Fehler beim Laden der Umfragen
          </p>
          <p className="text-sm text-red-500 mt-2">
            Bitte versuchen Sie es später erneut
          </p>
        </div>
      ) : filteredSurveys && filteredSurveys.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSurveys.map((survey) => (
              <div
                key={survey.id}
                className="card p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/surveys/${survey.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      survey.status === "published"
                        ? "bg-green-100 text-green-700"
                        : survey.status === "draft"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {survey.status === "published"
                      ? "Aktiv"
                      : survey.status === "draft"
                        ? "Entwurf"
                        : "Geschlossen"}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {survey.title}
                </h3>
                {survey.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {survey.description}
                  </p>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(survey.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {Math.floor(Math.random() * 200)} Antworten
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredSurveys.map((survey) => (
                <div
                  key={survey.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-all duration-200"
                  onClick={() => navigate(`/surveys/${survey.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {survey.title}
                          </h3>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              survey.status === "published"
                                ? "bg-green-100 text-green-700"
                                : survey.status === "draft"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {survey.status === "published"
                              ? "Aktiv"
                              : survey.status === "draft"
                                ? "Entwurf"
                                : "Geschlossen"}
                          </span>
                        </div>
                        {survey.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {survey.description}
                          </p>
                        )}
                        <div className="flex items-center gap-6 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Erstellt am {formatDate(survey.created_at)}
                          </span>
                          {survey.published_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Veröffentlicht am{" "}
                              {formatDate(survey.published_at)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {Math.floor(Math.random() * 200)} Antworten
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-12 card">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">
            Keine Umfragen gefunden
          </h3>
          <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== "all"
              ? "Versuchen Sie es mit anderen Suchkriterien."
              : "Es sind noch keine Umfragen vorhanden."}
          </p>
          {user?.role === "admin" && !searchTerm && statusFilter === "all" && (
            <div className="mt-6">
              <button
                onClick={() => navigate("/surveys/create")}
                className="btn-primary"
              >
                <Plus className="mr-2 h-5 w-5" />
                Erste Umfrage erstellen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default SurveyList;
