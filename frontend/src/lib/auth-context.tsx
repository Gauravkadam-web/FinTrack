"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  googleSignIn,
  loginUser,
  logoutAllSessions,
  logoutUser,
  refreshSession,
  registerUser,
} from "@/lib/api/auth";
import { setAccessToken, setAuthCallbacks } from "@/lib/api-client";
import { LoginFormData, RegisterFormData } from "@/schemas/auth.schema";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<any>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refresh: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const handleAuthFailure = useCallback(() => {
    setUser(null);
    setToken(null);
    setAccessToken(null);
    setIsLoading(false);
  }, []);

  const handleTokenRefreshed = useCallback((newToken: string) => {
    setToken(newToken);
    setAccessToken(newToken);
  }, []);

  // Register callbacks for api-client 401 interceptor
  useEffect(() => {
    setAuthCallbacks(handleAuthFailure, handleTokenRefreshed);
  }, [handleAuthFailure, handleTokenRefreshed]);

  // Initial session restoration on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const res = await refreshSession();
        if (isMounted && res?.access_token) {
          setToken(res.access_token);
          setAccessToken(res.access_token);
          setUser(res.user);
        }
      } catch (err) {
        if (isMounted) {
          handleAuthFailure();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, [handleAuthFailure]);

  const login = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const res = await loginUser(data);
      setToken(res.access_token);
      setAccessToken(res.access_token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterFormData) => {
    return await registerUser(data);
  };

  const googleLogin = async (idToken: string) => {
    setIsLoading(true);
    try {
      const res = await googleSignIn(idToken);
      setToken(res.access_token);
      setAccessToken(res.access_token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
    } catch {
      // Ignore network errors during logout
    } finally {
      handleAuthFailure();
      router.push("/login");
    }
  };

  const logoutAll = async () => {
    setIsLoading(true);
    try {
      await logoutAllSessions();
    } catch {
      // Ignore network errors
    } finally {
      handleAuthFailure();
      router.push("/login");
    }
  };

  const refresh = async () => {
    const res = await refreshSession();
    if (res?.access_token) {
      setToken(res.access_token);
      setAccessToken(res.access_token);
      setUser(res.user);
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user && !!accessToken,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        logoutAll,
        refresh,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
