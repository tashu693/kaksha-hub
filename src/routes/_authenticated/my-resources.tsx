import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Pencil, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/kaksha/page-ui";
import { StatusBadge } from "@/components/kaksha/status-badge";
import { deleteSubmission, fmtDate, myContributionsQuery, openResourceFile, resourceDetailsSchema, updateSubmission, type Submission } from "@/lib/contributions";
import { RESOURCE_TYPES } from "@/lib/library";
import { pageMeta } from "@/lib/route-meta";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/my-resources")({ head: () => pageMeta("My Resources", "Track the status of the study resources you've shared on Kaksha Hub."), component: MyResources });

const TABS = ["all", "pending", "approved", "rejected"] as const;

function MyResources() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery(myContributionsQuery(user?.id));
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [editing, setEditing] = useState<Submission | null>(null);
  const list = (q.data ?? []).filter((s) => tab === "all" || s.status === tab);
  const refresh = () => qc.invalidateQueries({ queryKey: ["my-contributions"] });
  const remove = async (s: Submission) => {
    if (!confirm(`Delete "${s.title}"? This can't be undone.`)) return;
    try { await deleteSubmission(s.id, s.filePath); toast.success("Submission deleted."); refresh(); } catch (e) { toast.error((e as Error).message); }
  };
  return <><PageHeader eyebrow="Personal library" title="My Resources" description="Everything you've shared, with its review status." actions={<Button asChild><Link to="/contribute"><Upload />Contribute</Link></Button>} />
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex gap-1 overflow-x-auto border-b border-border">{TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={cn("cursor-pointer whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-semibold capitalize text-muted-foreground", tab === t && "border-primary text-primary")}>{t} ({(q.data ?? []).filter((s) => t === "all" || s.status === t).length})</button>)}</div>
      {q.isLoading ? <p className="py-16 text-center text-sm text-muted-foreground">Loading your contributions…</p>
        : q.isError ? <p className="py-16 text-center text-sm text-destructive">Couldn't load your contributions. Please refresh.</p>
        : list.length === 0 ? <div className="py-16 text-center"><p className="text-sm text-muted-foreground">Nothing here yet.</p><Button asChild variant="outline" className="mt-4"><Link to="/contribute">Share your first resource</Link></Button></div>
        : <ul className="mt-8 grid gap-4 md:grid-cols-2">{list.map((s) => <li key={s.id} className="rounded-lg border border-border bg-card p-5 shadow-card">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-widest text-primary">{s.type}</p><h2 className="mt-1 font-display text-lg font-bold break-words">{s.title}</h2><p className="text-xs text-muted-foreground">{s.subject} ({s.code}) · {s.branch} · S{s.semester} · {fmtDate(s.createdAt)}</p></div><StatusBadge status={s.status} /></div>
          {s.status === "rejected" && s.rejectionReason && <p className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive"><strong>Reason:</strong> {s.rejectionReason}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {s.status === "approved" ? <Button asChild size="sm" variant="outline"><Link to="/resources/$resourceId" params={{ resourceId: s.slug }}><ExternalLink />View</Link></Button>
              : <Button size="sm" variant="outline" onClick={() => openResourceFile(s.filePath, s.fileUrl).catch((e: Error) => toast.error(e.message))}><ExternalLink />Open file</Button>}
            {s.status !== "approved" && <Button size="sm" variant="outline" onClick={() => setEditing(s)}><Pencil />Edit</Button>}
            {s.status === "pending" && <Button size="sm" variant="outline" onClick={() => remove(s)}><Trash2 />Delete</Button>}
          </div></li>)}</ul>}
    </div>
    {editing && <EditDialog sub={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
  </>;
}

function EditDialog({ sub, onClose, onSaved }: { sub: Submission; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ title: sub.title, type: sub.type, description: sub.description, tags: sub.tags.join(", ") });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const r = resourceDetailsSchema.safeParse(f);
    if (!r.success) return setErr(r.error.issues[0]?.message ?? "Please check the form.");
    setBusy(true); setErr(null);
    try { await updateSubmission(sub.id, r.data); toast.success("Saved — sent back for review."); onSaved(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent><DialogHeader><DialogTitle>Edit submission</DialogTitle></DialogHeader>
    <div className="space-y-3">
      <label className="block text-sm font-medium">Title<Input className="mt-1" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
      <label className="block text-sm font-medium">Type<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{RESOURCE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
      <label className="block text-sm font-medium">Description<Textarea className="mt-1" rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
      <label className="block text-sm font-medium">Tags (comma separated)<Input className="mt-1" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} /></label>
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      <p className="text-xs text-muted-foreground">Saving sends this back to admins for review.</p>
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button></DialogFooter></DialogContent></Dialog>;
}
