import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const RESOURCE_TYPES = [
  "CT Papers", "Semester Papers", "PYQs", "Handwritten Notes", "Assignments",
  "Important Questions", "Quantum/Question Banks", "Practical/Lab", "Lab Manuals",
  "Viva Questions", "Project Material", "Internship Material", "Study Material", "Other",
] as const;

export const PAGE_SIZE = 12;

export type LibraryResource = {
  id: string;
  title: string;
  type: string;
  subject: string;
  code: string;
  branch: string;
  semester: number;
  contributor: string;
  date: string;
  views: number;
  description: string;
  tags: string[];
  fileUrl: string | null;
  filePath: string | null;
};

export type SubjectItem = { id: string; name: string; code: string; branch: string; semester: number };

const RESOURCE_SELECT =
  "slug,title,description,resource_type,tags,file_url,file_path,contributor_name,view_count,created_at,subjects!inner(name,code),branches!inner(code),semesters!inner(number)";

type Row = {
  slug: string; title: string; description: string; resource_type: string; tags: string[]; file_url: string | null; file_path: string | null;
  contributor_name: string; view_count: number; created_at: string;
  subjects: { name: string; code: string }; branches: { code: string }; semesters: { number: number };
};

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

function toResource(r: Row): LibraryResource {
  return {
    id: r.slug, title: r.title, type: r.resource_type, subject: r.subjects.name, code: r.subjects.code,
    branch: r.branches.code, semester: r.semesters.number, contributor: r.contributor_name, date: fmtDate(r.created_at),
    views: r.view_count, description: r.description, tags: r.tags ?? [], fileUrl: r.file_url, filePath: r.file_path,
  };
}

export type ResourceFilters = { q?: string | undefined; branch?: string | undefined; semester?: string | undefined; subject?: string | undefined; type?: string | undefined; sort?: string | undefined; page?: number | undefined };

export const resourcesQuery = (f: ResourceFilters) =>
  queryOptions({
    queryKey: ["resources", f],
    queryFn: async () => {
      let query = supabase.from("resources").select(RESOURCE_SELECT, { count: "exact" }).eq("status", "approved");
      if (f.branch) query = query.eq("branches.code", f.branch);
      if (f.semester) query = query.eq("semesters.number", Number(f.semester));
      if (f.subject) query = query.eq("subjects.code", f.subject);
      if (f.type) query = query.eq("resource_type", f.type);
      const q = (f.q ?? "").replace(/[%,()*\\]/g, " ").trim().slice(0, 80);
      if (q) {
        const { data: subs } = await supabase.from("subjects").select("id").or(`name.ilike.%${q}%,code.ilike.%${q}%`).limit(200);
        const ids = (subs ?? []).map((s) => s.id);
        query = query.or(ids.length ? `title.ilike.%${q}%,subject_id.in.(${ids.join(",")})` : `title.ilike.%${q}%`);
      }
      query = f.sort === "popular" ? query.order("view_count", { ascending: false }) : query.order("created_at", { ascending: false });
      const page = Math.max(1, f.page ?? 1);
      const { data, error, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      if (error) throw new Error(error.message);
      return { items: (data as unknown as Row[]).map(toResource), total: count ?? 0 };
    },
  });

export async function fetchResource(slug: string) {
  const { data, error } = await supabase.from("resources").select(RESOURCE_SELECT).eq("slug", slug).eq("status", "approved").maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toResource(data as unknown as Row) : null;
}

export async function fetchRelated(item: LibraryResource) {
  const { data, error } = await supabase.from("resources").select(RESOURCE_SELECT).eq("status", "approved").eq("branches.code", item.branch).neq("slug", item.id).order("view_count", { ascending: false }).limit(3);
  if (error) throw new Error(error.message);
  return (data as unknown as Row[]).map(toResource);
}

export const recordView = (slug: string) => supabase.rpc("increment_resource_view", { _slug: slug });

export const branchesQuery = () =>
  queryOptions({
    queryKey: ["branches"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const [{ data, error }, { data: res }] = await Promise.all([
        supabase.from("branches").select("id,code,name").order("name"),
        supabase.from("resources").select("branch_id").eq("status", "approved").limit(2000),
      ]);
      if (error) throw new Error(error.message);
      const counts = new Map<string, number>();
      (res ?? []).forEach((r) => counts.set(r.branch_id, (counts.get(r.branch_id) ?? 0) + 1));
      const list = (data ?? []).map((b) => ({ code: b.code, name: b.name, count: counts.get(b.id) ?? 0 }));
      return [...list.filter((b) => b.code !== "OTH"), ...list.filter((b) => b.code === "OTH")];
    },
  });

export const subjectsQuery = (branch?: string | undefined, semester?: string | undefined) =>
  queryOptions({
    queryKey: ["subjects", branch ?? "", semester ?? ""],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      let query = supabase.from("subjects").select("id,name,code,branches!inner(code),semesters!inner(number)").order("name").limit(300);
      if (branch) query = query.eq("branches.code", branch);
      if (semester) query = query.eq("semesters.number", Number(semester));
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data as unknown as { id: string; name: string; code: string; branches: { code: string }; semesters: { number: number } }[]).map(
        (s): SubjectItem => ({ id: s.id, name: s.name, code: s.code, branch: s.branches.code, semester: s.semesters.number }),
      );
    },
  });

export const emptySearch = { q: "", branch: "", semester: "", subject: "", type: "", sort: "newest" };
