import axiosClient from "./client";
import { LoginCredentials, Token, Member, MemberCreate } from "../types";
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<Token> => {
    const formData = new FormData();
    formData.append("username", credentials.username);
    formData.append("password", credentials.password);
    const response = await axiosClient.post<Token>("/auth/token", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  },
  register: async (data: MemberCreate): Promise<Member> => {
    const response = await axiosClient.post<Member>("/users", data);
    return response.data;
  },
  getCurrentUser: async (): Promise<Member> => {
    const response = await axiosClient.get<Member>("/users/me");
    return response.data;
  },
};
