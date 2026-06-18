import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export async function getIdentityProfile(supabase: SupabaseClient<Database>, userId: string) {
  const currentSchemaResult = await supabase.from("users").select("id,email,full_name,role").eq("id", userId).maybeSingle();

  if (!currentSchemaResult.error && currentSchemaResult.data) {
    return currentSchemaResult.data;
  }

  const legacySchemaResult = await supabase.from("profiles").select("id,email,full_name,role").eq("id", userId).maybeSingle();
  return legacySchemaResult.data;
}

export async function getIdentityRole(supabase: SupabaseClient<Database>, userId: string) {
  const profile = await getIdentityProfile(supabase, userId);
  return profile?.role ?? null;
}

export async function listIdentityProfiles(supabase: SupabaseClient<Database>) {
  const currentSchemaResult = await supabase.from("users").select("*").order("updated_at", { ascending: false });

  if (!currentSchemaResult.error) {
    return {
      data: currentSchemaResult.data,
      error: null,
      source: "users" as const
    };
  }

  const legacySchemaResult = await supabase.from("profiles").select("*").order("updated_at", { ascending: false });

  return {
    data: legacySchemaResult.data,
    error: legacySchemaResult.error,
    source: "profiles" as const
  };
}
