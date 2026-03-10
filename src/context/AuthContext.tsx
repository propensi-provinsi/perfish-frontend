"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import apiClient from "@/lib/api";
import type {
  ApiResponse,
  LoginPayload,
  LoginResponseData,
  RegisterPayload,
  ProfileData,
  UserRole,
} from "@/types";

interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const restore = async () => {
      const stored = localStorage.getItem("token");
      if (stored) {
        try {
          const { data } = await apiClient.get<ApiResponse<ProfileData>>(
            "/v1/profile",
            { headers: { Authorization: `Bearer ${stored}` } }
          );
          setToken(stored);
          setUser({
            email: data.data.email,
            name: data.data.name,
            role: data.data.role as UserRole,
          });
        } catch {
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    restore();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const { data } = await apiClient.post<ApiResponse<LoginResponseData>>(
      "/v1/auth/login",
      payload
    );
    const { token: jwt, email, name, role } = data.data;
    localStorage.setItem("token", jwt);
    setToken(jwt);
    setUser({ email, name, role });
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await apiClient.post<ApiResponse<ProfileData>>(
      "/v1/auth/register",
      payload
    );
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    // Fire-and-forget server logout
    apiClient.post("/v1/auth/logout").catch(() => {});
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await apiClient.get<ApiResponse<ProfileData>>(
      "/v1/profile"
    );
    setUser({
      email: data.data.email,
      name: data.data.name,
      role: data.data.role as UserRole,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
