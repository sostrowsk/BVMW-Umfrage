import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Clock, Users, CheckCircle, AlertCircle } from "lucide-react";
import { getSurvey, submitSurveyResponse } from "../api/surveys";
export default function SurveyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<Record<string, any>>({});
  const {
    data: survey,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["survey", id],
    queryFn: () => getSurvey(id!),
    enabled: !!id,
  });
  const submitMutation = useMutation({
    mutationFn: (data: any) => submitSurveyResponse(id!, data),
    onSuccess: () => {
      navigate("/surveys", {
        state: { message: "Survey submitted successfully!" },
      });
    },
  });
  const handleInputChange = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      answers: responses,
      completedAt: new Date().toISOString(),
    });
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (error || !survey) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load survey</span>
          </div>
        </div>
      </div>
    );
  }
  const questions = survey.config?.questions || [];
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <h1 className="text-3xl font-bold mb-2">{survey.title}</h1>
          {survey.description && (
            <p className="text-blue-100">{survey.description}</p>
          )}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Est. {survey.config?.estimatedTime || "10"} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{survey.responseCount || 0} responses</span>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {questions.map((question: any, index: number) => (
            <div
              key={question.id}
              className="border-b border-gray-200 pb-6 last:border-0"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <label className="block text-lg font-medium text-gray-900 mb-2">
                    {question.text}
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  {question.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {question.description}
                    </p>
                  )}
                  {question.type === "text" && (
                    <input
                      type="text"
                      required={question.required}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={responses[question.id] || ""}
                      onChange={(e) =>
                        handleInputChange(question.id, e.target.value)
                      }
                    />
                  )}
                  {question.type === "textarea" && (
                    <textarea
                      required={question.required}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={responses[question.id] || ""}
                      onChange={(e) =>
                        handleInputChange(question.id, e.target.value)
                      }
                    />
                  )}
                  {question.type === "select" && (
                    <select
                      required={question.required}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={responses[question.id] || ""}
                      onChange={(e) =>
                        handleInputChange(question.id, e.target.value)
                      }
                    >
                      <option value="">Select an option</option>
                      {question.options?.map((option: any) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {question.type === "radio" && (
                    <div className="space-y-2">
                      {question.options?.map((option: any) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={option.value}
                            required={question.required}
                            className="w-4 h-4 text-blue-600"
                            checked={responses[question.id] === option.value}
                            onChange={(e) =>
                              handleInputChange(question.id, e.target.value)
                            }
                          />
                          <span className="text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {question.type === "checkbox" && (
                    <div className="space-y-2">
                      {question.options?.map((option: any) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            value={option.value}
                            className="w-4 h-4 text-blue-600 rounded"
                            checked={
                              responses[question.id]?.includes(option.value) ||
                              false
                            }
                            onChange={(e) => {
                              const currentValues =
                                responses[question.id] || [];
                              const newValues = e.target.checked
                                ? [...currentValues, option.value]
                                : currentValues.filter(
                                    (v: string) => v !== option.value,
                                  );
                              handleInputChange(question.id, newValues);
                            }}
                          />
                          <span className="text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {question.type === "scale" && (
                    <div className="flex items-center gap-2">
                      {[...Array(question.max || 10)].map((_, i) => (
                        <button
                          key={i + 1}
                          type="button"
                          className={`w-10 h-10 rounded-lg border-2 font-medium transition-colors ${
                            responses[question.id] === i + 1
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-gray-300 hover:border-blue-400"
                          }`}
                          onClick={() => handleInputChange(question.id, i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => navigate("/surveys")}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Submit Survey
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
