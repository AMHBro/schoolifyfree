import React, { createContext, useContext, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

interface School {
  id: string;
  username: string;
  schoolName: string;
  schoolCode?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  school: School | null;
  token: string | null;
  login: (token: string, school: School) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [school, setSchool] = useState<School | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Check for existing authentication on app load
    const storedToken = localStorage.getItem("token");
    const storedSchool = localStorage.getItem("school");

    if (storedToken && storedSchool) {
      try {
        const parsedSchool = JSON.parse(storedSchool);
        setToken(storedToken);
        setSchool(parsedSchool);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error parsing stored school data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("school");
      }
    }

    setLoading(false);
  }, []);

  const login = (newToken: string, newSchool: School) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("school", JSON.stringify(newSchool));
    setToken(newToken);
    setSchool(newSchool);
    setIsAuthenticated(true);

    // Clear all cached data to force refresh of entire dashboard
    queryClient.clear();

    // Alternatively, you can be more specific and invalidate specific queries:
    // queryClient.invalidateQueries({ queryKey: ['teachers'] });
    // queryClient.invalidateQueries({ queryKey: ['students'] });
    // queryClient.invalidateQueries({ queryKey: ['stages'] });
    // queryClient.invalidateQueries({ queryKey: ['subjects'] });
    // queryClient.invalidateQueries({ queryKey: ['exams'] });
    // queryClient.invalidateQueries({ queryKey: ['schedules'] });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("school");
    setToken(null);
    setSchool(null);
    setIsAuthenticated(false);

    // Clear all cached data on logout as well
    queryClient.clear();
  };

  const value: AuthContextType = {
    isAuthenticated,
    school,
    token,
    login,
    logout,
    loading,
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
