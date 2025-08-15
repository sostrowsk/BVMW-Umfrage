import apiClient from "./client";
export interface Organization {
  id: string;
  name: string;
  sizeCategory?: string;
  industry?: string;
  membershipStartDate?: string;
  address?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  memberCount?: number;
  responseRate?: number;
  createdAt: string;
}
export const getOrganizations = async (): Promise<Organization[]> => {
  const response = await apiClient.get("/organizations");
  return response.data;
};
export const getOrganization = async (id: string): Promise<Organization> => {
  const response = await apiClient.get(`/organizations/${id}`);
  return response.data;
};
export const createOrganization = async (
  data: Partial<Organization>,
): Promise<Organization> => {
  const response = await apiClient.post("/organizations", data);
  return response.data;
};
export const updateOrganization = async (
  id: string,
  data: Partial<Organization>,
): Promise<Organization> => {
  const response = await apiClient.put(`/organizations/${id}`, data);
  return response.data;
};
export const deleteOrganization = async (id: string): Promise<void> => {
  await apiClient.delete(`/organizations/${id}`);
};
export const getOrganizationStats = async (id: string): Promise<any> => {
  const response = await apiClient.get(`/organizations/${id}/stats`);
  return response.data;
};
