import apiClient from './client'
export interface AnalyticsData {
  stats: {
    totalSurveys: number
    totalResponses: number
    averageResponseRate: number
    totalMembers: number
    totalOrganizations: number
    averageCompletionTime: number
  }
  responsesTrend: Array<{
    date: string
    responses: number
  }>
  surveyPerformance: Array<{
    id: string
    title: string
    responses: number
    completionRate: number
  }>
  organizationParticipation: Array<{
    name: string
    value: number
  }>
  recentActivity: Array<{
    type: string
    description: string
    timestamp: string
  }>
  topSurveys: Array<{
    id: string
    title: string
    responses: number
    completionRate: number
    avgTime: number
    satisfaction: number
  }>
}
export const getAnalyticsData = async (): Promise<AnalyticsData> => {
  const response = await apiClient.get('/analytics')
  return response.data
}
export const getSurveyAnalytics = async (surveyId: string): Promise<any> => {
  const response = await apiClient.get(`/analytics/surveys/${surveyId}`)
  return response.data
}
export const getOrganizationAnalytics = async (organizationId: string): Promise<any> => {
  const response = await apiClient.get(`/analytics/organizations/${organizationId}`)
  return response.data
}
export const exportAnalytics = async (params: {
  format: 'csv' | 'pdf' | 'excel'
  dateRange?: { start: string; end: string }
  type?: 'survey' | 'organization' | 'member'
}): Promise<Blob> => {
  const response = await apiClient.post('/analytics/export', params, {
    responseType: 'blob',
  })
  return response.data
}