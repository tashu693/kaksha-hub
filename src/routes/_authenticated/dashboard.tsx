import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, BookOpen, CheckCircle2, Clock3, Download, FileText, GraduationCap, Layers, ThumbsUp, Upload, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionHeading, StatCard } from "@/components/kaksha/page-ui";
import { ResourceCard, ResourceCardSkeleton } from "@/components/kaksha/resource-card";
import { StatusBadge } from "@/components/kaksha/status-badge";
import { resourcesQuery, subjectsQuery, type LibraryResource } from "@/lib/library";
import { pageMeta } from "@/lib/route-meta";
import { greeting, useAuth } from "@/lib/auth";
import { fmtDate, myContributionsQuery } from "@/lib/contributions";
import { dashboardStatsQuery, myListQuery } from "@/lib/engagement";

export const Route = createFileRoute("/_authenticated/dashboard")({ head: () => pageMeta("Student Dashboard", "Track learning, saved resources and contributions on Kaksha Hub."), component: Dashboard });

function Grid({ q, empty }: { q: { isLoading: boolean; isError: boolean; data?: LibraryResource[] | undefined }; empty: ReactNode }) {
  if (q.isLoading) return <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <ResourceCardSkeleton key={i} />)}</div>;
  if (q.isError) return <p className="text-sm text-destructive">Couldn't load this section. Please refresh.</p>;
  if (!q.data?.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return <div className="grid gap-4 md:grid-cols-3">{q.data.slice(0, 3).map((r) => <ResourceCard key={r.id} resource={r} compact />)}</div>;
}

function Dashboard() {
  const { profile, user } = useAuth();
  const uid = user?.id;
  const mine = useQuery(myContributionsQuery(uid));
  const stats = useQuery(dashboardStatsQuery(uid));
  const downloads = useQuery(myListQuery("downloads", uid, 3));
  const recent = useQuery(myListQuery("recent", uid, 3));
  const cnt = (st?: string) => (mine.data ? String(mine.data.filter((x) => !st || x.status === st).length) : "—");
  const v = (n?: number) => (n === undefined ? "—" : String(n));
  const first = profile?.full_name.split(" ")[0] ?? "Student";
  const sem = profile?.semester ? String(profile.semester).padStart(2, "0") : "—";
  const semStr = profile?.semester ? String(profile.semester) : undefined;
  const subs = useQuery({ ...subjectsQuery(profile?.branch ?? undefined, semStr), enabled: !!profile });
  const recs = useQuery({ ...resourcesQuery({ branch: profile?.branch ?? undefined, semester: semStr, sort: "popular" }), enabled: !!profile });
  const latest = useQuery(resourcesQuery({ sort: "newest" }));
  const imp = stats.data?.impact;
  return <><PageHeader eyebrow="Student workspace" title={`${greeting()}, ${first} 👋`} description={`${profile?.branch ?? "Branch not set"} · Semester ${sem}`} actions={<Button asChild><Link to="/contribute"><Upload />Contribute resource</Link></Button>} />
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={GraduationCap} label="Current branch" value={profile?.branch ?? "Not set"} />
        <StatCard icon={Layers} label="Current semester" value={sem} />
        <StatCard icon={FileText} label="Resources shared" value={cnt()} />
        <StatCard icon={CheckCircle2} label="Approved" value={cnt("approved")} />
        <StatCard icon={Clock3} label="Pending" value={cnt("pending")} />
        <StatCard icon={Download} label="Downloads" value={v(stats.data?.downloads)} detail="Files you downloaded" />
        <StatCard icon={Bookmark} label="Saved" value={v(stats.data?.saved)} />
        <StatCard icon={ThumbsUp} label="Helpful likes" value={v(imp?.helpful)} detail="On your resources" />
      </div>

      <section className="mt-16"><SectionHeading eyebrow="Pick up where you left off" title="Continue learning" action={<Link to="/my-resources" className="text-sm font-semibold text-primary">My downloads</Link>} />
        <Grid q={downloads} empty="Files you download will show up here." /></section>
      <section className="mt-16"><SectionHeading eyebrow="History" title="Recently viewed" action={<Link to="/my-resources" className="text-sm font-semibold text-primary">See all</Link>} />
        <Grid q={recent} empty="Resources you open will appear here." /></section>
      <section className="mt-16"><SectionHeading eyebrow="For you" title="Recommended resources" />
        <Grid q={{ ...recs, data: recs.data?.items }} empty={<>No resources for your branch and semester yet — <Link to="/resources" className="font-semibold text-primary">browse the library</Link>.</>} /></section>
      <section className="mt-16"><SectionHeading eyebrow="Your semester" title="Your subjects" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{subs.data && subs.data.length === 0 && <p className="text-sm text-muted-foreground">No subjects added for your semester yet.</p>}{(subs.data ?? []).map((s) => <Link key={s.id} to="/resources" search={{ branch: s.branch, semester: String(s.semester), subject: s.code }} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/30"><span className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary"><BookOpen className="size-4" /></span><div><p className="font-semibold">{s.name}</p><p className="text-xs text-muted-foreground">{s.code}</p></div></Link>)}</div></section>
      <section className="mt-16"><SectionHeading eyebrow="New in the library" title="Recently added" />
        <Grid q={{ ...latest, data: latest.data?.items }} empty="Nothing new yet." /></section>

      <section className="mt-16"><SectionHeading eyebrow="Your contributions" title="Your contributions" action={<Link to="/my-resources" className="text-sm font-semibold text-primary">Manage</Link>} />
        {mine.data?.length ? <ul className="grid gap-3 md:grid-cols-3">{mine.data.slice(0, 3).map((s) => <li key={s.id} className="rounded-lg border border-border bg-card p-4"><div className="flex items-start justify-between gap-2"><p className="min-w-0 break-words font-semibold">{s.title}</p><StatusBadge status={s.status} /></div><p className="mt-1 text-xs text-muted-foreground">{s.subject} · {fmtDate(s.createdAt)}</p></li>)}</ul>
          : <p className="text-sm text-muted-foreground">{mine.isLoading ? "Loading…" : "You haven't shared anything yet."}</p>}</section>

      <section className="mt-16 rounded-lg bg-ink p-6 text-primary-foreground sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-highlight">Contribution impact</p>
        <h2 className="mt-2 font-display text-2xl font-bold">Help the next student learn faster.</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">{([[FileText, "Resources shared", imp?.shared], [Download, "Total downloads", imp?.downloads], [ThumbsUp, "Helpful likes", imp?.helpful], [Users, "Students reached", imp?.reached]] as const).map(([I, l, n]) => <div key={l} className="rounded-md bg-primary-foreground/5 p-4"><I className="size-4 text-highlight" /><p className="mt-2 font-display text-2xl font-bold">{v(n)}</p><p className="text-xs text-primary-foreground/65">{l}</p></div>)}</div>
        <div className="mt-6 flex flex-wrap gap-2"><Button asChild variant="secondary"><Link to="/contribute"><Upload />Share a resource</Link></Button>{uid && <Button asChild variant="outline" className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/contributors/$contributorId" params={{ contributorId: uid }}>View public profile</Link></Button>}</div>
      </section>
    </div></>;
}
