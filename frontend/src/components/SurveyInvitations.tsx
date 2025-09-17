import React, { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import type { Survey } from "../types";
import { useAuth } from "../features/auth/AuthContext";
import { formatDateForDisplay, getUserTimezone } from "../utils/dateUtils";

interface SurveyInvitation {
  id: string;
  survey_id: string;
  token: string;
  member_id?: string;
  email?: string;
  expires_at?: string;
  max_uses: number;
  use_count: number;
  used_at?: string;
  created_at: string;
  invitation_url?: string;
  invitation_metadata?: any;
}

interface SurveyInvitationsProps {
  survey: Survey;
  members?: Array<{ id: string; name: string; email: string }>;
}

const SurveyInvitations: React.FC<SurveyInvitationsProps> = ({ survey, members = [] }) => {
  const { user } = useAuth();
  const userTimezone = getUserTimezone(user?.preferences);
  const [invitations, setInvitations] = useState<SurveyInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"anonymous" | "personalized" | "list">("anonymous");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const [anonymousConfig, setAnonymousConfig] = useState({
    expiresInDays: 30,
    maxUses: 1000,
  });

  const [personalizedConfig, setPersonalizedConfig] = useState({
    selectedMembers: [] as string[],
    emails: "",
    expiresInDays: 30,
    maxUses: 1,
  });

  useEffect(() => {
    // Fetch invitations on mount to get the count
    if (survey?.id) {
      fetchInvitations();
    }
  }, [survey?.id]);
  
  useEffect(() => {
    // Refresh when switching to list tab
    if (activeTab === "list" && survey?.id) {
      fetchInvitations();
    }
  }, [activeTab, survey?.id]);

  const fetchInvitations = async () => {
    setLoading(true);
    if (!initialLoad) {
      setError("");
    }
    try {
      const response = await apiClient.get(`/surveys/${survey.id}/invitations`);
      setInvitations(response.data);
      setInitialLoad(false);
      setError("");
    } catch (err: any) {
      console.error("Failed to load invitations:", err);
      // Only show error if not initial load or if it's a real error
      if (!initialLoad || err.response?.status !== 404) {
        setError(err.response?.data?.detail || "Failed to load invitations");
      }
      setInitialLoad(false);
    } finally {
      setLoading(false);
    }
  };

  const createAnonymousLink = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.post(`/surveys/${survey.id}/anonymous-link`, {
        expires_in_days: anonymousConfig.expiresInDays,
        max_uses: anonymousConfig.maxUses,
      });
      
      const newInvitation = response.data;
      setInvitations([newInvitation, ...invitations]);
      setActiveTab("list");
      
      // Auto-copy to clipboard
      if (newInvitation.invitation_url) {
        copyToClipboard(newInvitation.invitation_url);
      }
    } catch (err) {
      setError("Failed to create anonymous link");
    } finally {
      setLoading(false);
    }
  };

  const createPersonalizedInvitations = async () => {
    setLoading(true);
    setError("");
    try {
      const emailList = personalizedConfig.emails
        ? personalizedConfig.emails.split(",").map(e => e.trim()).filter(e => e)
        : [];

      if (personalizedConfig.selectedMembers.length === 0 && emailList.length === 0) {
        setError("Please select members or enter email addresses");
        setLoading(false);
        return;
      }

      const response = await apiClient.post(`/surveys/${survey.id}/batch-invitations`, {
        member_ids: personalizedConfig.selectedMembers.length > 0 ? personalizedConfig.selectedMembers : null,
        emails: emailList.length > 0 ? emailList : null,
        expires_at: new Date(Date.now() + personalizedConfig.expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
        max_uses: personalizedConfig.maxUses,
      });

      const newInvitations = response.data;
      setInvitations([...newInvitations, ...invitations]);
      setActiveTab("list");
      
      // Reset form
      setPersonalizedConfig({
        selectedMembers: [],
        emails: "",
        expiresInDays: 30,
        maxUses: 1,
      });
    } catch (err) {
      setError("Failed to create personalized invitations");
    } finally {
      setLoading(false);
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to delete this invitation?")) return;
    
    try {
      await apiClient.delete(`/invitations/${invitationId}`);
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
    } catch (err) {
      setError("Failed to delete invitation");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedUrl(text);
      setTimeout(() => setCopiedUrl(null), 3000);
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return formatDateForDisplay(dateString, userTimezone, "datetime");
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Survey Invitations</h3>

      <div className="border-b mb-4">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("anonymous")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "anonymous"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Anonymous Link
          </button>
          <button
            onClick={() => setActiveTab("personalized")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "personalized"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Personalized Invitations
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "list"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            All Invitations ({invitations.length})
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {activeTab === "anonymous" && (
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Generate a public link that can be shared with anyone. No authentication required.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expires in (days)
              </label>
              <input
                type="number"
                value={anonymousConfig.expiresInDays}
                onChange={(e) => setAnonymousConfig({ ...anonymousConfig, expiresInDays: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="365"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Uses
              </label>
              <input
                type="number"
                value={anonymousConfig.maxUses}
                onChange={(e) => setAnonymousConfig({ ...anonymousConfig, maxUses: parseInt(e.target.value) || 1000 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10000"
              />
            </div>
          </div>

          <button
            onClick={createAnonymousLink}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Generating..." : "Generate Anonymous Link"}
          </button>
        </div>
      )}

      {activeTab === "personalized" && (
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Create personalized invitations for specific members or email addresses.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Members
            </label>
            <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
              {members.length > 0 ? (
                members.map((member) => (
                  <label key={member.id} className="flex items-center space-x-2 py-1 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      value={member.id}
                      checked={personalizedConfig.selectedMembers.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPersonalizedConfig({
                            ...personalizedConfig,
                            selectedMembers: [...personalizedConfig.selectedMembers, member.id],
                          });
                        } else {
                          setPersonalizedConfig({
                            ...personalizedConfig,
                            selectedMembers: personalizedConfig.selectedMembers.filter(id => id !== member.id),
                          });
                        }
                      }}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{member.name} ({member.email})</span>
                  </label>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No members available</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Or Enter Email Addresses (comma-separated)
            </label>
            <textarea
              value={personalizedConfig.emails}
              onChange={(e) => setPersonalizedConfig({ ...personalizedConfig, emails: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="email1@example.com, email2@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expires in (days)
              </label>
              <input
                type="number"
                value={personalizedConfig.expiresInDays}
                onChange={(e) => setPersonalizedConfig({ ...personalizedConfig, expiresInDays: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="365"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Uses per Invitation
              </label>
              <input
                type="number"
                value={personalizedConfig.maxUses}
                onChange={(e) => setPersonalizedConfig({ ...personalizedConfig, maxUses: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10"
              />
            </div>
          </div>

          <button
            onClick={createPersonalizedInvitations}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Creating..." : "Create Personalized Invitations"}
          </button>
        </div>
      )}

      {activeTab === "list" && (
        <div>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : invitations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No invitations created yet</p>
          ) : (
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {invitation.invitation_metadata?.type === "anonymous" ? (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Anonymous</span>
                        ) : (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Personalized</span>
                        )}
                        {invitation.use_count >= invitation.max_uses && (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">Used</span>
                        )}
                        {invitation.expires_at && new Date(invitation.expires_at) < new Date() && (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">Expired</span>
                        )}
                      </div>
                      
                      {invitation.email && (
                        <p className="text-sm text-gray-600 mb-1">Email: {invitation.email}</p>
                      )}
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Uses: {invitation.use_count} / {invitation.max_uses}</p>
                        <p>Expires: {formatDate(invitation.expires_at)}</p>
                        <p>Created: {formatDate(invitation.created_at)}</p>
                      </div>

                      {invitation.invitation_url && (
                        <div className="mt-2 flex items-center space-x-2">
                          <input
                            type="text"
                            value={invitation.invitation_url}
                            readOnly
                            className="flex-1 px-2 py-1 border rounded text-sm bg-gray-50"
                          />
                          <button
                            onClick={() => copyToClipboard(invitation.invitation_url!)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            {copiedUrl === invitation.invitation_url ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => deleteInvitation(invitation.id)}
                      className="ml-4 text-red-600 hover:text-red-800"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SurveyInvitations;