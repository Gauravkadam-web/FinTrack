"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyEmail } from "@/lib/api/auth";
import { Button } from "@/components/ui/Button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Missing verification token. Please check the link from your email.");
      return;
    }

    async function doVerify() {
      try {
        await verifyEmail(token);
        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "Invalid or expired verification link.");
      }
    }

    doVerify();
  }, [token]);

  if (status === "loading") {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Verifying your email address...
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
          Email Verified Successfully!
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your email address has been confirmed. You now have full access to your FinTrack account.
        </p>
        <div className="pt-2">
          <Link href="/dashboard">
            <Button variant="primary" size="lg" className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-4 space-y-4">
      <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
        Verification Failed
      </h2>
      <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
        {errorMessage}
      </p>
      <div className="pt-2">
        <Link href="/login">
          <Button variant="secondary" size="md" className="w-full">
            Back to Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center text-sm text-slate-400">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
