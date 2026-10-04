import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCircle2, Clock3, Download, ThumbsUp, Trophy, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/kaksha/page-ui";
import { useAuth } from "@/lib/auth";
import { markRead, notificationsQuery, timeAgo } from "@/lib/engagement";
import { pageMeta } from "@/lib/route-meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({ head: () => pageMeta("Notifications", "Review Kaksha Hub resource updates and contribution activity."), component: Notifications });

const ICONS: Record<string, typeof Bell> = { approved: CheckCircle2, rejected: XCircle, helpful: ThumbsUp, resource_100: Download, milestone: Trophy, submitted: Clock3 };

function Notifications() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const q = useQuery(notificationsQuery(user?.id));
  const unread = (q.data ?? []).filter((n) => !n.is_read).length;
  const mark = async (id?: string) => {
    if (!user) return;
    try { await markRead(user.id, id); await qc.invalidateQueries({ queryKey: ["notifications"] }); } catch (e) { toast.error((e as Error).message); }
  };
  return <><PageHeader eyebrow="Updates" title="Notifications" description="Contribution reviews, helpful reactions and download milestones." actions={user && unread > 0 ? <Button variant="outline" onClick={() => mark()}><Check />Mark all as read</Button> : undefined} />
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {!loading && !user ? <div className="text-center"><p className="text-sm text-muted-foreground">Log in to see your notifications.</p><Button asChild className="mt-4"><Link to="/login">Log in</Link></Button></div>
        : q.isLoading || loading ? <p className="py-10 text-center text-sm text-muted-foreground">Loading notifications…</p>
        : q.isError ? <p className="py-10 text-center text-sm text-destructive">Couldn't load notifications. Please refresh.</p>
        : !q.data?.length ? <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"><Bell className="size-4" />No notifications yet.</div>
        : <><div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">{q.data.map((n) => { const Icon = ICONS[n.type] ?? Bell; return (
            <button key={n.id} onClick={() => !n.is_read && mark(n.id)} className={cn("flex w-full cursor-pointer gap-4 border-b border-border p-4 text-left last:border-0 hover:bg-secondary/50 sm:p-5", !n.is_read && "bg-primary/5")}>
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground", !n.is_read && "bg-primary/10 text-primary")}><Icon className="size-4" /></span>
              <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><strong className="text-sm">{n.title}</strong>{!n.is_read && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}</span><span className="mt-1 block break-words text-sm text-muted-foreground">{n.message}</span><span className="mt-2 block text-xs text-muted-foreground">{timeAgo(n.created_at)}</span></span>
            </button>); })}</div>
          {unread === 0 && <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground"><Bell className="size-3.5" />You're all caught up.</div>}</>}
    </div></>;
}
