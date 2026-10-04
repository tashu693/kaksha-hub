import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle2, Download, FileText, ThumbsUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, StatCard } from "@/components/kaksha/page-ui";
import { ResourceCard, ResourceCardSkeleton } from "@/components/kaksha/resource-card";
import { BADGE_RULES, badgeFor, contributorQuery } from "@/lib/engagement";
import { initials } from "@/lib/auth";
import { pageMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/contributors/$contributorId")({
  head: () => pageMeta("Contributor Profile", "Explore a Kaksha Hub student contributor and the study resources they've shared."),
  component: Contributor,
});

function Contributor() {
  const { contributorId } = Route.useParams();
  const valid = /^[0-9a-f-]{36}$/i.test(contributorId);
  const q = useQuery({ ...contributorQuery(contributorId), enabled: valid });
  if (!valid || q.data === null) return <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="font-display text-2xl font-bold">Contributor not found</h1><p className="mt-2 text-muted-foreground">This profile doesn't exist.</p><Button asChild className="mt-6"><Link to="/resources">Browse resources</Link></Button></div>;
  if (q.isError) return <p className="px-4 py-24 text-center text-sm text-destructive">Couldn't load this profile. Please refresh.</p>;
  if (!q.data) return <div className="mx-auto max-w-7xl px-4 py-12"><div className="h-40 animate-pulse rounded-lg bg-card" /><div className="mt-6 grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <ResourceCardSkeleton key={i} />)}</div></div>;
  const { profile: p, resources } = q.data;
  const badge = badgeFor(p);
  const sem = p.semester ? `Semester ${String(p.semester).padStart(2, "0")}` : "Semester not set";
  return <><PageHeader eyebrow="Community contributor" title={p.full_name} description={`${p.branch ?? "Branch not set"} · ${sem} · AKTU`} />
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 rounded-lg border border-border bg-card p-6 shadow-card sm:flex-row sm:items-center">
        {p.avatar_url ? <img src={p.avatar_url} alt="" className="size-28 shrink-0 rounded-full object-cover" /> : <span className="grid size-28 shrink-0 place-items-center rounded-full bg-gradient-brand font-display text-3xl font-extrabold text-primary-foreground">{initials(p.full_name)}</span>}
        <div className="min-w-0"><h2 className="font-display text-2xl font-extrabold break-words">{p.full_name}</h2><p className="mt-1 text-sm text-muted-foreground">{p.branch ?? "—"} · {sem}</p>
          <div className="mt-4">{badge ? <span title={badge.rule} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"><Award className="size-3.5" />{badge.name}</span> : <span className="text-xs text-muted-foreground">No badge yet — badges unlock after the first approved resource.</span>}</div>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={FileText} label="Resources shared" value={String(p.shared)} />
        <StatCard icon={CheckCircle2} label="Approved" value={String(p.approved)} />
        <StatCard icon={Download} label="Total downloads" value={String(p.downloads)} />
        <StatCard icon={ThumbsUp} label="Helpful likes" value={String(p.helpful)} />
        <StatCard icon={Users} label="Students reached" value={String(p.reached)} />
      </div>
      <details className="mt-4 text-xs text-muted-foreground"><summary className="cursor-pointer">How badges work</summary><ul className="mt-2 space-y-1">{BADGE_RULES.map((b) => <li key={b.name}><strong>{b.name}:</strong> {b.rule}</li>)}</ul></details>
      <h2 className="mt-16 font-display text-2xl font-extrabold">Resources Shared by {p.full_name}</h2>
      {resources.length ? <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{resources.map((r) => <ResourceCard key={r.id} resource={r} />)}</div> : <p className="mt-4 text-sm text-muted-foreground">No approved resources yet.</p>}
    </div></>;
}
