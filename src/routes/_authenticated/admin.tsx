import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, Clock3, ExternalLink, FileText, ShieldCheck, UserRound, X, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, StatCard } from "@/components/kaksha/page-ui";
import { adminStatsQuery, fmtDate, moderate, openResourceFile, pendingQuery, type Submission } from "@/lib/contributions";
import { pageMeta } from "@/lib/route-meta";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({ head: () => pageMeta("Admin Dashboard", "Review and moderate student contributions on Kaksha Hub."), component: Admin });

function Admin() {
  const { role, loading } = useAuth();
  if (loading) return <div className="px-4 py-24 text-center text-sm text-muted-foreground">Checking access…</div>;
  if (role !== "admin") return <div className="mx-auto max-w-md px-4 py-24 text-center"><ShieldCheck className="mx-auto size-10 text-primary" /><h1 className="mt-4 font-display text-2xl font-extrabold">Admins only</h1><p className="mt-2 text-sm text-muted-foreground">You don't have permission to view this page.</p></div>;
  return <AdminPanel />;
}

function AdminPanel() {
  const qc = useQueryClient();
  const stats = useQuery(adminStatsQuery());
  const pending = useQuery(pendingQuery());
  const [rejecting, setRejecting] = useState<Submission | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });
  const act = async (s: Submission, status: "approved" | "rejected", reason?: string) => {
    setBusy(s.id);
    try { await moderate(s.id, status, reason); toast.success(status === "approved" ? "Approved and published." : "Rejected."); setRejecting(null); refresh(); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  };
  const v = (n?: number) => (n === undefined ? "—" : String(n));
  return <><PageHeader eyebrow="Moderation workspace" title="Admin Dashboard" description="Review student contributions before they appear in the library." />
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={UserRound} label="Students" value={v(stats.data?.students)} />
        <StatCard icon={FileText} label="Total resources" value={v(stats.data?.total)} />
        <StatCard icon={Clock3} label="Pending" value={v(stats.data?.pending)} />
        <StatCard icon={CheckCircle2} label="Approved" value={v(stats.data?.approved)} />
        <StatCard icon={XCircle} label="Rejected" value={v(stats.data?.rejected)} />
      </div>
      <section className="mt-12"><p className="text-xs font-bold uppercase tracking-widest text-primary">Review queue</p><h2 className="mt-1 font-display text-2xl font-extrabold">Pending contributions</h2>
        {pending.isLoading ? <p className="py-10 text-sm text-muted-foreground">Loading…</p>
          : pending.isError ? <p className="py-10 text-sm text-destructive">Couldn't load the queue. Please refresh.</p>
          : !pending.data?.length ? <p className="py-10 text-sm text-muted-foreground">All caught up — nothing waiting for review.</p>
          : <ul className="mt-6 space-y-4">{pending.data.map((s) => <li key={s.id} className="rounded-lg border border-border bg-card p-5 shadow-card">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-widest text-primary">{s.type}</p><h3 className="mt-1 font-display text-lg font-bold break-words">{s.title}</h3><p className="text-xs text-muted-foreground">{s.subject} ({s.code}) · {s.branch} · S{s.semester} · by {s.contributor} · {fmtDate(s.createdAt)}</p><p className="mt-2 text-sm text-muted-foreground break-words">{s.description}</p></div>
              <div className="flex shrink-0 flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => openResourceFile(s.filePath, s.fileUrl).catch((e: Error) => toast.error(e.message))}><ExternalLink />Open</Button><Button size="sm" disabled={busy === s.id} onClick={() => act(s, "approved")}><Check />Approve</Button><Button size="sm" variant="outline" disabled={busy === s.id} onClick={() => setRejecting(s)}><X />Reject</Button></div></div></li>)}</ul>}
      </section>
    </div>
    {rejecting && <RejectDialog sub={rejecting} busy={busy === rejecting.id} onClose={() => setRejecting(null)} onConfirm={(r) => act(rejecting, "rejected", r)} />}
  </>;
}

function RejectDialog({ sub, busy, onClose, onConfirm }: { sub: Submission; busy: boolean; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent><DialogHeader><DialogTitle>Reject "{sub.title}"</DialogTitle></DialogHeader>
    <label className="block text-sm font-medium">Reason (shown to the student)<Textarea className="mt-1" rows={4} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
    {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
    <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={() => (reason.trim().length < 5 ? setErr("Please give a reason (at least 5 characters).") : onConfirm(reason))}>Reject</Button></DialogFooter></DialogContent></Dialog>;
}
