import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { RESOURCE_TYPES } from "@/lib/library";

export const BUCKET = "resource-files";
export const MAX_FILE_MB = 20;
export const ALLOWED_EXT = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "jpg", "jpeg", "png", "zip"] as const;

export function validateFile(file: File | null): string | null {
  if (!file) return "Please choose a file to upload.";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!(ALLOWED_EXT as readonly string[]).includes(ext)) return `This file type isn't allowed. Use ${ALLOWED_EXT.join(", ").toUpperCase()}.`;
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `File is too large. Maximum size is ${MAX_FILE_MB} MB.`;
  if (file.size === 0) return "This file is empty.";
  return null;
}

export const parseTags = (s: string) =>
  Array.from(new Set(s.split(",").map((t) => t.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 30)).filter(Boolean))).slice(0, 10);

export const resourceDetailsSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(150, "Title must be under 150 characters."),
  type: z.enum(RESOURCE_TYPES, { message: "Please select a resource type." }),
  description: z.string().trim().min(10, "Please describe the resource (at least 10 characters).").max(2000, "Description must be under 2000 characters."),
  tags: z.string().max(400),
});

export const submissionSchema = resourceDetailsSchema.extend({
  branch: z.string().min(1, "Please select a branch."),
  semester: z.string().min(1, "Please select a semester."),
  subjectId: z.string().uuid("Please select a subject."),
});

/** Uploads with real progress using the storage REST endpoint. */
export async function uploadWithProgress(file: File, userId: string, onProgress: (pct: number) => void) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Please log in again.");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safe = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 60) || "file";
  const path = `${userId}/${crypto.randomUUID()}-${safe}.${ext}`;
  const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`;
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
    xhr.setRequestHeader("x-upsert", "false");
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed. Please try again.")));
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(file);
  });
  return path;
}

export async function createSubmission(input: z.infer<typeof submissionSchema>, filePath: string, userId: string) {
  const { data: subj, error: se } = await supabase.from("subjects").select("branch_id,semester_id").eq("id", input.subjectId).single();
  if (se || !subj) throw new Error("Selected subject was not found.");
  const { error } = await supabase.from("resources").insert({
    title: input.title, description: input.description, resource_type: input.type, tags: parseTags(input.tags),
    subject_id: input.subjectId, branch_id: subj.branch_id, semester_id: subj.semester_id,
    file_path: filePath, contributor_id: userId, status: "pending",
  });
  if (error) { await supabase.storage.from(BUCKET).remove([filePath]); throw new Error(friendlyDbError(error.message)); }
}

export async function updateSubmission(id: string, input: z.infer<typeof resourceDetailsSchema>) {
  const { error } = await supabase.from("resources").update({
    title: input.title, description: input.description, resource_type: input.type, tags: parseTags(input.tags), status: "pending",
  }).eq("id", id);
  if (error) throw new Error(friendlyDbError(error.message));
}

export async function deleteSubmission(id: string, filePath: string | null) {
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) throw new Error(friendlyDbError(error.message));
  if (filePath) await supabase.storage.from(BUCKET).remove([filePath]);
}

export async function openResourceFile(filePath: string | null, fileUrl: string | null) {
  if (filePath) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, 600);
    if (error || !data) throw new Error("Couldn't open this file right now.");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  } else if (fileUrl) window.open(fileUrl, "_blank", "noopener,noreferrer");
}

function friendlyDbError(m: string) {
  if (/row-level security|permission/i.test(m)) return "You don't have permission to do that.";
  if (/subject does not match/i.test(m)) return "The subject doesn't belong to the selected branch and semester.";
  if (/rejection reason/i.test(m)) return "Please enter a rejection reason.";
  return m.length < 120 ? m : "Something went wrong. Please try again.";
}

export type Submission = {
  id: string; slug: string; title: string; type: string; description: string; tags: string[];
  subject: string; code: string; branch: string; semester: number; status: "pending" | "approved" | "rejected";
  rejectionReason: string | null; createdAt: string; filePath: string | null; fileUrl: string | null; contributor: string;
};

const SUB_SELECT = "id,slug,title,resource_type,description,tags,status,rejection_reason,created_at,file_path,file_url,contributor_name,subjects!inner(name,code),branches!inner(code),semesters!inner(number)";
type SubRow = { id: string; slug: string; title: string; resource_type: string; description: string; tags: string[]; status: Submission["status"]; rejection_reason: string | null; created_at: string; file_path: string | null; file_url: string | null; contributor_name: string; subjects: { name: string; code: string }; branches: { code: string }; semesters: { number: number } };
const toSub = (r: SubRow): Submission => ({ id: r.id, slug: r.slug, title: r.title, type: r.resource_type, description: r.description, tags: r.tags ?? [], subject: r.subjects.name, code: r.subjects.code, branch: r.branches.code, semester: r.semesters.number, status: r.status, rejectionReason: r.rejection_reason, createdAt: r.created_at, filePath: r.file_path, fileUrl: r.file_url, contributor: r.contributor_name });

export const myContributionsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["my-contributions", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("resources").select(SUB_SELECT).eq("contributor_id", userId!).order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data as unknown as SubRow[]).map(toSub);
    },
  });

export const pendingQuery = () =>
  queryOptions({
    queryKey: ["admin", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase.from("resources").select(SUB_SELECT).eq("status", "pending").order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data as unknown as SubRow[]).map(toSub);
    },
  });

export const adminStatsQuery = () =>
  queryOptions({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const c = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);
      const [students, total, pending, approved, rejected] = await Promise.all([
        c(supabase.from("profiles").select("id", { count: "exact", head: true })),
        c(supabase.from("resources").select("id", { count: "exact", head: true })),
        c(supabase.from("resources").select("id", { count: "exact", head: true }).eq("status", "pending")),
        c(supabase.from("resources").select("id", { count: "exact", head: true }).eq("status", "approved")),
        c(supabase.from("resources").select("id", { count: "exact", head: true }).eq("status", "rejected")),
      ]);
      return { students, total, pending, approved, rejected };
    },
  });

export async function moderate(id: string, status: "approved" | "rejected", reason?: string) {
  const { error } = await supabase.from("resources").update({ status, rejection_reason: status === "rejected" ? reason?.trim().slice(0, 500) ?? "" : null }).eq("id", id);
  if (error) throw new Error(friendlyDbError(error.message));
}

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
