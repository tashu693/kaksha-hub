import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Role = "student" | "admin";

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) { setProfile(null); setRole(null); return; }
    const [p, r] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile(p.data ?? null);
    setRole(r.data?.some((x) => x.role === "admin") ? "admin" : r.data?.length ? "student" : null);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      // defer DB calls out of the auth callback
      setTimeout(() => { void loadProfile(next?.user.id); }, 0);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const refreshProfile = useCallback(() => loadProfile(session?.user.id), [loadProfile, session]);

  return <AuthContext.Provider value={{ loading, session, user: session?.user ?? null, profile, role, refreshProfile }}>{children}</AuthContext.Provider>;
}

const fallbackAuth: AuthState = { loading: true, session: null, user: null, profile: null, role: null, refreshProfile: async () => {} };

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx ?? fallbackAuth;
}

export function initials(name: string | null | undefined) {
  return (name ?? "S").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "S";
}

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be under 72 characters.")
  .regex(/[A-Za-z]/, "Password must include a letter.")
  .regex(/[0-9]/, "Password must include a number.");

export const branchCodes = ["CSE","IT","AIML","DS","ECE","EE","EEE","ME","CE","CHE","BT","OTH"] as const;

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(100, "Name must be under 100 characters."),
  email: z.string().trim().email("Please enter a valid email address.").max(255),
  password: passwordSchema,
  confirm: z.string(),
  branch: z.enum(branchCodes, { message: "Please select your branch." }),
  semester: z.coerce.number().int().min(1, "Please select your semester.").max(8),
}).refine((d) => d.password === d.confirm, { message: "Passwords do not match.", path: ["confirm"] });

export function friendlyAuthError(message: string | undefined) {
  const m = (message ?? "").toLowerCase();
  if (m.includes("invalid login")) return "Incorrect email or password.";
  if (m.includes("already registered") || m.includes("already exists")) return "An account with this email already exists. Try logging in.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox for the link.";
  if (m.includes("weak") || m.includes("pwned") || m.includes("password should")) return "This password is too weak. Choose a stronger one.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a moment and try again.";
  if (m.includes("fetch") || m.includes("network")) return "Network error — check your connection and try again.";
  return "Something went wrong. Please try again.";
}
