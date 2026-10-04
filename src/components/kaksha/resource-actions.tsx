import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Download, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { downloadResource, myReactionsQuery, refreshEngagement, setHelpful, setSaved } from "@/lib/engagement";
import type { LibraryResource } from "@/lib/library";
import { cn } from "@/lib/utils";

type R = Pick<LibraryResource, "uuid" | "helpful" | "filePath" | "fileUrl">;

/** Helpful / Save / Download buttons, shared by cards and the details page. */
export function ResourceActions({ resource, size = "sm", className }: { resource: R; size?: "sm" | "lg"; className?: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const mine = useQuery(myReactionsQuery(user?.id));
  const [busy, setBusy] = useState<string | null>(null);
  const isHelpful = mine.data?.helpful.has(resource.uuid) ?? false;
  const isSaved = mine.data?.saved.has(resource.uuid) ?? false;
  const [delta, setDelta] = useState(0);

  const run = async (key: string, fn: () => Promise<void>, ok?: string) => {
    if (!user) return toast.info("Log in to use this.", { description: "Create a free account to save, download and react." });
    setBusy(key);
    try { await fn(); if (ok) toast.success(ok); await refreshEngagement(qc); setDelta(0); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  };
  const toggleHelpful = () => run("helpful", async () => { setDelta(isHelpful ? -1 : 1); await setHelpful(user!.id, resource.uuid, !isHelpful); }, isHelpful ? undefined : "Marked as helpful");
  const toggleSave = () => run("save", () => setSaved(user!.id, resource.uuid, !isSaved), isSaved ? "Removed from saved" : "Saved to My Resources");
  const download = () => run("download", () => downloadResource(resource));
  const hasFile = !!(resource.filePath || resource.fileUrl);
  const s = size === "lg" ? "default" : "sm";

  return <div className={cn("flex flex-wrap gap-2", className)}>
    <Button type="button" size={s} variant={isHelpful ? "default" : "outline"} aria-pressed={isHelpful} disabled={busy === "helpful"} onClick={toggleHelpful}><ThumbsUp className={cn(isHelpful && "fill-current")} />Helpful · {resource.helpful + delta}</Button>
    <Button type="button" size={s} variant={isSaved ? "default" : "outline"} aria-pressed={isSaved} disabled={busy === "save"} onClick={toggleSave}><Bookmark className={cn(isSaved && "fill-current")} />{isSaved ? "Saved" : "Save"}</Button>
    {hasFile && <Button type="button" size={s} variant="outline" disabled={busy === "download"} onClick={download}><Download />{busy === "download" ? "Opening…" : "Download"}</Button>}
  </div>;
}
