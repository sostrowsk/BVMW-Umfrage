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
export const getMembers = async (): Promise<Member[]> => {
  const response = await apiClient.get("/members");
  return response.data;
};
export const getMember = async (id: string): Promise<Member> => {
  const response = await apiClient.get(`/members/${id}`);
  return response.data;
};
export const createMember = async (data: Partial<Member>): Promise<Member> => {
  const response = await apiClient.post("/members", data);
  return response.data;
};
export const updateMember = async (
  id: string,
  data: Partial<Member>,
): Promise<Member> => {
  const response = await apiClient.put(`/members/${id}`, data);
  return response.data;
};
export const deleteMember = async (id: string): Promise<void> => {
  await apiClient.delete(`/members/${id}`);
};
