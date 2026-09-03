import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  Auth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") {
    return null;
  }
  // If API key is not configured, don't crash
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("your-")) {
    return null;
  }
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  return getAuth(app);
}

export function clearRecaptcha(elementId = "recaptcha-container"): void {
  if (typeof window !== "undefined") {
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch {
        // ignore
      }
      (window as any).recaptchaVerifier = null;
    }
    const container = document.getElementById(elementId);
    if (container) {
      container.innerHTML = "";
    }
  }
}

export function setupRecaptcha(elementId = "recaptcha-container"): RecaptchaVerifier {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error(
      "Firebase is not configured. Please add NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID to .env"
    );
  }

  // If already initialized on window, reuse it
  if (typeof window !== "undefined" && (window as any).recaptchaVerifier) {
    return (window as any).recaptchaVerifier;
  }

  // Clear any stale DOM content in the container before rendering
  if (typeof window !== "undefined") {
    const container = document.getElementById(elementId);
    if (container) {
      container.innerHTML = "";
    }
  }

  const verifier = new RecaptchaVerifier(auth, elementId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved
    },
    "expired-callback": () => {
      clearRecaptcha(elementId);
    },
  });

  if (typeof window !== "undefined") {
    (window as any).recaptchaVerifier = verifier;
  }

  return verifier;
}

export async function sendFirebaseSmsOtp(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error(
      "Firebase is not configured. Please add NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID to .env"
    );
  }

  // Ensure E.164 format: if doesn't start with '+', default to +91 (India)
  let cleanPhone = phoneNumber.trim().replace(/[\s-]/g, "");
  if (!cleanPhone.startsWith("+")) {
    if (cleanPhone.length === 10) {
      cleanPhone = `+91${cleanPhone}`;
    } else {
      cleanPhone = `+${cleanPhone}`;
    }
  }

  return await signInWithPhoneNumber(auth, cleanPhone, verifier);
}
