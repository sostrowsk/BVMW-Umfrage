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
} from "lucide-react";
import { Survey } from "../types";
const SurveyList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
  const getStatusBadge = (status: Survey["status"]) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Umfragen</h1>
          <p className="mt-2 text-gray-600">
            Verwalten Sie Ihre Umfragen und nehmen Sie an aktiven Umfragen teil.
          </p>
        </div>
        {user?.role === "admin" && (
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => navigate("/surveys/create")}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Neue Umfrage
            </button>
          </div>
        )}
      </div>
      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Umfragen suchen..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
              >
                <option value="all">Alle Status</option>
                <option value="published">Aktiv</option>
                <option value="draft">Entwurf</option>
                <option value="closed">Geschlossen</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Fehler beim Laden der Umfragen</p>
            </div>
          ) : filteredSurveys && filteredSurveys.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredSurveys.map((survey) => (
                <div
                  key={survey.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => navigate(`/surveys/${survey.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <h3 className="text-lg font-medium text-gray-900">
                          {survey.title}
                        </h3>
                        <span
                          className={`ml-3 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(survey.status)}`}
                        >
                          {survey.status === "published"
                            ? "Aktiv"
                            : survey.status === "draft"
                              ? "Entwurf"
                              : "Geschlossen"}
                        </span>
                      </div>
                      {survey.description && (
                        <p className="mt-2 text-sm text-gray-600">
                          {survey.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        Erstellt am {formatDate(survey.created_at)}
                        {survey.published_at && (
                          <span className="ml-4">
                            Veröffentlicht am {formatDate(survey.published_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Keine Umfragen gefunden
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "Versuchen Sie es mit anderen Suchkriterien."
                  : "Es sind noch keine Umfragen vorhanden."}
              </p>
              {user?.role === "admin" &&
                !searchTerm &&
                statusFilter === "all" && (
                  <div className="mt-6">
                    <button
                      onClick={() => navigate("/surveys/create")}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Erste Umfrage erstellen
                    </button>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default SurveyList;
