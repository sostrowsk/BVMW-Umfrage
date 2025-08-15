import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building,
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  MapPin,
  Globe,
  Filter,
  Award,
  Activity,
} from "lucide-react";
import {
  getOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from "../api/organizations";
import OrganizationForm from "../components/OrganizationForm";
export default function Organizations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: getOrganizations,
  });
  const createMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setShowForm(false);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setEditingOrg(null);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
  const filteredOrganizations = organizations.filter((org: any) => {
    const matchesSearch = 
      org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.industry?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSize = sizeFilter === "all" || org.sizeCategory === sizeFilter;
    const matchesIndustry = industryFilter === "all" || org.industry === industryFilter;
    return matchesSearch && matchesSize && matchesIndustry;
  });
  const handleDelete = (id: string) => {
    if (
      confirm(
        "Möchten Sie diese Organisation wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
      )
    ) {
      deleteMutation.mutate(id);
    }
  };
  const getSizeCategoryStyle = (category: string) => {
    switch (category) {
      case "small":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "large":
        return "bg-purple-100 text-purple-800";
      case "enterprise":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };
  const getSizeCategoryLabel = (category: string) => {
    switch (category) {
      case "small":
        return "Klein";
      case "medium":
        return "Mittel";
      case "large":
        return "Groß";
      case "enterprise":
        return "Enterprise";
      default:
        return category;
    }
  };
  const uniqueIndustries = Array.from(new Set(organizations.map((org: any) => org.industry).filter(Boolean)));
  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Organisationen
          </h1>
          <p className="mt-2 text-gray-600">
            Verwalten Sie teilnehmende Organisationen
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <Plus className="h-5 w-5" />
            Organisation hinzufügen
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
                placeholder="Organisationen suchen..."
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="input-field pl-10 cursor-pointer"
              >
                <option value="all">Alle Größen</option>
                <option value="small">Klein</option>
                <option value="medium">Mittel</option>
                <option value="large">Groß</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <div>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="input-field cursor-pointer"
            >
              <option value="all">Alle Branchen</option>
              {uniqueIndustries.map((industry: string) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm text-gray-500">Lade Organisationen...</p>
        </div>
      ) : filteredOrganizations.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Building className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Keine Organisationen gefunden
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || sizeFilter !== "all" || industryFilter !== "all"
              ? "Versuchen Sie es mit anderen Filterkriterien."
              : "Es sind noch keine Organisationen vorhanden."}
          </p>
          {!searchTerm && sizeFilter === "all" && industryFilter === "all" && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              <Plus className="h-5 w-5" />
              Erste Organisation hinzufügen
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org: any) => (
            <div
              key={org.id}
              className="card p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingOrg(org)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Bearbeiten"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(org.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {org.name}
              </h3>
              {org.industry && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span>{org.industry}</span>
                </div>
              )}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{org.memberCount || 0} Mitglieder</span>
                  </div>
                  {org.sizeCategory && (
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getSizeCategoryStyle(org.sizeCategory)}`}
                    >
                      {getSizeCategoryLabel(org.sizeCategory)}
                    </span>
                  )}
                </div>
                {org.membershipStartDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Award className="h-4 w-4 text-gray-400" />
                    <span>
                      Mitglied seit {new Date(org.membershipStartDate).getFullYear()}
                    </span>
                  </div>
                )}
                {org.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{org.location}</span>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600 uppercase">
                    Antwortrate
                  </span>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-gray-800">
                      {org.responseRate
                        ? `${Math.round(org.responseRate * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${(org.responseRate || 0) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {(showForm || editingOrg) && (
        <OrganizationForm
          organization={editingOrg}
          onClose={() => {
            setShowForm(false);
            setEditingOrg(null);
          }}
          onSubmit={(data) => {
            if (editingOrg) {
              updateMutation.mutate({ id: editingOrg.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
        />
      )}
    </div>
  );
}