"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resendVerification } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { LoginFormData, loginSchema } from "@/schemas/auth.schema";

export function LoginForm() {
  const { login, googleLogin } = useAuth();
  const { success, error: toastError } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    setUnverifiedEmail(null);
    try {
      await login(data);
      success("Welcome back!");
      router.push(redirectUrl);
    } catch (err: any) {
      if (err.status === 429) {
        setFormError("Too many login attempts. Please wait a minute and try again.");
      } else if (err.status === 403 || err.message?.toLowerCase().includes("verify your email")) {
        setUnverifiedEmail(data.email.toLowerCase().trim());
        setFormError(err.message || "Please verify your email address before signing in.");
      } else if (err.status === 401 || err.code === "UNAUTHORIZED") {
        setFormError("Invalid email address or password. Please try again.");
      } else {
        setFormError(err.message || "Failed to sign in. Please try again.");
      }
    }
  };

  const handleResendForUnverified = async () => {
    if (!unverifiedEmail || resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      const res = await resendVerification(unverifiedEmail);
      success(res.message || "Verification link resent! Check your inbox.");
      setResendCooldown(60);
    } catch (err: any) {
      toastError(err.message || "Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    setFormError(null);
    setUnverifiedEmail(null);
    try {
      await googleLogin(idToken);
      success("Signed in with Google successfully!");
      router.push(redirectUrl);
    } catch (err: any) {
      setFormError(err.message || "Google authentication failed. Please try again.");
    }
  };

  const handleGoogleError = (errMsg: string) => {
    setFormError(errMsg);
  };

  return (
    <div className="w-full space-y-6">
      {formError && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium space-y-2 ${
            unverifiedEmail
              ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200"
              : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {unverifiedEmail ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <span>{formError}</span>
          </div>

          {unverifiedEmail && (
            <div className="pt-1 flex items-center justify-between border-t border-amber-500/20">
              <span className="text-[11px] text-amber-700 dark:text-amber-300">
                Didn&apos;t receive the link?
              </span>
              <button
                type="button"
                onClick={handleResendForUnverified}
                disabled={isResending || resendCooldown > 0}
                className="font-semibold underline decoration-amber-500/50 hover:text-amber-950 dark:hover:text-white disabled:opacity-50 transition-colors"
              >
                {isResending
                  ? "Sending..."
                  : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend Link"}
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isSubmitting}
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isSubmitting}
            error={errors.password?.message}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            }
            {...register("password")}
          />
          <div className="flex justify-end pt-1">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={isSubmitting}
        >
          Sign In
        </Button>
      </form>

      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
        <span className="bg-surface px-3 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold absolute">
          or continue with
        </span>
      </div>

      <GoogleSignInButton
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        disabled={isSubmitting}
      />

      <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}
