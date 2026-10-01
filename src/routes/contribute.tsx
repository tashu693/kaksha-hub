import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Info, LogIn } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { PageHeader, fieldClass, panelClass } from "@/components/kaksha/page-ui";
import { RESOURCE_TYPES, branchesQuery, subjectsQuery } from "@/lib/library";
import { ALLOWED_EXT, MAX_FILE_MB, createSubmission, submissionSchema, uploadWithProgress, validateFile } from "@/lib/contributions";
import { useAuth } from "@/lib/auth";
import { pageMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/contribute")({
  head: () => pageMeta("Contribute Study Material", "Submit AKTU notes, papers and academic resources for review."),
  component: Contribute,
});

const empty = { title: "", branch: "", semester: "", subjectId: "", type: "", description: "", tags: "" };

function Contribute() {
  const { user, profile, loading } = useAuth();
  return (
    <>
      <PageHeader eyebrow="Student contribution" title="Share what helped you learn" description="Good resources save someone else hours. Add clear details so reviewers can organize your material correctly." />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_300px] lg:px-8">
        {loading ? <div className={`${panelClass} h-96 animate-pulse`} /> : user ? <ContributeForm userId={user.id} defaults={{ branch: profile?.branch ?? "", semester: profile?.semester ? String(profile.semester) : "" }} /> : (
          <div className={`${panelClass} text-center`}>
            <LogIn className="mx-auto size-8 text-primary" />
            <h2 className="mt-4 font-display text-xl font-bold">Log in to contribute</h2>
            <p className="mt-2 text-sm text-muted-foreground">You need a student account to submit resources for review.</p>
            <div className="mt-6 flex justify-center gap-3"><Button asChild><Link to="/login" search={{ redirect: "/contribute" }}>Log in</Link></Button><Button asChild variant="outline"><Link to="/register">Register</Link></Button></div>
          </div>
        )}
        <aside className="space-y-4">
          <div className={panelClass}><Info className="size-5 text-primary" /><h2 className="mt-4 font-display font-bold">Before you submit</h2><ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground"><li>Use a clear, searchable title.</li><li>Only share material you have permission to distribute.</li><li>Remove personal information from documents.</li><li>Choose the exact subject and semester.</li></ul></div>
          <div className="rounded-lg bg-ink p-5 text-primary-foreground"><p className="text-sm font-bold">Community standard</p><p className="mt-2 text-xs leading-relaxed text-primary-foreground/65">Every contribution is shown as pending until a reviewer approves it.</p></div>
        </aside>
      </div>
    </>
  );
}

function ContributeForm({ userId, defaults }: { userId: string; defaults: { branch: string; semester: string } }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...empty, ...defaults });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const branches = useQuery(branchesQuery());
  const subjects = useQuery({ ...subjectsQuery(form.branch || undefined, form.semester || undefined), enabled: !!form.branch && !!form.semester });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value, ...(k === "branch" || k === "semester" ? { subjectId: "" } : {}) }));
  const busy = progress !== null;

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const parsed = submissionSchema.safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Please check the form."); return; }
    const fileErr = validateFile(file);
    if (fileErr) { setError(fileErr); return; }
    setProgress(0);
    try {
      const path = await uploadWithProgress(file!, userId, setProgress);
      await createSubmission(parsed.data, path, userId);
      await qc.invalidateQueries({ queryKey: ["my-contributions"] });
      navigate({ to: "/my-resources" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setProgress(null);
    }
  }

  return (
    <form noValidate className={panelClass} onSubmit={submit} aria-busy={busy}>
      <fieldset disabled={busy} className="grid gap-5 sm:grid-cols-2">
        <Field label="Resource title" wide><Input required maxLength={150} value={form.title} onChange={set("title")} placeholder="e.g. DBMS Unit 3 handwritten notes" className="h-11" /></Field>
        <Field label="Branch"><select required value={form.branch} onChange={set("branch")} className={fieldClass}><option value="">Select branch</option>{branches.data?.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}</select></Field>
        <Field label="Semester"><select required value={form.semester} onChange={set("semester")} className={fieldClass}><option value="">Select semester</option>{Array.from({ length: 8 }, (_, i) => <option key={i} value={i + 1}>Semester {String(i + 1).padStart(2, "0")}</option>)}</select></Field>
        <Field label="Subject"><select required value={form.subjectId} onChange={set("subjectId")} className={fieldClass} disabled={!form.branch || !form.semester}>
          <option value="">{!form.branch || !form.semester ? "Pick branch & semester first" : subjects.isLoading ? "Loading…" : subjects.data?.length ? "Select subject" : "No subjects yet"}</option>
          {subjects.data?.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
        </select></Field>
        <Field label="Resource type"><select required value={form.type} onChange={set("type")} className={fieldClass}><option value="">Select type</option>{RESOURCE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Description" wide><Textarea required maxLength={2000} value={form.description} onChange={set("description")} className="min-h-28" placeholder="What does this resource cover?" /></Field>
        <Field label="Tags" wide><Input value={form.tags} onChange={set("tags")} placeholder="aktu, unit-3, exam-prep" className="h-11" /></Field>
        <Field label="Resource file" wide>
          <span className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/40 p-6 text-center transition hover:border-primary/40 focus-within:border-primary">
            <FileUp className="size-8 text-primary" />
            <span className="mt-3 break-all font-semibold">{file ? file.name : "Choose a PDF or document"}</span>
            <span className="mt-1 text-xs text-muted-foreground">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : `${ALLOWED_EXT.slice(0, 7).join(", ").toUpperCase()}… up to ${MAX_FILE_MB} MB`}</span>
            <input type="file" className="sr-only" aria-label="Choose resource file" accept={ALLOWED_EXT.map((e) => "." + e).join(",")} onChange={(e) => { const f = e.target.files?.[0] ?? null; setFile(f); setError(f ? validateFile(f) ?? "" : ""); }} />
          </span>
        </Field>
      </fieldset>
      {busy && <div className="mt-6" role="status"><Progress value={progress} aria-label="Upload progress" /><p className="mt-2 text-center text-xs text-muted-foreground">{progress! < 100 ? `Uploading… ${progress}%` : "Saving submission…"}</p></div>}
      {error && <p role="alert" className="mt-6 rounded-md bg-destructive/10 p-3 text-center text-sm font-semibold text-destructive">{error}</p>}
      <Button size="lg" type="submit" disabled={busy} className="mt-6 w-full">{busy ? "Submitting…" : "Submit for Review"}</Button>
    </form>
  );
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={wide ? "sm:col-span-2" : ""}><span className="mb-2 block text-sm font-semibold">{label}</span>{children}</label>;
}
