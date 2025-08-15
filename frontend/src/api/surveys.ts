import axiosClient from './client'
import { Survey, SurveyCreate, SurveyResponse, SurveyResponseCreate, SurveyAnalytics } from '../types'
export const surveysApi = {
  getSurveys: async (skip = 0, limit = 100): Promise<Survey[]> => {
    const response = await axiosClient.get<Survey[]>('/surveys', {
      params: { skip, limit },
    })
    return response.data
  },
  getSurvey: async (surveyId: string): Promise<Survey> => {
    const response = await axiosClient.get<Survey>(`/surveys/${surveyId}`)
    return response.data
  },
  createSurvey: async (data: SurveyCreate): Promise<Survey> => {
    const response = await axiosClient.post<Survey>('/surveys', data)
    return response.data
  },
  submitResponse: async (surveyId: string, data: SurveyResponseCreate): Promise<SurveyResponse> => {
    const response = await axiosClient.post<SurveyResponse>(`/surveys/${surveyId}/responses`, data)
    return response.data
  },
  getAnalytics: async (surveyId: string): Promise<SurveyAnalytics> => {
    const response = await axiosClient.get<SurveyAnalytics>(`/surveys/${surveyId}/analytics`)
    return response.data
  },
}