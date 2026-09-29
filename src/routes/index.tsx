import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Download, FileText, Search, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { resourcesQuery } from "@/lib/library";
import { Button } from "@/components/ui/button";
import { ResourceCard, ResourceCardSkeleton } from "@/components/kaksha/resource-card";
import { SectionHeading } from "@/components/kaksha/page-ui";
import { branches, semesters, subjects } from "@/lib/mock-data";
import { pageMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/")({
  head: () => pageMeta("AKTU Study Material", "Find organized AKTU notes, papers, PYQs, assignments and practical resources across engineering branches."),
  component: Index,
});

function Index() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const popular = useQuery(resourcesQuery({ sort: "popular" }));
  const search = () => navigate({ to: "/resources", search: { q: query, branch: "", semester: "", subject: "", type: "", sort: "newest" } });
  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-ink text-primary-foreground">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(oklch(1_0_0/.08)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0/.08)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 md:min-h-[720px] lg:grid-cols-[1.2fr_.8fr] lg:px-8">
          <div><div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/8 px-3 py-1.5 text-xs font-semibold text-primary-foreground/80"><Sparkles className="size-3.5 text-highlight" />Built for AKTU students</div><p className="mt-7 text-sm font-bold tracking-widest text-highlight">KAKSHA HUB</p><h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] sm:text-6xl lg:text-7xl">Find Your AKTU Study Material</h1><p className="mt-6 max-w-2xl text-base leading-relaxed text-primary-foreground/70 sm:text-lg">CT papers, semester papers, handwritten notes, assignments, PYQs and important questions — organized in one place.</p>
            <form onSubmit={(event) => { event.preventDefault(); search(); }} className="mt-8 flex max-w-2xl flex-col gap-2 rounded-lg bg-background p-2 shadow-2xl sm:flex-row"><label className="flex flex-1 items-center gap-3 px-3"><Search className="size-5 shrink-0 text-muted-foreground" /><span className="sr-only">Search study material</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="Search subject, code, notes or papers…" /></label><Button size="lg" type="submit">Search resources</Button></form>
            <div className="mt-5 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/resources">Explore Resources <ArrowRight /></Link></Button><Button asChild size="lg" variant="outline" className="border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/branches">Browse Branches & Semesters</Link></Button></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"><Metric icon={BookOpen} value="4,800+" label="Study resources" /><Metric icon={Users} value="2,300+" label="Active students" /><Metric icon={FileText} value="320+" label="AKTU subjects" /><Metric icon={Download} value="18k+" label="Downloads" /></div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><SectionHeading eyebrow="Explore disciplines" title="Study material for every branch" description="Choose your programme to find the right subjects, papers and notes." action={<Button asChild variant="outline"><Link to="/branches">View all branches <ArrowRight /></Link></Button>} /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{branches.slice(0, 8).map((branch) => <Link key={branch.code} to="/semester" search={{ branch: branch.code }} className="group rounded-lg border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-1 hover:border-primary/25 hover:shadow-card-hover"><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-md bg-primary/10 font-display text-sm font-bold text-primary">{branch.icon}</span><span className="text-xs font-semibold text-muted-foreground">{branch.count} resources</span></div><h3 className="mt-4 font-display font-bold">{branch.code}</h3><p className="mt-1 text-sm text-muted-foreground">{branch.name}</p></Link>)}</div></section>
      <section className="border-y border-border bg-secondary/50"><div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><SectionHeading eyebrow="Semester path" title="Jump straight to your semester" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">{semesters.map((semester) => <Link key={semester.number} to="/semester" search={{ branch: "CSE" }} className="rounded-lg border border-border bg-background p-4 text-center transition hover:-translate-y-1 hover:border-primary/30"><span className="font-display text-2xl font-extrabold text-primary">{semester.label}</span><p className="mt-1 text-xs font-semibold text-muted-foreground">{semester.phase}</p></Link>)}</div></div></section>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><SectionHeading eyebrow="Popular subjects" title="Pick up where the syllabus starts" /><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{subjects.map((subject) => <Link key={subject.code} to="/resources" search={{ q: "", branch: "", semester: String(subject.semester), subject: subject.code, type: "", sort: "newest" }} className="rounded-lg border border-border bg-card p-5 transition hover:border-primary/25 hover:shadow-card"><div className="flex items-center justify-between"><span className="text-xs font-bold text-primary">{subject.code}</span><span className="text-xs text-muted-foreground">Semester {subject.semester}</span></div><h3 className="mt-3 font-display text-lg font-bold">{subject.name}</h3><p className="mt-2 text-sm text-muted-foreground">View resources</p></Link>)}</div></section>
      <section className="border-t border-border bg-secondary/35"><div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><SectionHeading eyebrow="Student favourites" title="Recently useful resources" action={<Button asChild variant="outline"><Link to="/resources">Browse library <ArrowRight /></Link></Button>} /><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{popular.data ? popular.data.items.slice(0, 3).map((resource) => <ResourceCard key={resource.id} resource={resource} />) : [0,1,2].map((i) => <ResourceCardSkeleton key={i} />)}</div></div></section>
    </>
  );
}

function Metric({ icon: Icon, value, label }: { icon: typeof BookOpen; value: string; label: string }) { return <div className="rounded-lg border border-primary-foreground/12 bg-primary-foreground/7 p-5 backdrop-blur-sm"><Icon className="size-5 text-highlight" /><p className="mt-5 font-display text-3xl font-extrabold">{value}</p><p className="mt-1 text-sm text-primary-foreground/60">{label}</p></div>; }
