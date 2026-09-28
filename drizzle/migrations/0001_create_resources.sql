CREATE TYPE public.resource_status AS ENUM ('approved','pending','rejected');
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  semester_id uuid NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN ('CT Papers','Semester Papers','PYQs','Handwritten Notes','Assignments','Important Questions','Quantum/Question Banks','Practical/Lab','Lab Manuals','Viva Questions','Project Material','Internship Material','Study Material','Other')),
  tags text[] NOT NULL DEFAULT '{}',
  file_url text,
  thumbnail_url text,
  contributor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contributor_name text NOT NULL DEFAULT 'Kaksha Hub Team',
  status public.resource_status NOT NULL DEFAULT 'pending',
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX resources_status_created_idx ON public.resources(status, created_at DESC);
CREATE INDEX resources_filter_idx ON public.resources(branch_id, semester_id, subject_id);
CREATE INDEX subjects_branch_sem_idx ON public.subjects(branch_id, semester_id);
GRANT SELECT ON public.resources TO anon, authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved resources are public" ON public.resources FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "Contributors read own resources" ON public.resources FOR SELECT TO authenticated USING (auth.uid() = contributor_id);
CREATE POLICY "Admins read all resources" ON public.resources FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER resources_touch BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE OR REPLACE FUNCTION public.increment_resource_view(_slug text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.resources SET view_count = view_count + 1 WHERE slug = _slug AND status = 'approved'
$$;
GRANT EXECUTE ON FUNCTION public.increment_resource_view(text) TO anon, authenticated;