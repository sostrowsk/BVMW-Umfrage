import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import type { SurveyConfig, Question } from "../types";

interface PublicSurveyData {
  survey_id: string;
  title: string;
  description?: string;
  config: SurveyConfig;
  status: string;
  invitation_valid: boolean;
  member_info?: {
    name: string;
    email: string;
    organization?: string;
  };
}

const PublicSurveyPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [survey, setSurvey] = useState<PublicSurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<"welcome" | "questions" | "thankyou">("welcome");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid survey link");
      setLoading(false);
      return;
    }

    fetchSurvey();
  }, [token]);

  const fetchSurvey = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/surveys/public/${token}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to load survey");
      }
      const data = await response.json();
      setSurvey(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load survey");
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleNextQuestion = () => {
    if (survey && currentQuestionIndex < survey.config.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (survey && currentQuestionIndex === survey.config.questions.length - 1) {
      handleSubmit();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!survey || !token) return;

    setSubmitting(true);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      const response = await fetch(`http://localhost:8000/api/v1/surveys/public/${token}/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers,
          time_spent_seconds: timeSpent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to submit response");
      }

      setCurrentPage("thankyou");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const answer = answers[question.id];

    switch (question.type) {
      case "text":
        return (
          <input
            type="text"
            value={answer || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Your answer..."
          />
        );

      case "textarea":
        return (
          <textarea
            value={answer || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Your answer..."
          />
        );

      case "radio":
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={typeof option === 'string' ? option : option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={typeof option === 'string' ? option : option.value}
                  checked={answer === (typeof option === 'string' ? option : option.value)}
                  onChange={() => handleAnswerChange(question.id, typeof option === 'string' ? option : option.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>{typeof option === 'string' ? option : option.label}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-2">
            {question.options?.map((option) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              return (
                <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={optionValue}
                    checked={answer?.includes(optionValue) || false}
                    onChange={(e) => {
                      const currentAnswers = answer || [];
                      if (e.target.checked) {
                        handleAnswerChange(question.id, [...currentAnswers, optionValue]);
                      } else {
                        handleAnswerChange(question.id, currentAnswers.filter((a: string) => a !== optionValue));
                      }
                    }}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>{optionLabel}</span>
                </label>
              );
            })}
          </div>
        );

      case "select":
        return (
          <select
            value={answer || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">Select an option...</option>
            {question.options?.map((option) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              return (
                <option key={optionValue} value={optionValue}>
                  {optionLabel}
                </option>
              );
            })}
          </select>
        );

      case "scale":
        const minRating = question.validation?.min || 1;
        const maxRating = question.validation?.max || 5;
        const scaleLength = maxRating - minRating + 1;
        return (
          <div className="flex space-x-2 flex-wrap">
            {Array.from({ length: scaleLength }, (_, i) => minRating + i).map((rating) => (
              <button
                key={rating}
                onClick={() => handleAnswerChange(question.id, rating)}
                className={`w-12 h-12 rounded-lg border-2 transition-colors ${
                  answer === rating
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
        );

      case "date":
        return (
          <input
            type="date"
            value={answer || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Survey Not Available</h2>
            <p className="text-gray-600">{error || "This survey link is invalid or has expired."}</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === "welcome") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{survey.title}</h1>
          {survey.description && <p className="text-gray-600 mb-6">{survey.description}</p>}
          
          {survey.member_info && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                Welcome, <strong>{survey.member_info.name}</strong>
                {survey.member_info.organization && ` from ${survey.member_info.organization}`}
              </p>
            </div>
          )}

          {survey.config.welcomePage ? (
            <div className="mb-6">
              {survey.config.welcomePage.title && (
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  {survey.config.welcomePage.title}
                </h2>
              )}
              {survey.config.welcomePage.description ? (
                <div 
                  className="prose max-w-none text-gray-600"
                  dangerouslySetInnerHTML={{ __html: survey.config.welcomePage.description }}
                />
              ) : null}
            </div>
          ) : (
            <p className="text-gray-600 mb-6">
              Thank you for participating in this survey. Your responses will help us improve our services.
            </p>
          )}

          <button
            onClick={() => setCurrentPage("questions")}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Start Survey
          </button>
        </div>
      </div>
    );
  }

  if (currentPage === "thankyou") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h2>
            
            {survey.config.thankyouPage ? (
              <div>
                {survey.config.thankyouPage.title && (
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    {survey.config.thankyouPage.title}
                  </h3>
                )}
                {survey.config.thankyouPage.description ? (
                  <div 
                    className="prose max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ __html: survey.config.thankyouPage.description }}
                  />
                ) : null}
              </div>
            ) : (
              <p className="text-gray-600">
                Your response has been successfully submitted. We appreciate your time and feedback.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = survey.config.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / survey.config.questions.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
              <span className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {survey.config.questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-medium text-gray-900 mb-4">
              {currentQuestion.title}
              {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            {currentQuestion.description && (
              <p className="text-gray-600 mb-4">{currentQuestion.description}</p>
            )}
            {renderQuestion(currentQuestion)}
          </div>

          <div className="flex justify-between">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className={`px-6 py-2 rounded-lg transition-colors ${
                currentQuestionIndex === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Previous
            </button>

            <button
              onClick={handleNextQuestion}
              disabled={submitting || (currentQuestion.required && !answers[currentQuestion.id])}
              className={`px-6 py-2 rounded-lg transition-colors ${
                submitting || (currentQuestion.required && !answers[currentQuestion.id])
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {submitting ? "Submitting..." : currentQuestionIndex === survey.config.questions.length - 1 ? "Submit" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicSurveyPage;