import axiosClient from "./client";
import type {
  Survey,
  SurveyCreate,
  SurveyResponse,
  SurveyResponseCreate,
  SurveyAnalytics,
} from "../types";
export const getSurveys = async (skip = 0, limit = 100): Promise<Survey[]> => {
  const response = await axiosClient.get<Survey[]>("/surveys", {
    params: { skip, limit },
  });
  return response.data;
};
export const getSurvey = async (surveyId: string): Promise<Survey> => {
  const response = await axiosClient.get<Survey>(`/surveys/${surveyId}`);
  return response.data;
};
export const createSurvey = async (data: SurveyCreate): Promise<Survey> => {
  const response = await axiosClient.post<Survey>("/surveys", data);
  return response.data;
};
export const updateSurvey = async (
  surveyId: string,
  data: Partial<SurveyCreate>,
): Promise<Survey> => {
  const response = await axiosClient.put<Survey>(`/surveys/${surveyId}`, data);
  return response.data;
};
export const submitSurveyResponse = async (
  surveyId: string,
  data: SurveyResponseCreate,
): Promise<SurveyResponse> => {
  const response = await axiosClient.post<SurveyResponse>(
    `/surveys/${surveyId}/responses`,
    data,
  );
  return response.data;
};
export const getAnalytics = async (
  surveyId: string,
): Promise<SurveyAnalytics> => {
  const response = await axiosClient.get<SurveyAnalytics>(
    `/surveys/${surveyId}/analytics`,
  );
  return response.data;
};
export const surveysApi = {
  getSurveys,
  getSurvey,
  createSurvey,
  updateSurvey,
  submitResponse: submitSurveyResponse,
  getAnalytics,
};
