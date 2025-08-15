import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  Copy,
} from "lucide-react";
import { getSurvey, createSurvey, updateSurvey } from "../api/surveys";
interface Question {
  id: string;
  type: "text" | "textarea" | "select" | "radio" | "checkbox" | "scale";
  text: string;
  description?: string;
  required: boolean;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
}
export default function SurveyEditor() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [surveyData, setSurveyData] = useState({
    title: "",
    description: "",
    status: "draft",
    config: {
      estimatedTime: 10,
      allowAnonymous: false,
      requiresAuth: true,
      questions: [] as Question[],
    },
  });
  const { data: existingSurvey } = useQuery({
    queryKey: ["survey", id],
    queryFn: () => getSurvey(id!),
    enabled: isEditing,
  });
  useEffect(() => {
    if (existingSurvey) {
      setSurveyData(existingSurvey);
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
    onSuccess: () => {
      navigate("/surveys");
    },
  });
  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      type: "text",
      text: "",
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
      text: `${question.text} (Copy)`,
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
    if (isEditing) {
      updateMutation.mutate(surveyData);
    } else {
      createMutation.mutate(surveyData);
    }
  };
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? "Edit Survey" : "Create New Survey"}
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/surveys")}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isEditing ? "Update" : "Create"} Survey
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Survey Title
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={surveyData.title}
                onChange={(e) =>
                  setSurveyData({ ...surveyData, title: e.target.value })
                }
                placeholder="Enter survey title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={surveyData.description}
                onChange={(e) =>
                  setSurveyData({ ...surveyData, description: e.target.value })
                }
                placeholder="Describe the purpose of this survey"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={surveyData.status}
                  onChange={(e) =>
                    setSurveyData({ ...surveyData, status: e.target.value })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex items-center gap-4 pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded"
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
                  <span className="text-sm text-gray-700">Allow Anonymous</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded"
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
                  <span className="text-sm text-gray-700">Requires Auth</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
            <button
              onClick={addQuestion}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Question
            </button>
          </div>
          <div className="space-y-4">
            {surveyData.config.questions.map((question, index) => (
              <div
                key={question.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 pt-2">
                    <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={question.text}
                        onChange={(e) =>
                          updateQuestion(index, { text: e.target.value })
                        }
                        placeholder="Enter question text"
                      />
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={question.type}
                        onChange={(e) =>
                          updateQuestion(index, {
                            type: e.target.value as Question["type"],
                          })
                        }
                      >
                        <option value="text">Short Text</option>
                        <option value="textarea">Long Text</option>
                        <option value="select">Dropdown</option>
                        <option value="radio">Radio Buttons</option>
                        <option value="checkbox">Checkboxes</option>
                        <option value="scale">Scale</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={question.description || ""}
                      onChange={(e) =>
                        updateQuestion(index, { description: e.target.value })
                      }
                      placeholder="Optional description or help text"
                    />
                    {(question.type === "select" ||
                      question.type === "radio" ||
                      question.type === "checkbox") && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Options
                        </label>
                        {question.options?.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="text"
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              value={option.label}
                              onChange={(e) => {
                                const newOptions = [
                                  ...(question.options || []),
                                ];
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
                              className="text-red-600 hover:text-red-800"
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
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          + Add Option
                        </button>
                      </div>
                    )}
                    {question.type === "scale" && (
                      <div className="flex items-center gap-4">
                        <div>
                          <label className="text-sm text-gray-700">Min</label>
                          <input
                            type="number"
                            className="w-20 px-2 py-1 border border-gray-300 rounded"
                            value={question.min || 1}
                            onChange={(e) =>
                              updateQuestion(index, {
                                min: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-700">Max</label>
                          <input
                            type="number"
                            className="w-20 px-2 py-1 border border-gray-300 rounded"
                            value={question.max || 10}
                            onChange={(e) =>
                              updateQuestion(index, {
                                max: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 rounded"
                          checked={question.required}
                          onChange={(e) =>
                            updateQuestion(index, {
                              required: e.target.checked,
                            })
                          }
                        />
                        <span className="text-sm text-gray-700">Required</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => duplicateQuestion(index)}
                          className="text-gray-600 hover:text-blue-600"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteQuestion(index)}
                          className="text-gray-600 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {surveyData.config.questions.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No questions added yet</p>
                <button
                  onClick={addQuestion}
                  className="mt-3 text-blue-600 hover:text-blue-800"
                >
                  Add your first question
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
