"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePassword } from "@/lib/api/auth";
import { useToast } from "@/components/ui/ToastContext";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChangePasswordFormData, changePasswordSchema } from "@/schemas/auth.schema";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { PasswordSuggesterButton } from "@/components/auth/PasswordSuggesterButton";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const { success } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const newPasswordValue = watch("new_password", "");

  const onSubmit = async (data: ChangePasswordFormData) => {
    setFormError(null);
    try {
      await changePassword(data);
      success("Password changed successfully!");
      reset();
      onClose();
    } catch (err: any) {
      setFormError(err.message || "Failed to update password. Please check your current password.");
    }
  };

  const handleClose = () => {
    reset();
    setFormError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Password"
      description="Update your account security password."
      maxWidth="sm"
    >
      {formError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Current Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={isSubmitting}
          error={errors.current_password?.message}
          {...register("current_password")}
        />

        <div className="space-y-1.5">
          <Input
            label="New Password"
            actionRight={
              <PasswordSuggesterButton
                onSuggest={(suggested) => {
                  setValue("new_password", suggested, { shouldValidate: true });
                  setValue("confirm_password", suggested, { shouldValidate: true });
                }}
              />
            }
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isSubmitting}
            error={errors.new_password?.message}
            {...register("new_password")}
          />
          <PasswordStrengthMeter password={newPasswordValue} />
        </div>

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isSubmitting}
          error={errors.confirm_password?.message}
          {...register("confirm_password")}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            Update Password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
