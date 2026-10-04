import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RESOURCE_SELECT, toResource, type LibraryResource, type Row } from "@/lib/library";
import { openResourceFile } from "@/lib/contributions";

/** Which resources the signed-in user has marked helpful / saved. */
export const myReactionsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["reactions", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const [h, s] = await Promise.all([
        supabase.from("resource_helpful").select("resource_id").eq("user_id", userId!),
        supabase.from("saved_resources").select("resource_id").eq("user_id", userId!),
      ]);
      if (h.error || s.error) throw new Error("Couldn't load your activity.");
      return { helpful: new Set(h.data.map((r) => r.resource_id)), saved: new Set(s.data.map((r) => r.resource_id)) };
    },
  });

export async function setHelpful(userId: string, resourceId: string, on: boolean) {
  const { error } = on
    ? await supabase.from("resource_helpful").insert({ user_id: userId, resource_id: resourceId })
    : await supabase.from("resource_helpful").delete().eq("user_id", userId).eq("resource_id", resourceId);
  if (error && !/duplicate/i.test(error.message)) throw new Error("Couldn't update. Please try again.");
}

export async function setSaved(userId: string, resourceId: string, on: boolean) {
  const { error } = on
    ? await supabase.from("saved_resources").insert({ user_id: userId, resource_id: resourceId })
    : await supabase.from("saved_resources").delete().eq("user_id", userId).eq("resource_id", resourceId);
  if (error && !/duplicate/i.test(error.message)) throw new Error("Couldn't update. Please try again.");
}

export async function downloadResource(r: Pick<LibraryResource, "uuid" | "filePath" | "fileUrl">) {
  const { error } = await supabase.rpc("record_download", { _resource_id: r.uuid });
  if (error) throw new Error(/log in/i.test(error.message) ? "Please log in to download." : "This resource isn't available for download.");
  await openResourceFile(r.filePath, r.fileUrl);
}

/** Refresh everything that shows engagement counts. */
export const refreshEngagement = (qc: QueryClient) =>
  Promise.all(["reactions", "resources", "related", "resource", "my-lists", "dashboard-stats", "contributor"].map((k) => qc.invalidateQueries({ queryKey: [k] })));

type ListKind = "saved" | "downloads" | "recent";
const LIST: Record<ListKind, { table: "saved_resources" | "resource_downloads" | "recently_viewed"; at: string }> = {
  saved: { table: "saved_resources", at: "created_at" },
  downloads: { table: "resource_downloads", at: "downloaded_at" },
  recent: { table: "recently_viewed", at: "viewed_at" },
};

export const myListQuery = (kind: ListKind, userId: string | undefined, limit = 30) =>
  queryOptions({
    queryKey: ["my-lists", kind, userId, limit],
    enabled: !!userId,
    queryFn: async () => {
      const { table, at } = LIST[kind];
      const { data, error } = await supabase.from(table).select(`${at},resources!inner(${RESOURCE_SELECT})`).eq("user_id", userId!).eq("resources.status", "approved").order(at, { ascending: false }).limit(limit);
      if (error) throw new Error(error.message);
      const seen = new Set<string>();
      return (data as unknown as { resources: Row }[]).map((d) => toResource(d.resources)).filter((r) => (seen.has(r.uuid) ? false : (seen.add(r.uuid), true)));
    },
  });

export const dashboardStatsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["dashboard-stats", userId],
    enabled: !!userId,
    queryFn: async () => {
      const c = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);
      const [downloads, saved, impact] = await Promise.all([
        c(supabase.from("resource_downloads").select("id", { count: "exact", head: true }).eq("user_id", userId!)),
        c(supabase.from("saved_resources").select("id", { count: "exact", head: true }).eq("user_id", userId!)),
        supabase.rpc("get_contributor", { _id: userId! }),
      ]);
      const s = impact.data?.[0];
      return { downloads, saved, impact: { shared: s?.shared ?? 0, approved: s?.approved ?? 0, downloads: s?.downloads ?? 0, helpful: s?.helpful ?? 0, reached: s?.reached ?? 0 } };
    },
  });

export type ContributorStats = { approved: number; downloads: number; helpful: number };
/** Transparent badge rules — based only on counts stored in the database. */
export const BADGE_RULES = [
  { name: "Top Contributor", rule: "10+ approved resources and 100+ downloads", test: (s: ContributorStats) => s.approved >= 10 && s.downloads >= 100 },
  { name: "Helpful Contributor", rule: "25+ helpful likes", test: (s: ContributorStats) => s.helpful >= 25 },
  { name: "Active Contributor", rule: "5+ approved resources", test: (s: ContributorStats) => s.approved >= 5 },
  { name: "New Contributor", rule: "1+ approved resource", test: (s: ContributorStats) => s.approved >= 1 },
] as const;
export const badgeFor = (s: ContributorStats) => BADGE_RULES.find((b) => b.test(s)) ?? null;

export const contributorQuery = (id: string) =>
  queryOptions({
    queryKey: ["contributor", id],
    queryFn: async () => {
      const [{ data, error }, res] = await Promise.all([
        supabase.rpc("get_contributor", { _id: id }),
        supabase.from("resources").select(RESOURCE_SELECT).eq("status", "approved").eq("contributor_id", id).order("created_at", { ascending: false }).limit(30),
      ]);
      if (error) throw new Error(error.message);
      const p = data?.[0];
      if (!p) return null;
      return { profile: p, resources: ((res.data ?? []) as unknown as Row[]).map(toResource) };
    },
  });

export type Notification = { id: string; type: string; title: string; message: string; is_read: boolean; created_at: string; resource_id: string | null };

export const notificationsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("id,type,title,message,is_read,created_at,resource_id").eq("user_id", userId!).order("created_at", { ascending: false }).limit(50);
      if (error) throw new Error(error.message);
      return data as Notification[];
    },
  });

export const unreadCountQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["notifications", userId, "unread"],
    enabled: !!userId,
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId!).eq("is_read", false);
      return count ?? 0;
    },
  });

export async function markRead(userId: string, id?: string) {
  let q = supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  if (id) q = q.eq("id", id);
  const { error } = await q;
  if (error) throw new Error("Couldn't update notifications.");
}

export const timeAgo = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};
