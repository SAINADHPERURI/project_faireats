"use client";

import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { getFullNameFromMetadata, getOnboardableRoleFromMetadata } from "@/config/roles";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getIdentityProfile } from "@/lib/supabase/identity-profile";
import type { AuthenticatedProfile } from "@/types/auth";

interface AuthContextValue {
  user: SupabaseUser | null;
  session: Session | null;
  profile: AuthenticatedProfile | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<AuthenticatedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (nextUser: SupabaseUser | null) => {
    if (!nextUser?.email) {
      setProfile(null);
      return;
    }

    const data = await getIdentityProfile(supabase, nextUser.id);
    const metadataRole = getOnboardableRoleFromMetadata(nextUser.user_metadata);

    setProfile(
      data
        ? {
            id: data.id,
            email: data.email,
            fullName: data.full_name,
            role: data.role
          }
        : metadataRole
          ? {
              id: nextUser.id,
              email: nextUser.email,
              fullName: getFullNameFromMetadata(nextUser.user_metadata),
              role: metadataRole
            }
        : null
    );
  }, [supabase]);

  const refresh = useCallback(async () => {
    const {
      data: { session: nextSession }
    } = await supabase.auth.getSession();
    const {
      data: { user: verifiedUser }
    } = await supabase.auth.getUser();
    const nextUser = verifiedUser ?? nextSession?.user ?? null;

    setSession(nextSession);
    setUser(nextUser);
    await loadProfile(nextUser);
  }, [loadProfile, supabase]);

  useEffect(() => {
    let isMounted = true;

    async function boot() {
      await refresh();

      if (isMounted) {
        setIsLoading(false);
      }
    }

    void boot();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      void loadProfile(nextSession?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, refresh, supabase]);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      isLoading,
      refresh
    }),
    [user, session, profile, isLoading, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
