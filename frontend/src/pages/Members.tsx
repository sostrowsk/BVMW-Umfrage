import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Building,
  Shield,
  UserCheck,
  UserX,
  Filter,
} from "lucide-react";
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
} from "../api/members";
import MemberForm from "../components/MemberForm";
export default function Members() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: getMembers,
  });
  const createMutation = useMutation({
    mutationFn: createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setShowForm(false);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => updateMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setEditingMember(null);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
  const filteredMembers = members.filter((member: any) => {
    const isActive = member.isActive ?? member.is_active ?? true;
    const matchesSearch =
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? isActive : !isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });
  const handleDelete = (id: string) => {
    if (confirm("Möchten Sie dieses Mitglied wirklich löschen?")) {
      deleteMutation.mutate(id);
    }
  };
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "manager":
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };
  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Mitglieder</h1>
          <p className="mt-2 text-gray-600">
            Verwalten Sie Organisationsmitglieder und deren Rollen
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="h-5 w-5" />
            Mitglied hinzufügen
          </button>
        </div>
      </div>
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
                placeholder="Mitglieder suchen..."
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input-field pl-10 cursor-pointer"
              >
                <option value="all">Alle Rollen</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="member">Mitglied</option>
              </select>
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field cursor-pointer"
            >
              <option value="all">Alle Status</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
            </select>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm text-gray-500">Lade Mitglieder...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Keine Mitglieder gefunden
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || roleFilter !== "all" || statusFilter !== "all"
              ? "Versuchen Sie es mit anderen Filterkriterien."
              : "Es sind noch keine Mitglieder vorhanden."}
          </p>
          {!searchTerm && roleFilter === "all" && statusFilter === "all" && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="h-5 w-5" />
              Erstes Mitglied hinzufügen
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Mitglied
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    E-Mail
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rolle
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Organisation
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMembers.map((member: any) => (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-50 transition-all"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {member.name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase() || "U"}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-800">
                            {member.name || "Unbenannter Benutzer"}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {member.id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{member.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          member.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : member.role === "manager"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {getRoleIcon(member.role || "member")}
                        {member.role || "Mitglied"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.organization ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">
                            {member.organization.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 italic">
                          Keine Organisation
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          (member.isActive ?? member.is_active ?? true)
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {(member.isActive ?? member.is_active ?? true) ? (
                          <>
                            <UserCheck className="h-3 w-3" />
                            Aktiv
                          </>
                        ) : (
                          <>
                            <UserX className="h-3 w-3" />
                            Inaktiv
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingMember(member)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Bearbeiten"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {(showForm || editingMember) && (
        <MemberForm
          member={editingMember}
          onClose={() => {
            setShowForm(false);
            setEditingMember(null);
          }}
          onSubmit={(data) => {
            if (editingMember) {
              updateMutation.mutate({ id: editingMember.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
        />
      )}
    </div>
  );
}
