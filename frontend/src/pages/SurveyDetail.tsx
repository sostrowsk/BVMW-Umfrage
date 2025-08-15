import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Clock, Users, AlertCircle, ArrowLeft } from "lucide-react";
import { getSurvey, submitSurveyResponse } from "../api/surveys";
import { Card, Button, InputField } from "../components/ui";
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
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
        <p className="mt-4 text-sm text-gray-500">Loading survey...</p>
      </div>
    );
  }
  if (error || !survey) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Error loading survey</h3>
              <p className="text-sm mt-1">Please try again later</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  const questions = survey.config?.questions || [];
  const renderQuestion = (question: any, index: number) => {
    switch (question.type) {
      case "text":
      case "textarea":
        return (
          <InputField
            id={`q${index}`}
            type={question.type === "textarea" ? "textarea" : "text"}
            rows={question.type === "textarea" ? 3 : undefined}
            required={question.required}
            value={responses[question.id] || ""}
            onChange={(e) => handleInputChange(question.id, (e.target as any).value)}
            placeholder="Enter your answer..."
          />
        );
      case "select":
        return (
          <select
            required={question.required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow cursor-pointer"
            value={responses[question.id] || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
          >
            <option value="">Select an option...</option>
            {question.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div className="flex flex-col space-y-2">
            {question.options?.map((option: any) => (
              <label
                key={option.value}
                className="cursor-pointer p-3 rounded-lg hover:bg-gray-50 flex items-center border border-gray-200 transition-all"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  required={question.required}
                  className="mr-3 text-blue-600"
                  checked={responses[question.id] === option.value}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <div className="flex flex-col space-y-2">
            {question.options?.map((option: any) => (
              <label
                key={option.value}
                className="cursor-pointer p-3 rounded-lg hover:bg-gray-50 flex items-center border border-gray-200 transition-all"
              >
                <input
                  type="checkbox"
                  value={option.value}
                  className="mr-3 text-blue-600 rounded"
                  checked={responses[question.id]?.includes(option.value) || false}
                  onChange={(e) => {
                    const currentValues = responses[question.id] || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v: string) => v !== option.value);
                    handleInputChange(question.id, newValues);
                  }}
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );
      case "scale":
        return (
          <div className="flex space-x-2">
            {[...Array(question.max || 5).keys()].map((i) => (
              <button
                key={i}
                type="button"
                className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                  responses[question.id] === i + 1
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700"
                }`}
                onClick={() => handleInputChange(question.id, i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        );
      case "boolean":
        return (
          <div className="flex space-x-4">
            <label className="cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-gray-200 flex items-center">
              <input
                type="radio"
                name={`q${index}`}
                value="true"
                className="mr-2"
                checked={responses[question.id] === true}
                onChange={() => handleInputChange(question.id, true)}
              />
              Yes
            </label>
            <label className="cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-gray-200 flex items-center">
              <input
                type="radio"
                name={`q${index}`}
                value="false"
                className="mr-2"
                checked={responses[question.id] === false}
                onChange={() => handleInputChange(question.id, false)}
              />
              No
            </label>
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-fadeIn">
      <button
        onClick={() => navigate("/surveys")}
        className="text-blue-600 hover:underline mb-6 inline-flex items-center transition-all hover:-translate-x-1"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Surveys
      </button>
      <Card className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{survey.title}</h2>
          <p className="text-gray-600 mb-6">
            {survey.description || "Please answer the following questions"}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>~{survey.config?.estimatedTime || "10"} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{survey.responseCount || 0} responses</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{questions.length} questions</span>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((question: any, index: number) => (
            <div key={question.id} className="mb-6">
              <label className="block text-gray-700 font-bold mb-3">
                {question.text}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {question.description && (
                <p className="text-sm text-gray-600 mb-3">{question.description}</p>
              )}
              {renderQuestion(question, index)}
            </div>
          ))}
          <div className="pt-6 border-t border-gray-200">
            <Button
              type="submit"
              fullWidth
              loading={submitMutation.isPending}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Response"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}