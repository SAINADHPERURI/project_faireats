import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

import { serverEnv } from "@/config/env";
import type { Database } from "@/types/database";

export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  type CookieToSet = { name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] };

  return createServerClient<Database>(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      }
    }
  });
}
