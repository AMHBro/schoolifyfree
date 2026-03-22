import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authAPI } from "../services/api";

interface CentralAdmin {
  id: string;
  username: string;
  name: string;
  email?: string;
}

interface AuthContextType {
  admin: CentralAdmin | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<CentralAdmin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    const savedToken = localStorage.getItem("central_admin_token");
    const savedAdmin = localStorage.getItem("central_admin_data");

    if (savedToken && savedAdmin) {
      setToken(savedToken);
      setAdmin(JSON.parse(savedAdmin));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      const data = await authAPI.login({ username, password });

      if (!data.success) {
        throw new Error(data.message || "Login failed");
      }

      const { token: newToken, admin: adminData } = data.data;

      // Save to localStorage
      localStorage.setItem("central_admin_token", newToken);
      localStorage.setItem("central_admin_data", JSON.stringify(adminData));

      // Update state
      setToken(newToken);
      setAdmin(adminData);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("central_admin_token");
    localStorage.removeItem("central_admin_data");
    setToken(null);
    setAdmin(null);
  };

  const value: AuthContextType = {
    admin,
    token,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
