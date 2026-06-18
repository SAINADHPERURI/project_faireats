import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password"
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard eyebrow="Account recovery" title="Reset access" description="Recover your FairEats account with a secure email reset link.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
