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
const normalizeOrganization = (organization: any): Organization => ({
  id: organization.id,
  name: organization.name,
  sizeCategory: organization.size_category ?? organization.sizeCategory,
  industry: organization.industry,
  membershipStartDate:
    organization.membership_start_date ?? organization.membershipStartDate,
  address: organization.address,
  website: organization.website,
  contactEmail: organization.contact_email ?? organization.contactEmail,
  contactPhone: organization.contact_phone ?? organization.contactPhone,
  memberCount: organization.member_count ?? organization.memberCount,
  responseRate: organization.response_rate ?? organization.responseRate,
  createdAt: organization.created_at ?? organization.createdAt,
});

const mapOrganizationPayload = (
  data: Partial<Organization> & { [key: string]: any },
) => {
  const payload: Record<string, any> = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.sizeCategory !== undefined) payload.size_category = data.sizeCategory;
  if (data.industry !== undefined) payload.industry = data.industry;
  if (data.membershipStartDate !== undefined)
    payload.membership_start_date = data.membershipStartDate;
  if (data.address !== undefined) payload.address = data.address;
  if (data.website !== undefined) payload.website = data.website;
  if (data.contactEmail !== undefined) payload.contact_email = data.contactEmail;
  if (data.contactPhone !== undefined) payload.contact_phone = data.contactPhone;
  if (data.memberCount !== undefined) payload.member_count = data.memberCount;
  if (data.responseRate !== undefined) payload.response_rate = data.responseRate;

  return payload;
};

export const getOrganizations = async (): Promise<Organization[]> => {
  const response = await apiClient.get("/organizations");
  return Array.isArray(response.data)
    ? response.data.map(normalizeOrganization)
    : [];
};
export const getOrganization = async (id: string): Promise<Organization> => {
  const response = await apiClient.get(`/organizations/${id}`);
  return normalizeOrganization(response.data);
};
export const createOrganization = async (
  data: Partial<Organization>,
): Promise<Organization> => {
  const response = await apiClient.post(
    "/organizations",
    mapOrganizationPayload(data),
  );
  return normalizeOrganization(response.data);
};
export const updateOrganization = async (
  id: string,
  data: Partial<Organization>,
): Promise<Organization> => {
  const response = await apiClient.put(
    `/organizations/${id}`,
    mapOrganizationPayload(data),
  );
  return normalizeOrganization(response.data);
};
export const deleteOrganization = async (id: string): Promise<void> => {
  await apiClient.delete(`/organizations/${id}`);
};
export const getOrganizationStats = async (id: string): Promise<any> => {
  const response = await apiClient.get(`/organizations/${id}/stats`);
  return response.data;
};
