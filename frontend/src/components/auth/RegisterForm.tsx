"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { registerUser, resendVerification } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { RegisterFormData, registerSchema } from "@/schemas/auth.schema";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { PasswordSuggesterButton } from "@/components/auth/PasswordSuggesterButton";

export function RegisterForm() {
  const { googleLogin } = useAuth();
  const { success, error: toastError } = useToast();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
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
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      display_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const passwordValue = watch("password", "");

  const onSubmit = async (data: RegisterFormData) => {
    setFormError(null);
    try {
      const res = await registerUser(data);
      setRegisteredEmail(data.email.toLowerCase().trim());
      setResendCooldown(60);
      success(res.message || "Account created! Please check your email to verify.");
    } catch (err: any) {
      if (err.status === 409 || err.code === "CONFLICT") {
        setFormError("An account with this email address already exists. Try signing in.");
      } else {
        setFormError(err.message || "Failed to create account. Please try again.");
      }
    }
  };

  const handleResend = async () => {
    if (!registeredEmail || resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      const res = await resendVerification(registeredEmail);
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
    try {
      await googleLogin(idToken);
      success("Account signed in with Google!");
      router.push("/dashboard");
    } catch (err: any) {
      setFormError(err.message || "Google registration failed. Please try again.");
    }
  };

  const handleGoogleError = (errMsg: string) => {
    setFormError(errMsg);
  };

  if (registeredEmail) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center py-4 space-y-5"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-inner">
          <svg className="w-7 h-7 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
            Check Your Email 📩
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
            We sent a verification link to{" "}
            <span className="font-semibold text-slate-900 dark:text-white underline decoration-primary/50 underline-offset-2">
              {registeredEmail}
            </span>
            . Please verify your email before signing in.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs leading-relaxed">
          <span>⚠️ <strong>Unverified accounts cannot log in.</strong> If you don&apos;t see the email, check your spam or junk folder.</span>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
          >
            {isResending ? (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </div>
            ) : resendCooldown > 0 ? (
              `Resend email in ${resendCooldown}s`
            ) : (
              "Resend Verification Link"
            )}
          </Button>

          <Link href="/login" className="block w-full">
            <Button variant="primary" size="lg" className="w-full">
              Go to Sign In
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {formError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name / Display Name"
          type="text"
          placeholder="Gaurav Kadam"
          autoComplete="name"
          disabled={isSubmitting}
          error={errors.display_name?.message}
          {...register("display_name")}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isSubmitting}
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="space-y-1.5">
          <Input
            label="Password"
            actionRight={
              <PasswordSuggesterButton
                onSuggest={(suggested) => {
                  setValue("password", suggested, { shouldValidate: true });
                  setValue("confirm_password", suggested, { shouldValidate: true });
                  setShowPassword(true);
                }}
              />
            }
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
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
          <PasswordStrengthMeter password={passwordValue} />
        </div>

        <Input
          label="Confirm Password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isSubmitting}
          error={errors.confirm_password?.message}
          {...register("confirm_password")}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={isSubmitting}
        >
          Create Account
        </Button>
      </form>

      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
        <span className="bg-surface px-3 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold absolute">
          or sign up with
        </span>
      </div>

      <GoogleSignInButton
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        disabled={isSubmitting}
      />

      <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
