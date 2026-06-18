import "server-only";

import { serverEnv } from "@/config/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";

export async function upsertProfile(input: { id: string; email: string; fullName?: string | null; role?: UserRole }) {
  const supabase = await createSupabaseServerClient();

  const basicProfileFields = {
    email: input.email,
    full_name: input.fullName ?? null
  };

  const { error } = await supabase.from("users").update(basicProfileFields).eq("id", input.id);

  if (!error) {
    return;
  }

  const { error: legacyProfileError } = await supabase
    .from("profiles")
    .update({
      email: input.email,
      full_name: input.fullName ?? null,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.id);

  if (!legacyProfileError) {
    return;
  }

  if (serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createSupabaseAdminClient();
    const { error: adminError } = await admin.from("users").upsert(
      {
        id: input.id,
        ...basicProfileFields,
        role: input.role ?? "CUSTOMER"
      },
      { onConflict: "id" }
    );

    if (adminError) {
      const { error: legacyAdminError } = await admin.from("profiles").upsert(
        {
          id: input.id,
          email: input.email,
          full_name: input.fullName ?? null,
          role: input.role ?? "CUSTOMER"
        },
        { onConflict: "id" }
      );

      if (legacyAdminError) {
        throw new Error(legacyAdminError.message);
      }
    }

    return;
  }

  throw new Error(legacyProfileError.message);
}
