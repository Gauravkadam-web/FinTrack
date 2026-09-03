"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { registerUser, registerWithPhone, resendVerification, verifyOtp } from "@/lib/api/auth";
import { setupRecaptcha, sendFirebaseSmsOtp } from "@/lib/firebase";
import type { ConfirmationResult } from "firebase/auth";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { RegisterFormData, registerSchema } from "@/schemas/auth.schema";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { PasswordSuggesterButton } from "@/components/auth/PasswordSuggesterButton";
import { OtpInput } from "@/components/auth/OtpInput";

export function RegisterForm() {
  const { googleLogin, setSession } = useAuth();
  const { success, error: toastError } = useToast();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [registeredPhone, setRegisteredPhone] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [preRegSession, setPreRegSession] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
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
      phone_number: "",
      otp_channel: "email",
      password: "",
      confirm_password: "",
    },
  });

  const passwordValue = watch("password", "");
  const selectedChannel = watch("otp_channel", "email");
  const [cachedData, setCachedData] = useState<RegisterFormData | null>(null);

  const onSubmit = async (data: RegisterFormData) => {
    setFormError(null);
    setCachedData(data);

    if (data.otp_channel === "sms") {
      // 📱 SMS OTP via Firebase
      if (!data.phone_number || data.phone_number.trim().length < 10) {
        setFormError("Please enter a valid mobile number with country code (e.g. +91 9876543210)");
        return;
      }

      try {
        const verifier = setupRecaptcha("recaptcha-container");
        const confirmation = await sendFirebaseSmsOtp(data.phone_number, verifier);
        setConfirmationResult(confirmation);
        setRegisteredPhone(data.phone_number.trim());
        setResendCooldown(60);
        success("SMS OTP sent to your mobile phone!");
      } catch (err: any) {
        setFormError(err.message || "Failed to send SMS OTP. Please check your phone number or try Email OTP.");
      }
      return;
    }

    // ✉️ Email OTP via SMTP / Brevo / Resend (Existing untouched flow)
    try {
      const res = await registerUser(data);
      setRegisteredEmail(data.email.toLowerCase().trim());
      if (res.pre_reg_session) {
        setPreRegSession(res.pre_reg_session);
      }
      setResendCooldown(60);
      success(res.message || "Verification code sent! Please check your email.");
    } catch (err: any) {
      if (err.status === 409 || err.code === "CONFLICT") {
        setFormError("An account with this email address already exists. Try signing in.");
      } else {
        setFormError(err.message || "Failed to create account. Please try again.");
      }
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (!code || code.length !== 6) return;
    setOtpError(null);
    setIsVerifyingOtp(true);

    try {
      if (registeredPhone && confirmationResult && cachedData) {
        // Confirm Firebase Phone SMS OTP
        const cred = await confirmationResult.confirm(code);
        const idToken = await cred.user.getIdToken();

        // Call backend /register-with-phone
        const tokenRes = await registerWithPhone({
          display_name: cachedData.display_name,
          email: cachedData.email.toLowerCase().trim(),
          password: cachedData.password,
          firebase_id_token: idToken,
        });

        setSession(tokenRes);
        success("Mobile verified successfully! Welcome to FinTrack");
        router.push("/dashboard");
        return;
      }

      if (preRegSession) {
        // Existing Email OTP verification
        const tokenRes = await verifyOtp(preRegSession, code);
        setSession(tokenRes);
        success("Account verified successfully! Welcome to FinTrack");
        router.push("/dashboard");
      }
    } catch (err: any) {
      setOtpError(err.message || "Invalid or expired verification code. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setOtp("");
    setOtpError(null);

    try {
      if (registeredPhone && cachedData) {
        const verifier = setupRecaptcha("recaptcha-container");
        const confirmation = await sendFirebaseSmsOtp(cachedData.phone_number || registeredPhone, verifier);
        setConfirmationResult(confirmation);
        setResendCooldown(60);
        success("New SMS code sent to your mobile phone!");
        return;
      }

      if (cachedData) {
        const res = await registerUser(cachedData);
        if (res.pre_reg_session) {
          setPreRegSession(res.pre_reg_session);
        }
        success(res.message || "New verification code sent! Check your inbox.");
      } else if (registeredEmail) {
        const res = await resendVerification(registeredEmail);
        success(res.message || "Verification email resent! Check your inbox.");
      }
      setResendCooldown(60);
    } catch (err: any) {
      toastError(err.message || "Failed to resend verification code.");
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

  if (registeredEmail || registeredPhone) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center py-2 space-y-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-inner">
          <svg className="w-7 h-7 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
            Enter 6-Digit Code
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
            {registeredPhone ? (
              <>
                We sent a 6-digit SMS OTP to{" "}
                <span className="font-semibold text-slate-900 dark:text-white underline decoration-primary/50 underline-offset-2">
                  {registeredPhone}
                </span>
              </>
            ) : (
              <>
                We sent a verification code to{" "}
                <span className="font-semibold text-slate-900 dark:text-white underline decoration-primary/50 underline-offset-2">
                  {registeredEmail}
                </span>
              </>
            )}
          </p>
        </div>

        {otpError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center justify-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{otpError}</span>
          </div>
        )}

        <OtpInput
          length={6}
          value={otp}
          onChange={(newOtp) => {
            setOtp(newOtp);
            if (otpError) setOtpError(null);
          }}
          onComplete={(completedOtp) => handleVerifyOtp(completedOtp)}
          disabled={isVerifyingOtp}
          hasError={Boolean(otpError)}
        />

        <div className="space-y-3 pt-1">
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full font-bold shadow-lg shadow-primary/25"
            onClick={() => handleVerifyOtp()}
            disabled={isVerifyingOtp || otp.length !== 6}
          >
            {isVerifyingOtp ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Verifying & Signing In...</span>
              </div>
            ) : (
              "Verify & Start Tracking"
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
          >
            {isResending ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Sending new code...</span>
              </div>
            ) : resendCooldown > 0 ? (
              `Resend code in ${resendCooldown}s`
            ) : (
              "Resend 6-Digit Code"
            )}
          </Button>

          {registeredEmail && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tip: You can also click the 1-click magic link in your email.
            </p>
          )}
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

        <Input
          label="Mobile Number (Optional for Email, Required for SMS)"
          type="tel"
          placeholder="+91 9876543210"
          autoComplete="tel"
          disabled={isSubmitting}
          error={errors.phone_number?.message}
          {...register("phone_number")}
        />

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Receive Verification OTP via:
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setValue("otp_channel", "email", { shouldValidate: true })}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                selectedChannel === "email"
                  ? "bg-white dark:bg-slate-700 text-primary shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>✉️ Email OTP</span>
            </button>
            <button
              type="button"
              onClick={() => setValue("otp_channel", "sms", { shouldValidate: true })}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                selectedChannel === "sms"
                  ? "bg-white dark:bg-slate-700 text-primary shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>📱 SMS OTP</span>
            </button>
          </div>
          {selectedChannel === "sms" && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              ⚡ Instant 6-digit SMS OTP will be delivered to your mobile phone.
            </p>
          )}
        </div>

        <div id="recaptcha-container" />

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
