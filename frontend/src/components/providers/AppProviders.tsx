"use client";

import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/ui/ThemeContext";
import { ToastProvider } from "@/components/ui/ToastContext";
import { PwaRegister } from "@/components/pwa/PwaRegister";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            {children}
            <PwaRegister />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
