-- 1. Tags: drop admin-only ALL policy, replace with authenticated ALL
DROP POLICY IF EXISTS "Admins can manage tags" ON public.tags;
CREATE POLICY "Authenticated can manage tags" ON public.tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Messages: add UPDATE and DELETE for admins
CREATE POLICY "Admins can update messages" ON public.messages FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete messages" ON public.messages FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));