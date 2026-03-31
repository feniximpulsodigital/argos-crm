
-- 1. Fix contacts: restrict SELECT to users with valid roles instead of all authenticated
DROP POLICY IF EXISTS "Authenticated can view contacts" ON public.contacts;
CREATE POLICY "Role users can view contacts" ON public.contacts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'atendente'));

-- 2. Recreate realtime policy with explicit schema reference
DROP POLICY IF EXISTS "Authenticated users can listen to realtime" ON realtime.messages;
CREATE POLICY "Authorized users can listen to realtime" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
    )
  );
