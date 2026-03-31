
-- 1. Fix user_roles: restrict SELECT to own roles or admin
DROP POLICY IF EXISTS "Authenticated can view roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 2. Fix profiles: allow atendentes to see colleagues' basic info
CREATE POLICY "Atendentes can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'atendente'));

-- 3. Fix tags: replace permissive ALL policy with role-restricted ones
DROP POLICY IF EXISTS "Authenticated can manage tags" ON public.tags;
CREATE POLICY "Admins can manage tags" ON public.tags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Atendentes can also insert/update/delete tags per feature requirements
CREATE POLICY "Atendentes can manage tags" ON public.tags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'atendente'))
  WITH CHECK (public.has_role(auth.uid(), 'atendente'));

-- 4. Realtime authorization: restrict channel subscriptions
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can listen to realtime"
  ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
    )
  );
