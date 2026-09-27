import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError, passwordSchema } from "@/lib/auth";
import { pageMeta } from "@/lib/route-meta";
import { AuthFrame } from "./login";

export const Route = createFileRoute("/reset-password")({ head: () => pageMeta("Reset Password", "Set a new password for your Kaksha Hub account."), component: ResetPassword });

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => { if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true); });
    supabase.auth.getSession().then(({ data: s }) => { if (s.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const p = passwordSchema.safeParse(password);
    if (!p.success) return setError(p.error.issues[0]?.message ?? "Invalid password");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(friendlyAuthError(error.message));
    navigate({ to: "/dashboard", replace: true });
  }
  return <AuthFrame title="Set a new password" subtitle="Choose a strong password for your account.">
    {!ready ? <div className="space-y-4"><p className="rounded-md bg-secondary p-4 text-sm text-muted-foreground">Open this page from the reset link in your email. Links expire after a while.</p><Button asChild variant="outline" className="w-full"><Link to="/login">Back to log in</Link></Button></div> :
    <form noValidate onSubmit={submit} className="space-y-4">
      <label className="block"><span className="mb-2 block text-sm font-semibold">New password</span><Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" placeholder="8+ chars, letter & number" /></label>
      <label className="block"><span className="mb-2 block text-sm font-semibold">Confirm password</span><Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11" placeholder="Repeat password" /></label>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Saving…" : "Update password"}</Button>
      {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-center text-sm font-semibold text-destructive">{error}</p>}
    </form>}
  </AuthFrame>;
}
