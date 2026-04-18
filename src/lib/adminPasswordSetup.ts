import type { EmailOtpType, Session, User } from "@supabase/supabase-js";
import { adminSupabase } from "@/lib/supabaseClient";

type AdminPasswordSetupResolution = {
  error: Error | null;
  session: Session | null;
  user: User | null;
};

function createUrlParams(value: string) {
  const normalized = String(value || "").replace(/^[?#]/, "");
  return new URLSearchParams(normalized);
}

function getSetupParam(search: string, hash: string, key: string) {
  return createUrlParams(search).get(key) ?? createUrlParams(hash).get(key);
}

export function hasAdminPasswordSetupContext(search = window.location.search, hash = window.location.hash) {
  const normalizedSearch = String(search || "").toLowerCase();
  const normalizedHash = String(hash || "").toLowerCase();

  return ["type=invite", "type=recovery", "access_token=", "refresh_token=", "token_hash=", "code="]
    .some((token) => normalizedSearch.includes(token) || normalizedHash.includes(token));
}

export async function resolveAdminPasswordSetupSession(
  search = window.location.search,
  hash = window.location.hash,
): Promise<AdminPasswordSetupResolution> {
  const code = getSetupParam(search, hash, "code");
  if (code) {
    const { data, error } = await adminSupabase.auth.exchangeCodeForSession(code);
    return {
      error: error ?? null,
      session: data.session ?? null,
      user: data.user ?? data.session?.user ?? null,
    };
  }

  const tokenHash = getSetupParam(search, hash, "token_hash");
  const type = getSetupParam(search, hash, "type")?.toLowerCase();
  if (tokenHash && (type === "invite" || type === "recovery" || type === "email")) {
    const { data, error } = await adminSupabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    return {
      error: error ?? null,
      session: data.session ?? null,
      user: data.user ?? data.session?.user ?? null,
    };
  }

  const accessToken = getSetupParam(search, hash, "access_token");
  const refreshToken = getSetupParam(search, hash, "refresh_token");
  if (accessToken && refreshToken) {
    const { data, error } = await adminSupabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    return {
      error: error ?? null,
      session: data.session ?? null,
      user: data.user ?? data.session?.user ?? null,
    };
  }

  const { data, error } = await adminSupabase.auth.getSession();
  return {
    error: error ?? null,
    session: data.session ?? null,
    user: data.session?.user ?? null,
  };
}

export function clearAdminPasswordSetupUrl() {
  window.history.replaceState({}, document.title, window.location.pathname);
}
