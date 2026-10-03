ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS helpful_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS download_count integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS resources_contributor_idx ON public.resources(contributor_id);
CREATE INDEX IF NOT EXISTS resources_status_created_idx ON public.resources(status, created_at DESC);

-- system-maintained counter updates bypass the contributor guard
CREATE OR REPLACE FUNCTION public.guard_resource_write()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare is_admin boolean := public.has_role(auth.uid(), 'admin');
begin
  if auth.uid() is null then return new; end if;
  if tg_op = 'UPDATE' and coalesce(current_setting('kaksha.system', true), '') = 'on' then return new; end if;
  if tg_op = 'INSERT' then
    if not is_admin then
      new.contributor_id := auth.uid(); new.status := 'pending'; new.view_count := 0;
      new.helpful_count := 0; new.download_count := 0; new.rejection_reason := null; new.reviewed_at := null;
    end if;
    select coalesce(nullif(full_name,''), 'Student') into new.contributor_name from public.profiles where id = new.contributor_id;
    if new.contributor_name is null then new.contributor_name := 'Student'; end if;
    return new;
  end if;
  new.id := old.id; new.slug := old.slug; new.created_at := old.created_at;
  new.contributor_id := old.contributor_id; new.contributor_name := old.contributor_name; new.view_count := old.view_count;
  new.helpful_count := old.helpful_count; new.download_count := old.download_count;
  if is_admin then
    if new.status is distinct from old.status then new.reviewed_at := now(); end if;
    if new.status <> 'rejected' then new.rejection_reason := null; end if;
  else
    new.status := 'pending'; new.rejection_reason := null; new.reviewed_at := null;
  end if;
  return new;
end $function$;

-- tables
CREATE TABLE public.resource_helpful (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_id)
);
CREATE INDEX resource_helpful_resource_idx ON public.resource_helpful(resource_id);
GRANT SELECT, INSERT, DELETE ON public.resource_helpful TO authenticated;
GRANT ALL ON public.resource_helpful TO service_role;
ALTER TABLE public.resource_helpful ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own helpful read" ON public.resource_helpful FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Own helpful add" ON public.resource_helpful FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.resources r WHERE r.id = resource_id AND r.status = 'approved'));
CREATE POLICY "Own helpful remove" ON public.resource_helpful FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.saved_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_resources TO authenticated;
GRANT ALL ON public.saved_resources TO service_role;
ALTER TABLE public.saved_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own saves read" ON public.saved_resources FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Own saves add" ON public.saved_resources FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.resources r WHERE r.id = resource_id AND r.status = 'approved'));
CREATE POLICY "Own saves remove" ON public.saved_resources FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.resource_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  contributor_id uuid,
  downloaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX resource_downloads_user_idx ON public.resource_downloads(user_id, downloaded_at DESC);
CREATE INDEX resource_downloads_contrib_idx ON public.resource_downloads(contributor_id);
CREATE INDEX resource_downloads_resource_idx ON public.resource_downloads(resource_id);
GRANT SELECT ON public.resource_downloads TO authenticated;
GRANT ALL ON public.resource_downloads TO service_role;
ALTER TABLE public.resource_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own downloads read" ON public.resource_downloads FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.recently_viewed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_id)
);
CREATE INDEX recently_viewed_user_idx ON public.recently_viewed(user_id, viewed_at DESC);
GRANT SELECT, DELETE ON public.recently_viewed TO authenticated;
GRANT ALL ON public.recently_viewed TO service_role;
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own history read" ON public.recently_viewed FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own history remove" ON public.recently_viewed FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  resource_id uuid REFERENCES public.resources(id) ON DELETE SET NULL,
  is_read boolean NOT NULL DEFAULT false,
  dedupe_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedupe_key)
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, DELETE ON public.notifications TO authenticated;
GRANT UPDATE (is_read) ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notifications read" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own notifications delete" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- helpers
CREATE OR REPLACE FUNCTION public.notify(_user uuid, _type text, _title text, _msg text, _res uuid, _key text DEFAULT NULL)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  INSERT INTO public.notifications (user_id, type, title, message, resource_id, dedupe_key)
  SELECT _user, _type, _title, _msg, _res, _key WHERE _user IS NOT NULL
  ON CONFLICT (user_id, dedupe_key) DO NOTHING
$$;
REVOKE EXECUTE ON FUNCTION public.notify(uuid,text,text,text,uuid,text) FROM PUBLIC, anon, authenticated;

-- helpful counter + notification
CREATE OR REPLACE FUNCTION public.on_helpful_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare r record;
begin
  perform set_config('kaksha.system','on',true);
  if tg_op = 'INSERT' then
    update public.resources set helpful_count = helpful_count + 1 where id = new.resource_id returning id, title, contributor_id into r;
    if r.contributor_id is not null and r.contributor_id <> new.user_id then
      perform public.notify(r.contributor_id, 'helpful', 'Someone found your resource helpful', '"' || r.title || '" was marked helpful.', r.id, 'helpful:' || new.id);
    end if;
  else
    update public.resources set helpful_count = greatest(helpful_count - 1, 0) where id = old.resource_id;
  end if;
  perform set_config('kaksha.system','',true);
  return null;
end $$;
CREATE TRIGGER helpful_change AFTER INSERT OR DELETE ON public.resource_helpful FOR EACH ROW EXECUTE FUNCTION public.on_helpful_change();

-- download counter + milestones
CREATE OR REPLACE FUNCTION public.on_download() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare r record; total int; m int;
begin
  perform set_config('kaksha.system','on',true);
  update public.resources set download_count = download_count + 1 where id = new.resource_id returning id, title, contributor_id, download_count into r;
  perform set_config('kaksha.system','',true);
  if r.contributor_id is null then return null; end if;
  if r.download_count = 100 then
    perform public.notify(r.contributor_id, 'resource_100', 'Your resource reached 100 downloads', '"' || r.title || '" has been downloaded 100 times.', r.id, 'res100:' || r.id);
  end if;
  select coalesce(sum(download_count),0) into total from public.resources where contributor_id = r.contributor_id and status = 'approved';
  foreach m in array array[10,50,100] loop
    if total >= m then
      perform public.notify(r.contributor_id, 'milestone', 'Milestone: ' || m || ' downloads', 'Your shared resources have reached ' || m || ' downloads in total.', null, 'milestone:' || m);
    end if;
  end loop;
  return null;
end $$;
CREATE TRIGGER download_recorded AFTER INSERT ON public.resource_downloads FOR EACH ROW EXECUTE FUNCTION public.on_download();

CREATE OR REPLACE FUNCTION public.record_download(_resource_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare c uuid;
begin
  if auth.uid() is null then raise exception 'Please log in to download'; end if;
  select contributor_id into c from public.resources where id = _resource_id and status = 'approved';
  if not found then raise exception 'This resource is not available'; end if;
  if exists (select 1 from public.resource_downloads where user_id = auth.uid() and resource_id = _resource_id and downloaded_at > now() - interval '30 seconds') then
    return false;
  end if;
  insert into public.resource_downloads (user_id, resource_id, contributor_id) values (auth.uid(), _resource_id, c);
  return true;
end $$;
REVOKE EXECUTE ON FUNCTION public.record_download(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_download(uuid) TO authenticated;

-- views + recently viewed (also fixes signed-in views going through the contributor guard)
CREATE OR REPLACE FUNCTION public.increment_resource_view(_slug text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare rid uuid;
begin
  perform set_config('kaksha.system','on',true);
  update public.resources set view_count = view_count + 1 where slug = _slug and status = 'approved' returning id into rid;
  perform set_config('kaksha.system','',true);
  if rid is not null and auth.uid() is not null then
    insert into public.recently_viewed (user_id, resource_id) values (auth.uid(), rid)
      on conflict (user_id, resource_id) do update set viewed_at = now();
    delete from public.recently_viewed where user_id = auth.uid() and id not in (
      select id from public.recently_viewed where user_id = auth.uid() order by viewed_at desc limit 20);
  end if;
end $$;

-- review notifications
CREATE OR REPLACE FUNCTION public.on_resource_review() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  if new.contributor_id is null then return null; end if;
  if tg_op = 'INSERT' then
    if new.status = 'pending' then
      perform public.notify(new.contributor_id, 'submitted', 'Contribution submitted', '"' || new.title || '" is waiting for admin review.', new.id);
    end if;
  elsif new.status is distinct from old.status then
    if new.status = 'approved' then
      perform public.notify(new.contributor_id, 'approved', 'Resource approved', '"' || new.title || '" is now live in the library.', new.id);
    elsif new.status = 'rejected' then
      perform public.notify(new.contributor_id, 'rejected', 'Resource rejected', '"' || new.title || '" was not approved. Reason: ' || coalesce(new.rejection_reason,''), new.id);
    end if;
  end if;
  return null;
end $$;
CREATE TRIGGER resources_review_notify AFTER INSERT OR UPDATE OF status ON public.resources FOR EACH ROW EXECUTE FUNCTION public.on_resource_review();

-- public contributor profile (no email / private data)
CREATE OR REPLACE FUNCTION public.get_contributor(_id uuid)
RETURNS TABLE(id uuid, full_name text, avatar_url text, branch text, semester int, shared int, approved int, downloads int, helpful int, reached int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.branch, p.semester,
    (SELECT count(*)::int FROM public.resources r WHERE r.contributor_id = p.id AND r.status <> 'rejected'),
    (SELECT count(*)::int FROM public.resources r WHERE r.contributor_id = p.id AND r.status = 'approved'),
    (SELECT coalesce(sum(r.download_count),0)::int FROM public.resources r WHERE r.contributor_id = p.id AND r.status = 'approved'),
    (SELECT coalesce(sum(r.helpful_count),0)::int FROM public.resources r WHERE r.contributor_id = p.id AND r.status = 'approved'),
    (SELECT count(DISTINCT d.user_id)::int FROM public.resource_downloads d JOIN public.resources r ON r.id = d.resource_id WHERE d.contributor_id = p.id AND r.status = 'approved')
  FROM public.profiles p WHERE p.id = _id
$$;
GRANT EXECUTE ON FUNCTION public.get_contributor(uuid) TO anon, authenticated;