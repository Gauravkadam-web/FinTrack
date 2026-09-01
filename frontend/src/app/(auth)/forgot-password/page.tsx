import React, { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
          Reset Password
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          We&apos;ll send you instructions to recover your account.
        </p>
      </div>

      <Suspense fallback={<div className="h-48 flex items-center justify-center text-sm text-slate-400">Loading form...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
