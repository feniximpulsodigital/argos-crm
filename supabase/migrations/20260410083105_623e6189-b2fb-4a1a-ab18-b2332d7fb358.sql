
-- Drop the overly broad realtime policy that only checks existence in user_roles
-- Keep the stricter one that checks for admin/atendente roles
DROP POLICY IF EXISTS "Authorized users can listen to realtime" ON messages;

-- Recreate a single consolidated realtime policy with proper role checks
CREATE POLICY "Authorized users can listen to realtime" ON messages
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'atendente'::app_role));
