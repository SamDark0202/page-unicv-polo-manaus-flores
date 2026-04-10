import { createContext, useContext, useEffect, useState } from "react";
import { adminSupabase, partnerSupabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AdminAuthContext = createContext<AuthContextType | undefined>(undefined);
const PartnerAuthContext = createContext<AuthContextType | undefined>(undefined);

function createUseScopedAuth(
  context: React.Context<AuthContextType | undefined>,
  hookName: string,
) {
  return function useScopedAuth() {
    const value = useContext(context);
    if (!value) {
      throw new Error(`${hookName} must be used within its provider`);
    }
    return value;
  };
}

function AdminAuthProviderInner({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminSupabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = adminSupabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await adminSupabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function resetPassword(email: string) {
    const redirectTo = `${window.location.origin}/parcerias/definir-senha`;
    const { error } = await adminSupabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  }

  async function signOut() {
    const { error } = await adminSupabase.auth.signOut();
    if (error) throw error;
  }

  return (
    <AdminAuthContext.Provider value={{ user, loading, signIn, resetPassword, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

function PartnerAuthProviderInner({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    partnerSupabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = partnerSupabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await partnerSupabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function resetPassword(email: string) {
    const redirectTo = `${window.location.origin}/parcerias/definir-senha`;
    const { error } = await partnerSupabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  }

  async function signOut() {
    const { error } = await partnerSupabase.auth.signOut();
    if (error) throw error;
  }

  return (
    <PartnerAuthContext.Provider value={{ user, loading, signIn, resetPassword, signOut }}>
      {children}
    </PartnerAuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProviderInner>
      <PartnerAuthProviderInner>{children}</PartnerAuthProviderInner>
    </AdminAuthProviderInner>
  );
}

export const useAdminAuth = createUseScopedAuth(AdminAuthContext, "useAdminAuth");
export const usePartnerAuth = createUseScopedAuth(PartnerAuthContext, "usePartnerAuth");
