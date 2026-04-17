-- Restrict realtime broadcast on contacts to admins or assigned agents
DROP POLICY IF EXISTS "Role users can view contacts" ON public.contacts;

CREATE POLICY "Admins or assigned agents can view contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'atendente'::app_role)
    AND (assigned_agent_id IS NULL OR assigned_agent_id = auth.uid())
  )
);