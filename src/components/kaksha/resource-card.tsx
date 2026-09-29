import { Link } from "@tanstack/react-router";
import { Eye, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LibraryResource } from "@/lib/library";

type CardResource = Pick<LibraryResource, "id" | "title" | "type" | "subject" | "code" | "branch" | "semester" | "contributor" | "date" | "views" | "description">;

export function ResourceCard({ resource, compact = false }: { resource: CardResource; compact?: boolean }) {
  return (
    <article className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3"><Badge variant="secondary" className="border border-primary/10 bg-primary/8 text-primary">{resource.type}</Badge></div>
      <Link to="/resources/$resourceId" params={{ resourceId: resource.id }} className="mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <h3 className="font-display text-lg font-bold leading-snug transition-colors group-hover:text-primary">{resource.title}</h3>
      </Link>
      <p className="mt-2 text-sm text-muted-foreground">{resource.subject} · {resource.code}</p>
      {!compact && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{resource.description}</p>}
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground"><span>{resource.branch}</span><span>•</span><span>Semester {String(resource.semester).padStart(2, "0")}</span><span>•</span><span>{resource.date}</span></div>
      <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><UserRound className="size-3.5" /><span className="font-medium">{resource.contributor}</span></span>
        <span className="flex items-center gap-1"><Eye className="size-3.5" />{resource.views}</span>
      </div>
    </article>
  );
}

export function ResourceCardSkeleton() {
  return <div className="h-56 animate-pulse rounded-lg border border-border bg-card p-5"><div className="h-5 w-24 rounded bg-secondary" /><div className="mt-5 h-5 w-4/5 rounded bg-secondary" /><div className="mt-3 h-4 w-1/2 rounded bg-secondary" /><div className="mt-8 h-4 w-2/3 rounded bg-secondary" /></div>;
}
