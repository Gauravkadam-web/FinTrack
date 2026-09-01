"use client";

import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled,
}: GoogleSignInButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const isConfigured = Boolean(clientId && !clientId.includes("your-google-client-id"));

  return (
    <div className="w-full relative group">
      {/* Modern Custom Button Visual (Styled to match FinTrack) */}
      <motion.div
        whileHover={{ scale: disabled ? 1 : 1.01 }}
        whileTap={{ scale: disabled ? 1 : 0.99 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={`w-full relative flex items-center justify-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 shadow-xs cursor-pointer select-none ${
          disabled
            ? "opacity-60 cursor-not-allowed bg-surface-100 border-border"
            : "bg-surface hover:bg-surface-100/80 border-slate-200 dark:border-slate-800 text-foreground hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:shadow-slate-900/5 dark:hover:shadow-black/20"
        }`}
      >
        {/* Official Google 'G' Multi-Color SVG Icon */}
        <div className="shrink-0 w-5 h-5 flex items-center justify-center">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        </div>

        {/* Text */}
        <span className="text-sm font-semibold tracking-tight text-slate-700 dark:text-slate-200">
          Continue with Google
        </span>

        {/* Subtle hover sparkle/indicator */}
        <div className="absolute right-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </motion.div>

      {/* Google GSI Trigger Overlay */}
      {isConfigured ? (
        <div
          className={`absolute inset-0 z-10 opacity-0 overflow-hidden cursor-pointer ${
            disabled ? "pointer-events-none" : ""
          }`}
        >
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (credentialResponse.credential) {
                onSuccess(credentialResponse.credential);
              } else {
                onError("Failed to obtain Google authentication token");
              }
            }}
            onError={() => {
              onError("Google Sign-In was cancelled or failed");
            }}
            theme="outline"
            shape="rectangular"
            size="large"
            width="100%"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onError("Google Sign-In requires NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env.local")}
          className="absolute inset-0 z-10 opacity-0 cursor-pointer w-full h-full"
        />
      )}
    </div>
  );
}
