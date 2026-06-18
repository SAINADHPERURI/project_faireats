import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password"
};

export default function ResetPasswordPage() {
  return (
    <AuthCard eyebrow="Password reset" title="Secure your account" description="Create a new password before returning to your FairEats workspace.">
      <ResetPasswordForm />
    </AuthCard>
  );
}
