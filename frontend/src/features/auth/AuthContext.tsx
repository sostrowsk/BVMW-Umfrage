import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Member, LoginCredentials } from "../../types";
import { authApi } from "../../api/auth";
interface AuthContextType {
  user: Member | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        } catch {
          localStorage.removeItem("access_token");
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);
  const login = async (credentials: LoginCredentials) => {
    const tokenData = await authApi.login(credentials);
    localStorage.setItem("access_token", tokenData.access_token);
    const userData = await authApi.getCurrentUser();
    setUser(userData);
  };
  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };
  const register = async (email: string, password: string, name?: string) => {
    const newUser = await authApi.register({ email, password, name });
    const tokenData = await authApi.login({ username: email, password });
    localStorage.setItem("access_token", tokenData.access_token);
    setUser(newUser);
  };
  const refreshUser = async () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Failed to refresh user:", error);
      }
    }
  };
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
