import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { surveysApi } from '../api/surveys'
import { useAuth } from '../features/auth/AuthContext'
import { FileText, Users, BarChart, Clock, ArrowRight, Plus } from 'lucide-react'
const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: surveys, isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: () => surveysApi.getSurveys(0, 5),
  })
  const stats = {
    totalSurveys: surveys?.length || 0,
    activeSurveys: surveys?.filter(s => s.status === 'published').length || 0,
    draftSurveys: surveys?.filter(s => s.status === 'draft').length || 0,
    closedSurveys: surveys?.filter(s => s.status === 'closed').length || 0,
  }
  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Willkommen zurück, {user?.name || user?.email}
        </h1>
        <p className="mt-2 text-gray-600">
          Hier ist Ihre Übersicht über die neuesten Umfragen und Aktivitäten.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Gesamt Umfragen</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalSurveys}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Aktive Umfragen</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeSurveys}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Entwürfe</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.draftSurveys}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Abgeschlossen</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.closedSurveys}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Neueste Umfragen</h2>
            <button
              onClick={() => navigate('/surveys')}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center"
            >
              Alle anzeigen
              <ArrowRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : surveys && surveys.length > 0 ? (
            <div className="space-y-4">
              {surveys.slice(0, 5).map((survey) => (
                <div
                  key={survey.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                  onClick={() => navigate(`/surveys/${survey.id}`)}
                >
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{survey.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {survey.description || 'Keine Beschreibung verfügbar'}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      survey.status === 'published' 
                        ? 'bg-green-100 text-green-800'
                        : survey.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {survey.status === 'published' ? 'Aktiv' : 
                       survey.status === 'draft' ? 'Entwurf' : 'Geschlossen'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Umfragen</h3>
              <p className="mt-1 text-sm text-gray-500">
                Es sind noch keine Umfragen vorhanden.
              </p>
              {user?.role === 'admin' && (
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/surveys/create')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Neue Umfrage erstellen
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default Dashboard