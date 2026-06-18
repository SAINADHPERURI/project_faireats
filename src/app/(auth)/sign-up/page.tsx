import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = {
  title: "Create account"
};

export default function SignUpPage() {
  return (
    <AuthCard eyebrow="Join FairEats" title="Create your account" description="Choose your marketplace role and start with the right workspace from day one.">
      <SignUpForm />
    </AuthCard>
  );
}
