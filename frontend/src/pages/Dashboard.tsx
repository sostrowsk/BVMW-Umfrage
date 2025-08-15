import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { surveysApi } from "../api/surveys";
import { useAuth } from "../features/auth/AuthContext";
import { Card, Button } from "../components/ui";
import { FilePlus2, ChevronRight, Clock, Users, BarChart3 } from "lucide-react";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: surveys, isLoading } = useQuery({
    queryKey: ["surveys"],
    queryFn: () => surveysApi.getSurveys(0, 10),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fadeIn">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Available Surveys
            </h2>
            <p className="text-gray-600 mt-1">
              Select a survey to participate or view results
            </p>
          </div>
          {user?.role === "admin" && (
            <Button
              onClick={() => navigate("/surveys/create")}
              variant="primary"
            >
              <FilePlus2 size={20} className="mr-2" />
              Create Survey
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
            <p className="text-gray-500">Loading surveys...</p>
          </div>
        ) : surveys && surveys.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map((survey) => (
              <Card
                key={survey.id}
                onClick={() => navigate(`/surveys/${survey.id}`)}
                className="animate-slideUp"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    {survey.status === "published" && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        Active
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {survey.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {survey.description || "No description available"}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{survey.config?.estimatedTime || 10} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span>{survey.responseCount || 0} responses</span>
                    </div>
                  </div>

                  <div className="text-blue-600 font-semibold flex items-center group">
                    Take Survey
                    <ChevronRight
                      size={20}
                      className="ml-1 group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Card className="p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No surveys available
              </h3>
              <p className="text-gray-600 mb-6">
                There are no surveys to display at the moment.
              </p>
              {user?.role === "admin" && (
                <Button
                  onClick={() => navigate("/surveys/create")}
                  variant="primary"
                >
                  <FilePlus2 size={20} className="mr-2" />
                  Create your first survey
                </Button>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
