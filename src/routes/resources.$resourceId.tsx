import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Eye, FileText, Tag } from "lucide-react";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResourceCard } from "@/components/kaksha/resource-card";
import { fetchRelated, fetchResource, recordView } from "@/lib/library";
import { pageMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/resources/$resourceId")({
  loader: async ({ params }) => { const item = await fetchResource(params.resourceId); if (!item) throw notFound(); return { item }; },
  head: ({ loaderData }) => loaderData ? pageMeta(loaderData.item.title, loaderData.item.description || "View this AKTU study resource on Kaksha Hub.") : { meta: [{ title: "Resource unavailable — Kaksha Hub" }, { name: "robots", content: "noindex" }] },
  notFoundComponent: () => <Message title="Resource not found" text="This resource doesn't exist or isn't available yet." />,
  errorComponent: () => <Message title="Something went wrong" text="We couldn't load this resource. Please try again." />,
  component: ResourceDetails,
});

function Message({ title, text }: { title: string; text: string }) { return <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="font-display text-2xl font-bold">{title}</h1><p className="mt-2 text-muted-foreground">{text}</p><Button asChild className="mt-6"><Link to="/resources">Back to library</Link></Button></div>; }

function ResourceDetails() {
  const { item } = Route.useLoaderData();
  useEffect(() => { void recordView(item.id); }, [item.id]);
  const related = useQuery({ queryKey: ["related", item.id], queryFn: () => fetchRelated(item) });
  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><nav className="text-sm text-muted-foreground"><Link to="/resources" className="hover:text-primary">Resources</Link> / <Link to="/resources" search={{ branch: item.branch, semester: String(item.semester), subject: item.code }} className="hover:text-primary">{item.subject}</Link></nav>
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]"><section><div className="overflow-hidden rounded-lg border border-border bg-secondary shadow-card"><div className="flex h-12 items-center gap-2 border-b border-border bg-card px-4 text-sm font-semibold"><FileText className="size-4 text-primary" />Document preview</div><div className="grid min-h-[420px] place-items-center p-6 sm:p-12"><div className="w-full max-w-xl bg-background p-8 shadow-lg"><p className="text-xs font-bold uppercase tracking-widest text-primary">{item.code} · {item.type}</p><h2 className="mt-5 font-display text-2xl font-bold">{item.subject}</h2><p className="mt-2 text-sm text-muted-foreground">{item.title}</p><p className="mt-8 text-sm text-muted-foreground">Sample material — the full file preview will be available once uploads are enabled.</p></div></div></div></section>
      <aside><Badge className="bg-primary/10 text-primary hover:bg-primary/10">{item.type}</Badge><h1 className="mt-4 font-display text-3xl font-extrabold leading-tight">{item.title}</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p><p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><Eye className="size-4 text-primary" /><strong className="text-foreground">{item.views}</strong> views</p>
        {item.fileUrl && <Button asChild size="lg" className="mt-6 w-full"><a href={item.fileUrl} target="_blank" rel="noopener noreferrer"><ExternalLink />Open resource</a></Button>}
        {item.tags.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{item.tags.map((t) => <span key={t} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium"><Tag className="size-3" />{t}</span>)}</div>}
        <dl className="mt-7 space-y-3 rounded-lg bg-secondary p-5 text-sm"><Row term="Subject" detail={`${item.subject} (${item.code})`} /><Row term="Branch" detail={item.branch} /><Row term="Semester" detail={String(item.semester).padStart(2, "0")} /><Row term="Added" detail={item.date} /><Row term="Contributor" detail={item.contributor} /></dl></aside></div>
    <div className="mt-20"><h2 className="font-display text-2xl font-extrabold">You may also find useful</h2>{related.data?.length ? <div className="mt-6 grid gap-4 md:grid-cols-3">{related.data.map((r) => <ResourceCard key={r.id} resource={r} compact />)}</div> : <p className="mt-4 text-sm text-muted-foreground">{related.isLoading ? "Loading…" : "No related resources yet."}</p>}</div></div>;
}
function Row({ term, detail }: { term: string; detail: string }) { return <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{term}</dt><dd className="text-right font-semibold">{detail}</dd></div>; }
