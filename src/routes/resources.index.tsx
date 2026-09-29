import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { PageHeader, fieldClass } from "@/components/kaksha/page-ui";
import { ResourceCard, ResourceCardSkeleton } from "@/components/kaksha/resource-card";
import { branchesQuery, PAGE_SIZE, RESOURCE_TYPES, resourcesQuery, subjectsQuery } from "@/lib/library";
import { pageMeta } from "@/lib/route-meta";

const s = z.coerce.string().optional();
const schema = z.object({ q: s, branch: s, semester: s, subject: s, type: s, sort: s, page: z.coerce.number().int().min(1).optional() });
export const Route = createFileRoute("/resources/")({ validateSearch: (search) => schema.parse(search), head: () => pageMeta("Resource Library", "Search and filter AKTU notes, papers, assignments, practical files and study material."), component: ResourcesPage });

function ResourcesPage() {
  const search = Route.useSearch(); const navigate = Route.useNavigate();
  const [text, setText] = useState(search.q ?? "");
  const [open, setOpen] = useState(false);
  useEffect(() => { setText(search.q ?? ""); }, [search.q]);
  useEffect(() => { const t = setTimeout(() => { if (text !== (search.q ?? "")) navigate({ search: (p) => ({ ...p, q: text, page: undefined }), replace: true }); }, 350); return () => clearTimeout(t); }, [text]); // eslint-disable-line react-hooks/exhaustive-deps
  const update = (patch: Partial<typeof search>) => navigate({ search: (p) => ({ ...p, ...patch, page: undefined }) });
  const branches = useQuery(branchesQuery());
  const subjects = useQuery(subjectsQuery(search.branch, search.semester));
  const res = useQuery({ ...resourcesQuery({ ...search }), placeholderData: keepPreviousData });
  const page = search.page ?? 1; const total = res.data?.total ?? 0; const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const active = !!(search.q || search.branch || search.semester || search.subject || search.type || (search.sort && search.sort !== "newest"));
  const clear = () => { setText(""); navigate({ search: {} }); };
  return <><PageHeader eyebrow="Resource library" title="Everything you need to study smarter" description="Search across curated student contributions and narrow results to exactly what your syllabus needs." /><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="rounded-lg border border-border bg-card p-4 shadow-card"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm font-bold"><SlidersHorizontal className="size-4 text-primary" />Filter resources</div><div className="flex gap-2">{active && <Button variant="ghost" size="sm" onClick={clear}><X />Clear filters</Button>}<Button variant="outline" size="sm" className="md:hidden" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? "Hide" : "Show"} filters</Button></div></div><label className="relative mt-4 block"><span className="sr-only">Search resources</span><Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><input className={`${fieldClass} pl-9`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Search by title, subject or subject code" /></label><div className={`mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 ${open ? "" : "hidden md:grid"}`}><Select label="Branch" value={search.branch} onChange={(v) => update({ branch: v, subject: "" })} options={(branches.data ?? []).map((b) => [b.code, `${b.code} — ${b.name}`])} /><Select label="Semester" value={search.semester} onChange={(v) => update({ semester: v, subject: "" })} options={Array.from({ length: 8 }, (_, i) => [String(i + 1), `Semester ${String(i + 1).padStart(2, "0")}`])} /><Select label="Subject" value={search.subject} onChange={(v) => update({ subject: v })} options={(subjects.data ?? []).map((s) => [s.code, `${s.name} (${s.code})`])} /><Select label="Resource type" value={search.type} onChange={(v) => update({ type: v })} options={RESOURCE_TYPES.map((v) => [v, v])} /><Select label="Sort" noAll value={search.sort ?? "newest"} onChange={(v) => update({ sort: v })} options={[["newest", "Recently added"], ["popular", "Most viewed"]]} /></div></div>
    <div className="mt-8"><p className="text-sm text-muted-foreground" aria-live="polite">{res.isLoading ? "Loading resources…" : <><strong className="text-foreground">{total}</strong> resources found</>}</p></div>
    {res.isError ? <div className="mt-6 rounded-lg border border-destructive/30 p-10 text-center"><p className="font-display text-lg font-bold">We couldn't load resources</p><p className="mt-2 text-sm text-muted-foreground">Please check your connection and try again.</p><Button className="mt-4" onClick={() => res.refetch()}>Try again</Button></div>
      : res.isLoading ? <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <ResourceCardSkeleton key={i} />)}</div>
      : res.data && res.data.items.length ? <><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{res.data.items.map((r) => <ResourceCard key={r.id} resource={r} />)}</div>{pages > 1 && <div className="mt-8 flex items-center justify-center gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => navigate({ search: (p) => ({ ...p, page: page - 1 }) })}>Previous</Button><span className="text-sm text-muted-foreground">Page {page} of {pages}</span><Button variant="outline" disabled={page >= pages} onClick={() => navigate({ search: (p) => ({ ...p, page: page + 1 }) })}>Next</Button></div>}</>
      : <div className="mt-6 rounded-lg border border-dashed border-border p-16 text-center"><p className="font-display text-lg font-bold">No matching resources</p><p className="mt-2 text-sm text-muted-foreground">Try clearing one or more filters.</p>{active && <Button className="mt-4" variant="outline" onClick={clear}>Clear filters</Button>}</div>}
  </div></>;
}
function Select({ label, value, onChange, options, noAll }: { label: string; value: string | undefined; onChange: (value: string) => void; options: string[][]; noAll?: boolean }) { return <label><span className="sr-only">{label}</span><select className={fieldClass} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>{!noAll && <option value="">All {label.toLowerCase()}s</option>}{options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>; }
