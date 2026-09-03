import { apiClient } from "@/lib/api-client";
import {
  ChangePasswordFormData,
  ForgotPasswordFormData,
  LoginFormData,
  RegisterFormData,
  ResetPasswordFormData,
} from "@/schemas/auth.schema";
import { TokenResponse, User } from "@/types";

export interface MessageResponse {
  message: string;
}

export interface RegisterResponse {
  email: string;
  display_name: string;
  message: string;
  pre_reg_session?: string;
}

export interface RegisterWithPhoneData {
  display_name: string;
  email: string;
  password: string;
  firebase_id_token: string;
}

export async function registerUser(data: RegisterFormData): Promise<RegisterResponse> {
  return apiClient<RegisterResponse>("auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      display_name: data.display_name,
      phone_number: data.phone_number || undefined,
    }),
    skipAuth: true,
  });
}

export async function registerWithPhone(data: RegisterWithPhoneData): Promise<TokenResponse> {
  return apiClient<TokenResponse>("auth/register-with-phone", {
    method: "POST",
    body: JSON.stringify(data),
    skipAuth: true,
  });
}

export async function verifyOtp(
  preRegSession: string,
  otp: string
): Promise<TokenResponse> {
  return apiClient<TokenResponse>("auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({
      pre_reg_session: preRegSession,
      otp,
    }),
    skipAuth: true,
  });
}

export async function loginUser(data: LoginFormData): Promise<TokenResponse> {
  return apiClient<TokenResponse>("auth/login", {
    method: "POST",
    body: JSON.stringify(data),
    skipAuth: true,
  });
}

export async function googleSignIn(idToken: string): Promise<TokenResponse> {
  return apiClient<TokenResponse>("auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
    skipAuth: true,
  });
}

export async function refreshSession(): Promise<TokenResponse> {
  return apiClient<TokenResponse>("auth/refresh", {
    method: "POST",
    skipAuth: true,
  });
}

export async function logoutUser(): Promise<MessageResponse> {
  return apiClient<MessageResponse>("auth/logout", {
    method: "POST",
    skipAuth: true,
  });
}

export async function logoutAllSessions(): Promise<MessageResponse> {
  return apiClient<MessageResponse>("auth/logout-all", {
    method: "POST",
  });
}

export async function forgotPassword(data: ForgotPasswordFormData): Promise<MessageResponse> {
  return apiClient<MessageResponse>("auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
    skipAuth: true,
  });
}

export async function resetPassword(
  token: string,
  data: ResetPasswordFormData
): Promise<MessageResponse> {
  return apiClient<MessageResponse>("auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token,
      new_password: data.new_password,
    }),
    skipAuth: true,
  });
}

export async function changePassword(data: ChangePasswordFormData): Promise<MessageResponse> {
  return apiClient<MessageResponse>("auth/change-password", {
    method: "PUT",
    body: JSON.stringify({
      current_password: data.current_password,
      new_password: data.new_password,
    }),
  });
}

export async function verifyEmail(token: string): Promise<MessageResponse> {
  return apiClient<MessageResponse>("auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
    skipAuth: true,
  });
}

export async function resendVerification(email: string): Promise<MessageResponse> {
  return apiClient<MessageResponse>("auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
    skipAuth: true,
  });
}

export async function getCurrentUser(): Promise<User> {
  return apiClient<User>("auth/me");
}


