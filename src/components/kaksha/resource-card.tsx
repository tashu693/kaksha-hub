import { Link } from "@tanstack/react-router";
import { Bookmark, Download, Eye, Heart, UserRound } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCount, type Resource } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function ResourceCard({ resource, compact = false }: { resource: Resource; compact?: boolean }) {
  const [saved, setSaved] = useState(false);
  const [helpful, setHelpful] = useState(false);
  return (
    <article className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3"><Badge variant="secondary" className="border border-primary/10 bg-primary/8 text-primary">{resource.type}</Badge><Button variant="ghost" size="icon" onClick={() => setSaved((value) => !value)} aria-label={saved ? "Remove from saved" : "Save resource"} className={cn("-mr-2 -mt-2", saved && "text-primary")}><Bookmark className={cn(saved && "fill-current")} /></Button></div>
      <Link to="/resources/$resourceId" params={{ resourceId: resource.id }} className="mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <h3 className="font-display text-lg font-bold leading-snug transition-colors group-hover:text-primary">{resource.title}</h3>
      </Link>
      <p className="mt-2 text-sm text-muted-foreground">{resource.subject} · {resource.code}</p>
      {!compact && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{resource.description}</p>}
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground"><span>{resource.branch}</span><span>•</span><span>Semester {String(resource.semester).padStart(2, "0")}</span><span>•</span><span>{resource.date}</span></div>
      <div className="mt-auto border-t border-border pt-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><UserRound className="size-3.5" /><Link to="/contributors/$contributorId" params={{ contributorId: resource.contributor.toLowerCase().replaceAll(" ", "-") }} className="font-medium hover:text-primary">{resource.contributor}</Link></div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span className="flex items-center gap-1"><Eye className="size-3.5" />{formatCount(resource.views)}</span><span className="flex items-center gap-1"><Download className="size-3.5" />{formatCount(resource.downloads)}</span><button type="button" onClick={() => setHelpful((value) => !value)} className={cn("flex cursor-pointer items-center gap-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", helpful && "text-highlight-strong")}><Heart className={cn("size-3.5", helpful && "fill-current")} />{resource.helpful + (helpful ? 1 : 0)}</button></div>
      </div>
    </article>
  );
}