ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS file_path text;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.resources ALTER COLUMN slug SET DEFAULT ('r-' || substr(replace(gen_random_uuid()::text,'-',''),1,12));

GRANT SELECT ON public.resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;

CREATE OR REPLACE FUNCTION public.guard_resource_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare is_admin boolean := public.has_role(auth.uid(), 'admin');
begin
  if auth.uid() is null then return new; end if; -- service/maintenance
  if tg_op = 'INSERT' then
    if not is_admin then
      new.contributor_id := auth.uid();
      new.status := 'pending';
      new.view_count := 0;
      new.rejection_reason := null;
      new.reviewed_at := null;
    end if;
    select coalesce(nullif(full_name,''), 'Student') into new.contributor_name from public.profiles where id = new.contributor_id;
    if new.contributor_name is null then new.contributor_name := 'Student'; end if;
    return new;
  end if;
  -- UPDATE
  new.id := old.id; new.slug := old.slug; new.created_at := old.created_at;
  new.contributor_id := old.contributor_id; new.contributor_name := old.contributor_name; new.view_count := old.view_count;
  if is_admin then
    if new.status is distinct from old.status then new.reviewed_at := now(); end if;
    if new.status <> 'rejected' then new.rejection_reason := null; end if;
  else
    -- contributor edit always goes back to review
    new.status := 'pending'; new.rejection_reason := null; new.reviewed_at := null;
  end if;
  return new;
end $$;

CREATE TRIGGER resources_guard BEFORE INSERT OR UPDATE ON public.resources
FOR EACH ROW EXECUTE FUNCTION public.guard_resource_write();

CREATE OR REPLACE FUNCTION public.validate_resource()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
begin
  if length(trim(new.title)) < 3 or length(new.title) > 150 then raise exception 'Title must be 3-150 characters'; end if;
  if length(new.description) > 2000 then raise exception 'Description too long'; end if;
  if coalesce(array_length(new.tags,1),0) > 10 then raise exception 'Too many tags'; end if;
  if not exists (select 1 from public.subjects s where s.id = new.subject_id and s.branch_id = new.branch_id and s.semester_id = new.semester_id) then
    raise exception 'Subject does not match branch and semester';
  end if;
  if new.status = 'rejected' and coalesce(trim(new.rejection_reason),'') = '' then raise exception 'Rejection reason required'; end if;
  return new;
end $$;

CREATE TRIGGER resources_validate BEFORE INSERT OR UPDATE ON public.resources
FOR EACH ROW EXECUTE FUNCTION public.validate_resource();

CREATE POLICY "Students submit own resources" ON public.resources FOR INSERT TO authenticated
WITH CHECK (auth.uid() = contributor_id AND status = 'pending');
CREATE POLICY "Contributors edit own resources" ON public.resources FOR UPDATE TO authenticated
USING (auth.uid() = contributor_id) WITH CHECK (auth.uid() = contributor_id AND status = 'pending');
CREATE POLICY "Contributors delete own pending" ON public.resources FOR DELETE TO authenticated
USING (auth.uid() = contributor_id AND status = 'pending');
CREATE POLICY "Admins update resources" ON public.resources FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete resources" ON public.resources FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin'));

-- Storage: files live under <user_id>/...
CREATE POLICY "Users upload to own folder" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resource-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users read own files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resource-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'resource-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins read all resource files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resource-files' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Anyone reads approved resource files" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'resource-files' AND EXISTS (SELECT 1 FROM public.resources r WHERE r.file_path = storage.objects.name AND r.status = 'approved'));