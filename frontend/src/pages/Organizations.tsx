import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building, Search, Plus, Edit, Trash2, Users, Calendar, TrendingUp } from 'lucide-react'
import { getOrganizations, createOrganization, updateOrganization, deleteOrganization } from '../api/organizations'
import OrganizationForm from '../components/OrganizationForm'
export default function Organizations() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingOrg, setEditingOrg] = useState<any>(null)
  const queryClient = useQueryClient()
  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
  })
  const createMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setShowForm(false)
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setEditingOrg(null)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })
  const filteredOrganizations = organizations.filter((org: any) =>
    org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.sizeCategory?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }
  const getSizeCategoryColor = (category: string) => {
    switch (category) {
      case 'small': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'large': return 'bg-purple-100 text-purple-800'
      case 'enterprise': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
                <p className="text-gray-600">Manage participating organizations</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Organization
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search organizations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No organizations found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {filteredOrganizations.map((org: any) => (
              <div key={org.id} className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingOrg(org)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(org.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{org.name}</h3>
                  {org.industry && (
                    <p className="text-sm text-gray-600 mb-3">{org.industry}</p>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{org.memberCount || 0} members</span>
                    </div>
                    {org.membershipStartDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Since {new Date(org.membershipStartDate).getFullYear()}</span>
                      </div>
                    )}
                    {org.sizeCategory && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSizeCategoryColor(org.sizeCategory)}`}>
                          {org.sizeCategory}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Response Rate</span>
                      <span className="font-medium text-gray-900">
                        {org.responseRate ? `${Math.round(org.responseRate * 100)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(org.responseRate || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {(showForm || editingOrg) && (
        <OrganizationForm
          organization={editingOrg}
          onClose={() => {
            setShowForm(false)
            setEditingOrg(null)
          }}
          onSubmit={(data) => {
            if (editingOrg) {
              updateMutation.mutate({ id: editingOrg.id, data })
            } else {
              createMutation.mutate(data)
            }
          }}
        />
      )}
    </div>
  )
}