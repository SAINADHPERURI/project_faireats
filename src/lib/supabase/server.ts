import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { serverEnv } from "@/config/env";
import type { Database } from "@/types/database";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  type CookieToSet = { name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] };

  return createServerClient<Database>(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; middleware refreshes sessions.
        }
      }
    }
  });
}
