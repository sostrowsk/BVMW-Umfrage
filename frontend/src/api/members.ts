import apiClient from "./client";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId?: string;
  organization?: any;
  preferences?: any;
  isActive?: boolean;
  createdAt: string;
}
const normalizeMember = (member: any): Member => ({
  id: member.id,
  name: member.name,
  email: member.email,
  role: member.role,
  organizationId: member.organization_id ?? member.organizationId,
  organization: member.organization,
  preferences: member.preferences,
  isActive: member.is_active ?? member.isActive ?? true,
  createdAt: member.created_at ?? member.createdAt,
});

const mapMemberPayload = (data: Partial<Member> & { [key: string]: any }) => {
  const payload: Record<string, any> = {};

  const knownFields: Array<keyof Member> = [
    "name",
    "email",
    "role",
    "preferences",
    "organizationId",
    "isActive",
  ];

  knownFields.forEach((field) => {
    if (data[field] !== undefined) {
      payload[field] = data[field];
    }
  });

  if (data.organizationId !== undefined) {
    payload.organization_id = data.organizationId;
    delete payload.organizationId;
  } else if (data.organization_id !== undefined) {
    payload.organization_id = data.organization_id;
  }

  if (data.isActive !== undefined) {
    payload.is_active = data.isActive;
    delete payload.isActive;
  } else if (data.is_active !== undefined) {
    payload.is_active = data.is_active;
  }

  if (data.password !== undefined) {
    payload.password = data.password;
  }

  return payload;
};

export const getMembers = async (): Promise<Member[]> => {
  const response = await apiClient.get("/members");
  return Array.isArray(response.data)
    ? response.data.map(normalizeMember)
    : [];
};
export const getMember = async (id: string): Promise<Member> => {
  const response = await apiClient.get(`/members/${id}`);
  return normalizeMember(response.data);
};
export const createMember = async (data: Partial<Member>): Promise<Member> => {
  const response = await apiClient.post("/members", mapMemberPayload(data));
  return normalizeMember(response.data);
};
export const updateMember = async (
  id: string,
  data: Partial<Member>,
): Promise<Member> => {
  const response = await apiClient.put(
    `/members/${id}`,
    mapMemberPayload(data),
  );
  return normalizeMember(response.data);
};
export const deleteMember = async (id: string): Promise<void> => {
  await apiClient.delete(`/members/${id}`);
};
