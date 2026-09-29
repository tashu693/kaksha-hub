import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronRight } from "lucide-react";
import { z } from "zod";
import { PageHeader, SectionHeading } from "@/components/kaksha/page-ui";
import { subjectsQuery } from "@/lib/library";
import { pageMeta } from "@/lib/route-meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/semester")({ validateSearch: (search) => z.object({ branch: z.coerce.string().optional(), semester: z.coerce.string().optional() }).parse(search), head: () => pageMeta("Semester Explorer", "Choose an AKTU semester and explore subjects and study resources."), component: SemesterPage });

function SemesterPage() {
  const { branch = "CSE", semester } = Route.useSearch();
  const subjects = useQuery({ ...subjectsQuery(branch, semester), enabled: !!semester });
  return <><PageHeader eyebrow={`${branch} study path`} title="Choose your semester" description="Pick a semester to see its subjects, then open the study material for any subject." /><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 8 }, (_, i) => String(i + 1)).map((n) => <Link key={n} to="/semester" search={{ branch, semester: n }} className={cn("group rounded-lg border border-border bg-card p-5 shadow-card transition hover:-translate-y-1 hover:border-primary/30", semester === n && "border-primary ring-2 ring-primary/30")}><div className="flex items-start justify-between"><h2 className="font-display text-3xl font-extrabold text-primary">{n.padStart(2, "0")}</h2><ChevronRight className="text-muted-foreground group-hover:text-primary" /></div><p className="mt-3 text-sm font-semibold">Semester {n}</p></Link>)}</div>
    <div className="mt-16">{!semester ? <p className="text-center text-muted-foreground">Select a semester above to see its subjects.</p> : <><SectionHeading eyebrow={`${branch} · Semester ${semester.padStart(2, "0")}`} title="Subjects" description="Starter subject list — not the complete official AKTU syllabus." />{subjects.isLoading ? <p className="text-sm text-muted-foreground">Loading subjects…</p> : subjects.isError ? <p className="text-sm text-destructive">Couldn't load subjects. Please try again.</p> : subjects.data?.length ? <div className="grid gap-4 md:grid-cols-3">{subjects.data.map((s) => <Link key={s.id} to="/resources" search={{ branch, semester, subject: s.code }} className="rounded-lg border border-border bg-secondary/50 p-5 transition hover:border-primary/30"><BookOpen className="size-5 text-primary" /><h3 className="mt-5 font-display font-bold">{s.name}</h3><p className="mt-1 text-sm text-muted-foreground">{s.code} · View resources</p></Link>)}</div> : <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No subjects added for this semester yet. <Link to="/resources" search={{ branch, semester }} className="font-semibold text-primary">Browse resources instead</Link></div>}</>}</div></div></>;
}
