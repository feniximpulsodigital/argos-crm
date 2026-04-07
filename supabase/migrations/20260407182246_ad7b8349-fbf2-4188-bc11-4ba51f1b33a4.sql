-- Fix 1: Replace overly permissive messages SELECT policy
DROP POLICY IF EXISTS "Authenticated can view messages" ON messages;

CREATE POLICY "Role users can view messages" ON messages
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'atendente'::app_role));

-- Fix 2: Tighten the realtime SELECT policy to match
DROP POLICY IF EXISTS "Authorized users can listen to realtime" ON messages;

CREATE POLICY "Authorized users can listen to realtime" ON messages
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'atendente'::app_role));

-- Fix 3: Add explicit UPDATE policy on user_roles for admins only
CREATE POLICY "Admins can update roles" ON user_roles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));