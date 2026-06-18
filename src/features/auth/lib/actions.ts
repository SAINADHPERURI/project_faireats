"use server";

import { redirect } from "next/navigation";

import { serverEnv } from "@/config/env";
import { appRoutes } from "@/config/routes";
import { getOnboardableRoleFromMetadata, getRoleEntryRoute } from "@/config/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getIdentityRole } from "@/lib/supabase/identity-profile";
import { upsertProfile } from "@/server/db/profiles";
import type { AuthActionState } from "@/features/auth/lib/action-state";
import { passwordResetRequestSchema, passwordUpdateSchema, signInSchema, signUpSchema } from "@/features/auth/types/schema";

const smtpSendErrorMessage =
  "Supabase could not send the confirmation email through your SMTP provider. Check the SMTP host, port, username, app password/API key, and sender email in Supabase Auth settings. For local testing, you can temporarily disable email confirmation.";

function getAuthErrorMessage(error: unknown) {
  const message =
    typeof error === "string" ? error : error instanceof Error ? error.message : error ? JSON.stringify(error) : "";
  const trimmedMessage = message.trim();
  const normalizedMessage = trimmedMessage.toLowerCase();

  if (!trimmedMessage || trimmedMessage === "{}" || normalizedMessage === "[object object]") {
    return smtpSendErrorMessage;
  }

  if (normalizedMessage.includes("rate limit") || normalizedMessage.includes("too many requests")) {
    return "Supabase email sending is temporarily rate limited. Please wait about 1 hour, or enable Custom SMTP in Supabase Auth to raise the email quota.";
  }

  if (normalizedMessage.includes("email address not authorized")) {
    return "Supabase is using the built-in demo email sender, which only sends to authorized team emails. Add this email to your Supabase team or enable Custom SMTP.";
  }

  if (
    normalizedMessage.includes("smtp") ||
    normalizedMessage.includes("confirmation email") ||
    normalizedMessage.includes("send email") ||
    normalizedMessage.includes("sending email") ||
    normalizedMessage.includes("email provider")
  ) {
    return smtpSendErrorMessage;
  }

  return trimmedMessage;
}

export async function signInAction(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message ?? "Check your email and password."
    };
  }

  const input = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(input);

  if (error) {
    return {
      status: "error",
      message: getAuthErrorMessage(error)
    };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Unable to load your account session."
    };
  }

  const profileRole = await getIdentityRole(supabase, user.id);
  const metadataRole = getOnboardableRoleFromMetadata(user.user_metadata);
  const authenticatedRole = profileRole ?? metadataRole;

  if (input.expectedRole && authenticatedRole !== input.expectedRole) {
    await supabase.auth.signOut();

    return {
      status: "error",
      message: `This account belongs to the ${formatRole(authenticatedRole)} workspace. Use the correct FairEats login portal.`
    };
  }

  redirect(getRoleEntryRoute(authenticatedRole));
}

export async function signUpAction(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message ?? "Check your account details."
    };
  }

  const input = parsed.data;
  const supabase = await createSupabaseServerClient();
  let redirectRole: typeof input.role | null = null;
  let result: AuthActionState = {
    status: "success",
    message: "Account created. Check your email to confirm your account, then sign in."
  };

  try {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${serverEnv.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=${appRoutes.signIn}`,
        data: {
          full_name: input.fullName,
          role: input.role
        }
      }
    });

    if (error) {
      return {
        status: "error",
        message: getAuthErrorMessage(error)
      };
    }

    if (data.user?.email) {
      try {
        await upsertProfile({
          id: data.user.id,
          email: data.user.email,
          fullName: input.fullName,
          role: input.role
        });
      } catch (profileError) {
        console.error("FairEats profile sync failed after signup:", profileError);
      }
    }

    if (data.session) {
      redirectRole = input.role;
      result = {
        status: "success",
        message: "Account created. Redirecting to your dashboard."
      };
    }
  } catch (error) {
    return {
      status: "error",
      message: getAuthErrorMessage(error)
    };
  }

  if (redirectRole) {
    redirect(getRoleEntryRoute(redirectRole));
  }

  return result;
}

export async function requestPasswordResetAction(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = passwordResetRequestSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message ?? "Enter a valid email address."
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${serverEnv.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=${appRoutes.resetPassword}`
  });

  if (error) {
    return {
      status: "error",
      message: getAuthErrorMessage(error)
    };
  }

  return {
    status: "success",
    message: "Password reset link sent. Check your email for the secure reset link."
  };
}

export async function updatePasswordAction(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = passwordUpdateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message ?? "Check your new password."
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password
  });

  if (error) {
    return {
      status: "error",
      message: getAuthErrorMessage(error)
    };
  }

  await supabase.auth.signOut();
  redirect(appRoutes.signIn);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(appRoutes.signIn);
}

function formatRole(role: string | null | undefined) {
  if (!role) {
    return "registered";
  }

  return role.charAt(0) + role.slice(1).toLowerCase();
}
