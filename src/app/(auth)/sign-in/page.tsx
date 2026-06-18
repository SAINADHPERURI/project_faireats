import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in"
};

export default function SignInPage() {
  return (
    <AuthCard
      eyebrow="Welcome back"
      title="FairEats"
      description="A secure marketplace for customers, restaurants, and delivery partners."
      showFoodShowcase
    >
      <SignInForm />
    </AuthCard>
  );
}
